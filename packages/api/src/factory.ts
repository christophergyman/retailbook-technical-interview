import { Hono } from 'hono';
import { createFactory } from 'hono/factory';
import type { DB } from '@trading/db';
import type { User } from '@trading/shared';

export type AppEnv = {
  Variables: {
    db: DB;
    user: User | null;
    requestId: string;
  };
};

export const factory = createFactory<AppEnv>();

export function createApp() {
  return new Hono<AppEnv>();
}
