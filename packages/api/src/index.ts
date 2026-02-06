import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { sql } from 'drizzle-orm';
import { db } from '@trading/db';
import { createLogger } from '@trading/logger';
import { factory } from './factory';
import { auth } from './auth/setup';
import { correlationId, requestLogger, loadSession, errorHandler } from './middleware';
import { securityHeaders } from './middleware/security-headers';
import { rateLimit } from './middleware/rate-limit';
import offersRoutes from './routes/offers';
import ordersRoutes from './routes/orders';
import dashboardRoutes from './routes/dashboard';

const log = createLogger('api:server');

const app = factory.createApp();

// Global middleware (order matters)
app.use('*', async (c, next) => {
  c.set('db', db);
  c.set('user', null);
  await next();
});
app.use('*', correlationId);
app.use('*', securityHeaders);
app.use('*', rateLimit);
app.use('*', requestLogger);
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (process.env.NODE_ENV !== 'production') {
        return origin;
      }
      const allowed = (process.env.FRONTEND_URL || 'http://localhost:3000')
        .split(',')
        .map((s) => s.trim());
      return allowed.includes(origin) ? origin : allowed[0];
    },
    credentials: true,
  }),
);
app.use('*', bodyLimit({ maxSize: 1024 * 1024 }));
app.use('*', loadSession);

// Better Auth handler
app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw));

// Routes
app.route('/api/offers', offersRoutes);
app.route('/api/orders', ordersRoutes);
app.route('/api/dashboard', dashboardRoutes);

// Health check with DB readiness probe
app.get('/api/health', (c) => {
  let dbStatus: 'connected' | 'error' = 'connected';
  try {
    db.run(sql`SELECT 1`);
  } catch {
    dbStatus = 'error';
  }

  const status = dbStatus === 'connected' ? 'ok' : 'degraded';
  return c.json(
    { status, timestamp: new Date().toISOString(), db: dbStatus },
    dbStatus === 'connected' ? 200 : 503,
  );
});

// Error handler
app.onError(errorHandler);

// Graceful shutdown
function shutdown(signal: string) {
  log.info({ signal }, 'shutting down gracefully');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
export type AppType = typeof app;
