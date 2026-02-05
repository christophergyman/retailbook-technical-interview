import { relations } from 'drizzle-orm';
import { users } from './users';
import { offers } from './offers';
import { orders, orderStageHistory } from './orders';

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
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
