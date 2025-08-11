import { Request, Response } from 'express';
import { redisService } from '../services/redisService';
import { logger } from '../utils/logger';

export class LogoutController {
  // Logout do usuário (invalidar token atual)
  async logout(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const token = req.token; // Token atual extraído do middleware de auth
      
      if (!userId || !token) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Adicionar token à blacklist
      const tokenExpiry = req.user?.exp || Math.floor(Date.now() / 1000) + 3600; // 1 hora padrão
      const ttl = tokenExpiry - Math.floor(Date.now() / 1000);
      
      if (ttl > 0) {
        await redisService.setex(`blacklist:${token}`, ttl, 'true');
      }

      // Remover refresh token se fornecido
      const { refreshToken } = req.body;
      if (refreshToken) {
        await redisService.del(`refresh_token:${userId}:${refreshToken}`);
      }

      logger.info(`Logout realizado para usuário ${userId}`);
      res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      logger.error('Erro no logout:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Logout de todos os dispositivos
  async logoutAll(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Buscar e invalidar todas as sessões do usuário
      const sessionPattern = `session:${userId}:*`;
      const refreshTokenPattern = `refresh_token:${userId}:*`;
      
      const [sessionKeys, refreshKeys] = await Promise.all([
        redisService.keys(sessionPattern),
        redisService.keys(refreshTokenPattern)
      ]);

      // Deletar todas as chaves encontradas
      const allKeys = [...sessionKeys, ...refreshKeys];
      if (allKeys.length > 0) {
        await redisService.del(...allKeys);
      }

      logger.info(`Logout de todos os dispositivos para usuário ${userId} (${allKeys.length} sessões invalidadas)`);
      res.json({ 
        message: 'Logout realizado em todos os dispositivos',
        sessionsInvalidated: allKeys.length
      });
    } catch (error) {
      logger.error('Erro no logout de todos os dispositivos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export const logoutController = new LogoutController();