import { createLogger, createChildLogger } from '@trading/logger';
import { factory } from '../factory';

const baseLog = createLogger('api:http');

export const requestLogger = factory.createMiddleware(async (c, next) => {
  const start = Date.now();
  const requestId = c.get('requestId');
  const log = createChildLogger(baseLog, { requestId });

  log.info({ method: c.req.method, path: c.req.path }, 'request start');

  await next();

  const durationMs = Date.now() - start;
  log.info(
    { method: c.req.method, path: c.req.path, status: c.res.status, durationMs },
    'request complete',
  );
});
