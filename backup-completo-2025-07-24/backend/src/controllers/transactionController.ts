import { Request, Response } from 'express';
import { transactionService } from '../services/transactionService';
import { logger } from '../utils/logger';
import { validateTransactionData, validateTransactionFilters } from '../utils/validation';

export class TransactionController {
  // Listar transações com filtros e paginação
  async getTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const validation = validateTransactionFilters(req.query);
      if (!validation.isValid) {
        return res.status(400).json({ 
          error: 'Filtros inválidos', 
          details: validation.errors 
        });
      }

      const result = await transactionService.getTransactions(userId, validation.data);
      res.json(result);
    } catch (error) {
      logger.error('Erro ao listar transações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter transação por ID
  async getTransactionById(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const transaction = await transactionService.getTransactionById(userId, id);
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }

      res.json(transaction);
    } catch (error) {
      logger.error('Erro ao obter transação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Criar nova transação
  async createTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const validation = validateTransactionData(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: validation.errors 
        });
      }

      const transaction = await transactionService.createTransaction(userId, validation.data);
      res.status(201).json(transaction);
    } catch (error) {
      logger.error('Erro ao criar transação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Atualizar transação
  async updateTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const validation = validateTransactionData(req.body, true); // partial update
      if (!validation.isValid) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: validation.errors 
        });
      }

      const transaction = await transactionService.updateTransaction(userId, id, validation.data);
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }

      res.json(transaction);
    } catch (error) {
      logger.error('Erro ao atualizar transação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Excluir transação
  async deleteTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const success = await transactionService.deleteTransaction(userId, id);
      
      if (!success) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }

      res.json({ message: 'Transação excluída com sucesso' });
    } catch (error) {
      logger.error('Erro ao excluir transação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Excluir múltiplas transações
  async deleteMultipleTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { ids } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'IDs das transações são obrigatórios' });
      }

      const result = await transactionService.deleteMultipleTransactions(userId, ids);
      res.json(result);
    } catch (error) {
      logger.error('Erro ao excluir múltiplas transações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter resumo financeiro
  async getFinancialSummary(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { startDate, endDate } = req.query;
      const summary = await transactionService.getFinancialSummary(userId, {
        startDate: startDate as string,
        endDate: endDate as string
      });

      res.json(summary);
    } catch (error) {
      logger.error('Erro ao obter resumo financeiro:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter transações por categoria
  async getTransactionsByCategory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { startDate, endDate } = req.query;
      const result = await transactionService.getTransactionsByCategory(userId, {
        startDate: startDate as string,
        endDate: endDate as string
      });

      res.json(result);
    } catch (error) {
      logger.error('Erro ao obter transações por categoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter evolução mensal
  async getMonthlyEvolution(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { months = 12 } = req.query;
      const result = await transactionService.getMonthlyEvolution(userId, parseInt(months as string));

      res.json(result);
    } catch (error) {
      logger.error('Erro ao obter evolução mensal:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Importar transações
  async importTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { transactions } = req.body;
      
      if (!Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({ error: 'Lista de transações é obrigatória' });
      }

      const result = await transactionService.importTransactions(userId, transactions);
      res.json(result);
    } catch (error) {
      logger.error('Erro ao importar transações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Exportar transações
  async exportTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { format = 'json', startDate, endDate } = req.query;
      const result = await transactionService.exportTransactions(userId, {
        format: format as string,
        startDate: startDate as string,
        endDate: endDate as string
      });

      // Configurar headers para download
      const filename = `transacoes_${new Date().toISOString().split('T')[0]}.${format}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
      } else {
        res.setHeader('Content-Type', 'application/json');
      }

      res.send(result);
    } catch (error) {
      logger.error('Erro ao exportar transações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Duplicar transação
  async duplicateTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const transaction = await transactionService.duplicateTransaction(userId, id);
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }

      res.status(201).json(transaction);
    } catch (error) {
      logger.error('Erro ao duplicar transação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter estatísticas avançadas
  async getAdvancedStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const stats = await transactionService.getAdvancedStats(userId);
      res.json(stats);
    } catch (error) {
      logger.error('Erro ao obter estatísticas avançadas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export const transactionController = new TransactionController();