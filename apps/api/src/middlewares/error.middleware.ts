import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/ApiError';
import { logger } from '../lib/logger';
import { ZodError } from 'zod';
import { config } from '../config';
import * as Sentry from '@sentry/node';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.format(),
    });
    return;
  }

  logger.error('Unhandled Exception', err, {
    method: req.method,
    path: req.path,
  });
  
  Sentry.captureException(err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    success: false,
    error: message,
    ...(config.env === 'development' && { stack: err.stack })
  });
}
