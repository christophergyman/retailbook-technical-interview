import { describe, expect, it, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { createTestDb, type TestDB } from '../test-helpers';
import { users, offers, orders } from '../schema';

let db: TestDB;

beforeEach(() => {
  db = createTestDb();
});

describe('DB schema', () => {
  it('creates all tables without errors', () => {
    // If createTestDb() succeeded, tables exist. Verify by inserting a user.
    const id = randomUUID();
    db.insert(users).values({ id, email: 'test@test.com', name: 'Test' }).run();
    const user = db.select().from(users).where(eq(users.id, id)).get();
    expect(user).toBeDefined();
    expect(user!.name).toBe('Test');
  });

  it('returns Date objects for timestamp columns', () => {
    const id = randomUUID();
    db.insert(users).values({ id, email: 'ts@test.com', name: 'Timestamp' }).run();
    const user = db.select().from(users).where(eq(users.id, id)).get();
    expect(user!.createdAt).toBeInstanceOf(Date);
  });

  it('enforces foreign key on orders.userId', () => {
    const offerId = randomUUID();
    db.insert(users).values({ id: 'u1', email: 'a@a.com', name: 'A' }).run();
    db.insert(offers)
      .values({
        id: offerId,
        companyName: 'X',
        ticker: 'X',
        sector: 'Tech',
        pricePerShare: 10,
        totalShares: 100,
        availableShares: 100,
        ipoDate: '2025-01-01',
      })
      .run();

    expect(() =>
      db
        .insert(orders)
        .values({
          id: randomUUID(),
          userId: 'nonexistent-user',
          offerId,
          sharesRequested: 1,
          totalCost: 10,
        })
        .run(),
    ).toThrow();
  });

  it('supports relational query: order → offer', () => {
    const userId = randomUUID();
    const offerId = randomUUID();
    const orderId = randomUUID();

    db.insert(users).values({ id: userId, email: 'rel@test.com', name: 'Rel' }).run();
    db.insert(offers)
      .values({
        id: offerId,
        companyName: 'RelCo',
        ticker: 'REL',
        sector: 'Finance',
        pricePerShare: 20,
        totalShares: 500,
        availableShares: 500,
        ipoDate: '2025-06-01',
      })
      .run();
    db.insert(orders)
      .values({
        id: orderId,
        userId,
        offerId,
        sharesRequested: 5,
        totalCost: 100,
      })
      .run();

    const result = db.query.orders
      .findFirst({
        where: eq(orders.id, orderId),
        with: { offer: true },
      })
      .sync();

    expect(result).toBeDefined();
    expect(result!.offer).toBeDefined();
    expect(result!.offer.ticker).toBe('REL');
  });

  it('enforces unique constraint on offers.ticker', () => {
    db.insert(offers)
      .values({
        id: randomUUID(),
        companyName: 'First',
        ticker: 'DUP',
        sector: 'Tech',
        pricePerShare: 10,
        totalShares: 100,
        availableShares: 100,
        ipoDate: '2025-01-01',
      })
      .run();

    expect(() =>
      db
        .insert(offers)
        .values({
          id: randomUUID(),
          companyName: 'Second',
          ticker: 'DUP',
          sector: 'Finance',
          pricePerShare: 20,
          totalShares: 200,
          availableShares: 200,
          ipoDate: '2025-02-01',
        })
        .run(),
    ).toThrow();
  });
});
