import { Router } from 'express';
import { recurringTransactionController } from '../controllers/recurringTransactionController';
import { authenticateToken } from '../middleware/auth';
import { enforceDataIsolation, addUserFilter } from '../middleware/dataIsolation';
import { setRLSContext } from '../middleware/rlsContext';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting para operações de escrita
const writeOperationsLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // máximo 20 operações por minuto
  message: {
    error: 'Muitas operações. Tente novamente em 1 minuto.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para processamento manual
const processLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5, // máximo 5 processamentos por 5 minutos
  message: {
    error: 'Limite de processamento excedido. Tente novamente em 5 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware aplicado a todas as rotas
router.use(authenticateToken);
router.use(setRLSContext);
router.use(addUserFilter);

// Listar transações recorrentes
router.get('/', recurringTransactionController.getRecurringTransactions.bind(recurringTransactionController));

// Obter próximas execuções
router.get('/upcoming', recurringTransactionController.getUpcomingRecurringTransactions.bind(recurringTransactionController));

// Processar transações recorrentes manualmente (todas do usuário)
router.post('/process', 
  processLimit,
  recurringTransactionController.processRecurringTransactions.bind(recurringTransactionController)
);

// Criar nova transação recorrente
router.post('/', 
  writeOperationsLimit,
  recurringTransactionController.createRecurringTransaction.bind(recurringTransactionController)
);

// Obter transação recorrente específica
router.get('/:id', 
  enforceDataIsolation('recurringTransaction'),
  recurringTransactionController.getRecurringTransaction.bind(recurringTransactionController)
);

// Atualizar transação recorrente
router.put('/:id', 
  writeOperationsLimit,
  enforceDataIsolation('recurringTransaction'),
  recurringTransactionController.updateRecurringTransaction.bind(recurringTransactionController)
);

// Ativar/desativar transação recorrente
router.patch('/:id/toggle', 
  writeOperationsLimit,
  enforceDataIsolation('recurringTransaction'),
  recurringTransactionController.toggleRecurringTransaction.bind(recurringTransactionController)
);

// Processar transação recorrente específica
router.post('/:id/process', 
  processLimit,
  enforceDataIsolation('recurringTransaction'),
  recurringTransactionController.processRecurringTransactions.bind(recurringTransactionController)
);

// Obter histórico de execuções
router.get('/:id/history', 
  enforceDataIsolation('recurringTransaction'),
  recurringTransactionController.getRecurringTransactionHistory.bind(recurringTransactionController)
);

// Simular próximas execuções
router.get('/:id/simulate', 
  enforceDataIsolation('recurringTransaction'),
  recurringTransactionController.simulateRecurringTransaction.bind(recurringTransactionController)
);

// Excluir transação recorrente
router.delete('/:id', 
  writeOperationsLimit,
  enforceDataIsolation('recurringTransaction'),
  recurringTransactionController.deleteRecurringTransaction.bind(recurringTransactionController)
);

export { router as recurringTransactionRoutes };