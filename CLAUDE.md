# CLAUDE.md — AI Context for Claude Code

## Project Overview

RetailBook is a pre-IPO trading dashboard built as a technical interview project. Users browse IPO offers, place orders, and track them through a multi-stage pipeline.

## Architecture

Turborepo monorepo with npm workspaces:

```
apps/web          → Next.js 15 frontend (TanStack Query, Tailwind CSS v4, next-themes)
packages/api      → Hono API (routes, middleware, services)
packages/db       → Drizzle ORM + SQLite (better-sqlite3)
packages/shared   → TypeBox schemas, stage constants, type exports
packages/logger   → Pino logger (structured JSON in prod, pino-pretty in dev)
```

Dependencies flow: `web → api → db → shared`, `web → shared`, `api → shared`, `* → logger`

## Key Commands

```bash
npm run dev          # Start dev server (Next.js + API on :3000)
npm run build        # Production build
npm run test         # Run all Vitest suites via Turbo
npm run e2e          # Run Playwright E2E tests (needs dev server)
npm run lint         # ESLint all packages
npm run typecheck    # TypeScript --noEmit all packages
npm run db:push      # Push Drizzle schema to SQLite
npm run db:seed      # Seed database with demo data
npm run format       # Prettier format all files
```

## Coding Conventions

- **Validation**: TypeBox (`@sinclair/typebox`) — NOT Zod. Schemas in `packages/shared/src/schemas/`.
- **Database**: Drizzle ORM with SQLite. Schema in `packages/db/src/schema/`. Use `.sync()` for queries (synchronous SQLite).
- **API pattern**: Hono routes → service layer → DB. Services in `packages/api/src/services/`. Routes never contain business logic.
- **Error handling**: `AppError` hierarchy in `packages/api/src/middleware/error-handler.ts`. Subclasses: `NotFoundError`, `ValidationError`, `ForbiddenError`, `InvalidTransitionError`.
- **Auth**: Better Auth (email/password). Session loaded via middleware. Access `c.get('user')` in routes.
- **Logging**: Pino via `@trading/logger`. Use `createLogger(name)` for module loggers. Use `logBusinessEvent(log, event, data)` for business events.
- **Testing**: Vitest with in-memory SQLite. Test helpers in `packages/db/src/test-helpers.ts`. API tests use Hono test client (`app.request()`). No mocking libraries — use real DB.
- **Frontend state**: TanStack Query for server state. No global state management (Redux, Zustand, etc.).

## Order Stage Pipeline

```
PENDING_REVIEW → COMPLIANCE_CHECK → APPROVED → ALLOCATED → SETTLED
       ↓                 ↓              ↓           ↓
    REJECTED          REJECTED       REJECTED    REJECTED
```

Valid transitions defined in `packages/shared/src/constants/stages.ts` via `VALID_TRANSITIONS` map.

Terminal stages: `SETTLED`, `REJECTED` (no further transitions).

## File Structure Quick Reference

| What             | Where                                     |
| ---------------- | ----------------------------------------- |
| API routes       | `packages/api/src/routes/*.ts`            |
| API middleware   | `packages/api/src/middleware/*.ts`        |
| Service layer    | `packages/api/src/services/*.ts`          |
| DB schema        | `packages/db/src/schema/*.ts`             |
| TypeBox schemas  | `packages/shared/src/schemas/*.ts`        |
| Stage constants  | `packages/shared/src/constants/stages.ts` |
| React pages      | `apps/web/src/app/**/page.tsx`            |
| React components | `apps/web/src/components/**/*.tsx`        |
| API hooks        | `apps/web/src/hooks/*.ts`                 |
| E2E tests        | `apps/web/tests/*.spec.ts`                |
| Unit tests       | `packages/*/tests/*.test.ts`              |

## Things to Avoid

- **No Express** — we use Hono
- **No Zod** — we use TypeBox
- **No localStorage for tokens** — Better Auth uses HTTP-only cookies
- **No mocking libraries** (jest.mock, vi.mock) — use real in-memory DB
- **No Prisma** — we use Drizzle ORM
- **No Redux/Zustand** — TanStack Query handles server state

## Pre-commit Hooks

Husky + lint-staged runs on commit:

- `*.{ts,tsx}`: ESLint --fix + Prettier
- `*.{json,md}`: Prettier

## Environment Variables

| Variable             | Default                 | Description                            |
| -------------------- | ----------------------- | -------------------------------------- |
| `DATABASE_URL`       | `./local.db`            | SQLite database path                   |
| `BETTER_AUTH_SECRET` | (required)              | Auth session secret                    |
| `BETTER_AUTH_URL`    | `http://localhost:3000` | Auth callback base URL                 |
| `NODE_ENV`           | `development`           | Environment mode                       |
| `LOG_LEVEL`          | `info`                  | Pino log level                         |
| `FRONTEND_URL`       | `http://localhost:3000` | Allowed CORS origins (comma-separated) |
