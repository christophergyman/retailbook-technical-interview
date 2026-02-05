import { Type, type Static } from '@sinclair/typebox';
import { OrderSchema } from './order';

export const DashboardStatsSchema = Type.Object({
  totalOrders: Type.Integer(),
  totalInvested: Type.Number(),
  ordersByStage: Type.Record(Type.String(), Type.Integer()),
  recentOrders: Type.Array(
    Type.Object({
      ...OrderSchema.properties,
      companyName: Type.String(),
      ticker: Type.String(),
    }),
  ),
});

export type DashboardStats = Static<typeof DashboardStatsSchema>;
