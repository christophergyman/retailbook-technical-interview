import { randomUUID } from 'crypto';
import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { users, offers, orders, orderStageHistory } from '@trading/db';
import type { AppEnv } from './factory';
import { correlationId } from './middleware/correlation-id';
import { errorHandler } from './middleware/error-handler';
import offersRoutes from './routes/offers';
import ordersRoutes from './routes/orders';
import dashboardRoutes from './routes/dashboard';
import type { TestDB } from '@trading/db/src/test-helpers';

export function createTestApp(db: TestDB) {
  const app = new Hono<AppEnv>();

  // Inject test db and init user to null
  app.use('*', async (c, next) => {
    c.set('db', db as AppEnv['Variables']['db']);
    c.set('user', null);
    await next();
  });

  // Correlation ID
  app.use('*', correlationId);

  // Auth simulation via x-user-id header
  app.use('*', async (c, next) => {
    const userId = c.req.header('x-user-id');
    if (userId) {
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

  // Mount routes
  app.route('/api/offers', offersRoutes);
  app.route('/api/orders', ordersRoutes);
  app.route('/api/dashboard', dashboardRoutes);

  // Error handler
  app.onError(errorHandler);

  return app;
}

export function seedTestData(db: TestDB) {
  const user1Id = randomUUID();
  const user2Id = randomUUID();
  const openOfferId = randomUUID();
  const closedOfferId = randomUUID();
  const orderId = randomUUID();
  const historyId = randomUUID();

  db.insert(users)
    .values([
      { id: user1Id, email: 'alice@test.com', name: 'Alice' },
      { id: user2Id, email: 'bob@test.com', name: 'Bob' },
    ])
    .run();

  db.insert(offers)
    .values([
      {
        id: openOfferId,
        companyName: 'Acme Corp',
        ticker: 'ACME',
        description: 'A test company',
        sector: 'Technology',
        pricePerShare: 25.5,
        totalShares: 1000,
        availableShares: 500,
        ipoDate: '2025-06-15',
        status: 'open',
      },
      {
        id: closedOfferId,
        companyName: 'Closed Inc',
        ticker: 'CLSD',
        description: 'A closed offer',
        sector: 'Finance',
        pricePerShare: 10.0,
        totalShares: 500,
        availableShares: 0,
        ipoDate: '2025-01-01',
        status: 'closed',
      },
    ])
    .run();

  db.insert(orders)
    .values({
      id: orderId,
      userId: user1Id,
      offerId: openOfferId,
      sharesRequested: 10,
      totalCost: 255.0,
      stage: 'PENDING_REVIEW',
    })
    .run();

  db.insert(orderStageHistory)
    .values({
      id: historyId,
      orderId,
      fromStage: null,
      toStage: 'PENDING_REVIEW',
    })
    .run();

  return { user1Id, user2Id, openOfferId, closedOfferId, orderId, historyId };
}

export function authHeader(userId: string) {
  return { 'x-user-id': userId };
}
