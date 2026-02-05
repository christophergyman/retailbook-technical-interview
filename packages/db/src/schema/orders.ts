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
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const orderStageHistory = sqliteTable('order_stage_history', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id),
  fromStage: text('from_stage', { enum: [...ORDER_STAGES] }),
  toStage: text('to_stage', { enum: [...ORDER_STAGES] }).notNull(),
  note: text('note'),
  changedAt: text('changed_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});
