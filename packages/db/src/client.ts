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

export const db = drizzle(sqlite, {
  schema,
  logger: {
    logQuery(query, params) {
      const durationMs = Math.round((performance.now() - queryStart) * 100) / 100;
      log.debug({ query, params, durationMs }, 'query executed');
    },
  },
});

export type DB = typeof db;
