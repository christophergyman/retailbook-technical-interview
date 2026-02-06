import { createLogger, logBusinessEvent } from '@trading/logger';
import { factory } from '../factory';
import { ValidationError } from '../middleware/error-handler';
import { listOffers, getOffer } from '../services/offer.service';

const log = createLogger('api:offers');

const VALID_STATUSES = ['open', 'closed'] as const;

const app = factory.createApp();

app.get('/', (c) => {
  const db = c.get('db');
  const status = c.req.query('status');
  const sector = c.req.query('sector');

  if (status && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    throw new ValidationError(`Invalid status: must be one of ${VALID_STATUSES.join(', ')}`);
  }

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
