import { Type, type Static } from '@sinclair/typebox';
import { OfferSchema } from './offer';

export const OrderStageEnum = Type.Union([
  Type.Literal('PENDING_REVIEW'),
  Type.Literal('COMPLIANCE_CHECK'),
  Type.Literal('APPROVED'),
  Type.Literal('ALLOCATED'),
  Type.Literal('SETTLED'),
  Type.Literal('REJECTED'),
]);

export const CreateOrderSchema = Type.Object({
  offerId: Type.String(),
  sharesRequested: Type.Integer({ minimum: 1 }),
});

export const UpdateOrderStageSchema = Type.Object({
  toStage: OrderStageEnum,
  note: Type.Optional(Type.String()),
});

export const StageHistoryEntrySchema = Type.Object({
  id: Type.String(),
  fromStage: Type.Union([Type.String(), Type.Null()]),
  toStage: Type.String(),
  note: Type.Union([Type.String(), Type.Null()]),
  changedAt: Type.String(),
});

export const OrderSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  offerId: Type.String(),
  sharesRequested: Type.Integer(),
  totalCost: Type.Number(),
  stage: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const OrderDetailSchema = Type.Object({
  ...OrderSchema.properties,
  offer: OfferSchema,
  stageHistory: Type.Array(StageHistoryEntrySchema),
});

export const OrderListResponseSchema = Type.Array(OrderSchema);

export type CreateOrder = Static<typeof CreateOrderSchema>;
export type UpdateOrderStage = Static<typeof UpdateOrderStageSchema>;
export type StageHistoryEntry = Static<typeof StageHistoryEntrySchema>;
export type Order = Static<typeof OrderSchema>;
export type OrderDetail = Static<typeof OrderDetailSchema>;
export type OrderListResponse = Static<typeof OrderListResponseSchema>;
