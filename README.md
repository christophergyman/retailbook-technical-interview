# RetailBook — Pre-IPO Trading Dashboard

A full-stack monorepo application where retail investors browse upcoming IPO offers, place orders for shares, and track those orders through a multi-stage compliance pipeline. Built as a technical interview project demonstrating end-to-end ownership across frontend, API, database, testing, CI/CD, and deployment.

---

## Tech Stack

| Layer      | Technology                                           |
| ---------- | ---------------------------------------------------- |
| Monorepo   | Turborepo + npm workspaces                           |
| Frontend   | Next.js 15, React 19, TanStack Query v5, Tailwind v4 |
| API        | Hono v4 (lightweight, edge-compatible)               |
| Database   | SQLite (better-sqlite3) + Drizzle ORM                |
| Auth       | Better Auth (email/password, HTTP-only cookies)      |
| Validation | TypeBox (shared schemas between API and frontend)    |
| Testing    | Vitest (unit/integration) + Playwright (E2E)         |
| Logging    | Pino (structured JSON in prod, pretty-print in dev)  |
| CI/CD      | GitHub Actions (lint, typecheck, test on PRs)        |
| Deployment | Docker (multi-stage build)                           |

---

## Quick Start

### Prerequisites

- **Node.js** >= 18 (tested with v22)
- **npm** >= 10

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env

# 3. Create the SQLite database and seed it with demo data
npm run db:push
npm run db:seed

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Accounts

The seed script creates 8 users, 20 IPO offers, and 30 orders at various pipeline stages:

| User          | Email               | Password      | Notes                                                        |
| ------------- | ------------------- | ------------- | ------------------------------------------------------------ |
| Alice Johnson | `alice@example.com` | `password123` | 5 orders (settled, allocated, pending, rejected, compliance) |
| Bob Smith     | `bob@example.com`   | `password123` | 4 orders (settled, approved, pending, rejected)              |

All 8 users share the same password (`password123`). Additional users: Carol, Dave, Eve, Frank, Grace, Hank — each with 3-4 orders covering every pipeline stage.

---

## Project Structure

```
retailbook-technical-interview/
│
├── apps/
│   └── web/                            # Next.js 15 frontend
│       ├── src/
│       │   ├── app/                    # Pages (file-system routing)
│       │   │   ├── page.tsx            #   Landing page
│       │   │   ├── auth/
│       │   │   │   ├── login/page.tsx  #   Sign in form
│       │   │   │   └── register/page.tsx #  Sign up form
│       │   │   ├── offers/
│       │   │   │   ├── page.tsx        #   Browse IPO offers (grid)
│       │   │   │   └── [id]/page.tsx   #   Offer detail + buy form
│       │   │   └── dashboard/
│       │   │       ├── page.tsx        #   User dashboard (stats + order table)
│       │   │       └── orders/
│       │   │           └── [id]/page.tsx # Order detail + stage timeline
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   ├── Header.tsx      #   Top nav (branding, links, auth, theme toggle)
│       │   │   │   ├── AuthGuard.tsx   #   Route protection (redirects to /auth/login)
│       │   │   │   ├── ErrorBoundary.tsx # React error boundary with fallback UI
│       │   │   │   └── ThemeToggle.tsx #   Light / Dark / System theme switcher
│       │   │   ├── offers/
│       │   │   │   ├── OfferCard.tsx   #   Offer summary card with progress bar
│       │   │   │   └── BuyForm.tsx     #   Share quantity picker + order submission
│       │   │   └── orders/
│       │   │       ├── StageProgress.tsx # Visual pipeline (colored stage badges)
│       │   │       └── OrderTimeline.tsx # Chronological stage history
│       │   ├── hooks/                  # TanStack Query hooks
│       │   │   ├── useOffers.ts        #   GET /api/offers (list + single)
│       │   │   ├── useOffer.ts         #   GET /api/offers/:id
│       │   │   ├── useCreateOrder.ts   #   POST /api/orders (mutation)
│       │   │   ├── useOrders.ts        #   GET /api/orders
│       │   │   ├── useOrderDetail.ts   #   GET /api/orders/:id
│       │   │   ├── useDashboard.ts     #   GET /api/dashboard
│       │   │   └── useAdvanceStage.ts  #   PATCH /api/orders/:id/stage (mutation)
│       │   ├── lib/
│       │   │   ├── api-client.ts       #   Fetch wrapper (GET/POST/PATCH + error handling)
│       │   │   ├── auth-client.ts      #   Better Auth client (signIn, signUp, signOut, useSession)
│       │   │   └── query-client.ts     #   TanStack Query client factory
│       │   └── providers/
│       │       └── Providers.tsx        #   QueryClientProvider + ThemeProvider
│       ├── e2e/                        # Playwright E2E test specs
│       └── playwright.config.ts
│
├── packages/
│   ├── api/                            # Hono API server
│   │   └── src/
│   │       ├── index.ts                #   App entrypoint (middleware registration, routes, health check)
│   │       ├── factory.ts              #   Hono app factory with typed AppEnv
│   │       ├── auth/
│   │       │   └── setup.ts            #   Better Auth configuration
│   │       ├── routes/
│   │       │   ├── offers.ts           #   GET /api/offers, GET /api/offers/:id
│   │       │   ├── orders.ts           #   CRUD + stage advancement
│   │       │   └── dashboard.ts        #   GET /api/dashboard
│   │       ├── services/               # Business logic (no HTTP concerns)
│   │       │   ├── offer.service.ts    #   listOffers, getOffer
│   │       │   ├── order.service.ts    #   createOrder, listOrders, getOrderDetail, advanceOrderStage
│   │       │   └── dashboard.service.ts #  getDashboardStats
│   │       └── middleware/
│   │           ├── auth.ts             #   Session loading via Better Auth
│   │           ├── require-auth.ts     #   401 for unauthenticated requests
│   │           ├── correlation-id.ts   #   X-Request-Id header (trace requests)
│   │           ├── logger.ts           #   Request start/complete logging
│   │           ├── error-handler.ts    #   AppError hierarchy → HTTP status codes
│   │           ├── validate.ts         #   TypeBox body validation
│   │           ├── security-headers.ts #   CSP, HSTS, X-Frame-Options, etc.
│   │           └── rate-limit.ts       #   IP-based rate limiter (100 req/min)
│   │
│   ├── db/                             # Database layer
│   │   └── src/
│   │       ├── client.ts               #   Drizzle + better-sqlite3 setup, PII masking, query logging
│   │       ├── seed.ts                 #   Demo data (8 users, 20 offers, 30 orders)
│   │       ├── test-helpers.ts         #   In-memory SQLite factory for tests
│   │       └── schema/
│   │           ├── users.ts            #   Users table
│   │           ├── offers.ts           #   IPO offers table
│   │           ├── orders.ts           #   Orders + order_stage_history tables
│   │           ├── auth.ts             #   Sessions, accounts, verifications (Better Auth)
│   │           └── relations.ts        #   Drizzle relation definitions
│   │
│   ├── shared/                         # Shared types and constants
│   │   └── src/
│   │       ├── constants/
│   │       │   └── stages.ts           #   ORDER_STAGES, VALID_TRANSITIONS, isValidTransition()
│   │       └── schemas/
│   │           ├── user.ts             #   UserSchema
│   │           ├── offer.ts            #   OfferSchema, OfferListResponseSchema
│   │           ├── order.ts            #   CreateOrderSchema, UpdateOrderStageSchema, OrderDetailSchema
│   │           └── dashboard.ts        #   DashboardStatsSchema
│   │
│   └── logger/                         # Pino logger
│       └── src/
│           └── index.ts                #   createLogger, createChildLogger, logBusinessEvent
│
├── .github/workflows/
│   ├── ci.yml                          # PR checks: lint + typecheck + test
│   └── e2e.yml                         # Playwright E2E (manual trigger + main push)
│
├── Dockerfile                          # Multi-stage production build
├── docker-compose.yml                  # Single-service with SQLite volume
├── .dockerignore
├── turbo.json                          # Turborepo task configuration
├── vitest.workspace.ts                 # Vitest workspace (all packages)
├── CLAUDE.md                           # AI context for Claude Code
├── CONTEXT.md                          # AI context for any AI tool
└── PROMPTS.md                          # AI conversation transcript + prompt templates
```

### Dependency Graph

```
apps/web ──→ packages/api ──→ packages/db ──→ packages/shared
   │              │                               ↑
   │              └───────────────────────────────┘
   └──→ packages/shared

All packages ──→ packages/logger
```

The frontend (`web`) imports the API as a Next.js route handler at `apps/web/src/app/api/[...route]/route.ts`, so the API runs inside the same Next.js process on port 3000 — no separate backend server.

---

## Architecture

### API Layer (Hono)

Routes delegate to a **service layer** — route files handle HTTP concerns (parsing params, setting status codes), while services contain all business logic and database queries. This separation makes services independently testable with a real in-memory database.

**Middleware pipeline** (executed in order):

1. **DB injection** — sets `c.get('db')` for all routes
2. **Correlation ID** — attaches `X-Request-Id` for distributed tracing
3. **Security headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options
4. **Rate limiter** — 100 requests/minute per IP (in-memory, sliding window)
5. **Request logger** — logs request start + completion with duration
6. **CORS** — permissive in dev, origin-restricted in production
7. **Body limit** — 1MB max request body
8. **Session loader** — resolves Better Auth session → `c.get('user')`

**Error handling** uses a class hierarchy that maps to HTTP status codes:

| Error Class              | Status | Code                 |
| ------------------------ | ------ | -------------------- |
| `ValidationError`        | 400    | `VALIDATION_ERROR`   |
| `InvalidTransitionError` | 400    | `INVALID_TRANSITION` |
| `ForbiddenError`         | 403    | `FORBIDDEN`          |
| `NotFoundError`          | 404    | `NOT_FOUND`          |
| `AppError` (base)        | 500    | `INTERNAL_ERROR`     |

### Order Stage Pipeline

Orders move through a linear pipeline with rejection possible from any non-terminal stage:

```
PENDING_REVIEW → COMPLIANCE_CHECK → APPROVED → ALLOCATED → SETTLED
       ↓                 ↓              ↓           ↓
    REJECTED          REJECTED       REJECTED    REJECTED
```

- **Terminal stages**: `SETTLED` and `REJECTED` (no further transitions allowed)
- **Transitions are validated** server-side via `VALID_TRANSITIONS` map in `packages/shared`
- **Every transition** is recorded in `order_stage_history` with timestamp and optional note

### API Endpoints

| Method | Path                    | Auth | Description                                     |
| ------ | ----------------------- | ---- | ----------------------------------------------- |
| GET    | `/api/health`           | No   | Health check with DB readiness probe            |
| GET    | `/api/offers`           | No   | List offers (`?status=open&sector=Technology`)  |
| GET    | `/api/offers/:id`       | No   | Get single offer                                |
| POST   | `/api/orders`           | Yes  | Create order (`{ offerId, sharesRequested }`)   |
| GET    | `/api/orders`           | Yes  | List user's orders (`?stage=PENDING_REVIEW`)    |
| GET    | `/api/orders/:id`       | Yes  | Get order detail with stage history             |
| PATCH  | `/api/orders/:id/stage` | Yes  | Advance order stage (`{ toStage, note? }`)      |
| GET    | `/api/dashboard`        | Yes  | Dashboard stats (totals, breakdown by stage)    |
| \*     | `/api/auth/**`          | No   | Better Auth handlers (login, register, session) |

### Database Schema

```
users ──────────< orders >────────── offers
                    │
                    └──< order_stage_history

sessions ──────── users ──────── accounts
                                verifications
```

7 tables total. `users`, `offers`, `orders`, and `order_stage_history` are the domain tables. `sessions`, `accounts`, and `verifications` are managed by Better Auth.

---

## Available Scripts

| Command             | Description                                       |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Start dev server (Next.js + API on :3000)         |
| `npm run build`     | Production build (all packages via Turbo)         |
| `npm test`          | Run all unit/integration tests (Vitest via Turbo) |
| `npm run e2e`       | Run Playwright E2E tests (requires dev server)    |
| `npm run lint`      | ESLint all packages                               |
| `npm run typecheck` | TypeScript `--noEmit` all packages                |
| `npm run format`    | Prettier format all files                         |
| `npm run db:push`   | Push Drizzle schema to SQLite                     |
| `npm run db:seed`   | Seed database with demo data                      |

---

## Testing

### Unit & Integration Tests (Vitest)

```bash
npm test                # Run all tests via Turbo
npx vitest run          # Run with Vitest directly
npx vitest --coverage   # Run with coverage report
```

**144 tests** across 4 packages:

| Package  | Tests | What's Covered                                                 |
| -------- | ----- | -------------------------------------------------------------- |
| `shared` | 49    | TypeBox schema validation, stage transitions, helper functions |
| `logger` | 10    | Logger creation, child loggers, business event logging         |
| `db`     | 5     | Schema constraints, foreign keys, unique indexes               |
| `api`    | 80    | Routes, middleware, services, error handling, auth guards      |

Tests use **real in-memory SQLite databases** — no mocking libraries. Each test file gets a fresh database via `createTestDb()` from `packages/db/src/test-helpers.ts`. API tests exercise the full middleware → route → service → DB stack using Hono's test client (`app.request()`).

### E2E Tests (Playwright)

```bash
npm run e2e             # Run all E2E tests (headless Chromium)
cd apps/web
npm run e2e:ui          # Run with Playwright interactive UI
```

**14 tests** across 4 spec files:

| Spec                 | Tests | What's Covered                                        |
| -------------------- | ----- | ----------------------------------------------------- |
| `auth.spec.ts`       | 5     | Home page, login, bad credentials, register, sign out |
| `offers.spec.ts`     | 3     | Offer list, detail page, buy form visibility          |
| `order-flow.spec.ts` | 2     | Place order, verify order appears in dashboard        |
| `dashboard.spec.ts`  | 4     | Stat cards, orders table, order detail, auth guard    |

Playwright auto-starts the dev server if not already running. Tests run against `http://localhost:3000` with a 60s timeout per test.

---

## Docker

### Build and run

```bash
docker build -t retailbook .
docker run -p 3000:3000 retailbook
```

### With Docker Compose

```bash
docker compose up
```

The Compose file mounts a named volume for SQLite persistence. Environment variables are read from `.env` or can be overridden in `docker-compose.yml`.

The Dockerfile uses a 3-stage build (deps → build → production) with a non-root `nextjs` user and a built-in health check against `/api/health`.

---

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- **`ci.yml`** — Runs on every push/PR to `main`: lint, typecheck, and all unit tests in parallel
- **`e2e.yml`** — Runs on push to `main` or manual dispatch: installs Playwright, seeds the database, runs E2E tests, uploads report artifacts on failure

---

## Environment Variables

| Variable             | Required | Default                 | Description                            |
| -------------------- | -------- | ----------------------- | -------------------------------------- |
| `DATABASE_URL`       | No       | `./local.db`            | SQLite database file path              |
| `BETTER_AUTH_SECRET` | Yes      | —                       | Session encryption secret              |
| `BETTER_AUTH_URL`    | No       | `http://localhost:3000` | Auth callback base URL                 |
| `NODE_ENV`           | No       | `development`           | `development` or `production`          |
| `LOG_LEVEL`          | No       | `info`                  | Pino log level                         |
| `FRONTEND_URL`       | No       | `http://localhost:3000` | Allowed CORS origins (comma-separated) |

Copy `.env.example` to `.env` and fill in `BETTER_AUTH_SECRET`.

---

## AI Usage & Engineering Decisions

This project was built with AI assistance (Claude Code). The full conversation transcript is in [`PROMPTS.md`](./PROMPTS.md).

### Where AI Was Used

- **Scaffolding** — Monorepo setup, configs, boilerplate (AI-generated, manually verified)
- **Schema design** — TypeBox schemas and Drizzle ORM tables (AI-generated based on requirements)
- **API routes** — Hono middleware and service layer (AI-generated, architecture reviewed)
- **Frontend** — React components, hooks, pages (AI-generated with design review)
- **Test suite** — Test files and helpers (AI-generated, coverage gaps identified manually)
- **Dark mode** — Systematic `dark:` variant additions (AI-generated, excellent for repetitive work)
- **Production hardening** — Security middleware, Docker, CI/CD, documentation (AI-generated from plan)

### Where Manual Judgment Was Applied

- **Architecture** — Chose Hono over Express, SQLite over Postgres, TypeBox over Zod, service layer pattern
- **Stage pipeline** — Designed the order flow based on real IPO compliance workflows
- **Auth strategy** — Selected Better Auth for session management, avoiding JWT complexity
- **Error hierarchy** — Designed `AppError` subclasses to map cleanly to HTTP status codes
- **Test strategy** — Prioritized integration tests (real middleware + DB) over mocked unit tests, supplemented with Playwright E2E for full user flows

### Key Trade-offs

1. **SQLite vs Postgres** — Zero-config local dev and single-file deployment. Trade-off: no concurrent writes, but acceptable for this scope.
2. **In-memory test DB** — Fast and isolated tests, but doesn't exercise migration files.
3. **Shared TypeBox schemas** — Single source of truth for API contracts between frontend and backend. Adds coupling but eliminates type drift.
4. **Service layer** — Business logic in services, not route handlers. One extra layer, but makes testing and reuse straightforward.
5. **No frontend unit tests** — E2E tests cover user flows end-to-end; unit tests focus on the API/shared/db layers where business logic lives.
