import { Request, Response, NextFunction } from 'express';
import { logRequest } from '@/utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Capturar quando a resposta termina
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logRequest(req, res, responseTime);
  });

  next();
};