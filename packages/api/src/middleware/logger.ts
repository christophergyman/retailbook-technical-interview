import { createLogger } from '@trading/logger';
import { factory } from '../factory';

const log = createLogger('api:http');

export const requestLogger = factory.createMiddleware(async (c, next) => {
  const start = Date.now();
  const requestId = c.get('requestId');

  log.info({ method: c.req.method, path: c.req.path, requestId }, 'request start');

  await next();

  const durationMs = Date.now() - start;
  log.info(
    { method: c.req.method, path: c.req.path, status: c.res.status, durationMs, requestId },
    'request complete',
  );
});
