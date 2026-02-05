import { createApp } from '../factory';
import { requireAuth } from '../middleware/auth';
import { getDashboardStats } from '../services/dashboard.service';

const app = createApp();

app.use('*', requireAuth);

app.get('/', (c) => {
  const db = c.get('db');
  const user = c.get('user')!;

  const stats = getDashboardStats(db, user.id);
  return c.json(stats);
});

export default app;
