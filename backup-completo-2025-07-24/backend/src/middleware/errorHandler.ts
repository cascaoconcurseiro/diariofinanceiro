import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger, logError } from '@/utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | AppError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Erro interno do servidor';
  let code = 'INTERNAL_ERROR';
  let details: any = undefined;

  // Log do erro
  logError(error, {
    url: req.originalUrl,
    method: req.method,
    userId: (req as any).user?.id,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Tratamento específico por tipo de erro
  if (error instanceof CustomError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
  }
  
  // Erros de validação Zod
  else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Dados inválidos';
    code = 'VALIDATION_ERROR';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
  }
  
  // Erros do Prisma
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Dados duplicados';
        code = 'DUPLICATE_ERROR';
        details = {
          field: error.meta?.target,
          constraint: 'unique'
        };
        break;
      
      case 'P2025':
        statusCode = 404;
        message = 'Registro não encontrado';
        code = 'NOT_FOUND';
        break;
      
      case 'P2003':
        statusCode = 400;
        message = 'Violação de chave estrangeira';
        code = 'FOREIGN_KEY_ERROR';
        break;
      
      case 'P2014':
        statusCode = 400;
        message = 'Dados relacionados inválidos';
        code = 'RELATION_ERROR';
        break;
      
      default:
        statusCode = 500;
        message = 'Erro de banco de dados';
        code = 'DATABASE_ERROR';
    }
  }
  
  // Erros de JWT
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
    code = 'INVALID_TOKEN';
  }
  
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
    code = 'EXPIRED_TOKEN';
  }
  
  // Erros de sintaxe JSON
  else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'JSON inválido';
    code = 'INVALID_JSON';
  }
  
  // Outros erros conhecidos
  else if ((error as AppError).statusCode) {
    statusCode = (error as AppError).statusCode!;
    message = error.message;
    code = (error as AppError).code || 'CUSTOM_ERROR';
  }

  // Resposta de erro
  const errorResponse: any = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  };

  // Adicionar detalhes apenas se existirem
  if (details) {
    errorResponse.details = details;
  }

  // Em desenvolvimento, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Middleware para capturar erros assíncronos
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Funções utilitárias para criar erros específicos
// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomError(`Rota não encontrada: ${req.originalUrl}`, 404, 'NOT_FOUND');
  next(error);
};

export const createError = {
  badRequest: (message: string = 'Requisição inválida') => 
    new CustomError(message, 400, 'BAD_REQUEST'),
  
  unauthorized: (message: string = 'Não autorizado') => 
    new CustomError(message, 401, 'UNAUTHORIZED'),
  
  forbidden: (message: string = 'Acesso negado') => 
    new CustomError(message, 403, 'FORBIDDEN'),
  
  notFound: (message: string = 'Não encontrado') => 
    new CustomError(message, 404, 'NOT_FOUND'),
  
  conflict: (message: string = 'Conflito de dados') => 
    new CustomError(message, 409, 'CONFLICT'),
  
  tooManyRequests: (message: string = 'Muitas requisições') => 
    new CustomError(message, 429, 'TOO_MANY_REQUESTS'),
  
  internal: (message: string = 'Erro interno do servidor') => 
    new CustomError(message, 500, 'INTERNAL_ERROR')
};