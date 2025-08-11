import { PrismaClient } from '@prisma/client';
import { executeWithUserContext, createRLSTransaction } from '../middleware/rlsContext';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Testes de isolamento de dados
export class DataIsolationTests {
  
  // Teste básico de RLS
  async testBasicRLS(userId1: string, userId2: string): Promise<boolean> {
    try {
      // Criar transação para usuário 1
      const transaction1 = await executeWithUserContext(userId1, async () => {
        return await prisma.transaction.create({
          data: {
            userId: userId1,
            date: new Date(),
            description: 'Teste RLS User 1',
            amount: 100,
            type: 'ENTRADA'
          }
        });
      });

      // Tentar acessar transação do usuário 1 com contexto do usuário 2
      const accessAttempt = await executeWithUserContext(userId2, async () => {
        return await prisma.transaction.findMany({
          where: { userId: userId1 }
        });
      });

      // Se RLS estiver funcionando, não deve retornar nada
      const isIsolated = accessAttempt.length === 0;
      
      logger.info('Teste RLS básico:', {
        userId1,
        userId2,
        transactionCreated: !!transaction1,
        accessBlocked: isIsolated,
        result: isIsolated ? 'PASS' : 'FAIL'
      });

      return isIsolated;
    } catch (error) {
      logger.error('Erro no teste RLS básico:', error);
      return false;
    }
  }

  // Teste de transação com RLS
  async testTransactionRLS(userId: string): Promise<boolean> {
    try {
      const rlsTransaction = createRLSTransaction(userId);
      
      const result = await rlsTransaction.execute(async (tx) => {
        // Criar transação
        const transaction = await tx.transaction.create({
          data: {
            userId,
            date: new Date(),
            description: 'Teste Transação RLS',
            amount: 200,
            type: 'SAIDA'
          }
        });

        // Verificar se pode acessar
        const found = await tx.transaction.findUnique({
          where: { id: transaction.id }
        });

        return !!found;
      });

      logger.info('Teste transação RLS:', {
        userId,
        result: result ? 'PASS' : 'FAIL'
      });

      return result;
    } catch (error) {
      logger.error('Erro no teste transação RLS:', error);
      return false;
    }
  }

  // Teste de isolamento em operações bulk
  async testBulkOperationIsolation(userId1: string, userId2: string): Promise<boolean> {
    try {
      // Criar transações para ambos usuários
      const [trans1, trans2] = await Promise.all([
        executeWithUserContext(userId1, async () => {
          return await prisma.transaction.create({
            data: {
              userId: userId1,
              date: new Date(),
              description: 'Bulk Test User 1',
              amount: 300,
              type: 'ENTRADA'
            }
          });
        }),
        executeWithUserContext(userId2, async () => {
          return await prisma.transaction.create({
            data: {
              userId: userId2,
              date: new Date(),
              description: 'Bulk Test User 2',
              amount: 400,
              type: 'SAIDA'
            }
          });
        })
      ]);

      // Tentar operação bulk com contexto do usuário 1
      const bulkResult = await executeWithUserContext(userId1, async () => {
        return await prisma.transaction.findMany({
          where: {
            id: { in: [trans1.id, trans2.id] }
          }
        });
      });

      // Deve retornar apenas a transação do usuário 1
      const isIsolated = bulkResult.length === 1 && bulkResult[0].userId === userId1;

      logger.info('Teste operação bulk RLS:', {
        userId1,
        userId2,
        transactionsFound: bulkResult.length,
        correctIsolation: isIsolated,
        result: isIsolated ? 'PASS' : 'FAIL'
      });

      return isIsolated;
    } catch (error) {
      logger.error('Erro no teste bulk RLS:', error);
      return false;
    }
  }

  // Executar todos os testes
  async runAllTests(userId1: string, userId2: string): Promise<{ passed: number; total: number; details: any[] }> {
    const tests = [
      { name: 'Basic RLS', test: () => this.testBasicRLS(userId1, userId2) },
      { name: 'Transaction RLS', test: () => this.testTransactionRLS(userId1) },
      { name: 'Bulk Operation Isolation', test: () => this.testBulkOperationIsolation(userId1, userId2) }
    ];

    const results = [];
    let passed = 0;

    for (const { name, test } of tests) {
      try {
        const result = await test();
        results.push({ name, passed: result, error: null });
        if (result) passed++;
      } catch (error) {
        results.push({ name, passed: false, error: error.message });
      }
    }

    logger.info('Resultados dos testes de isolamento:', {
      passed,
      total: tests.length,
      success: passed === tests.length
    });

    return { passed, total: tests.length, details: results };
  }
}

export const dataIsolationTests = new DataIsolationTests();