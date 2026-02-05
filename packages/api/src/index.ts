import { cors } from 'hono/cors';
import { db } from '@trading/db';
import { factory } from './factory';
import { correlationId, requestLogger, devAuth, errorHandler } from './middleware';
import offersRoutes from './routes/offers';
import ordersRoutes from './routes/orders';
import dashboardRoutes from './routes/dashboard';

const app = factory.createApp();

// Global middleware (order matters)
app.use('*', async (c, next) => {
  c.set('db', db);
  c.set('user', null);
  await next();
});
app.use('*', correlationId);
app.use('*', requestLogger);
app.use('*', cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));

// Dev auth — only active outside production
if (process.env.NODE_ENV !== 'production') {
  app.use('*', devAuth);
}

// Routes
app.route('/api/offers', offersRoutes);
app.route('/api/orders', ordersRoutes);
app.route('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.onError(errorHandler);

export default app;
export type AppType = typeof app;
