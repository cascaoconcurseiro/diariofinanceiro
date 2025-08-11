import { PrismaClient, TransactionType, TransactionSource } from '@prisma/client';
import { logger } from '../utils/logger';
import { createUserQuery } from '../middleware/dataIsolation';

const prisma = new PrismaClient();

interface TransactionFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  category?: string;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
  source?: TransactionSource;
  isRecurring?: boolean;
}

interface TransactionData {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category?: string;
  source?: TransactionSource;
}

export class TransactionService {
  // Listar transações com filtros e paginação
  async getTransactions(userId: string, filters: TransactionFilters) {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      type,
      category,
      description,
      minAmount,
      maxAmount,
      source,
      isRecurring
    } = filters;

    const skip = (page - 1) * limit;

    // Construir filtros dinâmicos
    const where = createUserQuery(userId, {
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }),
      ...(type && { type }),
      ...(category && { category: { contains: category, mode: 'insensitive' } }),
      ...(description && { description: { contains: description, mode: 'insensitive' } }),
      ...(minAmount !== undefined && maxAmount !== undefined && {
        amount: {
          gte: minAmount,
          lte: maxAmount
        }
      }),
      ...(source && { source }),
      ...(isRecurring !== undefined && { isRecurring })
    });

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          date: true,
          description: true,
          amount: true,
          type: true,
          category: true,
          isRecurring: true,
          source: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.transaction.count({ where })
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
  }

  // Obter transação por ID
  async getTransactionById(userId: string, transactionId: string) {
    return await prisma.transaction.findFirst({
      where: createUserQuery(userId, { id: transactionId }),
      select: {
        id: true,
        date: true,
        description: true,
        amount: true,
        type: true,
        category: true,
        isRecurring: true,
        recurringId: true,
        source: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  // Criar nova transação
  async createTransaction(userId: string, data: TransactionData) {
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        date: new Date(data.date),
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category,
        source: data.source || TransactionSource.MANUAL
      },
      select: {
        id: true,
        date: true,
        description: true,
        amount: true,
        type: true,
        category: true,
        isRecurring: true,
        source: true,
        createdAt: true,
        updatedAt: true
      }
    });

    logger.info(`Transação criada`, { userId, transactionId: transaction.id });
    return transaction;
  }

  // Atualizar transação
  async updateTransaction(userId: string, transactionId: string, data: Partial<TransactionData>) {
    const existingTransaction = await this.getTransactionById(userId, transactionId);
    if (!existingTransaction) {
      return null;
    }

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...(data.date && { date: new Date(data.date) }),
        ...(data.description && { description: data.description }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.type && { type: data.type }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.source && { source: data.source }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        date: true,
        description: true,
        amount: true,
        type: true,
        category: true,
        isRecurring: true,
        source: true,
        createdAt: true,
        updatedAt: true
      }
    });

    logger.info(`Transação atualizada`, { userId, transactionId });
    return transaction;
  }

  // Excluir transação
  async deleteTransaction(userId: string, transactionId: string) {
    const existingTransaction = await this.getTransactionById(userId, transactionId);
    if (!existingTransaction) {
      return false;
    }

    await prisma.transaction.delete({
      where: { id: transactionId }
    });

    logger.info(`Transação excluída`, { userId, transactionId });
    return true;
  }

  // Excluir múltiplas transações
  async deleteMultipleTransactions(userId: string, transactionIds: string[]) {
    // Verificar se todas as transações pertencem ao usuário
    const count = await prisma.transaction.count({
      where: createUserQuery(userId, { id: { in: transactionIds } })
    });

    if (count !== transactionIds.length) {
      throw new Error('Algumas transações não foram encontradas ou não pertencem ao usuário');
    }

    const result = await prisma.transaction.deleteMany({
      where: { id: { in: transactionIds } }
    });

    logger.info(`Múltiplas transações excluídas`, { userId, count: result.count });
    return { deletedCount: result.count };
  }

  // Obter resumo financeiro
  async getFinancialSummary(userId: string, filters: { startDate?: string; endDate?: string }) {
    const where = createUserQuery(userId, {
      ...(filters.startDate && filters.endDate && {
        date: {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate)
        }
      })
    });

    const [entradas, saidas, diario, total] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.ENTRADA },
        _sum: { amount: true },
        _count: true
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.SAIDA },
        _sum: { amount: true },
        _count: true
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.DIARIO },
        _sum: { amount: true },
        _count: true
      }),
      prisma.transaction.count({ where })
    ]);

    const totalEntradas = entradas._sum.amount || 0;
    const totalSaidas = saidas._sum.amount || 0;
    const totalDiario = diario._sum.amount || 0;

    return {
      summary: {
        totalEntradas: Number(totalEntradas),
        totalSaidas: Number(totalSaidas),
        totalDiario: Number(totalDiario),
        saldo: Number(totalEntradas) - Number(totalSaidas),
        totalTransactions: total
      },
      counts: {
        entradas: entradas._count,
        saidas: saidas._count,
        diario: diario._count
      }
    };
  }

  // Obter transações por categoria
  async getTransactionsByCategory(userId: string, filters: { startDate?: string; endDate?: string }) {
    const where = createUserQuery(userId, {
      ...(filters.startDate && filters.endDate && {
        date: {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate)
        }
      }),
      category: { not: null }
    });

    const result = await prisma.transaction.groupBy({
      by: ['category', 'type'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } }
    });

    return result.map(item => ({
      category: item.category,
      type: item.type,
      total: Number(item._sum.amount || 0),
      count: item._count
    }));
  }

  // Obter evolução mensal
  async getMonthlyEvolution(userId: string, months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const transactions = await prisma.transaction.findMany({
      where: createUserQuery(userId, {
        date: { gte: startDate }
      }),
      select: {
        date: true,
        amount: true,
        type: true
      },
      orderBy: { date: 'asc' }
    });

    // Agrupar por mês
    const monthlyData: { [key: string]: { entradas: number; saidas: number; saldo: number } } = {};

    transactions.forEach(transaction => {
      const monthKey = transaction.date.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { entradas: 0, saidas: 0, saldo: 0 };
      }

      const amount = Number(transaction.amount);
      
      if (transaction.type === TransactionType.ENTRADA) {
        monthlyData[monthKey].entradas += amount;
      } else if (transaction.type === TransactionType.SAIDA) {
        monthlyData[monthKey].saidas += amount;
      }
    });

    // Calcular saldo para cada mês
    Object.keys(monthlyData).forEach(month => {
      monthlyData[month].saldo = monthlyData[month].entradas - monthlyData[month].saidas;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  // Importar transações
  async importTransactions(userId: string, transactions: TransactionData[]) {
    const results = {
      success: 0,
      errors: [] as { index: number; error: string; data: any }[]
    };

    for (let i = 0; i < transactions.length; i++) {
      try {
        await this.createTransaction(userId, transactions[i]);
        results.success++;
      } catch (error) {
        results.errors.push({
          index: i,
          error: error.message,
          data: transactions[i]
        });
      }
    }

    logger.info(`Importação de transações concluída`, { 
      userId, 
      success: results.success, 
      errors: results.errors.length 
    });

    return results;
  }

  // Exportar transações
  async exportTransactions(userId: string, options: { format: string; startDate?: string; endDate?: string }) {
    const where = createUserQuery(userId, {
      ...(options.startDate && options.endDate && {
        date: {
          gte: new Date(options.startDate),
          lte: new Date(options.endDate)
        }
      })
    });

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        description: true,
        amount: true,
        type: true,
        category: true,
        source: true
      }
    });

    if (options.format === 'csv') {
      const headers = 'ID,Data,Descrição,Valor,Tipo,Categoria,Origem\n';
      const rows = transactions.map(t => 
        `${t.id},${t.date.toISOString().split('T')[0]},"${t.description}",${t.amount},${t.type},${t.category || ''},${t.source}`
      ).join('\n');
      
      return headers + rows;
    }

    return JSON.stringify(transactions, null, 2);
  }

  // Duplicar transação
  async duplicateTransaction(userId: string, transactionId: string) {
    const original = await this.getTransactionById(userId, transactionId);
    if (!original) {
      return null;
    }

    return await this.createTransaction(userId, {
      date: new Date().toISOString(),
      description: `${original.description} (cópia)`,
      amount: Number(original.amount),
      type: original.type,
      category: original.category,
      source: TransactionSource.MANUAL
    });
  }

  // Obter estatísticas avançadas
  async getAdvancedStats(userId: string) {
    const [
      totalTransactions,
      avgTransactionValue,
      mostUsedCategory,
      recentActivity,
      monthlyGrowth
    ] = await Promise.all([
      prisma.transaction.count({
        where: createUserQuery(userId)
      }),
      prisma.transaction.aggregate({
        where: createUserQuery(userId),
        _avg: { amount: true }
      }),
      prisma.transaction.groupBy({
        by: ['category'],
        where: createUserQuery(userId, { category: { not: null } }),
        _count: true,
        orderBy: { _count: { _all: 'desc' } },
        take: 1
      }),
      prisma.transaction.count({
        where: createUserQuery(userId, {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // últimos 7 dias
          }
        })
      }),
      this.calculateMonthlyGrowth(userId)
    ]);

    return {
      totalTransactions,
      avgTransactionValue: Number(avgTransactionValue._avg.amount || 0),
      mostUsedCategory: mostUsedCategory[0]?.category || null,
      recentActivity,
      monthlyGrowth
    };
  }

  // Calcular crescimento mensal
  private async calculateMonthlyGrowth(userId: string) {
    const currentMonth = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [currentCount, lastCount] = await Promise.all([
      prisma.transaction.count({
        where: createUserQuery(userId, {
          createdAt: {
            gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
          }
        })
      }),
      prisma.transaction.count({
        where: createUserQuery(userId, {
          createdAt: {
            gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
            lt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
          }
        })
      })
    ]);

    if (lastCount === 0) return 0;
    return ((currentCount - lastCount) / lastCount) * 100;
  }
}

export const transactionService = new TransactionService();