import jwt from 'jsonwebtoken';
import { JWTPayload } from '@/types/auth';
import { logger } from '@/utils/logger';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets must be defined in environment variables');
}

export const jwtUtils = {
  // Gerar access token
  generateAccessToken: (payload: { userId: string; email: string }): string => {
    try {
      return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'diario-financeiro',
        audience: 'diario-financeiro-users'
      });
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  },

  // Gerar refresh token
  generateRefreshToken: (payload: { userId: string; email: string }): string => {
    try {
      return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'diario-financeiro',
        audience: 'diario-financeiro-users'
      });
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  },

  // Verificar access token
  verifyAccessToken: (token: string): JWTPayload => {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'diario-financeiro',
        audience: 'diario-financeiro-users'
      }) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        logger.error('Error verifying access token:', error);
        throw new Error('Token verification failed');
      }
    }
  },

  // Verificar refresh token
  verifyRefreshToken: (token: string): JWTPayload => {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET, {
        issuer: 'diario-financeiro',
        audience: 'diario-financeiro-users'
      }) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        logger.error('Error verifying refresh token:', error);
        throw new Error('Refresh token verification failed');
      }
    }
  },

  // Decodificar token sem verificar (para debug)
  decodeToken: (token: string): any => {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Error decoding token:', error);
      return null;
    }
  },

  // Obter tempo de expiração do token
  getTokenExpiration: (token: string): Date | null => {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      logger.error('Error getting token expiration:', error);
      return null;
    }
  },

  // Verificar se token está próximo do vencimento (5 minutos)
  isTokenNearExpiry: (token: string): boolean => {
    try {
      const expiration = jwtUtils.getTokenExpiration(token);
      if (!expiration) return true;
      
      const now = new Date();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutos em ms
      
      return (expiration.getTime() - now.getTime()) < fiveMinutes;
    } catch (error) {
      return true;
    }
  }
};