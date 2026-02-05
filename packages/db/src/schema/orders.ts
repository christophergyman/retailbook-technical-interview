import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { ORDER_STAGES } from '@trading/shared';
import { users } from './users';
import { offers } from './offers';

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  offerId: text('offer_id')
    .notNull()
    .references(() => offers.id),
  sharesRequested: integer('shares_requested').notNull(),
  totalCost: real('total_cost').notNull(),
  stage: text('stage', { enum: [...ORDER_STAGES] })
    .notNull()
    .default('PENDING_REVIEW'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const orderStageHistory = sqliteTable('order_stage_history', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id),
  fromStage: text('from_stage', { enum: [...ORDER_STAGES] }),
  toStage: text('to_stage', { enum: [...ORDER_STAGES] }).notNull(),
  note: text('note'),
  changedAt: integer('changed_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});
