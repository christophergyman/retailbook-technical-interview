# RetailBook — IPO Order Management Platform

A full-stack trading dashboard for managing IPO orders through a multi-stage pipeline.

## Tech Stack

| Layer      | Technology                                          |
| ---------- | --------------------------------------------------- |
| Monorepo   | Turborepo + npm workspaces                          |
| Frontend   | Next.js 15 + TanStack Query + Tailwind CSS v4       |
| API        | Hono (lightweight Node.js framework)                |
| Database   | SQLite + Drizzle ORM                                |
| Auth       | Better Auth (email/password)                        |
| Validation | TypeBox (shared schemas)                            |
| Testing    | Vitest (unit/integration) + Playwright (E2E)        |
| Logging    | Pino (structured JSON in prod, pretty-print in dev) |

## Project Structure

    ├── apps/
    │   └── web/                  # Next.js frontend
    ├── packages/
    │   ├── shared/               # TypeBox schemas, stage constants
    │   ├── logger/               # Pino logger configuration
    │   ├── db/                   # Drizzle ORM schema + SQLite
    │   └── api/                  # Hono API routes + middleware
    ├── turbo.json
    └── vitest.workspace.ts

## Prerequisites

- **Node.js** >= 18 (tested with v22)
- **npm** >= 10

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create the SQLite database and seed it with demo data
npm run db:push
npm run db:seed

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Accounts

The seed script creates two users and sample data (5 offers, 4 orders):

| User          | Email               | Password      | Notes                          |
| ------------- | ------------------- | ------------- | ------------------------------ |
| Alice Johnson | `alice@example.com` | `password123` | Has 4 orders at various stages |
| Bob Smith     | `bob@example.com`   | `password123` | No orders yet                  |

### Available Scripts

| Command             | Description                                     |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Start the dev server (Next.js + API on :3000)   |
| `npm run build`     | Production build                                |
| `npm test`          | Run all unit/integration tests (Vitest)         |
| `npm run e2e`       | Run E2E tests (Playwright, requires dev server) |
| `npm run lint`      | Lint all packages                               |
| `npm run typecheck` | Type-check all packages                         |
| `npm run format`    | Format all files with Prettier                  |
| `npm run db:push`   | Push schema to SQLite database                  |
| `npm run db:seed`   | Seed database with demo data                    |

## Order Pipeline

Orders progress through stages: **Pending Review → Compliance Check → Approved → Allocated → Settled**. Orders can be **Rejected** from any non-terminal stage.

## Testing

### Unit & Integration Tests

```bash
npm test              # Run all tests via Turbo
npx vitest run        # Run with Vitest directly
npx vitest --coverage # Run with coverage report
```

133 tests across 4 packages (shared, logger, db, api) covering schemas, stage logic, middleware, services, and API routes.

### E2E Tests (Playwright)

```bash
cd apps/web
npm run e2e           # Run all E2E tests (headless)
npm run e2e:ui        # Run with Playwright UI mode
```

14 tests across 4 spec files:

| Spec                 | Tests                                                 |
| -------------------- | ----------------------------------------------------- |
| `auth.spec.ts`       | Home page, login, bad credentials, register, sign out |
| `offers.spec.ts`     | Offer list, detail page, buy form visibility          |
| `order-flow.spec.ts` | Place order, verify in dashboard                      |
| `dashboard.spec.ts`  | Stat cards, orders table, order detail, auth guard    |

Requires the dev server running on `http://localhost:3000` (auto-started by Playwright if not already running).

## AI Usage & Engineering Decisions

This project was built with AI assistance (Claude Code). Below is a summary of where AI was used and where manual engineering judgment was applied.

### Where AI Was Used

- **Scaffolding**: Monorepo setup, configs, boilerplate — AI-generated, manually verified
- **Schema design**: TypeBox schemas and Drizzle ORM tables — AI-generated based on requirements
- **API routes**: Hono middleware and service layer — AI-generated, architecture reviewed
- **Frontend components**: React components, hooks, pages — AI-generated with design review
- **Test suite**: Test files and helpers — AI-generated, coverage gaps identified manually
- **Dark mode**: Systematic dark: variant additions — AI-generated, excellent for repetitive work

### Where Manual Judgment Was Applied

- **Architecture decisions**: Chose Hono over Express for lightweight API, SQLite for simplicity, TypeBox over Zod for runtime performance
- **Stage transition model**: Designed the order pipeline (PENDING_REVIEW → SETTLED with REJECTED from any stage) based on real IPO workflows
- **Auth strategy**: Selected Better Auth for built-in session management, avoiding JWT complexity for this use case
- **Error hierarchy**: Designed AppError subclasses to map cleanly to HTTP status codes
- **Test strategy**: Prioritized integration tests over unit tests for routes (tests hit real middleware + services + DB), supplemented with unit tests for schemas and stage logic. Added Playwright E2E tests for full user flow verification against the running app
- **Logging levels**: Separated error vs warn for server errors (5xx) vs client errors (4xx) in error handler

### Key Trade-offs

1. **SQLite vs Postgres**: Chose SQLite for zero-config local dev. Trade-off: no concurrent writes, but acceptable for interview scope.
2. **In-memory test DB**: Tests use `:memory:` SQLite — fast and isolated, but doesn't test migration files.
3. **Monorepo shared types**: TypeBox schemas shared between API and frontend. Ensures type safety but adds coupling.
4. **Service layer pattern**: Business logic in services, not route handlers. Adds a layer but makes testing and reuse easier.
