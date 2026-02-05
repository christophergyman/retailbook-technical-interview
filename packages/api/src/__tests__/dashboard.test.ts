import { describe, expect, it, beforeEach } from 'vitest';
import { createTestDb, type TestDB } from '@trading/db/src/test-helpers';
import { createTestApp, seedTestData, authHeader } from '../test-utils';

let db: TestDB;
let app: ReturnType<typeof createTestApp>;
let seed: ReturnType<typeof seedTestData>;

beforeEach(() => {
  db = createTestDb();
  app = createTestApp(db);
  seed = seedTestData(db);
});

describe('GET /api/dashboard', () => {
  it('returns correct aggregate stats', async () => {
    const res = await app.request('/api/dashboard', {
      headers: authHeader(seed.user1Id),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalOrders).toBe(1);
    expect(body.totalInvested).toBe(255);
    expect(body.ordersByStage).toBeDefined();
    expect(body.ordersByStage['PENDING_REVIEW']).toBe(1);
    expect(body.recentOrders).toHaveLength(1);
    expect(body.recentOrders[0].ticker).toBe('ACME');
  });

  it('returns zero stats for user with no orders', async () => {
    const res = await app.request('/api/dashboard', {
      headers: authHeader(seed.user2Id),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalOrders).toBe(0);
    expect(body.totalInvested).toBe(0);
    expect(body.recentOrders).toHaveLength(0);
  });

  it('returns 401 unauthenticated', async () => {
    const res = await app.request('/api/dashboard');
    expect(res.status).toBe(401);
  });
});
