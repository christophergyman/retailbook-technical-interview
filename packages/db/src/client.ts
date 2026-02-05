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

export const db = drizzle(sqlite, {
  schema,
  logger: {
    logQuery(query, params) {
      log.debug({ query, params }, 'executing query');
    },
  },
});

export type DB = typeof db;
