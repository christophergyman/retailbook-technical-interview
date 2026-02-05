import { describe, expect, it } from 'vitest';
import { createLogger, logger } from '../index';

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

describe('default logger', () => {
  it('is a pre-configured logger with name trading-dashboard', () => {
    expect(logger).toBeDefined();
    const bindings = logger.bindings();
    expect(bindings.name).toBe('trading-dashboard');
  });
});
