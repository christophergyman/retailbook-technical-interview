import { eq, and, type SQL } from 'drizzle-orm';
import { offers, type DB } from '@trading/db';
import type { Logger } from '@trading/logger';
import { noopLogger } from '@trading/logger';
import { NotFoundError } from '../middleware/error-handler';

export function listOffers(
  db: DB,
  filters: { status?: string; sector?: string } = {},
  log?: Logger,
) {
  const svcLog = log ?? noopLogger();
  const conditions: SQL[] = [];

  const status = filters.status ?? 'open';
  conditions.push(eq(offers.status, status as 'open' | 'closed'));

  if (filters.sector) {
    conditions.push(eq(offers.sector, filters.sector));
  }

  const rows = db
    .select()
    .from(offers)
    .where(and(...conditions))
    .all();

  svcLog.debug(
    { status: filters.status, sector: filters.sector, count: rows.length },
    'offers listed',
  );
  return rows.map((row) => ({
    ...row,
    description: row.description ?? '',
  }));
}

export function getOffer(db: DB, id: string, log?: Logger) {
  const svcLog = log ?? noopLogger();
  const row = db.query.offers
    .findFirst({
      where: eq(offers.id, id),
    })
    .sync();

  if (!row) {
    svcLog.warn({ offerId: id }, 'offer not found');
    throw new NotFoundError('Offer');
  }

  svcLog.debug({ offerId: id }, 'offer retrieved');
  return {
    ...row,
    description: row.description ?? '',
  };
}
