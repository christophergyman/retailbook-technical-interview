import { Type, type Static } from '@sinclair/typebox';

export const OfferSchema = Type.Object({
  id: Type.String(),
  companyName: Type.String(),
  ticker: Type.String(),
  description: Type.String(),
  sector: Type.String(),
  pricePerShare: Type.Number(),
  totalShares: Type.Integer(),
  availableShares: Type.Integer(),
  ipoDate: Type.String({ format: 'date' }),
  status: Type.Union([Type.Literal('open'), Type.Literal('closed')]),
  createdAt: Type.String(),
});

export const OfferListResponseSchema = Type.Array(OfferSchema);

export type Offer = Static<typeof OfferSchema>;
export type OfferListResponse = Static<typeof OfferListResponseSchema>;
