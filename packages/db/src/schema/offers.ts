import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const offers = sqliteTable('offers', {
  id: text('id').primaryKey(),
  companyName: text('company_name').notNull(),
  ticker: text('ticker').notNull().unique(),
  description: text('description'),
  sector: text('sector').notNull(),
  pricePerShare: real('price_per_share').notNull(),
  totalShares: integer('total_shares').notNull(),
  availableShares: integer('available_shares').notNull(),
  ipoDate: text('ipo_date').notNull(),
  status: text('status', { enum: ['open', 'closed'] })
    .notNull()
    .default('open'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});
