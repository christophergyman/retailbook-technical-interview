import { eq, and, type SQL } from 'drizzle-orm';
import { offers, type DB } from '@trading/db';
import { NotFoundError } from '../middleware/error-handler';

export function listOffers(db: DB, filters: { status?: string; sector?: string } = {}) {
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

  return rows.map((row) => ({
    ...row,
    description: row.description ?? '',
  }));
}

export function getOffer(db: DB, id: string) {
  const row = db.query.offers
    .findFirst({
      where: eq(offers.id, id),
    })
    .sync();

  if (!row) {
    throw new NotFoundError('Offer');
  }

  return {
    ...row,
    description: row.description ?? '',
  };
}
