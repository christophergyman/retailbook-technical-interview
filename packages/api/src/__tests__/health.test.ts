import { describe, expect, it, beforeEach } from 'vitest';
import { createTestDb, type TestDB } from '@trading/db/src/test-helpers';
import { createTestApp, seedTestData } from '../test-utils';

let db: TestDB;
let app: ReturnType<typeof createTestApp>;

beforeEach(() => {
  db = createTestDb();
  app = createTestApp(db);
  seedTestData(db);

  // Add health check to test app (mirrors index.ts)
  app.get('/api/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
});

describe('GET /api/health', () => {
  it('returns { status: "ok" } with timestamp', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
