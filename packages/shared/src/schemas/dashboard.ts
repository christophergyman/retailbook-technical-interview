import { Type, type Static } from '@sinclair/typebox';

export const DashboardStatsSchema = Type.Object({
  totalOrders: Type.Integer(),
  totalInvested: Type.Number(),
  ordersByStage: Type.Record(Type.String(), Type.Integer()),
  recentOrders: Type.Array(
    Type.Object({
      id: Type.String(),
      companyName: Type.String(),
      ticker: Type.String(),
      sharesRequested: Type.Integer(),
      totalCost: Type.Number(),
      stage: Type.String(),
      createdAt: Type.String(),
    }),
  ),
});

export type DashboardStats = Static<typeof DashboardStatsSchema>;
