import { PrismaClient, RecurringFrequency, TransactionType } from '@prisma/client';
import { executeWithUserContext, createRLSTransaction } from '../middleware/rlsContext';
import { logger } from '../utils/logger';
import { cacheService } from './redisService';

const prisma = new PrismaClient();

interface CreateRecurringTransactionData {
  description: string;
  amount: number;
  type: TransactionType;
  dayOfMonth: number;
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date;
  remainingCount?: number;
  remainingMonths?: number;
}

export class RecurringTransactionService {
  // Listar transações recorrentes
  async getRecurringTransactions(
    userId: string,
    page: number = 1,
    limit: number = 20,
    isActive?: boolean
  ) {
    const cacheKey = `recurring:${userId}:${page}:${limit}:${isActive}`;
    
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    return executeWithUserContext(userId, async () => {
      const skip = (page - 1) * limit;
      
      const where: any = { userId };
      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      const [recurringTransactions, total] = await Promise.all([
        prisma.recurringTransaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            transactions: {
              orderBy: { date: 'desc' },
              take: 5 // Últimas 5 transações geradas
            },
            _count: {
              select: { transactions: true }
            }
          }
        }),
        prisma.recurringTransaction.count({ where })
      ]);

      const result = {
        recurringTransactions: recurringTransactions.map(rt => ({
          ...rt,
          generatedCount: rt._count.transactions,
          nextExecution: this.calculateNextExecution(rt),
          status: this.getRecurringTransactionStatus(rt)
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      // Cache por 5 minutos
      await cacheService.set(cacheKey, result, 300);
      
      return result;
    });
  }

  // Obter transação recorrente específica
  async getRecurringTransaction(userId: string, recurringId: string) {
    return executeWithUserContext(userId, async () => {
      const recurringTransaction = await prisma.recurringTransaction.findFirst({
        where: { id: recurringId, userId },
        include: {
          transactions: {
            orderBy: { date: 'desc' },
            take: 10
          },
          _count: {
            select: { transactions: true }
          }
        }
      });

      if (!recurringTransaction) {
        return null;
      }

      return {
        ...recurringTransaction,
        generatedCount: recurringTransaction._count.transactions,
        nextExecution: this.calculateNextExecution(recurringTransaction),
        status: this.getRecurringTransactionStatus(recurringTransaction)
      };
    });
  }

  // Criar nova transação recorrente
  async createRecurringTransaction(userId: string, data: CreateRecurringTransactionData) {
    return executeWithUserContext(userId, async () => {
      // CORREÇÃO: Calcular startDate correta para evitar datas passadas
      const today = new Date();
      const currentDay = today.getDate();
      let correctedStartDate = data.startDate;
      
      // Se a data de início é hoje e o dia do mês já passou, ajustar para o próximo mês
      if (data.startDate <= today && data.dayOfMonth <= currentDay) {
        correctedStartDate = new Date(today.getFullYear(), today.getMonth() + 1, data.dayOfMonth);
        console.log(`📅 CORREÇÃO: Ajustando startDate de ${data.startDate.toLocaleDateString()} para ${correctedStartDate.toLocaleDateString()}`);
      }
      
      const recurringTransaction = await prisma.recurringTransaction.create({
        data: {
          ...data,
          startDate: correctedStartDate,
          userId,
          isActive: true
        },
        include: {
          _count: {
            select: { transactions: true }
          }
        }
      });

      // Invalidar cache
      await this.invalidateUserCache(userId);

      logger.info(`Transação recorrente criada`, {
        userId,
        recurringId: recurringTransaction.id,
        description: data.description,
        frequency: data.frequency,
        originalStartDate: data.startDate.toISOString(),
        correctedStartDate: correctedStartDate.toISOString()
      });

      return {
        ...recurringTransaction,
        generatedCount: 0,
        nextExecution: this.calculateNextExecution(recurringTransaction),
        status: this.getRecurringTransactionStatus(recurringTransaction)
      };
    });
  }

  // Atualizar transação recorrente
  async updateRecurringTransaction(
    userId: string, 
    recurringId: string, 
    data: Partial<CreateRecurringTransactionData>
  ) {
    return executeWithUserContext(userId, async () => {
      const updated = await prisma.recurringTransaction.updateMany({
        where: { id: recurringId, userId },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });

      if (updated.count === 0) {
        return null;
      }

      // Invalidar cache
      await this.invalidateUserCache(userId);

      // Buscar transação atualizada
      const recurringTransaction = await prisma.recurringTransaction.findFirst({
        where: { id: recurringId, userId },
        include: {
          _count: {
            select: { transactions: true }
          }
        }
      });

      logger.info(`Transação recorrente atualizada`, {
        userId,
        recurringId,
        changes: Object.keys(data)
      });

      return {
        ...recurringTransaction,
        generatedCount: recurringTransaction?._count.transactions || 0,
        nextExecution: this.calculateNextExecution(recurringTransaction!),
        status: this.getRecurringTransactionStatus(recurringTransaction!)
      };
    });
  }

  // Ativar/desativar transação recorrente
  async toggleRecurringTransaction(userId: string, recurringId: string, isActive: boolean) {
    return executeWithUserContext(userId, async () => {
      const updated = await prisma.recurringTransaction.updateMany({
        where: { id: recurringId, userId },
        data: { isActive, updatedAt: new Date() }
      });

      if (updated.count === 0) {
        return null;
      }

      await this.invalidateUserCache(userId);

      const recurringTransaction = await prisma.recurringTransaction.findFirst({
        where: { id: recurringId, userId },
        include: {
          _count: {
            select: { transactions: true }
          }
        }
      });

      logger.info(`Transação recorrente ${isActive ? 'ativada' : 'desativada'}`, {
        userId,
        recurringId
      });

      return {
        ...recurringTransaction,
        generatedCount: recurringTransaction?._count.transactions || 0,
        nextExecution: this.calculateNextExecution(recurringTransaction!),
        status: this.getRecurringTransactionStatus(recurringTransaction!)
      };
    });
  }

  // Excluir transação recorrente
  async deleteRecurringTransaction(
    userId: string, 
    recurringId: string, 
    deleteGeneratedTransactions: boolean = false
  ) {
    const rlsTransaction = createRLSTransaction(userId);
    
    return rlsTransaction.execute(async (tx) => {
      let transactionsDeleted = 0;

      if (deleteGeneratedTransactions) {
        const deletedTransactions = await tx.transaction.deleteMany({
          where: { recurringId, userId }
        });
        transactionsDeleted = deletedTransactions.count;
      } else {
        // Apenas remover a referência
        await tx.transaction.updateMany({
          where: { recurringId, userId },
          data: { recurringId: null }
        });
      }

      const deleted = await tx.recurringTransaction.deleteMany({
        where: { id: recurringId, userId }
      });

      if (deleted.count > 0) {
        await this.invalidateUserCache(userId);
        
        logger.info(`Transação recorrente excluída`, {
          userId,
          recurringId,
          transactionsDeleted
        });
      }

      return {
        deleted: deleted.count > 0,
        transactionsDeleted
      };
    });
  }

  // Processar transações recorrentes
  async processRecurringTransactions(
    userId?: string,
    recurringId?: string,
    targetDate: Date = new Date()
  ) {
    const results = {
      processed: 0,
      created: 0,
      errors: [] as any[]
    };

    try {
      // Buscar transações recorrentes ativas
      const where: any = {
        isActive: true,
        startDate: { lte: targetDate }
      };

      if (userId) where.userId = userId;
      if (recurringId) where.id = recurringId;

      const recurringTransactions = await prisma.recurringTransaction.findMany({
        where,
        include: {
          transactions: {
            orderBy: { date: 'desc' },
            take: 1
          }
        }
      });

      for (const rt of recurringTransactions) {
        try {
          results.processed++;
          
          const shouldProcess = await this.shouldProcessRecurringTransaction(rt, targetDate);
          
          if (shouldProcess) {
            const transaction = await executeWithUserContext(rt.userId, async () => {
              return await prisma.transaction.create({
                data: {
                  userId: rt.userId,
                  date: this.calculateExecutionDate(rt, targetDate),
                  description: rt.description,
                  amount: rt.amount,
                  type: rt.type,
                  isRecurring: true,
                  recurringId: rt.id,
                  source: 'RECURRING'
                }
              });
            });

            results.created++;

            // Atualizar contadores se necessário
            await this.updateRecurringTransactionCounters(rt);

            logger.info(`Transação recorrente processada`, {
              userId: rt.userId,
              recurringId: rt.id,
              transactionId: transaction.id,
              amount: rt.amount
            });
          }
        } catch (error) {
          results.errors.push({
            recurringId: rt.id,
            error: error.message
          });
          
          logger.error(`Erro ao processar transação recorrente ${rt.id}:`, error);
        }
      }

      logger.info(`Processamento de transações recorrentes concluído`, {
        processed: results.processed,
        created: results.created,
        errors: results.errors.length
      });

      return results;
    } catch (error) {
      logger.error('Erro no processamento de transações recorrentes:', error);
      throw error;
    }
  }

  // Obter próximas execuções
  async getUpcomingRecurringTransactions(userId: string, days: number = 30) {
    return executeWithUserContext(userId, async () => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const recurringTransactions = await prisma.recurringTransaction.findMany({
        where: {
          userId,
          isActive: true,
          startDate: { lte: endDate }
        }
      });

      const upcoming = recurringTransactions
        .map(rt => {
          const nextExecution = this.calculateNextExecution(rt);
          if (nextExecution && nextExecution <= endDate) {
            return {
              ...rt,
              nextExecution,
              daysUntil: Math.ceil((nextExecution.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            };
          }
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => a!.nextExecution.getTime() - b!.nextExecution.getTime());

      return upcoming;
    });
  }

  // Obter histórico de execuções
  async getRecurringTransactionHistory(
    userId: string,
    recurringId: string,
    page: number = 1,
    limit: number = 20
  ) {
    return executeWithUserContext(userId, async () => {
      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: { recurringId, userId },
          orderBy: { date: 'desc' },
          skip,
          take: limit
        }),
        prisma.transaction.count({
          where: { recurringId, userId }
        })
      ]);

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    });
  }

  // Simular próximas execuções
  async simulateRecurringTransaction(userId: string, recurringId: string, months: number = 12) {
    return executeWithUserContext(userId, async () => {
      const recurringTransaction = await prisma.recurringTransaction.findFirst({
        where: { id: recurringId, userId }
      });

      if (!recurringTransaction) {
        return null;
      }

      const simulations = [];
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);

      let currentDate = new Date(Math.max(startDate.getTime(), recurringTransaction.startDate.getTime()));

      while (currentDate <= endDate) {
        const executionDate = this.calculateExecutionDate(recurringTransaction, currentDate);
        
        if (executionDate <= endDate) {
          simulations.push({
            date: executionDate,
            description: recurringTransaction.description,
            amount: recurringTransaction.amount,
            type: recurringTransaction.type
          });
        }

        // Avançar para próximo período
        currentDate = this.getNextPeriod(recurringTransaction, currentDate);
      }

      return {
        recurringTransaction,
        simulations,
        summary: {
          totalExecutions: simulations.length,
          totalAmount: simulations.reduce((sum, sim) => sum + Number(sim.amount), 0),
          period: { startDate, endDate }
        }
      };
    });
  }

  // Métodos auxiliares privados
  private calculateNextExecution(rt: any): Date | null {
    if (!rt.isActive) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let nextDate = new Date(rt.startDate);

    // CORREÇÃO: Se ainda não passou da data de início
    if (nextDate > today) {
      return this.calculateExecutionDate(rt, nextDate);
    }

    // CORREÇÃO: Calcular próxima execução sempre para o futuro
    switch (rt.frequency) {
      case 'MONTHLY':
        nextDate = new Date(now.getFullYear(), now.getMonth(), rt.dayOfMonth);
        // CRÍTICO: Se a data já passou hoje, ir para o próximo mês
        if (nextDate <= today) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;

      case 'FIXED_COUNT':
      case 'MONTHLY_DURATION':
        // Verificar se ainda há execuções restantes
        if (rt.remainingCount && rt.remainingCount <= 0) return null;
        if (rt.remainingMonths && rt.remainingMonths <= 0) return null;
        
        nextDate = new Date(now.getFullYear(), now.getMonth(), rt.dayOfMonth);
        // CRÍTICO: Se a data já passou hoje, ir para o próximo mês
        if (nextDate <= today) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;
    }

    // Verificar data de fim
    if (rt.endDate && nextDate > rt.endDate) {
      return null;
    }

    // CORREÇÃO: Ajustar para meses que não têm o dia especificado
    const adjustedDate = this.calculateExecutionDate(rt, nextDate);
    
    // Se ainda assim a data calculada for no passado, avançar um mês
    if (adjustedDate <= today) {
      nextDate.setMonth(nextDate.getMonth() + 1);
      return this.calculateExecutionDate(rt, nextDate);
    }

    return adjustedDate;
  }

  private calculateExecutionDate(rt: any, targetDate: Date): Date {
    const executionDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), rt.dayOfMonth);
    
    // CORREÇÃO: Se o dia não existe no mês (ex: 31 em fevereiro), usar último dia do mês
    if (executionDate.getDate() !== rt.dayOfMonth) {
      // Ir para o primeiro dia do próximo mês e voltar um dia (último dia do mês atual)
      executionDate.setMonth(executionDate.getMonth() + 1, 0);
      console.log(`📅 AJUSTE: Dia ${rt.dayOfMonth} não existe em ${targetDate.getMonth() + 1}/${targetDate.getFullYear()}, usando último dia: ${executionDate.getDate()}`);
    }
    
    return executionDate;
  }

  private async shouldProcessRecurringTransaction(rt: any, targetDate: Date): Promise<boolean> {
    const executionDate = this.calculateExecutionDate(rt, targetDate);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // CORREÇÃO: Não processar datas passadas
    if (executionDate < todayStart) {
      console.log(`⏭️ BLOCKED: Execution date ${executionDate.toLocaleDateString()} is in the past`);
      return false;
    }
    
    // Verificar se já foi processada
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        recurringId: rt.id,
        date: {
          gte: new Date(executionDate.getFullYear(), executionDate.getMonth(), executionDate.getDate()),
          lt: new Date(executionDate.getFullYear(), executionDate.getMonth(), executionDate.getDate() + 1)
        }
      }
    });

    if (existingTransaction) {
      console.log(`⏭️ ALREADY PROCESSED: Transaction already exists for ${executionDate.toLocaleDateString()}`);
      return false;
    }

    return true;
  }

  private async updateRecurringTransactionCounters(rt: any) {
    const updates: any = {};

    if (rt.remainingCount && rt.remainingCount > 0) {
      updates.remainingCount = rt.remainingCount - 1;
      
      if (updates.remainingCount <= 0) {
        updates.isActive = false;
      }
    }

    if (rt.remainingMonths && rt.remainingMonths > 0) {
      updates.remainingMonths = rt.remainingMonths - 1;
      
      if (updates.remainingMonths <= 0) {
        updates.isActive = false;
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.recurringTransaction.update({
        where: { id: rt.id },
        data: updates
      });
    }
  }

  private getNextPeriod(rt: any, currentDate: Date): Date {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    return nextDate;
  }

  private getRecurringTransactionStatus(rt: any): string {
    if (!rt.isActive) return 'INACTIVE';
    
    const nextExecution = this.calculateNextExecution(rt);
    if (!nextExecution) return 'COMPLETED';
    
    const now = new Date();
    if (nextExecution <= now) return 'PENDING';
    
    return 'ACTIVE';
  }

  // Invalidar cache do usuário
  private async invalidateUserCache(userId: string) {
    try {
      await cacheService.delPattern(`recurring:${userId}:*`);
    } catch (error) {
      logger.error('Erro ao invalidar cache:', error);
    }
  }
}

export const recurringTransactionService = new RecurringTransactionService();