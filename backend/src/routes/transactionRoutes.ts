import { Router } from 'express';
import { transactionController } from '../controllers/transactionController';
import { authenticateToken } from '../middleware/auth';
import { enforceDataIsolation, validateBulkOwnership, addUserFilter } from '../middleware/dataIsolation';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting para operações bulk
const bulkOperationsLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 operações bulk por IP
  message: {
    error: 'Muitas operações em lote. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Todas as rotas requerem autenticação
router.use(authenticateToken);
router.use(addUserFilter);

// Listar transações com filtros e paginação
router.get('/', transactionController.getTransactions.bind(transactionController));

// Obter resumo financeiro
router.get('/summary', transactionController.getFinancialSummary.bind(transactionController));

// Obter transações por categoria
router.get('/by-category', transactionController.getTransactionsByCategory.bind(transactionController));

// Obter evolução mensal
router.get('/monthly-evolution', transactionController.getMonthlyEvolution.bind(transactionController));

// Obter estatísticas avançadas
router.get('/stats', transactionController.getAdvancedStats.bind(transactionController));

// Exportar transações
router.get('/export', transactionController.exportTransactions.bind(transactionController));

// Obter transação específica por ID
router.get('/:id', 
  enforceDataIsolation('transaction'),
  transactionController.getTransactionById.bind(transactionController)
);

// Criar nova transação
router.post('/', transactionController.createTransaction.bind(transactionController));

// Importar transações
router.post('/import', 
  bulkOperationsLimit,
  transactionController.importTransactions.bind(transactionController)
);

// Duplicar transação
router.post('/:id/duplicate', 
  enforceDataIsolation('transaction'),
  transactionController.duplicateTransaction.bind(transactionController)
);

// Atualizar transação
router.put('/:id', 
  enforceDataIsolation('transaction'),
  transactionController.updateTransaction.bind(transactionController)
);

// Excluir transação
router.delete('/:id', 
  enforceDataIsolation('transaction'),
  transactionController.deleteTransaction.bind(transactionController)
);

// Excluir múltiplas transações
router.delete('/', 
  bulkOperationsLimit,
  validateBulkOwnership('transaction'),
  transactionController.deleteMultipleTransactions.bind(transactionController)
);

export { router as transactionRoutes };