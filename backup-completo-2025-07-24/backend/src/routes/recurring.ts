import { Router } from 'express';
import { authenticate } from '@/middleware/auth';

const router = Router();

// Todas as rotas de transações recorrentes requerem autenticação
router.use(authenticate);

// TODO: Implementar rotas de transações recorrentes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Rotas de transações recorrentes em desenvolvimento',
    data: []
  });
});

export { router as recurringRoutes };