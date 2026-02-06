import { randomUUID } from 'crypto';
import { eq, and, desc, asc } from 'drizzle-orm';
import { orders, orderStageHistory, offers, type DB } from '@trading/db';
import { isValidTransition, type OrderStage } from '@trading/shared';
import type { CreateOrder, UpdateOrderStage } from '@trading/shared';
import type { Logger } from '@trading/logger';
import { noopLogger } from '@trading/logger';
import {
  NotFoundError,
  ValidationError,
  InvalidTransitionError,
} from '../middleware/error-handler';

export function createOrder(db: DB, userId: string, input: CreateOrder, log?: Logger) {
  const svcLog = log ?? noopLogger();
  const offer = db.query.offers
    .findFirst({
      where: eq(offers.id, input.offerId),
    })
    .sync();

  if (!offer) {
    svcLog.warn({ offerId: input.offerId }, 'order rejected: offer not found');
    throw new NotFoundError('Offer');
  }

  if (offer.status !== 'open') {
    svcLog.warn({ offerId: input.offerId, status: offer.status }, 'order rejected: offer not open');
    throw new ValidationError('Offer is not open');
  }

  if (offer.availableShares < input.sharesRequested) {
    svcLog.warn(
      {
        offerId: input.offerId,
        available: offer.availableShares,
        requested: input.sharesRequested,
      },
      'order rejected: insufficient shares',
    );
    throw new ValidationError('Not enough available shares');
  }

  const totalCost = offer.pricePerShare * input.sharesRequested;
  const orderId = randomUUID();
  const historyId = randomUUID();
  const stage: OrderStage = 'PENDING_REVIEW';

  const result = db.transaction((tx) => {
    tx.insert(orders)
      .values({
        id: orderId,
        userId,
        offerId: input.offerId,
        sharesRequested: input.sharesRequested,
        totalCost,
        stage,
      })
      .run();

    tx.update(offers)
      .set({ availableShares: offer.availableShares - input.sharesRequested })
      .where(eq(offers.id, input.offerId))
      .run();

    tx.insert(orderStageHistory)
      .values({
        id: historyId,
        orderId,
        fromStage: null,
        toStage: stage,
      })
      .run();

    return tx.query.orders
      .findFirst({
        where: eq(orders.id, orderId),
      })
      .sync()!;
  });

  svcLog.info({ orderId, userId, totalCost }, 'order created');
  return result;
}

export function listOrders(db: DB, userId: string, filters: { stage?: string } = {}, log?: Logger) {
  const svcLog = log ?? noopLogger();
  const conditions = [eq(orders.userId, userId)];

  if (filters.stage) {
    conditions.push(eq(orders.stage, filters.stage as OrderStage));
  }

  const result = db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .all();

  svcLog.debug({ userId, stage: filters.stage, count: result.length }, 'orders listed');
  return result;
}

export function getOrderDetail(db: DB, userId: string, orderId: string, log?: Logger) {
  const svcLog = log ?? noopLogger();
  const row = db.query.orders
    .findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
      with: {
        offer: true,
        stageHistory: {
          orderBy: [asc(orderStageHistory.changedAt)],
        },
      },
    })
    .sync();

  if (!row) {
    svcLog.warn({ orderId, userId }, 'order not found');
    throw new NotFoundError('Order');
  }

  svcLog.debug({ orderId, userId, stage: row.stage }, 'order detail retrieved');
  return {
    ...row,
    offer: {
      ...row.offer,
      description: row.offer.description ?? '',
    },
  };
}

export function advanceOrderStage(
  db: DB,
  userId: string,
  orderId: string,
  input: UpdateOrderStage,
  log?: Logger,
) {
  const svcLog = log ?? noopLogger();
  const order = db.query.orders
    .findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
    })
    .sync();

  if (!order) {
    svcLog.warn({ orderId, userId }, 'advance stage: order not found');
    throw new NotFoundError('Order');
  }

  const currentStage = order.stage as OrderStage;
  const toStage = input.toStage as OrderStage;

  if (!isValidTransition(currentStage, toStage)) {
    svcLog.warn({ orderId, from: currentStage, to: toStage }, 'invalid stage transition');
    throw new InvalidTransitionError(currentStage, toStage);
  }

  if (toStage === 'ALLOCATED') {
    const offer = db.query.offers
      .findFirst({
        where: eq(offers.id, order.offerId),
      })
      .sync();
    if (offer && offer.availableShares < order.sharesRequested) {
      throw new ValidationError('Not enough available shares for allocation');
    }
  }

  const result = db.transaction((tx) => {
    tx.update(orders)
      .set({
        stage: toStage,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .run();

    tx.insert(orderStageHistory)
      .values({
        id: randomUUID(),
        orderId,
        fromStage: currentStage,
        toStage,
        note: input.note ?? null,
      })
      .run();

    return tx.query.orders
      .findFirst({
        where: eq(orders.id, orderId),
      })
      .sync()!;
  });

  svcLog.info({ orderId, from: currentStage, to: toStage }, 'order stage advanced');
  return result;
}
