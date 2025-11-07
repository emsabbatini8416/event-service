import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { AppError } from '../types/error.types';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('UNAUTHORIZED', 'Missing authorization header', 401);
  }

  const token = authHeader.replace('Bearer ', '');

  if (token !== config.adminToken) {
    throw new AppError('UNAUTHORIZED', 'Invalid authorization token', 401);
  }

  next();
}

