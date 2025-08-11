import { Router } from 'express';
import { AuthController } from '@/controllers/authController';
import { authenticate, userRateLimit, logSensitiveActivity } from '@/middleware/auth';
import { 
  validate, 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema 
} from '@/utils/validation';

const router = Router();

// Rotas públicas (sem autenticação)
router.post(
  '/register',
  validate(registerSchema),
  logSensitiveActivity('USER_REGISTRATION'),
  AuthController.register
);

router.post(
  '/login',
  validate(loginSchema),
  logSensitiveActivity('USER_LOGIN'),
  AuthController.login
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  AuthController.refreshToken
);

router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  logSensitiveActivity('PASSWORD_RESET_REQUEST'),
  AuthController.forgotPassword
);

router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  logSensitiveActivity('PASSWORD_RESET'),
  AuthController.resetPassword
);

router.get(
  '/check-user',
  AuthController.checkUserExists
);

router.get(
  '/validate-token',
  AuthController.validateToken
);

// Rotas protegidas (requerem autenticação)
router.post(
  '/logout',
  authenticate,
  logSensitiveActivity('USER_LOGOUT'),
  AuthController.logout
);

router.post(
  '/logout-all',
  authenticate,
  userRateLimit(5, 15), // Máximo 5 logout-all por 15 minutos
  logSensitiveActivity('LOGOUT_ALL_DEVICES'),
  AuthController.logoutAll
);

router.get(
  '/me',
  authenticate,
  AuthController.me
);

export { router as authRoutes };