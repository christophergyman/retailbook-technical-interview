import { eq } from 'drizzle-orm';
import { users } from '@trading/db';
import { factory } from '../factory';

export const devAuth = factory.createMiddleware(async (c, next) => {
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
  await next();
});
