import { createLogger } from '@trading/logger';
import { factory } from '../factory';
import { listOffers, getOffer } from '../services/offer.service';

const log = createLogger('api:offers');

const app = factory.createApp();

app.get('/', (c) => {
  const db = c.get('db');
  const status = c.req.query('status');
  const sector = c.req.query('sector');

  const result = listOffers(db, { status, sector });

  log.info(
    { status, sector, count: result.length, requestId: c.get('requestId') },
    'offers listed',
  );

  return c.json(result);
});

app.get('/:id', (c) => {
  const db = c.get('db');
  const id = c.req.param('id');

  const result = getOffer(db, id);

  log.info({ offerId: id, requestId: c.get('requestId') }, 'offer accessed');

  return c.json(result);
});

export default app;
