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
  search?: string;
  minAmount?: number;
  maxAmount?: number;
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
      search,
      minAmount,
      maxAmount,
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
      ...(category && { category }),
      ...(search && {
        description: {
          contains: search,
          mode: 'insensitive' as const
        }
      }),
      ...(minAmount !== undefined && maxAmount !== undefined && {
        amount: {
          gte: minAmount,
          lte: maxAmount
        }
      }),
      ...(isRecurring !== undefined && { isRecurring })
    });

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
          recurringTransaction: {
            select: {
              id: true,
              description: true,
              frequency: true
            }
          }
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
  async getTransactionById(userId: string, id: string) {
    return await prisma.transaction.findFirst({
      where: createUserQuery(userId, { id }),
      include: {
        recurringTransaction: {
          select: {
            id: true,
            description: true,
            frequency: true,
            dayOfMonth: true
          }
        }
      }
    });
  }

  // Criar nova transação
  async createTransaction(userId: string, data: TransactionData) {
    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        date: new Date(data.date),
        userId,
        source: data.source || TransactionSource.MANUAL
      },
      include: {
        recurringTransaction: {
          select: {
            id: true,
            description: true,
            frequency: true
          }
        }
      }
    });

    logger.info(`Transação criada`, { userId, transactionId: transaction.id });
    return transaction;
  }

  // Atualizar transação
  async updateTransaction(userId: string, id: string, data: Partial<TransactionData>) {
    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = await this.getTransactionById(userId, id);
    if (!existingTransaction) {
      return null;
    }

    const updatedData = {
      ...data,
      ...(data.date && { date: new Date(data.date) }),
      updatedAt: new Date()
    };

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updatedData,
      include: {
        recurringTransaction: {
          select: {
            id: true,
            description: true,
            frequency: true
          }
        }
      }
    });

    logger.info(`Transação atualizada`, { userId, transactionId: id });
    return transaction;
  }

  // Excluir transação
  async deleteTransaction(userId: string, id: string) {
    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = await this.getTransactionById(userId, id);
    if (!existingTransaction) {
      return false;
    }

    await prisma.transaction.delete({
      where: { id }
    });

    logger.info(`Transação excluída`, { userId, transactionId: id });
    return true;
  }

  // Excluir múltiplas transações
  async deleteMultipleTransactions(userId: string, ids: string[]) {
    // Verificar quantas transações pertencem ao usuário
    const count = await prisma.transaction.count({
      where: createUserQuery(userId, { id: { in: ids } })
    });

    if (count !== ids.length) {
      throw new Error('Algumas transações não foram encontradas ou não pertencem ao usuário');
    }

    const result = await prisma.transaction.deleteMany({
      where: { id: { in: ids } }
    });

    logger.info(`Múltiplas transações excluídas`, { userId, count: result.count });
    return { deleted: result.count };
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

    const [entradas, saidas, diarios] = await Promise.all([
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
      })
    ]);

    const totalEntradas = entradas._sum.amount || 0;
    const totalSaidas = saidas._sum.amount || 0;
    const totalDiarios = diarios._sum.amount || 0;

    return {
      entradas: {
        total: totalEntradas,
        count: entradas._count
      },
      saidas: {
        total: totalSaidas,
        count: saidas._count
      },
      diarios: {
        total: totalDiarios,
        count: diarios._count
      },
      saldo: totalEntradas - totalSaidas,
      saldoComDiarios: totalEntradas - totalSaidas + totalDiarios
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
      total: item._sum.amount || 0,
      count: item._count
    }));
  }

  // Obter evolução mensal
  async getMonthlyEvolution(userId: string, months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);

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
    const monthlyData = new Map();

    transactions.forEach(transaction => {
      const monthKey = transaction.date.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          entradas: 0,
          saidas: 0,
          diarios: 0
        });
      }

      const data = monthlyData.get(monthKey);
      const amount = Number(transaction.amount);

      switch (transaction.type) {
        case TransactionType.ENTRADA:
          data.entradas += amount;
          break;
        case TransactionType.SAIDA:
          data.saidas += amount;
          break;
        case TransactionType.DIARIO:
          data.diarios += amount;
          break;
      }
    });

    return Array.from(monthlyData.values()).map(data => ({
      ...data,
      saldo: data.entradas - data.saidas,
      saldoComDiarios: data.entradas - data.saidas + data.diarios
    }));
  }

  // Importar transações
  async importTransactions(userId: string, transactions: TransactionData[]) {
    const results = {
      imported: 0,
      errors: [] as string[]
    };

    for (const [index, transactionData] of transactions.entries()) {
      try {
        await this.createTransaction(userId, transactionData);
        results.imported++;
      } catch (error) {
        results.errors.push(`Linha ${index + 1}: ${error.message}`);
      }
    }

    logger.info(`Importação de transações concluída`, { 
      userId, 
      imported: results.imported, 
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
        source: true,
        createdAt: true
      }
    });

    if (options.format === 'csv') {
      const headers = ['ID', 'Data', 'Descrição', 'Valor', 'Tipo', 'Categoria', 'Origem', 'Criado em'];
      const rows = transactions.map(t => [
        t.id,
        t.date.toISOString().split('T')[0],
        t.description,
        t.amount.toString(),
        t.type,
        t.category || '',
        t.source,
        t.createdAt.toISOString()
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(transactions, null, 2);
  }

  // Obter estatísticas avançadas
  async getAdvancedStats(userId: string) {
    const [
      totalTransactions,
      avgTransactionValue,
      mostUsedCategory,
      recurringTransactionsCount,
      lastMonthComparison
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
        where: createUserQuery(userId, { isRecurring: true })
      }),
      this.getLastMonthComparison(userId)
    ]);

    return {
      totalTransactions,
      avgTransactionValue: avgTransactionValue._avg.amount || 0,
      mostUsedCategory: mostUsedCategory[0]?.category || null,
      recurringTransactionsCount,
      lastMonthComparison
    };
  }

  // Duplicar transação
  async duplicateTransaction(userId: string, id: string) {
    const originalTransaction = await this.getTransactionById(userId, id);
    if (!originalTransaction) {
      return null;
    }

    const { id: _, createdAt, updatedAt, ...transactionData } = originalTransaction;

    return await this.createTransaction(userId, {
      ...transactionData,
      date: new Date().toISOString(),
      description: `${transactionData.description} (cópia)`,
      amount: Number(transactionData.amount)
    });
  }

  // Comparação com mês anterior (método privado)
  private async getLastMonthComparison(userId: string) {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [currentMonth, lastMonth] = await Promise.all([
      this.getFinancialSummary(userId, {
        startDate: currentMonthStart.toISOString(),
        endDate: now.toISOString()
      }),
      this.getFinancialSummary(userId, {
        startDate: lastMonthStart.toISOString(),
        endDate: lastMonthEnd.toISOString()
      })
    ]);

    const entradaChange = currentMonth.entradas.total - lastMonth.entradas.total;
    const saidaChange = currentMonth.saidas.total - lastMonth.saidas.total;
    const saldoChange = currentMonth.saldo - lastMonth.saldo;

    return {
      currentMonth,
      lastMonth,
      changes: {
        entradas: entradaChange,
        saidas: saidaChange,
        saldo: saldoChange
      },
      percentageChanges: {
        entradas: lastMonth.entradas.total > 0 ? (entradaChange / lastMonth.entradas.total) * 100 : 0,
        saidas: lastMonth.saidas.total > 0 ? (saidaChange / lastMonth.saidas.total) * 100 : 0,
        saldo: lastMonth.saldo !== 0 ? (saldoChange / Math.abs(lastMonth.saldo)) * 100 : 0
      }
    };
  }
}

export const transactionService = new TransactionService();