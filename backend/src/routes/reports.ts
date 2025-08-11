import { Router } from 'express';
import { authenticate } from '@/middleware/auth';

const router = Router();

// Todas as rotas de relatórios requerem autenticação
router.use(authenticate);

// TODO: Implementar rotas de relatórios
router.get('/monthly/:year/:month', (req, res) => {
  res.json({
    success: true,
    message: 'Rotas de relatórios em desenvolvimento',
    data: {}
  });
});

export { router as reportRoutes };