import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@trading/db';
import * as schema from '@trading/db/src/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    usePlural: true,
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000'],
});
