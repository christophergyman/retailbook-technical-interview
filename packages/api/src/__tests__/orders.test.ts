import { describe, expect, it, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { offers, orderStageHistory } from '@trading/db';
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

describe('POST /api/orders', () => {
  it('creates an order (201)', async () => {
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { ...authHeader(seed.user1Id), 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId: seed.openOfferId, sharesRequested: 5 }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.sharesRequested).toBe(5);
    expect(body.totalCost).toBe(127.5); // 5 * 25.5
    expect(body.stage).toBe('PENDING_REVIEW');
  });

  it('decrements available shares', async () => {
    await app.request('/api/orders', {
      method: 'POST',
      headers: { ...authHeader(seed.user1Id), 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId: seed.openOfferId, sharesRequested: 5 }),
    });
    const offer = db.select().from(offers).where(eq(offers.id, seed.openOfferId)).get();
    expect(offer!.availableShares).toBe(495); // 500 - 5
  });

  it('rejects closed offer', async () => {
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { ...authHeader(seed.user1Id), 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId: seed.closedOfferId, sharesRequested: 1 }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects insufficient shares', async () => {
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { ...authHeader(seed.user1Id), 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId: seed.openOfferId, sharesRequested: 9999 }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects sharesRequested=0 (validation)', async () => {
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { ...authHeader(seed.user1Id), 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId: seed.openOfferId, sharesRequested: 0 }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 unauthenticated', async () => {
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId: seed.openOfferId, sharesRequested: 5 }),
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/orders', () => {
  it("returns only user's orders", async () => {
    const res = await app.request('/api/orders', {
      headers: authHeader(seed.user1Id),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].id).toBe(seed.orderId);
  });

  it('returns empty for user with no orders', async () => {
    const res = await app.request('/api/orders', {
      headers: authHeader(seed.user2Id),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(0);
  });

  it('filters by stage query param', async () => {
    const res = await app.request('/api/orders?stage=PENDING_REVIEW', {
      headers: authHeader(seed.user1Id),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].stage).toBe('PENDING_REVIEW');
  });

  it('returns empty with non-matching stage filter', async () => {
    const res = await app.request('/api/orders?stage=SETTLED', {
      headers: authHeader(seed.user1Id),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(0);
  });

  it('returns 401 unauthenticated', async () => {
    const res = await app.request('/api/orders');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/orders/:id', () => {
  it('returns detail with offer and history', async () => {
    const res = await app.request(`/api/orders/${seed.orderId}`, {
      headers: authHeader(seed.user1Id),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(seed.orderId);
    expect(body.offer).toBeDefined();
    expect(body.offer.ticker).toBe('ACME');
    expect(body.stageHistory).toBeDefined();
    expect(body.stageHistory.length).toBeGreaterThanOrEqual(1);
  });

  it("returns 404 for other user's order", async () => {
    const res = await app.request(`/api/orders/${seed.orderId}`, {
      headers: authHeader(seed.user2Id),
    });
    expect(res.status).toBe(404);
  });

  it('returns 404 for non-existent order', async () => {
    const res = await app.request('/api/orders/nonexistent-order-id', {
      headers: authHeader(seed.user1Id),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });
});

describe('PATCH /api/orders/:id/stage', () => {
  it('advances stage correctly', async () => {
    const res = await app.request(`/api/orders/${seed.orderId}/stage`, {
      method: 'PATCH',
      headers: { ...authHeader(seed.user1Id), 'Content-Type': 'application/json' },
      body: JSON.stringify({ toStage: 'COMPLIANCE_CHECK' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stage).toBe('COMPLIANCE_CHECK');
  });

  it('creates history entry', async () => {
    await app.request(`/api/orders/${seed.orderId}/stage`, {
      method: 'PATCH',
      headers: { ...authHeader(seed.user1Id), 'Content-Type': 'application/json' },
      body: JSON.stringify({ toStage: 'COMPLIANCE_CHECK' }),
    });
    const history = db
      .select()
      .from(orderStageHistory)
      .where(eq(orderStageHistory.orderId, seed.orderId))
      .all();
    // Original PENDING_REVIEW entry + new transition
    expect(history.length).toBe(2);
    const latest = history.find((h) => h.toStage === 'COMPLIANCE_CHECK');
    expect(latest).toBeDefined();
    expect(latest!.fromStage).toBe('PENDING_REVIEW');
  });

  it('rejects invalid transition', async () => {
    const res = await app.request(`/api/orders/${seed.orderId}/stage`, {
      method: 'PATCH',
      headers: { ...authHeader(seed.user1Id), 'Content-Type': 'application/json' },
      body: JSON.stringify({ toStage: 'SETTLED' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('INVALID_TRANSITION');
  });

  it('allows rejection', async () => {
    const res = await app.request(`/api/orders/${seed.orderId}/stage`, {
      method: 'PATCH',
      headers: { ...authHeader(seed.user1Id), 'Content-Type': 'application/json' },
      body: JSON.stringify({ toStage: 'REJECTED', note: 'Not eligible' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stage).toBe('REJECTED');
  });

  it('transitions through full pipeline', async () => {
    // Create a new order
    const createRes = await app.request('/api/orders', {
      method: 'POST',
      headers: { ...authHeader(seed.user1Id), 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId: seed.openOfferId, sharesRequested: 2 }),
    });
    const order = await createRes.json();

    const stages = ['COMPLIANCE_CHECK', 'APPROVED', 'ALLOCATED', 'SETTLED'];
    for (const stage of stages) {
      const res = await app.request(`/api/orders/${order.id}/stage`, {
        method: 'PATCH',
        headers: { ...authHeader(seed.user1Id), 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStage: stage }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.stage).toBe(stage);
    }
  });

  it('stores note in transition history', async () => {
    await app.request(`/api/orders/${seed.orderId}/stage`, {
      method: 'PATCH',
      headers: { ...authHeader(seed.user1Id), 'Content-Type': 'application/json' },
      body: JSON.stringify({ toStage: 'COMPLIANCE_CHECK', note: 'Looks good' }),
    });
    const history = db
      .select()
      .from(orderStageHistory)
      .where(eq(orderStageHistory.orderId, seed.orderId))
      .all();
    const transition = history.find((h) => h.toStage === 'COMPLIANCE_CHECK');
    expect(transition).toBeDefined();
    expect(transition!.note).toBe('Looks good');
  });

  it('rejects non-existent offer in order creation', async () => {
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { ...authHeader(seed.user1Id), 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId: 'nonexistent-offer', sharesRequested: 1 }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });
});
