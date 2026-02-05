import { describe, expect, it } from 'vitest';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { DashboardStatsSchema } from '../schemas/dashboard';

const dashCheck = TypeCompiler.Compile(DashboardStatsSchema);

function omit<T extends Record<string, unknown>>(obj: T, key: keyof T) {
  const copy = { ...obj };
  delete copy[key];
  return copy;
}

const validStats = {
  totalOrders: 5,
  totalInvested: 1250.0,
  ordersByStage: { PENDING_REVIEW: 2, APPROVED: 3 },
  recentOrders: [
    {
      id: 'order-1',
      companyName: 'Acme Corp',
      ticker: 'ACME',
      sharesRequested: 10,
      totalCost: 255.0,
      stage: 'PENDING_REVIEW',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ],
};

describe('DashboardStatsSchema', () => {
  it('accepts valid dashboard stats', () => {
    expect(dashCheck.Check(validStats)).toBe(true);
  });

  it('accepts empty recentOrders and ordersByStage', () => {
    expect(
      dashCheck.Check({
        totalOrders: 0,
        totalInvested: 0,
        ordersByStage: {},
        recentOrders: [],
      }),
    ).toBe(true);
  });

  it('rejects missing totalOrders', () => {
    expect(dashCheck.Check(omit(validStats, 'totalOrders'))).toBe(false);
  });

  it('rejects missing totalInvested', () => {
    expect(dashCheck.Check(omit(validStats, 'totalInvested'))).toBe(false);
  });

  it('rejects missing ordersByStage', () => {
    expect(dashCheck.Check(omit(validStats, 'ordersByStage'))).toBe(false);
  });

  it('rejects missing recentOrders', () => {
    expect(dashCheck.Check(omit(validStats, 'recentOrders'))).toBe(false);
  });

  it('rejects non-integer totalOrders', () => {
    expect(dashCheck.Check({ ...validStats, totalOrders: 1.5 })).toBe(false);
  });

  it('rejects empty object', () => {
    expect(dashCheck.Check({})).toBe(false);
  });
});
