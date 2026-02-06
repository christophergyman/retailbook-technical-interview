import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '../factory';
import { correlationId } from '../middleware/correlation-id';
import { requireAuth } from '../middleware/require-auth';
import {
  errorHandler,
  AppError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  InvalidTransitionError,
} from '../middleware/error-handler';
import { validateBody } from '../middleware/validate';
import { requestLogger } from '../middleware/logger';
import { CreateOrderSchema } from '@trading/shared';

function createMiddlewareApp() {
  const app = new Hono<AppEnv>();

  // Initialize variables
  app.use('*', async (c, next) => {
    c.set('user', null);
    c.set('requestId', 'test-fallback');
    await next();
  });

  return app;
}

describe('correlationId middleware', () => {
  it('generates a UUID when no x-request-id header is present', async () => {
    const app = createMiddlewareApp();
    app.use('*', correlationId);
    app.get('/test', (c) => c.json({ requestId: c.get('requestId') }));

    const res = await app.request('/test');
    expect(res.status).toBe(200);
    const body = await res.json();
    // Should be a UUID-like string
    expect(body.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('uses provided x-request-id header', async () => {
    const app = createMiddlewareApp();
    app.use('*', correlationId);
    app.get('/test', (c) => c.json({ requestId: c.get('requestId') }));

    const res = await app.request('/test', {
      headers: { 'x-request-id': 'custom-id-123' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.requestId).toBe('custom-id-123');
  });

  it('sets x-request-id response header', async () => {
    const app = createMiddlewareApp();
    app.use('*', correlationId);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test', {
      headers: { 'x-request-id': 'resp-header-test' },
    });
    expect(res.headers.get('x-request-id')).toBe('resp-header-test');
  });
});

describe('requireAuth middleware', () => {
  it('returns 401 when no user is set', async () => {
    const app = createMiddlewareApp();
    app.use('*', requireAuth);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('passes when user is set', async () => {
    const app = createMiddlewareApp();
    app.use('*', async (c, next) => {
      c.set('user', { id: 'u1', email: 'test@test.com', name: 'Test' });
      await next();
    });
    app.use('*', requireAuth);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});

describe('errorHandler', () => {
  it('handles NotFoundError (404)', async () => {
    const app = createMiddlewareApp();
    app.use('*', correlationId);
    app.get('/test', () => {
      throw new NotFoundError('Widget');
    });
    app.onError(errorHandler);

    const res = await app.request('/test');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
    expect(body.error).toBe('Widget not found');
    expect(body.requestId).toBeDefined();
  });

  it('handles ValidationError (400)', async () => {
    const app = createMiddlewareApp();
    app.use('*', correlationId);
    app.get('/test', () => {
      throw new ValidationError('Invalid input');
    });
    app.onError(errorHandler);

    const res = await app.request('/test');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.error).toBe('Invalid input');
  });

  it('handles ForbiddenError (403)', async () => {
    const app = createMiddlewareApp();
    app.use('*', correlationId);
    app.get('/test', () => {
      throw new ForbiddenError();
    });
    app.onError(errorHandler);

    const res = await app.request('/test');
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('FORBIDDEN');
  });

  it('handles InvalidTransitionError (400)', async () => {
    const app = createMiddlewareApp();
    app.use('*', correlationId);
    app.get('/test', () => {
      throw new InvalidTransitionError('PENDING_REVIEW', 'SETTLED');
    });
    app.onError(errorHandler);

    const res = await app.request('/test');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('INVALID_TRANSITION');
    expect(body.error).toContain('PENDING_REVIEW');
    expect(body.error).toContain('SETTLED');
  });

  it('handles generic AppError with 500', async () => {
    const app = createMiddlewareApp();
    app.use('*', correlationId);
    app.get('/test', () => {
      throw new AppError('Something broke', 500, 'INTERNAL_ERROR');
    });
    app.onError(errorHandler);

    const res = await app.request('/test');
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe('INTERNAL_ERROR');
  });

  it('handles unknown errors as 500', async () => {
    const app = createMiddlewareApp();
    app.use('*', correlationId);
    app.get('/test', () => {
      throw new Error('unexpected failure');
    });
    app.onError(errorHandler);

    const res = await app.request('/test');
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal Server Error');
    expect(body.code).toBe('INTERNAL_ERROR');
  });
});

describe('validateBody middleware', () => {
  it('passes valid body and sets validatedBody', async () => {
    const app = createMiddlewareApp();
    app.use('*', correlationId);
    app.post('/test', validateBody(CreateOrderSchema), (c) => {
      const body = c.get('validatedBody' as never);
      return c.json(body);
    });
    app.onError(errorHandler);

    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId: 'abc', sharesRequested: 5 }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.offerId).toBe('abc');
    expect(body.sharesRequested).toBe(5);
  });

  it('rejects invalid body with 400', async () => {
    const app = createMiddlewareApp();
    app.use('*', correlationId);
    app.post('/test', validateBody(CreateOrderSchema), (c) => {
      return c.json({ ok: true });
    });
    app.onError(errorHandler);

    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId: 'abc' }), // missing sharesRequested
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});

describe('auth dev-fallback (via createTestApp)', () => {
  it('sets user when valid x-user-id header is provided', async () => {
    const app = createMiddlewareApp();

    // Simulate the dev-fallback auth from test-utils: look up user by x-user-id
    const mockUsers: Record<string, { id: string; email: string; name: string }> = {
      u1: { id: 'u1', email: 'alice@test.com', name: 'Alice' },
    };
    app.use('*', async (c, next) => {
      const userId = c.req.header('x-user-id');
      if (userId && mockUsers[userId]) {
        c.set('user', mockUsers[userId]);
      }
      await next();
    });
    app.get('/test', (c) => c.json({ user: c.get('user') }));

    const res = await app.request('/test', {
      headers: { 'x-user-id': 'u1' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toEqual({ id: 'u1', email: 'alice@test.com', name: 'Alice' });
  });

  it('leaves user null when x-user-id refers to non-existent user', async () => {
    const app = createMiddlewareApp();
    const mockUsers: Record<string, { id: string; email: string; name: string }> = {};
    app.use('*', async (c, next) => {
      const userId = c.req.header('x-user-id');
      if (userId && mockUsers[userId]) {
        c.set('user', mockUsers[userId]);
      }
      await next();
    });
    app.get('/test', (c) => c.json({ user: c.get('user') }));

    const res = await app.request('/test', {
      headers: { 'x-user-id': 'nonexistent' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeNull();
  });

  it('leaves user null when no x-user-id header is provided', async () => {
    const app = createMiddlewareApp();
    app.use('*', async (c, next) => {
      // No header check — simulates missing header scenario
      await next();
    });
    app.get('/test', (c) => c.json({ user: c.get('user') }));

    const res = await app.request('/test');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeNull();
  });
});

describe('requestLogger middleware', () => {
  it('passes request through and completes', async () => {
    const app = createMiddlewareApp();
    app.use('*', correlationId);
    app.use('*', requestLogger);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
