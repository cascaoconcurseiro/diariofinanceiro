import { Request, Response } from 'express';
import { recurringTransactionService } from '../services/recurringTransactionService';
import { logger } from '../utils/logger';
import { validateRecurringTransaction, validateRecurringTransactionUpdate } from '../utils/validation';

export class RecurringTransactionController {
  // Listar transações recorrentes
  async getRecurringTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { page = 1, limit = 20, isActive } = req.query;

      const result = await recurringTransactionService.getRecurringTransactions(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        isActive === 'true' ? true : isActive === 'false' ? false : undefined
      );

      res.json(result);
    } catch (error) {
      logger.error('Erro ao listar transações recorrentes:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter transação recorrente específica
  async getRecurringTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const recurringTransaction = await recurringTransactionService.getRecurringTransaction(userId, id);
      
      if (!recurringTransaction) {
        return res.status(404).json({ error: 'Transação recorrente não encontrada' });
      }

      res.json(recurringTransaction);
    } catch (error) {
      logger.error('Erro ao obter transação recorrente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Criar nova transação recorrente
  async createRecurringTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const validation = validateRecurringTransaction(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: validation.errors
        });
      }

      const recurringTransaction = await recurringTransactionService.createRecurringTransaction(userId, validation.data);
      res.status(201).json(recurringTransaction);
    } catch (error) {
      logger.error('Erro ao criar transação recorrente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Atualizar transação recorrente
  async updateRecurringTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const validation = validateRecurringTransactionUpdate(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: validation.errors
        });
      }

      const recurringTransaction = await recurringTransactionService.updateRecurringTransaction(userId, id, validation.data);
      
      if (!recurringTransaction) {
        return res.status(404).json({ error: 'Transação recorrente não encontrada' });
      }

      res.json(recurringTransaction);
    } catch (error) {
      logger.error('Erro ao atualizar transação recorrente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Ativar/desativar transação recorrente
  async toggleRecurringTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const { isActive } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive deve ser um boolean' });
      }

      const recurringTransaction = await recurringTransactionService.toggleRecurringTransaction(userId, id, isActive);
      
      if (!recurringTransaction) {
        return res.status(404).json({ error: 'Transação recorrente não encontrada' });
      }

      res.json(recurringTransaction);
    } catch (error) {
      logger.error('Erro ao ativar/desativar transação recorrente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Excluir transação recorrente
  async deleteRecurringTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const { deleteGeneratedTransactions = false } = req.query;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const result = await recurringTransactionService.deleteRecurringTransaction(
        userId, 
        id, 
        deleteGeneratedTransactions === 'true'
      );
      
      if (!result.deleted) {
        return res.status(404).json({ error: 'Transação recorrente não encontrada' });
      }

      res.json({
        message: 'Transação recorrente excluída com sucesso',
        transactionsDeleted: result.transactionsDeleted
      });
    } catch (error) {
      logger.error('Erro ao excluir transação recorrente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Processar transações recorrentes manualmente
  async processRecurringTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { recurringId } = req.params;
      const { targetDate } = req.body;

      const result = await recurringTransactionService.processRecurringTransactions(
        userId,
        recurringId || undefined,
        targetDate ? new Date(targetDate) : undefined
      );

      res.json(result);
    } catch (error) {
      logger.error('Erro ao processar transações recorrentes:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter próximas execuções
  async getUpcomingRecurringTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { days = 30 } = req.query;

      const result = await recurringTransactionService.getUpcomingRecurringTransactions(
        userId,
        parseInt(days as string)
      );

      res.json(result);
    } catch (error) {
      logger.error('Erro ao obter próximas transações recorrentes:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter histórico de execuções
  async getRecurringTransactionHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { page = 1, limit = 20 } = req.query;

      const result = await recurringTransactionService.getRecurringTransactionHistory(
        userId,
        id,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json(result);
    } catch (error) {
      logger.error('Erro ao obter histórico de transação recorrente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Simular próximas execuções
  async simulateRecurringTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { months = 12 } = req.query;

      const result = await recurringTransactionService.simulateRecurringTransaction(
        userId,
        id,
        parseInt(months as string)
      );

      if (!result) {
        return res.status(404).json({ error: 'Transação recorrente não encontrada' });
      }

      res.json(result);
    } catch (error) {
      logger.error('Erro ao simular transação recorrente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export const recurringTransactionController = new RecurringTransactionController();