import { createLogger } from '@trading/logger';
import {
  CreateOrderSchema,
  UpdateOrderStageSchema,
  type CreateOrder,
  type UpdateOrderStage,
} from '@trading/shared';
import { factory } from '../factory';
import { requireAuth } from '../middleware/auth';
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

  const order = createOrder(db, user.id, body);

  log.info(
    {
      orderId: order.id,
      userId: user.id,
      offerId: body.offerId,
      shares: body.sharesRequested,
      totalCost: order.totalCost,
      requestId: c.get('requestId'),
    },
    'order_created',
  );

  return c.json(order, 201);
});

app.get('/', (c) => {
  const db = c.get('db');
  const user = c.get('user')!;
  const stage = c.req.query('stage');

  const result = listOrders(db, user.id, { stage });

  log.info(
    { userId: user.id, stage, count: result.length, requestId: c.get('requestId') },
    'orders listed',
  );

  return c.json(result);
});

app.get('/:id', (c) => {
  const db = c.get('db');
  const user = c.get('user')!;
  const id = c.req.param('id');

  const result = getOrderDetail(db, user.id, id);

  log.info(
    { orderId: id, userId: user.id, requestId: c.get('requestId') },
    'order detail accessed',
  );

  return c.json(result);
});

app.patch('/:id/stage', validateBody(UpdateOrderStageSchema), (c) => {
  const db = c.get('db');
  const user = c.get('user')!;
  const id = c.req.param('id');
  const body = c.get('validatedBody' as never) as UpdateOrderStage;

  const previousOrder = getOrderDetail(db, user.id, id);
  const fromStage = previousOrder.stage;

  const order = advanceOrderStage(db, user.id, id, body);

  log.info(
    {
      orderId: id,
      userId: user.id,
      fromStage,
      toStage: body.toStage,
      requestId: c.get('requestId'),
    },
    'stage_changed',
  );

  return c.json(order);
});

export default app;
