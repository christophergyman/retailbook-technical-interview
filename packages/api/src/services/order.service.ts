import { randomUUID } from 'crypto';
import { eq, and, desc, asc } from 'drizzle-orm';
import { orders, orderStageHistory, offers, type DB } from '@trading/db';
import { isValidTransition, type OrderStage } from '@trading/shared';
import type { CreateOrder, UpdateOrderStage } from '@trading/shared';
import {
  NotFoundError,
  ValidationError,
  InvalidTransitionError,
} from '../middleware/error-handler';

export function createOrder(db: DB, userId: string, input: CreateOrder) {
  const offer = db.query.offers
    .findFirst({
      where: eq(offers.id, input.offerId),
    })
    .sync();

  if (!offer) {
    throw new NotFoundError('Offer');
  }

  if (offer.status !== 'open') {
    throw new ValidationError('Offer is not open');
  }

  if (offer.availableShares < input.sharesRequested) {
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

  return result;
}

export function listOrders(db: DB, userId: string, filters: { stage?: string } = {}) {
  const conditions = [eq(orders.userId, userId)];

  if (filters.stage) {
    conditions.push(eq(orders.stage, filters.stage as OrderStage));
  }

  return db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .all();
}

export function getOrderDetail(db: DB, userId: string, orderId: string) {
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
    throw new NotFoundError('Order');
  }

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
) {
  const order = db.query.orders
    .findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
    })
    .sync();

  if (!order) {
    throw new NotFoundError('Order');
  }

  const currentStage = order.stage as OrderStage;
  const toStage = input.toStage as OrderStage;

  if (!isValidTransition(currentStage, toStage)) {
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
        updatedAt: new Date().toISOString(),
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

  return result;
}
