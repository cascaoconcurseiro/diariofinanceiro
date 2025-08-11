import { Router } from 'express';
import { authenticate } from '@/middleware/auth';

const router = Router();

// Todas as rotas de transações requerem autenticação
router.use(authenticate);

// TODO: Implementar rotas de transações
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Rotas de transações em desenvolvimento',
    data: []
  });
});

export { router as transactionRoutes };