import { describe, expect, it, beforeEach } from 'vitest';
import { createTestDb, type TestDB } from '@trading/db/src/test-helpers';
import { createTestApp, seedTestData } from '../test-utils';

let db: TestDB;
let app: ReturnType<typeof createTestApp>;
let seed: ReturnType<typeof seedTestData>;

beforeEach(() => {
  db = createTestDb();
  app = createTestApp(db);
  seed = seedTestData(db);
});

describe('GET /api/offers', () => {
  it('returns open offers by default', async () => {
    const res = await app.request('/api/offers');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(1);
    expect(body[0].ticker).toBe('ACME');
    expect(body[0].status).toBe('open');
  });

  it('returns closed offers with ?status=closed', async () => {
    const res = await app.request('/api/offers?status=closed');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].ticker).toBe('CLSD');
    expect(body[0].status).toBe('closed');
  });
});

describe('GET /api/offers/:id', () => {
  it('returns offer details', async () => {
    const res = await app.request(`/api/offers/${seed.openOfferId}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(seed.openOfferId);
    expect(body.companyName).toBe('Acme Corp');
  });

  it('returns 404 for non-existent offer', async () => {
    const res = await app.request('/api/offers/nonexistent-id');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });
});
