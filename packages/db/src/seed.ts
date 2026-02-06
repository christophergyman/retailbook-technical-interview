import { randomUUID } from 'crypto';
import { hashPassword } from 'better-auth/crypto';
import { createLogger } from '@trading/logger';
import type { OrderStage } from '@trading/shared';
import { db } from './client';
import { users, offers, orders, orderStageHistory, accounts } from './schema';

const log = createLogger('seed');

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
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

async function seed() {
  log.info('seeding database...');

  // ── Users (8) ──────────────────────────────────────────────
  const aliceId = randomUUID();
  const bobId = randomUUID();
  const carolId = randomUUID();
  const daveId = randomUUID();
  const eveId = randomUUID();
  const frankId = randomUUID();
  const graceId = randomUUID();
  const hankId = randomUUID();

  db.insert(users)
    .values([
      { id: aliceId, email: 'alice@example.com', name: 'Alice Johnson', emailVerified: true },
      { id: bobId, email: 'bob@example.com', name: 'Bob Smith', emailVerified: true },
      { id: carolId, email: 'carol@example.com', name: 'Carol Davis', emailVerified: true },
      { id: daveId, email: 'dave@example.com', name: 'Dave Martinez', emailVerified: true },
      { id: eveId, email: 'eve@example.com', name: 'Eve Chen', emailVerified: true },
      { id: frankId, email: 'frank@example.com', name: 'Frank Wilson', emailVerified: true },
      { id: graceId, email: 'grace@example.com', name: 'Grace Kim', emailVerified: true },
      { id: hankId, email: 'hank@example.com', name: 'Hank Patel', emailVerified: true },
    ])
    .run();

  const hashedPassword = await hashPassword('password123');

  db.insert(accounts)
    .values([
      {
        id: randomUUID(),
        accountId: aliceId,
        providerId: 'credential',
        userId: aliceId,
        password: hashedPassword,
      },
      {
        id: randomUUID(),
        accountId: bobId,
        providerId: 'credential',
        userId: bobId,
        password: hashedPassword,
      },
      {
        id: randomUUID(),
        accountId: carolId,
        providerId: 'credential',
        userId: carolId,
        password: hashedPassword,
      },
      {
        id: randomUUID(),
        accountId: daveId,
        providerId: 'credential',
        userId: daveId,
        password: hashedPassword,
      },
      {
        id: randomUUID(),
        accountId: eveId,
        providerId: 'credential',
        userId: eveId,
        password: hashedPassword,
      },
      {
        id: randomUUID(),
        accountId: frankId,
        providerId: 'credential',
        userId: frankId,
        password: hashedPassword,
      },
      {
        id: randomUUID(),
        accountId: graceId,
        providerId: 'credential',
        userId: graceId,
        password: hashedPassword,
      },
      {
        id: randomUUID(),
        accountId: hankId,
        providerId: 'credential',
        userId: hankId,
        password: hashedPassword,
      },
    ])
    .run();

  log.info('inserted 8 users with accounts');

  // ── Offers (20) ────────────────────────────────────────────
  const ntaiId = randomUUID();
  const gplsId = randomUUID();
  const mvhtId = randomUUID();
  const qldgId = randomUUID();
  const anstId = randomUUID();
  const strpId = randomUUID();
  const dbrkId = randomUUID();
  const cnvaId = randomUUID();
  const dscId = randomUUID();
  const fgmaId = randomUUID();
  const ntnId = randomUUID();
  const vrclId = randomUUID();
  const lnrId = randomUUID();
  const pldId = randomUUID();
  const antpId = randomUUID();
  const sclId = randomUUID();
  const andlId = randomUUID();
  const spxId = randomUUID();
  const rvnId = randomUUID();
  const icrtId = randomUUID();

  db.insert(offers)
    .values([
      // Original 5
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
      // New 15
      {
        id: strpId,
        companyName: 'Stripe',
        ticker: 'STRP',
        description: 'Online payments infrastructure for the internet',
        sector: 'Fintech',
        pricePerShare: 72.0,
        totalShares: 5_000_000,
        availableShares: 3_200_000,
        ipoDate: '2026-03-10',
      },
      {
        id: dbrkId,
        companyName: 'Databricks',
        ticker: 'DBRK',
        description: 'Unified analytics platform for data and AI',
        sector: 'Technology',
        pricePerShare: 58.5,
        totalShares: 3_000_000,
        availableShares: 2_100_000,
        ipoDate: '2026-04-22',
      },
      {
        id: cnvaId,
        companyName: 'Canva',
        ticker: 'CNVA',
        description: 'Visual communication and design platform',
        sector: 'Design',
        pricePerShare: 45.0,
        totalShares: 4_000_000,
        availableShares: 3_500_000,
        ipoDate: '2026-05-05',
      },
      {
        id: dscId,
        companyName: 'Discord',
        ticker: 'DSCR',
        description: 'Voice, video, and text communication platform',
        sector: 'Technology',
        pricePerShare: 38.25,
        totalShares: 2_500_000,
        availableShares: 2_000_000,
        ipoDate: '2026-06-01',
      },
      {
        id: fgmaId,
        companyName: 'Figma',
        ticker: 'FGMA',
        description: 'Collaborative interface design tool',
        sector: 'Design',
        pricePerShare: 52.0,
        totalShares: 1_800_000,
        availableShares: 1_200_000,
        ipoDate: '2026-03-28',
      },
      {
        id: ntnId,
        companyName: 'Notion',
        ticker: 'NTON',
        description: 'All-in-one workspace for notes, docs, and projects',
        sector: 'Technology',
        pricePerShare: 33.5,
        totalShares: 2_200_000,
        availableShares: 1_800_000,
        ipoDate: '2026-04-18',
      },
      {
        id: vrclId,
        companyName: 'Vercel',
        ticker: 'VRCL',
        description: 'Frontend cloud platform for web development',
        sector: 'Technology',
        pricePerShare: 28.0,
        totalShares: 1_500_000,
        availableShares: 1_100_000,
        ipoDate: '2026-05-20',
      },
      {
        id: lnrId,
        companyName: 'Linear',
        ticker: 'LNRR',
        description: 'Project management and issue tracking for software teams',
        sector: 'Technology',
        pricePerShare: 22.0,
        totalShares: 1_200_000,
        availableShares: 950_000,
        ipoDate: '2026-06-15',
      },
      {
        id: pldId,
        companyName: 'Plaid',
        ticker: 'PLAD',
        description: 'Financial data connectivity and payments',
        sector: 'Fintech',
        pricePerShare: 35.75,
        totalShares: 2_800_000,
        availableShares: 2_200_000,
        ipoDate: '2026-03-05',
      },
      {
        id: antpId,
        companyName: 'Anthropic',
        ticker: 'ANTP',
        description: 'AI safety and research company',
        sector: 'AI/ML',
        pricePerShare: 85.0,
        totalShares: 4_500_000,
        availableShares: 2_800_000,
        ipoDate: '2026-04-08',
      },
      {
        id: sclId,
        companyName: 'Scale AI',
        ticker: 'SCAL',
        description: 'Data labeling and AI infrastructure platform',
        sector: 'AI/ML',
        pricePerShare: 48.5,
        totalShares: 2_000_000,
        availableShares: 1_500_000,
        ipoDate: '2026-05-12',
      },
      {
        id: andlId,
        companyName: 'Anduril',
        ticker: 'ANDL',
        description: 'Defense technology and autonomous systems',
        sector: 'Aerospace',
        pricePerShare: 62.0,
        totalShares: 3_500_000,
        availableShares: 2_400_000,
        ipoDate: '2026-06-20',
      },
      {
        id: spxId,
        companyName: 'SpaceX',
        ticker: 'SPXR',
        description: 'Spacecraft manufacturing and space transportation',
        sector: 'Aerospace',
        pricePerShare: 78.0,
        totalShares: 8_000_000,
        availableShares: 5_000_000,
        ipoDate: '2026-07-01',
      },
      {
        id: rvnId,
        companyName: 'Rivian',
        ticker: 'RVIN',
        description: 'Electric vehicle manufacturer and adventure brand',
        sector: 'Automotive',
        pricePerShare: 19.5,
        totalShares: 6_000_000,
        availableShares: 4_800_000,
        ipoDate: '2026-04-30',
      },
      {
        id: icrtId,
        companyName: 'Instacart',
        ticker: 'ICRT',
        description: 'Online grocery delivery and pickup service',
        sector: 'Logistics',
        pricePerShare: 12.75,
        totalShares: 5_500_000,
        availableShares: 4_200_000,
        ipoDate: '2026-03-25',
      },
    ])
    .run();

  log.info('inserted 20 offers');

  // ── Orders (~30) ───────────────────────────────────────────

  // --- Alice (5 orders) ---
  // Fully settled order
  createOrderWithHistory(
    randomUUID(),
    aliceId,
    ntaiId,
    500,
    500 * 24.5,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED', 'ALLOCATED', 'SETTLED'],
    40,
  );
  // Allocated
  createOrderWithHistory(
    randomUUID(),
    aliceId,
    gplsId,
    1000,
    1000 * 18.75,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED', 'ALLOCATED'],
    30,
  );
  // Pending review
  createOrderWithHistory(randomUUID(), aliceId, qldgId, 200, 200 * 42.0, ['PENDING_REVIEW'], 3);
  // Rejected at compliance
  createOrderWithHistory(
    randomUUID(),
    aliceId,
    mvhtId,
    300,
    300 * 31.0,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'REJECTED'],
    20,
  );
  // Compliance check in progress
  createOrderWithHistory(
    randomUUID(),
    aliceId,
    strpId,
    150,
    150 * 72.0,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK'],
    7,
  );

  // --- Bob (4 orders) ---
  // Fully settled
  createOrderWithHistory(
    randomUUID(),
    bobId,
    strpId,
    400,
    400 * 72.0,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED', 'ALLOCATED', 'SETTLED'],
    35,
  );
  // Approved
  createOrderWithHistory(
    randomUUID(),
    bobId,
    antpId,
    250,
    250 * 85.0,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED'],
    15,
  );
  // Pending review
  createOrderWithHistory(randomUUID(), bobId, cnvaId, 600, 600 * 45.0, ['PENDING_REVIEW'], 2);
  // Rejected at approval
  createOrderWithHistory(
    randomUUID(),
    bobId,
    spxId,
    100,
    100 * 78.0,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED', 'REJECTED'],
    25,
  );

  // --- Carol (4 orders) ---
  // Settled
  createOrderWithHistory(
    randomUUID(),
    carolId,
    fgmaId,
    350,
    350 * 52.0,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED', 'ALLOCATED', 'SETTLED'],
    38,
  );
  // Allocated
  createOrderWithHistory(
    randomUUID(),
    carolId,
    dbrkId,
    500,
    500 * 58.5,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED', 'ALLOCATED'],
    22,
  );
  // Compliance check
  createOrderWithHistory(
    randomUUID(),
    carolId,
    pldId,
    800,
    800 * 35.75,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK'],
    10,
  );
  // Pending review
  createOrderWithHistory(randomUUID(), carolId, lnrId, 1200, 1200 * 22.0, ['PENDING_REVIEW'], 1);

  // --- Dave (4 orders) ---
  // Settled
  createOrderWithHistory(
    randomUUID(),
    daveId,
    antpId,
    200,
    200 * 85.0,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED', 'ALLOCATED', 'SETTLED'],
    42,
  );
  // Approved
  createOrderWithHistory(
    randomUUID(),
    daveId,
    sclId,
    450,
    450 * 48.5,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED'],
    18,
  );
  // Rejected at compliance
  createOrderWithHistory(
    randomUUID(),
    daveId,
    rvnId,
    2000,
    2000 * 19.5,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'REJECTED'],
    14,
  );
  // Pending review
  createOrderWithHistory(randomUUID(), daveId, dscId, 700, 700 * 38.25, ['PENDING_REVIEW'], 4);

  // --- Eve (4 orders) ---
  // Settled
  createOrderWithHistory(
    randomUUID(),
    eveId,
    spxId,
    300,
    300 * 78.0,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED', 'ALLOCATED', 'SETTLED'],
    45,
  );
  // Allocated
  createOrderWithHistory(
    randomUUID(),
    eveId,
    andlId,
    500,
    500 * 62.0,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED', 'ALLOCATED'],
    28,
  );
  // Approved
  createOrderWithHistory(
    randomUUID(),
    eveId,
    ntnId,
    900,
    900 * 33.5,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED'],
    12,
  );
  // Rejected at pending review
  createOrderWithHistory(
    randomUUID(),
    eveId,
    icrtId,
    1500,
    1500 * 12.75,
    ['PENDING_REVIEW', 'REJECTED'],
    6,
  );

  // --- Frank (3 orders) ---
  // Settled
  createOrderWithHistory(
    randomUUID(),
    frankId,
    pldId,
    600,
    600 * 35.75,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED', 'ALLOCATED', 'SETTLED'],
    36,
  );
  // Compliance check
  createOrderWithHistory(
    randomUUID(),
    frankId,
    vrclId,
    1000,
    1000 * 28.0,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK'],
    9,
  );
  // Pending review
  createOrderWithHistory(randomUUID(), frankId, anstId, 2500, 2500 * 15.25, ['PENDING_REVIEW'], 2);

  // --- Grace (3 orders) ---
  // Allocated
  createOrderWithHistory(
    randomUUID(),
    graceId,
    cnvaId,
    400,
    400 * 45.0,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED', 'ALLOCATED'],
    19,
  );
  // Approved
  createOrderWithHistory(
    randomUUID(),
    graceId,
    strpId,
    200,
    200 * 72.0,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED'],
    11,
  );
  // Rejected at allocated stage
  createOrderWithHistory(
    randomUUID(),
    graceId,
    gplsId,
    3000,
    3000 * 18.75,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED', 'ALLOCATED', 'REJECTED'],
    32,
  );

  // --- Hank (3 orders) ---
  // Settled
  createOrderWithHistory(
    randomUUID(),
    hankId,
    icrtId,
    5000,
    5000 * 12.75,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK', 'APPROVED', 'ALLOCATED', 'SETTLED'],
    44,
  );
  // Compliance check
  createOrderWithHistory(
    randomUUID(),
    hankId,
    dbrkId,
    300,
    300 * 58.5,
    ['PENDING_REVIEW', 'COMPLIANCE_CHECK'],
    8,
  );
  // Pending review
  createOrderWithHistory(randomUUID(), hankId, fgmaId, 450, 450 * 52.0, ['PENDING_REVIEW'], 1);

  log.info('inserted 30 orders with stage history');
  log.info('seed complete');
}

seed();
