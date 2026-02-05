import { eq, desc, count, sum } from 'drizzle-orm';
import { orders, offers, type DB } from '@trading/db';
import type { DashboardStats } from '@trading/shared';

export function getDashboardStats(db: DB, userId: string): DashboardStats {
  const totalOrdersResult = db
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.userId, userId))
    .get();

  const totalInvestedResult = db
    .select({ total: sum(orders.totalCost) })
    .from(orders)
    .where(eq(orders.userId, userId))
    .get();

  const stageCountRows = db
    .select({ stage: orders.stage, count: count() })
    .from(orders)
    .where(eq(orders.userId, userId))
    .groupBy(orders.stage)
    .all();

  const ordersByStage: Record<string, number> = {};
  for (const row of stageCountRows) {
    ordersByStage[row.stage] = row.count;
  }

  const recentOrderRows = db
    .select({
      id: orders.id,
      userId: orders.userId,
      offerId: orders.offerId,
      sharesRequested: orders.sharesRequested,
      totalCost: orders.totalCost,
      stage: orders.stage,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      companyName: offers.companyName,
      ticker: offers.ticker,
    })
    .from(orders)
    .innerJoin(offers, eq(orders.offerId, offers.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(5)
    .all();

  return {
    totalOrders: totalOrdersResult?.count ?? 0,
    totalInvested: Number(totalInvestedResult?.total ?? 0),
    ordersByStage,
    recentOrders: recentOrderRows,
  };
}
