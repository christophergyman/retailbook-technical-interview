import { createLogger, logBusinessEvent } from '@trading/logger';
import { factory } from '../factory';
import { listOffers, getOffer } from '../services/offer.service';

const log = createLogger('api:offers');

const app = factory.createApp();

app.get('/', (c) => {
  const db = c.get('db');
  const status = c.req.query('status');
  const sector = c.req.query('sector');

  const result = listOffers(db, { status, sector }, log);

  logBusinessEvent(log, 'offers_listed', {
    status,
    sector,
    count: result.length,
    requestId: c.get('requestId'),
  });

  return c.json(result);
});

app.get('/:id', (c) => {
  const db = c.get('db');
  const id = c.req.param('id');

  const result = getOffer(db, id, log);

  logBusinessEvent(log, 'offer_accessed', {
    offerId: id,
    requestId: c.get('requestId'),
  });

  return c.json(result);
});

export default app;
