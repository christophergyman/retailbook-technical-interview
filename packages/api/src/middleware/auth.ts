import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../factory';

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
  }
  await next();
});

export const optionalAuth = createMiddleware<AppEnv>(async (_c, next) => {
  await next();
});
