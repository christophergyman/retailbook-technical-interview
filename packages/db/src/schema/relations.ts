import { relations } from 'drizzle-orm';
import { users } from './users';
import { offers } from './offers';
import { orders, orderStageHistory } from './orders';
import { sessions, accounts } from './auth';

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const offersRelations = relations(offers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  offer: one(offers, {
    fields: [orders.offerId],
    references: [offers.id],
  }),
  stageHistory: many(orderStageHistory),
}));

export const orderStageHistoryRelations = relations(orderStageHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStageHistory.orderId],
    references: [orders.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));
