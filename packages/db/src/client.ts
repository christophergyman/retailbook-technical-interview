import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { createLogger } from '@trading/logger';
import * as schema from './schema';

const log = createLogger('db');

const dbPath = process.env.DATABASE_URL || './local.db';
log.debug({ dbPath: path.resolve(dbPath) }, 'opening database');

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

let queryStart = 0;

const originalPrepare = sqlite.prepare.bind(sqlite);
sqlite.prepare = function trackedPrepare(sql: string) {
  queryStart = performance.now();
  return originalPrepare(sql);
} as typeof sqlite.prepare;

const SENSITIVE_FIELDS = /password|token|secret|access_token|refresh_token|id_token/i;

function maskParams(params: unknown): unknown {
  if (!Array.isArray(params)) return params;
  return params.map((p, i) => {
    if (typeof p === 'string' && p.length > 8 && SENSITIVE_FIELDS.test(String(i))) {
      return '[REDACTED]';
    }
    return p;
  });
}

function maskQuery(query: string): string {
  return query.replace(/(password|token|secret)\s*=\s*'[^']*'/gi, '$1=[REDACTED]');
}

export const db = drizzle(sqlite, {
  schema,
  logger: {
    logQuery(query, params) {
      const durationMs = Math.round((performance.now() - queryStart) * 100) / 100;
      log.debug(
        { query: maskQuery(query), params: maskParams(params), durationMs },
        'query executed',
      );
    },
  },
});

export type DB = typeof db;
