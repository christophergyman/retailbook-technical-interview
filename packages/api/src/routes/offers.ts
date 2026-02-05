import { createApp } from '../factory';
import { listOffers, getOffer } from '../services/offer.service';

const app = createApp();

app.get('/', (c) => {
  const db = c.get('db');
  const status = c.req.query('status');
  const sector = c.req.query('sector');

  const result = listOffers(db, { status, sector });
  return c.json(result);
});

app.get('/:id', (c) => {
  const db = c.get('db');
  const id = c.req.param('id');

  const result = getOffer(db, id);
  return c.json(result);
});

export default app;
