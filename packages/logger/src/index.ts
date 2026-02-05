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

export const logger = createLogger('trading-dashboard');
