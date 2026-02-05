import type { Context } from 'hono';
import { createLogger } from '@trading/logger';
import type { AppEnv } from '../factory';

const log = createLogger('api:error');

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super('Forbidden', 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class InvalidTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(`Invalid stage transition from ${from} to ${to}`, 400, 'INVALID_TRANSITION');
    this.name = 'InvalidTransitionError';
  }
}

export function errorHandler(err: Error, c: Context<AppEnv>) {
  const requestId = c.get('requestId') ?? 'unknown';

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      log.error({ err, requestId, code: err.code }, err.message);
    } else {
      log.warn({ requestId, code: err.code, statusCode: err.statusCode }, err.message);
    }
    return c.json({ error: err.message, code: err.code, requestId }, err.statusCode as 400);
  }

  log.error({ err, requestId }, 'Unhandled error');
  return c.json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR', requestId }, 500);
}
