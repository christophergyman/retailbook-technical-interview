import { randomUUID } from 'crypto';
import { createLogger } from '@trading/logger';
import type { OrderStage } from '@trading/shared';
import { db } from './client';
import { users, offers, orders, orderStageHistory } from './schema';

const log = createLogger('seed');

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function createOrderWithHistory(
  orderId: string,
  userId: string,
  offerId: string,
  sharesRequested: number,
  totalCost: number,
  stages: OrderStage[],
  startDaysAgo: number,
) {
  const currentStage = stages[stages.length - 1]!;

  db.insert(orders)
    .values({
      id: orderId,
      userId,
      offerId,
      sharesRequested,
      totalCost,
      stage: currentStage,
      createdAt: daysAgo(startDaysAgo),
      updatedAt: daysAgo(startDaysAgo - stages.length + 1),
    })
    .run();

  stages.forEach((toStage, i) => {
    const fromStage = i === 0 ? null : stages[i - 1]!;
    db.insert(orderStageHistory)
      .values({
        id: randomUUID(),
        orderId,
        fromStage,
        toStage,
        changedAt: daysAgo(startDaysAgo - i),
      })
      .run();
  });
}

function seed() {
  log.info('seeding database...');

  // Users
  const aliceId = randomUUID();
  const bobId = randomUUID();

  db.insert(users)
    .values([
      { id: aliceId, email: 'alice@example.com', name: 'Alice Johnson', emailVerified: true },
      { id: bobId, email: 'bob@example.com', name: 'Bob Smith', emailVerified: true },
    ])
    .run();

  log.info('inserted 2 users');

  // Offers
  const ntaiId = randomUUID();
  const gplsId = randomUUID();
  const mvhtId = randomUUID();
  const qldgId = randomUUID();
  const anstId = randomUUID();

  db.insert(offers)
    .values([
      {
        id: ntaiId,
        companyName: 'NovaTech AI',
        ticker: 'NTAI',
        description: 'AI-powered enterprise solutions',
        sector: 'Technology',
        pricePerShare: 24.5,
        totalShares: 1_000_000,
        availableShares: 750_000,
        ipoDate: '2026-03-15',
      },
      {
        id: gplsId,
        companyName: 'GreenPulse Energy',
        ticker: 'GPLS',
        description: 'Renewable energy infrastructure',
        sector: 'Clean Energy',
        pricePerShare: 18.75,
        totalShares: 2_000_000,
        availableShares: 1_800_000,
        ipoDate: '2026-04-01',
      },
      {
        id: mvhtId,
        companyName: 'MedVault Health',
        ticker: 'MVHT',
        description: 'Healthcare data management platform',
        sector: 'Healthcare',
        pricePerShare: 31.0,
        totalShares: 500_000,
        availableShares: 420_000,
        ipoDate: '2026-03-20',
      },
      {
        id: qldgId,
        companyName: 'QuantumLedger',
        ticker: 'QLDG',
        description: 'Blockchain-based financial services',
        sector: 'Fintech',
        pricePerShare: 42.0,
        totalShares: 750_000,
        availableShares: 600_000,
        ipoDate: '2026-05-10',
      },
      {
        id: anstId,
        companyName: 'AeroNest Logistics',
        ticker: 'ANST',
        description: 'Drone-based delivery logistics',
        sector: 'Logistics',
        pricePerShare: 15.25,
        totalShares: 3_000_000,
        availableShares: 2_500_000,
        ipoDate: '2026-04-15',
      },
    ])
    .run();

  log.info('inserted 5 offers');

  // Orders for Alice
  createOrderWithHistory(
    randomUUID(),
    aliceId,
    ntaiId,
    500,
    500 * 24.5,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED', 'ALLOCATED'],
    10,
  );

  createOrderWithHistory(
    randomUUID(),
    aliceId,
    gplsId,
    1000,
    1000 * 18.75,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK'],
    7,
  );

  createOrderWithHistory(randomUUID(), aliceId, qldgId, 200, 200 * 42.0, ['PENDING_REVIEW'], 3);

  createOrderWithHistory(
    randomUUID(),
    aliceId,
    mvhtId,
    300,
    300 * 31.0,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'REJECTED'],
    8,
  );

  log.info('inserted 4 orders with stage history');
  log.info('seed complete');
}

seed();
