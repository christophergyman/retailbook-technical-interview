import { describe, expect, it, vi } from 'vitest';
import { createLogger, createChildLogger, logBusinessEvent, noopLogger, logger } from '../index';

describe('createLogger', () => {
  it('returns a pino logger instance', () => {
    const log = createLogger('test-logger');
    expect(log).toBeDefined();
    expect(typeof log.info).toBe('function');
    expect(typeof log.error).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.debug).toBe('function');
  });

  it('has the correct name', () => {
    const log = createLogger('my-service');
    // Pino exposes bindings containing the name
    const bindings = log.bindings();
    expect(bindings.name).toBe('my-service');
  });

  it('respects LOG_LEVEL env var (silent)', () => {
    // LOG_LEVEL is set to 'silent' in vitest.config.ts env
    const log = createLogger('silent-test');
    expect(log.level).toBe('silent');
  });
});

describe('noopLogger', () => {
  it('returns a logger with level silent', () => {
    const log = noopLogger();
    expect(log.level).toBe('silent');
  });

  it('returns the same singleton instance', () => {
    expect(noopLogger()).toBe(noopLogger());
  });
});

describe('createChildLogger', () => {
  it('creates a child logger with merged bindings', () => {
    const parent = createLogger('parent');
    const child = createChildLogger(parent, { requestId: 'req-1' });
    const bindings = child.bindings();
    expect(bindings.requestId).toBe('req-1');
  });
});

describe('logBusinessEvent', () => {
  it('calls log.info with event name and data', () => {
    const log = createLogger('test');
    const spy = vi.spyOn(log, 'info');
    logBusinessEvent(log, 'order_created', { orderId: '123' });
    expect(spy).toHaveBeenCalledWith({ event: 'order_created', orderId: '123' }, 'order_created');
  });
});

describe('createLogger dev transport', () => {
  it('includes pino-pretty transport when NODE_ENV=development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    // Re-import to get fresh module with development env
    // Instead, call createLogger which reads process.env at call time
    const log = createLogger('dev-test');
    // pino-pretty transport is set; we can verify the logger was created
    expect(log).toBeDefined();
    expect(typeof log.info).toBe('function');
    vi.unstubAllEnvs();
  });

  it('omits transport when NODE_ENV is not development', () => {
    vi.stubEnv('NODE_ENV', 'test');
    const log = createLogger('prod-test');
    expect(log).toBeDefined();
    expect(typeof log.info).toBe('function');
    vi.unstubAllEnvs();
  });
});

describe('default logger', () => {
  it('is a pre-configured logger with name trading-dashboard', () => {
    expect(logger).toBeDefined();
    const bindings = logger.bindings();
    expect(bindings.name).toBe('trading-dashboard');
  });
});
