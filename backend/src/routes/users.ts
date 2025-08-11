import { Router } from 'express';
import { authenticate } from '@/middleware/auth';

const router = Router();

// Todas as rotas de usuários requerem autenticação
router.use(authenticate);

// TODO: Implementar rotas de usuários
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'Rotas de usuários em desenvolvimento',
    data: {}
  });
});

export { router as userRoutes };