import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Middleware para garantir isolamento de dados por usuário
export const enforceDataIsolation = (resourceType: 'transaction' | 'recurringTransaction' | 'userSettings') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const resourceId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      if (!resourceId) {
        return next(); // Se não há ID específico, continua (ex: listagem)
      }

      // Verificar se o recurso pertence ao usuário
      let resource = null;
      
      switch (resourceType) {
        case 'transaction':
          resource = await prisma.transaction.findFirst({
            where: { id: resourceId, userId },
            select: { id: true, userId: true }
          });
          break;
          
        case 'recurringTransaction':
          resource = await prisma.recurringTransaction.findFirst({
            where: { id: resourceId, userId },
            select: { id: true, userId: true }
          });
          break;
          
        case 'userSettings':
          resource = await prisma.userSettings.findFirst({
            where: { id: resourceId, userId },
            select: { id: true, userId: true }
          });
          break;
      }

      if (!resource) {
        logger.warn(`Tentativa de acesso não autorizado`, {
          userId,
          resourceType,
          resourceId,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(404).json({ error: 'Recurso não encontrado' });
      }

      next();
    } catch (error) {
      logger.error('Erro no middleware de isolamento de dados:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
};

// Middleware para adicionar filtro de usuário automaticamente nas queries
export const addUserFilter = (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  // Adicionar userId ao contexto da requisição para uso nos controllers
  (req as any).userFilter = { userId };
  
  next();
};

// Middleware para validar propriedade de recursos em bulk operations
export const validateBulkOwnership = (resourceType: 'transaction' | 'recurringTransaction') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const resourceIds = req.body.ids || [];

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
        return res.status(400).json({ error: 'IDs dos recursos são obrigatórios' });
      }

      // Verificar se todos os recursos pertencem ao usuário
      let count = 0;
      
      switch (resourceType) {
        case 'transaction':
          count = await prisma.transaction.count({
            where: { id: { in: resourceIds }, userId }
          });
          break;
          
        case 'recurringTransaction':
          count = await prisma.recurringTransaction.count({
            where: { id: { in: resourceIds }, userId }
          });
          break;
      }

      if (count !== resourceIds.length) {
        logger.warn(`Tentativa de operação bulk não autorizada`, {
          userId,
          resourceType,
          requestedIds: resourceIds.length,
          ownedIds: count,
          ip: req.ip
        });
        
        return res.status(403).json({ error: 'Acesso negado a alguns recursos' });
      }

      next();
    } catch (error) {
      logger.error('Erro na validação de propriedade bulk:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
};

// Middleware para log de acesso a dados sensíveis
export const logDataAccess = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id;
    const resourceId = req.params.id;
    
    logger.info(`Acesso a dados: ${operation}`, {
      userId,
      resourceId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    next();
  };
};

// Função utilitária para criar queries com filtro de usuário
export const createUserQuery = (userId: string, additionalFilters: any = {}) => {
  return {
    userId,
    ...additionalFilters
  };
};

// Função para validar se um usuário pode acessar dados de outro usuário (admin)
export const canAccessUserData = async (requestingUserId: string, targetUserId: string): Promise<boolean> => {
  // Por enquanto, usuários só podem acessar seus próprios dados
  // Em futuras versões, pode incluir lógica de admin
  return requestingUserId === targetUserId;
};

// Middleware para operações que requerem confirmação de identidade
export const requireIdentityConfirmation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { password } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Confirmação de senha é obrigatória' });
    }

    // Verificar senha do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const { comparePassword } = await import('../utils/password');
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      logger.warn(`Tentativa de confirmação de identidade com senha incorreta`, {
        userId,
        ip: req.ip,
        path: req.path
      });
      
      return res.status(400).json({ error: 'Senha incorreta' });
    }

    next();
  } catch (error) {
    logger.error('Erro na confirmação de identidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};