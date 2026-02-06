import pino from 'pino';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export function createLogger(name: string) {
  return pino({
    name,
    level: LOG_LEVEL,
    ...(process.env.NODE_ENV === 'development' && {
      transport: {
        target: 'pino-pretty',
      },
    }),
  });
}

export type Logger = ReturnType<typeof createLogger>;

const NOOP = pino({ level: 'silent' });
export function noopLogger(): Logger {
  return NOOP;
}

export function createChildLogger(parent: Logger, bindings: Record<string, unknown>) {
  return parent.child(bindings);
}

export function logBusinessEvent(log: Logger, event: string, data: Record<string, unknown> = {}) {
  log.info({ event, ...data }, event);
}

export const logger = createLogger('trading-dashboard');
