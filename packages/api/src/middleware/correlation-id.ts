import { factory } from '../factory';

export const correlationId = factory.createMiddleware(async (c, next) => {
  const id = c.req.header('x-request-id') ?? crypto.randomUUID();
  c.set('requestId', id);
  c.header('x-request-id', id);
  await next();
});
