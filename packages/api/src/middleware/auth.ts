import { factory } from '../factory';

export const requireAuth = factory.createMiddleware(async (c, next) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
  }
  await next();
});

export const optionalAuth = factory.createMiddleware(async (_c, next) => {
  await next();
});
