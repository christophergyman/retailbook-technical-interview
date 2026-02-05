import { describe, expect, it } from 'vitest';
import { FormatRegistry } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { OfferSchema, OfferListResponseSchema } from '../schemas/offer';

// Register format validators so TypeCompiler recognizes format annotations
if (!FormatRegistry.Has('date')) {
  FormatRegistry.Set('date', (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v));
}

const offerCheck = TypeCompiler.Compile(OfferSchema);
const offerListCheck = TypeCompiler.Compile(OfferListResponseSchema);

function omit<T extends Record<string, unknown>>(obj: T, key: keyof T) {
  const copy = { ...obj };
  delete copy[key];
  return copy;
}

const validOffer = {
  id: 'offer-1',
  companyName: 'Acme Corp',
  ticker: 'ACME',
  description: 'A test company',
  sector: 'Technology',
  pricePerShare: 25.5,
  totalShares: 1000,
  availableShares: 500,
  ipoDate: '2025-06-15',
  status: 'open' as const,
  createdAt: '2025-01-01T00:00:00.000Z',
};

describe('OfferSchema', () => {
  it('accepts a valid offer', () => {
    expect(offerCheck.Check(validOffer)).toBe(true);
  });

  it('accepts status "closed"', () => {
    expect(offerCheck.Check({ ...validOffer, status: 'closed' })).toBe(true);
  });

  it('rejects invalid status value', () => {
    expect(offerCheck.Check({ ...validOffer, status: 'pending' })).toBe(false);
  });

  it('rejects missing companyName', () => {
    expect(offerCheck.Check(omit(validOffer, 'companyName'))).toBe(false);
  });

  it('rejects missing ticker', () => {
    expect(offerCheck.Check(omit(validOffer, 'ticker'))).toBe(false);
  });

  it('rejects missing id', () => {
    expect(offerCheck.Check(omit(validOffer, 'id'))).toBe(false);
  });

  it('rejects missing pricePerShare', () => {
    expect(offerCheck.Check(omit(validOffer, 'pricePerShare'))).toBe(false);
  });

  it('rejects non-integer totalShares', () => {
    expect(offerCheck.Check({ ...validOffer, totalShares: 10.5 })).toBe(false);
  });

  it('rejects non-integer availableShares', () => {
    expect(offerCheck.Check({ ...validOffer, availableShares: 3.7 })).toBe(false);
  });

  it('rejects empty object', () => {
    expect(offerCheck.Check({})).toBe(false);
  });
});

describe('OfferListResponseSchema', () => {
  it('accepts an array of valid offers', () => {
    expect(offerListCheck.Check([validOffer])).toBe(true);
  });

  it('accepts an empty array', () => {
    expect(offerListCheck.Check([])).toBe(true);
  });

  it('rejects non-array', () => {
    expect(offerListCheck.Check(validOffer)).toBe(false);
  });
});
