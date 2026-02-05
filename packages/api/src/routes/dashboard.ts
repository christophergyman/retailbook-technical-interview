import { createLogger } from '@trading/logger';
import { factory } from '../factory';
import { requireAuth } from '../middleware/auth';
import { getDashboardStats } from '../services/dashboard.service';

const log = createLogger('api:dashboard');
const app = factory.createApp();

app.use('*', requireAuth);

app.get('/', (c) => {
  const db = c.get('db');
  const user = c.get('user')!;

  const stats = getDashboardStats(db, user.id);

  log.info({ userId: user.id, requestId: c.get('requestId') }, 'dashboard accessed');

  return c.json(stats);
});

export default app;
