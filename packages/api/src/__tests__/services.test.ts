import { describe, expect, it, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { createTestDb, type TestDB } from '@trading/db/src/test-helpers';
import { users, offers, orderStageHistory } from '@trading/db';
import { listOffers, getOffer } from '../services/offer.service';
import {
  createOrder,
  listOrders,
  getOrderDetail,
  advanceOrderStage,
} from '../services/order.service';
import { getDashboardStats } from '../services/dashboard.service';
import {
  NotFoundError,
  ValidationError,
  InvalidTransitionError,
} from '../middleware/error-handler';

let db: TestDB;
let userId: string;
let openOfferId: string;
let closedOfferId: string;

function seedDb() {
  userId = randomUUID();
  openOfferId = randomUUID();
  closedOfferId = randomUUID();

  db.insert(users).values({ id: userId, email: 'svc@test.com', name: 'SvcUser' }).run();
  db.insert(offers)
    .values([
      {
        id: openOfferId,
        companyName: 'TechCo',
        ticker: 'TCH',
        description: 'Tech company',
        sector: 'Technology',
        pricePerShare: 10,
        totalShares: 1000,
        availableShares: 100,
        ipoDate: '2025-06-15',
        status: 'open',
      },
      {
        id: closedOfferId,
        companyName: 'FinCo',
        ticker: 'FIN',
        description: 'Finance company',
        sector: 'Finance',
        pricePerShare: 20,
        totalShares: 500,
        availableShares: 0,
        ipoDate: '2025-01-01',
        status: 'closed',
      },
    ])
    .run();
}

beforeEach(() => {
  db = createTestDb();
  seedDb();
});

describe('offer.service', () => {
  describe('listOffers', () => {
    it('returns open offers by default', () => {
      const result = listOffers(db);
      expect(result).toHaveLength(1);
      expect(result[0].ticker).toBe('TCH');
    });

    it('filters by sector', () => {
      const result = listOffers(db, { sector: 'Technology' });
      expect(result).toHaveLength(1);
      expect(result[0].sector).toBe('Technology');
    });

    it('returns empty when sector does not match', () => {
      const result = listOffers(db, { sector: 'Healthcare' });
      expect(result).toHaveLength(0);
    });

    it('returns closed offers with status=closed', () => {
      const result = listOffers(db, { status: 'closed' });
      expect(result).toHaveLength(1);
      expect(result[0].ticker).toBe('FIN');
    });

    it('filters by both status and sector', () => {
      const result = listOffers(db, { status: 'closed', sector: 'Finance' });
      expect(result).toHaveLength(1);
      expect(result[0].ticker).toBe('FIN');
    });

    it('returns empty when no offers match status and sector combination', () => {
      const result = listOffers(db, { status: 'closed', sector: 'Technology' });
      expect(result).toHaveLength(0);
    });
  });

  describe('getOffer', () => {
    it('returns offer by id', () => {
      const offer = getOffer(db, openOfferId);
      expect(offer.id).toBe(openOfferId);
      expect(offer.companyName).toBe('TechCo');
    });

    it('throws NotFoundError for non-existent id', () => {
      expect(() => getOffer(db, 'nonexistent-id')).toThrow(NotFoundError);
    });

    it('returns description as empty string when null', () => {
      // Insert an offer with null description
      const noDescId = randomUUID();
      db.insert(offers)
        .values({
          id: noDescId,
          companyName: 'NoDesc',
          ticker: 'ND',
          sector: 'Tech',
          pricePerShare: 5,
          totalShares: 100,
          availableShares: 100,
          ipoDate: '2025-01-01',
        })
        .run();

      const offer = getOffer(db, noDescId);
      expect(offer.description).toBe('');
    });
  });
});

describe('order.service', () => {
  describe('createOrder', () => {
    it('creates an order successfully', () => {
      const order = createOrder(db, userId, {
        offerId: openOfferId,
        sharesRequested: 5,
      });
      expect(order.id).toBeDefined();
      expect(order.sharesRequested).toBe(5);
      expect(order.totalCost).toBe(50); // 5 * 10
      expect(order.stage).toBe('PENDING_REVIEW');
    });

    it('throws NotFoundError for non-existent offer', () => {
      expect(() => createOrder(db, userId, { offerId: 'nonexistent', sharesRequested: 1 })).toThrow(
        NotFoundError,
      );
    });

    it('throws ValidationError for closed offer', () => {
      expect(() => createOrder(db, userId, { offerId: closedOfferId, sharesRequested: 1 })).toThrow(
        ValidationError,
      );
    });

    it('throws ValidationError for insufficient shares', () => {
      expect(() =>
        createOrder(db, userId, { offerId: openOfferId, sharesRequested: 9999 }),
      ).toThrow(ValidationError);
    });
  });

  describe('listOrders', () => {
    it('returns orders for a user', () => {
      createOrder(db, userId, { offerId: openOfferId, sharesRequested: 5 });
      const result = listOrders(db, userId);
      expect(result).toHaveLength(1);
    });

    it('returns empty for user with no orders', () => {
      const result = listOrders(db, userId);
      expect(result).toHaveLength(0);
    });

    it('filters by stage', () => {
      createOrder(db, userId, { offerId: openOfferId, sharesRequested: 5 });
      const pending = listOrders(db, userId, { stage: 'PENDING_REVIEW' });
      expect(pending).toHaveLength(1);

      const approved = listOrders(db, userId, { stage: 'APPROVED' });
      expect(approved).toHaveLength(0);
    });
  });

  describe('getOrderDetail', () => {
    it('returns order with offer and history', () => {
      const order = createOrder(db, userId, { offerId: openOfferId, sharesRequested: 5 });
      const detail = getOrderDetail(db, userId, order.id);
      expect(detail.id).toBe(order.id);
      expect(detail.offer).toBeDefined();
      expect(detail.offer.ticker).toBe('TCH');
      expect(detail.stageHistory).toBeDefined();
      expect(detail.stageHistory.length).toBeGreaterThanOrEqual(1);
    });

    it('throws NotFoundError for non-existent order', () => {
      expect(() => getOrderDetail(db, userId, 'nonexistent')).toThrow(NotFoundError);
    });

    it('throws NotFoundError for other users order', () => {
      const otherUserId = randomUUID();
      db.insert(users).values({ id: otherUserId, email: 'other@test.com', name: 'Other' }).run();
      const order = createOrder(db, userId, { offerId: openOfferId, sharesRequested: 5 });
      expect(() => getOrderDetail(db, otherUserId, order.id)).toThrow(NotFoundError);
    });
  });

  describe('advanceOrderStage', () => {
    it('advances from PENDING_REVIEW to COMPLIANCE_CHECK', () => {
      const order = createOrder(db, userId, { offerId: openOfferId, sharesRequested: 5 });
      const updated = advanceOrderStage(db, userId, order.id, { toStage: 'COMPLIANCE_CHECK' });
      expect(updated.stage).toBe('COMPLIANCE_CHECK');
    });

    it('throws InvalidTransitionError for invalid transition', () => {
      const order = createOrder(db, userId, { offerId: openOfferId, sharesRequested: 5 });
      expect(() => advanceOrderStage(db, userId, order.id, { toStage: 'SETTLED' })).toThrow(
        InvalidTransitionError,
      );
    });

    it('throws NotFoundError for non-existent order', () => {
      expect(() =>
        advanceOrderStage(db, userId, 'nonexistent', { toStage: 'COMPLIANCE_CHECK' }),
      ).toThrow(NotFoundError);
    });

    it('supports full pipeline: PENDING_REVIEW -> COMPLIANCE_CHECK -> APPROVED -> ALLOCATED -> SETTLED', () => {
      const order = createOrder(db, userId, { offerId: openOfferId, sharesRequested: 5 });

      let updated = advanceOrderStage(db, userId, order.id, { toStage: 'COMPLIANCE_CHECK' });
      expect(updated.stage).toBe('COMPLIANCE_CHECK');

      updated = advanceOrderStage(db, userId, order.id, { toStage: 'APPROVED' });
      expect(updated.stage).toBe('APPROVED');

      updated = advanceOrderStage(db, userId, order.id, { toStage: 'ALLOCATED' });
      expect(updated.stage).toBe('ALLOCATED');

      updated = advanceOrderStage(db, userId, order.id, { toStage: 'SETTLED' });
      expect(updated.stage).toBe('SETTLED');
    });

    it('stores note in stage history', () => {
      const order = createOrder(db, userId, { offerId: openOfferId, sharesRequested: 5 });
      advanceOrderStage(db, userId, order.id, { toStage: 'REJECTED', note: 'Failed KYC' });

      const history = db
        .select()
        .from(orderStageHistory)
        .all()
        .filter((h) => h.orderId === order.id && h.toStage === 'REJECTED');

      expect(history).toHaveLength(1);
      expect(history[0].note).toBe('Failed KYC');
    });

    it('allows rejection from any non-terminal stage', () => {
      const order = createOrder(db, userId, { offerId: openOfferId, sharesRequested: 5 });
      const updated = advanceOrderStage(db, userId, order.id, { toStage: 'REJECTED' });
      expect(updated.stage).toBe('REJECTED');
    });

    it('checks allocation shares availability', () => {
      // Create an order that uses all available shares (100)
      const order = createOrder(db, userId, { offerId: openOfferId, sharesRequested: 100 });

      // Advance to APPROVED
      advanceOrderStage(db, userId, order.id, { toStage: 'COMPLIANCE_CHECK' });
      advanceOrderStage(db, userId, order.id, { toStage: 'APPROVED' });

      // Now set the available shares to less than requested by directly updating
      // (simulating the offer running out of shares after order creation)
      db.update(offers).set({ availableShares: 0 }).where(eq(offers.id, openOfferId)).run();

      // Should throw ValidationError when trying to allocate
      expect(() => advanceOrderStage(db, userId, order.id, { toStage: 'ALLOCATED' })).toThrow(
        ValidationError,
      );
    });
  });
});

describe('dashboard.service', () => {
  describe('getDashboardStats', () => {
    it('returns zero stats for user with no orders', () => {
      const stats = getDashboardStats(db, userId);
      expect(stats.totalOrders).toBe(0);
      expect(stats.totalInvested).toBe(0);
      expect(stats.recentOrders).toHaveLength(0);
    });

    it('returns correct stats after creating orders', () => {
      createOrder(db, userId, { offerId: openOfferId, sharesRequested: 5 });
      createOrder(db, userId, { offerId: openOfferId, sharesRequested: 10 });

      const stats = getDashboardStats(db, userId);
      expect(stats.totalOrders).toBe(2);
      expect(stats.totalInvested).toBe(150); // (5 * 10) + (10 * 10)
      expect(stats.ordersByStage['PENDING_REVIEW']).toBe(2);
      expect(stats.recentOrders).toHaveLength(2);
    });

    it('reflects stage changes in ordersByStage', () => {
      const order = createOrder(db, userId, { offerId: openOfferId, sharesRequested: 5 });
      advanceOrderStage(db, userId, order.id, { toStage: 'COMPLIANCE_CHECK' });

      const stats = getDashboardStats(db, userId);
      expect(stats.ordersByStage['COMPLIANCE_CHECK']).toBe(1);
      expect(stats.ordersByStage['PENDING_REVIEW']).toBeUndefined();
    });

    it('recentOrders contains createdAt as ISO string', () => {
      createOrder(db, userId, { offerId: openOfferId, sharesRequested: 5 });
      const stats = getDashboardStats(db, userId);
      expect(stats.recentOrders[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
