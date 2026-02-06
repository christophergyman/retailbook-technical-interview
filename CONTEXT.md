# CONTEXT.md — Project Context for AI Tools

## Domain Model

- **Users**: Authenticated via email/password (Better Auth). Can browse offers and place orders.
- **Offers**: IPO listings with company info, price, available shares, status (open/closed).
- **Orders**: A user's investment in an offer. Tracks shares requested, total cost, and current stage.
- **Stage History**: Audit trail of all stage transitions for each order, with optional notes.

## Tech Stack

| Layer         | Technology                 | Version        |
| ------------- | -------------------------- | -------------- |
| Monorepo      | Turborepo + npm workspaces | Turbo 2.x      |
| Frontend      | Next.js + React            | 15.5 / 19.1    |
| Styling       | Tailwind CSS               | v4             |
| Server state  | TanStack Query             | v5             |
| API framework | Hono                       | v4             |
| Database      | SQLite + Drizzle ORM       | better-sqlite3 |
| Auth          | Better Auth                | v1.2           |
| Validation    | TypeBox                    | v0.34          |
| Logging       | Pino                       | v9             |
| Unit testing  | Vitest                     | v3             |
| E2E testing   | Playwright                 | v1.58          |
| Linting       | ESLint (flat config)       | v9             |
| Formatting    | Prettier                   | v3             |

## API Endpoints

| Method   | Path                    | Auth | Description                                           |
| -------- | ----------------------- | ---- | ----------------------------------------------------- |
| GET      | `/api/health`           | No   | Health check with DB readiness                        |
| POST/GET | `/api/auth/**`          | No   | Better Auth handlers (login, register, session)       |
| GET      | `/api/offers`           | No   | List offers (query: `?status=open&sector=Technology`) |
| GET      | `/api/offers/:id`       | No   | Get single offer                                      |
| GET      | `/api/orders`           | Yes  | List user's orders (query: `?stage=PENDING_REVIEW`)   |
| GET      | `/api/orders/:id`       | Yes  | Get order detail with stage history                   |
| POST     | `/api/orders`           | Yes  | Create order (`{ offerId, sharesRequested }`)         |
| PATCH    | `/api/orders/:id/stage` | Yes  | Advance order stage (`{ toStage, note? }`)            |
| GET      | `/api/dashboard`        | Yes  | Get user's dashboard stats                            |

## Database Schema

**Tables**: `users`, `offers`, `orders`, `order_stage_history`, `sessions`, `accounts`, `verifications`

Key relationships:

- `orders.userId` → `users.id`
- `orders.offerId` → `offers.id`
- `order_stage_history.orderId` → `orders.id`

Order stages: `PENDING_REVIEW`, `COMPLIANCE_CHECK`, `APPROVED`, `ALLOCATED`, `SETTLED`, `REJECTED`

## Environment Variables

| Variable             | Required | Default                 | Description                   |
| -------------------- | -------- | ----------------------- | ----------------------------- |
| `DATABASE_URL`       | No       | `./local.db`            | SQLite database file path     |
| `BETTER_AUTH_SECRET` | Yes      | —                       | Session encryption secret     |
| `BETTER_AUTH_URL`    | No       | `http://localhost:3000` | Auth callback URL             |
| `NODE_ENV`           | No       | `development`           | `development` or `production` |
| `LOG_LEVEL`          | No       | `info`                  | Pino log level                |
| `FRONTEND_URL`       | No       | `http://localhost:3000` | Allowed CORS origins          |

## Common Workflows

### Adding a new API route

1. Create service function in `packages/api/src/services/<name>.service.ts`
2. Create route file in `packages/api/src/routes/<name>.ts` using `factory.createApp()`
3. Register route in `packages/api/src/index.ts` with `app.route('/api/<path>', routes)`
4. Add tests in `packages/api/tests/<name>.test.ts`

### Adding a new TypeBox schema

1. Create/edit schema in `packages/shared/src/schemas/<name>.ts`
2. Export from `packages/shared/src/schemas/index.ts`
3. Types are auto-exported via `Static<typeof Schema>`

### Adding a new database table

1. Define table in `packages/db/src/schema/<name>.ts` using `sqliteTable()`
2. Add relations in `packages/db/src/schema/relations.ts`
3. Export from `packages/db/src/schema/index.ts`
4. Run `npm run db:push` to apply
5. Update `packages/db/src/test-helpers.ts` CREATE_TABLES SQL

### Adding a new frontend page

1. Create `apps/web/src/app/<path>/page.tsx`
2. Create components in `apps/web/src/components/<feature>/`
3. Add API hooks in `apps/web/src/hooks/` using TanStack Query
4. Wrap in `<AuthGuard>` if authentication is required
