import { createLogger, logBusinessEvent } from '@trading/logger';
import {
  CreateOrderSchema,
  UpdateOrderStageSchema,
  type CreateOrder,
  type UpdateOrderStage,
} from '@trading/shared';
import { factory } from '../factory';
import { requireAuth } from '../middleware/require-auth';
import { validateBody } from '../middleware/validate';
import {
  createOrder,
  listOrders,
  getOrderDetail,
  advanceOrderStage,
} from '../services/order.service';

const log = createLogger('api:orders');
const app = factory.createApp();

app.use('*', requireAuth);

app.post('/', validateBody(CreateOrderSchema), (c) => {
  const db = c.get('db');
  const user = c.get('user')!;
  const body = c.get('validatedBody' as never) as CreateOrder;

  const order = createOrder(db, user.id, body, log);

  logBusinessEvent(log, 'order_created', {
    orderId: order.id,
    userId: user.id,
    offerId: body.offerId,
    shares: body.sharesRequested,
    totalCost: order.totalCost,
    requestId: c.get('requestId'),
  });

  return c.json(order, 201);
});

app.get('/', (c) => {
  const db = c.get('db');
  const user = c.get('user')!;
  const stage = c.req.query('stage');

  const result = listOrders(db, user.id, { stage }, log);

  logBusinessEvent(log, 'orders_listed', {
    userId: user.id,
    stage,
    count: result.length,
    requestId: c.get('requestId'),
  });

  return c.json(result);
});

app.get('/:id', (c) => {
  const db = c.get('db');
  const user = c.get('user')!;
  const id = c.req.param('id');

  const result = getOrderDetail(db, user.id, id, log);

  logBusinessEvent(log, 'order_detail_accessed', {
    orderId: id,
    userId: user.id,
    requestId: c.get('requestId'),
  });

  return c.json(result);
});

app.patch('/:id/stage', validateBody(UpdateOrderStageSchema), (c) => {
  const db = c.get('db');
  const user = c.get('user')!;
  const id = c.req.param('id');
  const body = c.get('validatedBody' as never) as UpdateOrderStage;

  const previousOrder = getOrderDetail(db, user.id, id, log);
  const fromStage = previousOrder.stage;

  const order = advanceOrderStage(db, user.id, id, body, log);

  logBusinessEvent(log, 'stage_changed', {
    orderId: id,
    userId: user.id,
    fromStage,
    toStage: body.toStage,
    requestId: c.get('requestId'),
  });

  return c.json(order);
});

export default app;
