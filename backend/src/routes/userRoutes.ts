import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';
import { validateUpdateProfile, validateChangePassword } from '../utils/validation';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting para operações sensíveis
const sensitiveOperationsLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas por IP
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordOperationsLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 tentativas por IP
  message: {
    error: 'Muitas tentativas de alteração de senha. Tente novamente em 1 hora.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Obter perfil do usuário
router.get('/profile', userController.getProfile.bind(userController));

// Atualizar perfil do usuário
router.put('/profile', userController.updateProfile.bind(userController));

// Alterar senha
router.put('/password', 
  passwordOperationsLimit,
  userController.changePassword.bind(userController)
);

// Solicitar recuperação de senha (não requer autenticação)
router.post('/password/reset-request', 
  sensitiveOperationsLimit,
  userController.requestPasswordReset.bind(userController)
);

// Redefinir senha com token (não requer autenticação)
router.post('/password/reset', 
  sensitiveOperationsLimit,
  userController.resetPassword.bind(userController)
);

// Obter estatísticas do usuário
router.get('/stats', userController.getUserStats.bind(userController));

// Excluir conta (operação irreversível)
router.delete('/account', 
  sensitiveOperationsLimit,
  userController.deleteAccount.bind(userController)
);

// Logout (invalidar token atual)
router.post('/logout', userController.logout.bind(userController));

// Logout de todos os dispositivos
router.post('/logout-all', 
  sensitiveOperationsLimit,
  userController.logoutAll.bind(userController)
);

export { router as userRoutes };