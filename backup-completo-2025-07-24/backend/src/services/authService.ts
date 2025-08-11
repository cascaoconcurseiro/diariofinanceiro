import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sessionService } from '../utils/sessionService';
import { logger } from '../utils/logger';
import { logSecurityEvent } from '../utils/securityUtils';
import { redisService } from './redisService';
import { string } from 'zod';
import { boolean } from 'zod';
import { boolean } from 'zod';
import { string } from 'zod';
import { createError } from '@/middleware/errorHandler';
import { createError } from '@/middleware/errorHandler';
import { AuthResponse } from '@/types/auth';
import { DeviceInfo } from '@/types/auth';
import { RefreshTokenRequest } from '@/types/auth';
import { createError } from '@/middleware/errorHandler';
import { createError } from '@/middleware/errorHandler';
import { createError } from '@/middleware/errorHandler';
import { AuthResponse } from '@/types/auth';
import { DeviceInfo } from '@/types/auth';
import { LoginRequest } from '@/types/auth';
import { createError } from '@/middleware/errorHandler';
import { createError } from '@/middleware/errorHandler';
import { AuthResponse } from '@/types/auth';
import { DeviceInfo } from '@/types/auth';
import { RegisterRequest } from '@/types/auth';

const prisma = new PrismaClient();

export class AuthService {
  // Registrar novo usuário
  static async register(data: RegisterRequest, deviceInfo?: DeviceInfo): Promise<AuthResponse> {
    try {
      // Verificar se email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        logSecurityEvent('REGISTRATION_ATTEMPT_EXISTING_EMAIL', {
          email: data.email,
          ip: deviceInfo?.ip
        });
        
        throw createError.conflict('Email já está em uso');
      }

      // Verificar se senha foi comprometida
      const isCompromised = await passwordUtils.checkIfCompromised(data.password);
      if (isCompromised) {
        throw createError.badRequest('Esta senha foi comprometida em vazamentos de dados. Escolha uma senha diferente.');
      }

      // Hash da senha
      const hashedPassword = await passwordUtils.hash(data.password);

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          settings: {
            create: {
              // Configurações padrão
              emergencyReserveAmount: 0,
              emergencyReserveMonths: 6,
              currency: 'BRL',
              timezone: 'America/Sao_Paulo',
              language: 'pt-BR',
              theme: 'light'
            }
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      });

      // Gerar tokens
      const accessToken = jwtUtils.generateAccessToken({
        userId: user.id,
        email: user.email
      });

      const refreshToken = jwtUtils.generateRefreshToken({
        userId: user.id,
        email: user.email
      });

      // Salvar sessão no Redis
      await sessionService.saveSession(accessToken, user.id, 15 * 60); // 15 minutos

      // Salvar sessão no banco
      await prisma.userSession.create({
        data: {
          userId: user.id,
          tokenHash: await passwordUtils.hash(refreshToken),
          deviceInfo: deviceInfo as any,
          ipAddress: deviceInfo?.ip,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
        }
      });

      logUserActivity(user.id, 'USER_REGISTERED', {
        email: user.email,
        ip: deviceInfo?.ip
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString()
        },
        accessToken,
        refreshToken
      };

    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  // Login do usuário
  static async login(data: LoginRequest, deviceInfo?: DeviceInfo): Promise<AuthResponse> {
    try {
      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (!user) {
        logSecurityEvent('LOGIN_ATTEMPT_INVALID_EMAIL', {
          email: data.email,
          ip: deviceInfo?.ip
        });
        
        throw createError.unauthorized('Email ou senha inválidos');
      }

      if (!user.isActive) {
        logSecurityEvent('LOGIN_ATTEMPT_INACTIVE_USER', {
          userId: user.id,
          email: data.email,
          ip: deviceInfo?.ip
        });
        
        throw createError.forbidden('Conta desativada');
      }

      // Verificar senha
      const isValidPassword = await passwordUtils.verify(data.password, user.password);
      
      if (!isValidPassword) {
        logSecurityEvent('LOGIN_ATTEMPT_INVALID_PASSWORD', {
          userId: user.id,
          email: data.email,
          ip: deviceInfo?.ip
        });
        
        throw createError.unauthorized('Email ou senha inválidos');
      }

      // Gerar tokens
      const accessToken = jwtUtils.generateAccessToken({
        userId: user.id,
        email: user.email
      });

      const refreshToken = jwtUtils.generateRefreshToken({
        userId: user.id,
        email: user.email
      });

      // Salvar sessão no Redis
      await sessionService.saveSession(accessToken, user.id, 15 * 60); // 15 minutos

      // Salvar sessão no banco
      await prisma.userSession.create({
        data: {
          userId: user.id,
          tokenHash: await passwordUtils.hash(refreshToken),
          deviceInfo: deviceInfo as any,
          ipAddress: deviceInfo?.ip,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
        }
      });

      // Atualizar último login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      logUserActivity(user.id, 'USER_LOGIN', {
        email: user.email,
        ip: deviceInfo?.ip
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString()
        },
        accessToken,
        refreshToken
      };

    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  // Refresh token
  static async refreshToken(data: RefreshTokenRequest, deviceInfo?: DeviceInfo): Promise<AuthResponse> {
    try {
      // Verificar refresh token
      const payload = jwtUtils.verifyRefreshToken(data.refreshToken);

      // Buscar sessão no banco
      const sessions = await prisma.userSession.findMany({
        where: {
          userId: payload.userId,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
              isActive: true
            }
          }
        }
      });

      // Verificar se alguma sessão corresponde ao token
      let validSession = null;
      for (const session of sessions) {
        const isValid = await passwordUtils.verify(data.refreshToken, session.tokenHash);
        if (isValid) {
          validSession = session;
          break;
        }
      }

      if (!validSession) {
        logSecurityEvent('INVALID_REFRESH_TOKEN', {
          userId: payload.userId,
          ip: deviceInfo?.ip
        });
        
        throw createError.unauthorized('Refresh token inválido');
      }

      if (!validSession.user.isActive) {
        throw createError.forbidden('Conta desativada');
      }

      // Gerar novos tokens
      const accessToken = jwtUtils.generateAccessToken({
        userId: validSession.user.id,
        email: validSession.user.email
      });

      const newRefreshToken = jwtUtils.generateRefreshToken({
        userId: validSession.user.id,
        email: validSession.user.email
      });

      // Salvar nova sessão no Redis
      await sessionService.saveSession(accessToken, validSession.user.id, 15 * 60);

      // Atualizar sessão no banco
      await prisma.userSession.update({
        where: { id: validSession.id },
        data: {
          tokenHash: await passwordUtils.hash(newRefreshToken),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      logUserActivity(validSession.user.id, 'TOKEN_REFRESHED', {
        ip: deviceInfo?.ip
      });

      return {
        user: {
          id: validSession.user.id,
          name: validSession.user.name,
          email: validSession.user.email,
          createdAt: validSession.user.createdAt.toISOString()
        },
        accessToken,
        refreshToken: newRefreshToken
      };

    } catch (error) {
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  // Logout
  static async logout(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      const payload = jwtUtils.verifyAccessToken(accessToken);

      // Remover sessão do Redis
      await sessionService.deleteSession(accessToken);

      // Remover sessão do banco se refresh token fornecido
      if (refreshToken) {
        const sessions = await prisma.userSession.findMany({
          where: { userId: payload.userId }
        });

        for (const session of sessions) {
          const isValid = await passwordUtils.verify(refreshToken, session.tokenHash);
          if (isValid) {
            await prisma.userSession.delete({
              where: { id: session.id }
            });
            break;
          }
        }
      }

      logUserActivity(payload.userId, 'USER_LOGOUT', {});

    } catch (error) {
      logger.error('Logout error:', error);
      // Não lançar erro no logout para não afetar UX
    }
  }

  // Logout de todos os dispositivos
  static async logoutAll(userId: string): Promise<void> => {
    try {
      // Remover todas as sessões do Redis
      await sessionService.deleteUserSessions(userId);

      // Remover todas as sessões do banco
      await prisma.userSession.deleteMany({
        where: { userId }
      });

      logUserActivity(userId, 'LOGOUT_ALL_DEVICES', {});

    } catch (error) {
      logger.error('Logout all error:', error);
      throw error;
    }
  }

  // Verificar se usuário existe
  static async userExists(email: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      });

      return !!user;
    } catch (error) {
      logger.error('User exists check error:', error);
      return false;
    }
  }

  // Obter informações do usuário por token
  static async getUserFromToken(accessToken: string) {
    try {
      const payload = jwtUtils.verifyAccessToken(accessToken);
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          lastLogin: true,
          isActive: true
        }
      });

      return user;
    } catch (error) {
      logger.error('Get user from token error:', error);
      return null;
    }
  }
}