import { createLogger } from '@trading/logger';
import {
  CreateOrderSchema,
  UpdateOrderStageSchema,
  type CreateOrder,
  type UpdateOrderStage,
} from '@trading/shared';
import { createApp } from '../factory';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createOrder,
  listOrders,
  getOrderDetail,
  advanceOrderStage,
} from '../services/order.service';

const log = createLogger('api:orders');
const app = createApp();

app.use('*', requireAuth);

app.post('/', validateBody(CreateOrderSchema), (c) => {
  const db = c.get('db');
  const user = c.get('user')!;
  const body = c.get('validatedBody' as never) as CreateOrder;

  const order = createOrder(db, user.id, body);

  log.info({ orderId: order.id, userId: user.id, offerId: body.offerId }, 'order_created');

  return c.json(order, 201);
});

app.get('/', (c) => {
  const db = c.get('db');
  const user = c.get('user')!;
  const stage = c.req.query('stage');

  const result = listOrders(db, user.id, { stage });
  return c.json(result);
});

app.get('/:id', (c) => {
  const db = c.get('db');
  const user = c.get('user')!;
  const id = c.req.param('id');

  const result = getOrderDetail(db, user.id, id);
  return c.json(result);
});

app.patch('/:id/stage', validateBody(UpdateOrderStageSchema), (c) => {
  const db = c.get('db');
  const user = c.get('user')!;
  const id = c.req.param('id');
  const body = c.get('validatedBody' as never) as UpdateOrderStage;

  const order = advanceOrderStage(db, user.id, id, body);

  log.info(
    { orderId: id, userId: user.id, fromStage: body.toStage, toStage: body.toStage },
    'stage_changed',
  );

  return c.json(order);
});

export default app;
