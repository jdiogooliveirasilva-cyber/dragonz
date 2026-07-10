import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function createError(message: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

export function notFound(req: Request, res: Response, next: NextFunction): void {
  const error = createError(`Rota não encontrada: ${req.originalUrl}`, 404);
  next(error);
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Erro interno do servidor.';

  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', err.stack);
  } else if (!err.isOperational) {
    console.error('[Internal Error]', err.message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
