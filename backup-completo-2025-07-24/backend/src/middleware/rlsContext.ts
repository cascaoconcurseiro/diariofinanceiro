import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Middleware para configurar o contexto RLS do PostgreSQL
export const setRLSContext = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return next(); // Se não há usuário, continua sem configurar RLS
    }

    // Configurar o usuário atual no contexto do PostgreSQL
    await prisma.$executeRaw`SELECT set_current_user_id(${userId})`;

    // Log para debug (remover em produção)
    logger.debug(`RLS context set for user: ${userId}`);

    next();
  } catch (error) {
    logger.error('Erro ao configurar contexto RLS:', error);
    // Não falha a requisição, apenas loga o erro
    next();
  }
};

// Middleware para limpar o contexto RLS após a requisição
export const clearRLSContext = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Limpar o contexto do usuário
    await prisma.$executeRaw`SELECT set_config('app.current_user_id', '', true)`;
    
    next();
  } catch (error) {
    logger.error('Erro ao limpar contexto RLS:', error);
    next();
  }
};

// Função utilitária para executar queries com contexto de usuário específico
export const executeWithUserContext = async <T>(
  userId: string,
  operation: () => Promise<T>
): Promise<T> => {
  try {
    // Configurar contexto
    await prisma.$executeRaw`SELECT set_current_user_id(${userId})`;
    
    // Executar operação
    const result = await operation();
    
    // Limpar contexto
    await prisma.$executeRaw`SELECT set_config('app.current_user_id', '', true)`;
    
    return result;
  } catch (error) {
    // Garantir que o contexto seja limpo mesmo em caso de erro
    try {
      await prisma.$executeRaw`SELECT set_config('app.current_user_id', '', true)`;
    } catch (cleanupError) {
      logger.error('Erro ao limpar contexto RLS após falha:', cleanupError);
    }
    
    throw error;
  }
};

// Classe para gerenciar transações com RLS
export class RLSTransaction {
  private userId: string;
  private transaction: any;

  constructor(userId: string) {
    this.userId = userId;
  }

  async execute<T>(operation: (tx: any) => Promise<T>): Promise<T> {
    return await prisma.$transaction(async (tx) => {
      // Configurar contexto RLS dentro da transação
      await tx.$executeRaw`SELECT set_current_user_id(${this.userId})`;
      
      try {
        return await operation(tx);
      } finally {
        // Limpar contexto
        await tx.$executeRaw`SELECT set_config('app.current_user_id', '', true)`;
      }
    });
  }
}

// Função para criar uma nova transação com RLS
export const createRLSTransaction = (userId: string) => {
  return new RLSTransaction(userId);
};

// Middleware para validar que RLS está funcionando
export const validateRLS = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return next();
    }

    // Testar se o contexto RLS está configurado corretamente
    const result = await prisma.$queryRaw<[{ get_current_user_id: string }]>`
      SELECT get_current_user_id() as get_current_user_id
    `;

    const currentUserId = result[0]?.get_current_user_id;

    if (currentUserId !== userId) {
      logger.error('RLS context mismatch', {
        expectedUserId: userId,
        actualUserId: currentUserId,
        path: req.path
      });
      
      return res.status(500).json({ 
        error: 'Erro de segurança: contexto de usuário inválido' 
      });
    }

    next();
  } catch (error) {
    logger.error('Erro na validação RLS:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função para desabilitar RLS temporariamente (apenas para operações administrativas)
export const bypassRLS = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    // ATENÇÃO: Use apenas para operações administrativas necessárias
    await prisma.$executeRaw`SET row_security = off`;
    
    const result = await operation();
    
    await prisma.$executeRaw`SET row_security = on`;
    
    return result;
  } catch (error) {
    // Garantir que RLS seja reabilitado
    try {
      await prisma.$executeRaw`SET row_security = on`;
    } catch (resetError) {
      logger.error('CRÍTICO: Falha ao reabilitar RLS:', resetError);
    }
    
    throw error;
  }
};