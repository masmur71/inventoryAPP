// src/common/middleware/errorHandler.ts
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';
import { config } from '../../config/env.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // 1. Log Error ke Console/File (Winston)
  if (err.statusCode >= 500) {
    logger.error('💥 APPLICATION ERROR:', err);
  } else {
    logger.warn(`⚠️ ${err.message}`, { statusCode: err.statusCode });
  }

  // 2. Response Development (Detail stack trace)
  if (config.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } 
  // 3. Response Production 
  else {
    // A. Operational Error 
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } 
    // B. Programming Error 
    else {
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
      });
    }
  }
};