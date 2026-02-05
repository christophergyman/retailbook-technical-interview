import { eq } from 'drizzle-orm';
import { users } from '@trading/db';
import { auth } from '../auth/setup';
import { factory } from '../factory';

export const loadSession = factory.createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (session) {
    c.set('user', {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    });
  } else if (process.env.NODE_ENV !== 'production') {
    // Dev fallback: allow x-user-id header
    const userId = c.req.header('x-user-id');
    if (userId) {
      const db = c.get('db');
      const user = db.query.users
        .findFirst({
          where: eq(users.id, userId),
          columns: { id: true, email: true, name: true },
        })
        .sync();
      if (user) {
        c.set('user', user);
      }
    }
  }

  await next();
});

export const requireAuth = factory.createMiddleware(async (c, next) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
  }
  await next();
});
