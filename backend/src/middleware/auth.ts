import { Request, Response, NextFunction } from 'express';
import { jwtUtils } from '@/utils/jwt';
import { createError } from '@/middleware/errorHandler';
import { logSecurityEvent, logUserActivity } from '@/utils/logger';
import { sessionService, rateLimitService } from '@/services/redisService';
import { AuthenticatedRequest } from '@/types/auth';

// Middleware de autenticação principal
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logSecurityEvent('MISSING_AUTH_TOKEN', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      
      throw createError.unauthorized('Token de acesso requerido');
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    if (!token) {
      throw createError.unauthorized('Token inválido');
    }

    // Verificar se token está na blacklist
    const isBlacklisted = await sessionService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      logSecurityEvent('BLACKLISTED_TOKEN_USED', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      
      throw createError.unauthorized('Token inválido');
    }

    // Verificar token JWT
    const payload = jwtUtils.verifyAccessToken(token);

    // Verificar se sessão ainda é válida no Redis
    const session = await sessionService.getSession(token);
    
    if (!session || session.userId !== payload.userId) {
      logSecurityEvent('INVALID_SESSION', {
        userId: payload.userId,
        ip: req.ip,
        tokenExpiry: new Date(payload.exp * 1000)
      });
      
      throw createError.unauthorized('Sessão inválida ou expirada');
    }

    // Adicionar informações do usuário à requisição
    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      email: payload.email,
      name: session.userId, // Será preenchido pelo middleware de usuário se necessário
      exp: payload.exp
    };

    // Adicionar token à requisição para uso em logout
    (req as any).token = token;

    // Log da atividade do usuário
    logUserActivity(payload.userId, 'API_ACCESS', {
      method: req.method,
      path: req.path,
      ip: req.ip
    });

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware opcional de autenticação (não falha se não autenticado)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        try {
          const payload = jwtUtils.verifyAccessToken(token);
          const session = await sessionService.getSession(token);
          
          if (session && session.userId === payload.userId) {
            (req as AuthenticatedRequest).user = {
              id: payload.userId,
              email: payload.email,
              name: session.userId
            };
          }
        } catch (error) {
          // Ignorar erros em autenticação opcional
        }
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

// Middleware de rate limiting por usuário
export const userRateLimit = (maxRequests: number = 100, windowMinutes: number = 15) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      if (!user) {
        return next();
      }

      const key = `rate_limit:user:${user.id}`;
      const windowSeconds = windowMinutes * 60;
      
      const currentCount = await rateLimitService.increment(key, windowSeconds);
      
      // Adicionar headers de rate limit
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - currentCount).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + windowSeconds * 1000).toISOString()
      });

      if (currentCount > maxRequests) {
        logSecurityEvent('RATE_LIMIT_EXCEEDED', {
          userId: user.id,
          ip: req.ip,
          path: req.path,
          count: currentCount,
          limit: maxRequests
        });
        
        throw createError.tooManyRequests(
          `Limite de ${maxRequests} requisições por ${windowMinutes} minutos excedido`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware para verificar se usuário é ativo
export const requireActiveUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      throw createError.unauthorized('Usuário não autenticado');
    }

    // Aqui você pode adicionar verificações adicionais
    // como verificar se o usuário está ativo no banco de dados
    
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware para verificar permissões específicas
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      if (!user) {
        throw createError.unauthorized('Usuário não autenticado');
      }

      // Implementar lógica de permissões conforme necessário
      // Por enquanto, todos os usuários autenticados têm todas as permissões
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware para verificar se o usuário pode acessar recurso específico
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const resourceId = req.params[resourceIdParam];
      
      if (!user) {
        throw createError.unauthorized('Usuário não autenticado');
      }

      // Para recursos que pertencem ao usuário, verificar se o ID bate
      if (resourceIdParam === 'userId' && resourceId !== user.id) {
        logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
          userId: user.id,
          attemptedResource: resourceId,
          ip: req.ip,
          path: req.path
        });
        
        throw createError.forbidden('Acesso negado a este recurso');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware para refresh de token automático
export const autoRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (jwtUtils.isTokenNearExpiry(token)) {
        // Token próximo do vencimento, sugerir refresh
        res.set('X-Token-Refresh-Suggested', 'true');
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

// Middleware para log de atividades sensíveis
export const logSensitiveActivity = (activity: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    
    if (user) {
      logUserActivity(user.id, activity, {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    
    next();
  };
};