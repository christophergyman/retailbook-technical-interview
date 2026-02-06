import { eq } from 'drizzle-orm';
import { users } from '@trading/db';
import { createLogger } from '@trading/logger';
import { auth } from '../auth/setup';
import { factory } from '../factory';

const log = createLogger('api:auth');

export const loadSession = factory.createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (session) {
    log.debug({ userId: session.user.id }, 'session resolved from Better Auth');
    c.set('user', {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    });
  } else if (process.env.NODE_ENV !== 'production') {
    // Dev fallback: allow x-user-id header
    const userId = c.req.header('x-user-id');
    if (userId) {
      log.debug({ userId }, 'dev fallback activated');
      const db = c.get('db');
      const user = db.query.users
        .findFirst({
          where: eq(users.id, userId),
          columns: { id: true, email: true, name: true },
        })
        .sync();
      if (user) {
        log.debug({ userId }, 'dev fallback user found');
        c.set('user', user);
      } else {
        log.warn({ userId }, 'dev fallback user not found');
      }
    }
  }

  await next();
});
