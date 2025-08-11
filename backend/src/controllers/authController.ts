import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/authService';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validate 
} from '@/utils/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { DeviceInfo } from '@/types/auth';

export class AuthController {
  // Registrar usuário
  static register = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = registerSchema.parse(req.body);
    
    const deviceInfo: DeviceInfo = {
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      platform: req.get('Sec-CH-UA-Platform'),
      browser: req.get('Sec-CH-UA')
    };

    const result = await AuthService.register(validatedData, deviceInfo);

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: result
    });
  });

  // Login
  static login = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = loginSchema.parse(req.body);
    
    const deviceInfo: DeviceInfo = {
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      platform: req.get('Sec-CH-UA-Platform'),
      browser: req.get('Sec-CH-UA')
    };

    const result = await AuthService.login(validatedData, deviceInfo);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: result
    });
  });

  // Refresh token
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = refreshTokenSchema.parse(req.body);
    
    const deviceInfo: DeviceInfo = {
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      platform: req.get('Sec-CH-UA-Platform'),
      browser: req.get('Sec-CH-UA')
    };

    const result = await AuthService.refreshToken(validatedData, deviceInfo);

    res.json({
      success: true,
      message: 'Token renovado com sucesso',
      data: result
    });
  });

  // Logout
  static logout = asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.substring(7); // Remove 'Bearer '
    const { refreshToken } = req.body;

    if (accessToken) {
      await AuthService.logout(accessToken, refreshToken);
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  });

  // Logout de todos os dispositivos
  static logoutAll = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    await AuthService.logoutAll(user.id);

    res.json({
      success: true,
      message: 'Logout realizado em todos os dispositivos'
    });
  });

  // Verificar se usuário existe (para formulários)
  static checkUserExists = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.query;
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }

    const exists = await AuthService.userExists(email);

    res.json({
      success: true,
      data: { exists }
    });
  });

  // Obter informações do usuário atual
  static me = asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.substring(7);

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido'
      });
    }

    const user = await AuthService.getUserFromToken(accessToken);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
          lastLogin: user.lastLogin?.toISOString(),
          isActive: user.isActive
        }
      }
    });
  });

  // Esqueci minha senha (placeholder)
  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = forgotPasswordSchema.parse(req.body);

    // TODO: Implementar envio de email
    // Por enquanto, apenas log
    console.log('Password reset requested for:', validatedData.email);

    res.json({
      success: true,
      message: 'Se o email existir, você receberá instruções para redefinir sua senha'
    });
  });

  // Resetar senha (placeholder)
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = resetPasswordSchema.parse(req.body);

    // TODO: Implementar reset de senha
    console.log('Password reset attempt with token:', validatedData.token);

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });
  });

  // Validar token (para verificar se ainda é válido)
  static validateToken = asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.substring(7);

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido'
      });
    }

    const user = await AuthService.getUserFromToken(accessToken);

    res.json({
      success: true,
      data: {
        valid: !!user,
        user: user ? {
          id: user.id,
          email: user.email,
          name: user.name
        } : null
      }
    });
  });
}