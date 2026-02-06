import { describe, expect, it } from 'vitest';
import { createApp, factory } from '../factory';

describe('factory', () => {
  it('createApp returns a Hono-like app', () => {
    const app = createApp();
    expect(app).toBeDefined();
    expect(typeof app.get).toBe('function');
    expect(typeof app.use).toBe('function');
  });

  it('factory has createMiddleware', () => {
    expect(typeof factory.createMiddleware).toBe('function');
  });
});
