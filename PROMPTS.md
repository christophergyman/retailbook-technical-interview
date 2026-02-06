# AI Conversation Transcript

## Prompt Engineering Guidelines

### How to Brief AI on This Project

Point the AI at `CLAUDE.md` (for Claude Code) or `CONTEXT.md` (for other tools) before starting. These files contain the full architecture, conventions, and constraints. If using Claude Code, it picks up `CLAUDE.md` automatically.

### Example Prompts That Work Well

**New feature:**

> Add a `PATCH /api/offers/:id` endpoint that lets admins close an offer. Create the service function in `offer.service.ts`, add the route in `offers.ts`, validate with TypeBox, and add tests.

**Bug fix:**

> The orders list endpoint returns orders from all users when `stage` is provided. Fix the query in `listOrders()` in `order.service.ts` to always filter by `userId`. Add a regression test.

**Refactoring:**

> Extract the stage transition validation from `advanceOrderStage()` into a standalone `validateTransition()` function in the shared package. Update imports in the API service and add unit tests.

### Anti-patterns to Avoid

- Don't say "build me an API" — be specific about which endpoints, schemas, and error cases.
- Don't ask for a "complete rewrite" — the codebase has established patterns. Ask for incremental changes.
- Don't skip mentioning test requirements — always ask for tests alongside code changes.
- Don't request technologies we don't use (Zod, Express, Prisma, Redux) — see CLAUDE.md for conventions.

### When to Use Which AI Tool

| Task                   | Tool                    | Why                                                  |
| ---------------------- | ----------------------- | ---------------------------------------------------- |
| Multi-file refactoring | Claude Code             | Understands monorepo, can edit + test in one session |
| Inline code completion | GitHub Copilot / Cursor | Fast autocomplete from context                       |
| Code review            | Claude Code / ChatGPT   | Can analyze diffs and suggest improvements           |
| Schema design          | Claude Code             | Can read existing schemas and maintain consistency   |
| Debugging              | Claude Code             | Can read logs, trace errors, and fix across files    |

### Templates

**New Feature Request:**

```
Add [feature description].
- Route: [METHOD /api/path]
- Schema: [describe input/output]
- Service: [which service file]
- Auth: [required/not required]
- Tests: [describe test cases]
```

**Bug Fix Request:**

```
Bug: [describe the incorrect behavior]
Expected: [describe correct behavior]
Location: [file:line or function name]
Reproduce: [steps or curl command]
Add a regression test.
```

---

## Session 1 — Project Scaffolding

**Prompt**: Implement Phase 0 scaffolding — set up Turborepo monorepo with workspace packages, Next.js app, ESLint, Prettier, Husky, Vitest, and Claude Code agent skills.

**Response summary**: AI generated the full monorepo structure including root configs (turbo.json, tsconfig.base.json, eslint flat config, prettier), 4 workspace packages (shared, logger, db, api), scaffolded Next.js via create-next-app, set up Husky pre-commit hooks, and installed agent skills.

**What I did with it**: Accepted as-is after verifying all configs were correct and build/lint/typecheck passed.

---

## Session 2 — Shared Package & DB Schema

**Prompt**: Implement the shared constants (order stages, valid transitions) and TypeBox schemas (User, Offer, Order, Dashboard). Then build out the Drizzle ORM schema with SQLite tables for users, offers, orders, order_stage_history, plus Better Auth tables.

**Response summary**: AI generated stage constants with VALID_TRANSITIONS map, helper functions (isValidTransition, getStageIndex, isTerminalStage), TypeBox schemas for all domain types, and full Drizzle schema with relations. Also created seed script with realistic data.

**What I did with it**: Accepted. Verified foreign keys work and seed data is valid.

---

## Session 3 — API Layer (Hono)

**Prompt**: Build the Hono API with middleware (CORS, correlation ID, request logging, auth session loading, error handling, body validation) and routes for offers, orders, and dashboard.

**Response summary**: AI generated factory pattern with typed AppEnv, all middleware, service layer (offer, order, dashboard services), and route handlers. Included error class hierarchy (AppError, NotFoundError, ValidationError, ForbiddenError, InvalidTransitionError).

**What I did with it**: Accepted. The service layer cleanly separates business logic from route handlers.

---

## Session 4 — Test Suite

**Prompt**: Add comprehensive tests across shared, db, and api packages. Target: validate schemas, DB constraints, and API routes with auth simulation.

**Response summary**: AI generated 48 tests: stage transition tests, schema validation tests, DB constraint tests, and full API route tests using in-memory SQLite and Hono test client.

**What I did with it**: Accepted. All tests passed on first run. Test helpers (createTestDb, createTestApp, seedTestData) are well-structured for reuse.

---

## Session 5 — Frontend (Next.js + TanStack Query)

**Prompt**: Build the Next.js frontend with TanStack Query hooks, Better Auth client, offer browsing, order placement, dashboard with stats, and order detail with stage progression.

**Response summary**: AI generated full frontend: auth pages (login/register), offers listing and detail, buy form, dashboard with stat cards and order table, order detail with stage progress visualization and timeline. Used TanStack Query for server state and Better Auth React client for sessions.

**What I did with it**: Accepted. UI follows a clean component structure with good loading/error states.

---

## Session 6 — Dark Mode Toggle

**Prompt**: Add a three-way theme toggle (Light/Dark/System) using next-themes. Place in header, add dark: Tailwind variants to all 17 component files.

**Response summary**: AI generated ThemeToggle component with dropdown, wired up ThemeProvider, and systematically added dark: variants to all pages/components following a consistent color mapping (bg-white → dark:bg-slate-800, etc.).

**What I did with it**: Accepted after verifying all 48 tests still pass and typecheck succeeds.

---

## Session 7 — Testing Expansion & Logging Enhancement

**Prompt**: Expand test suite for near-100% code coverage. Enhance logging with structured business events, child loggers with bound context, DB query duration tracking, and warn-level logging for client errors.

**Response summary**: AI generated additional test files covering schema validation, middleware, services, and edge cases. Enhanced logger package with createChildLogger and logBusinessEvent helpers. Added query duration tracking to DB client.

**What I did with it**: Reviewing and merging. Tests validate critical business logic paths.

---

## Session 8 — Playwright E2E Tests

**Prompt**: Add Playwright E2E tests to verify all frontend pages and user flows work correctly against the real running app. Cover auth (login, register, bad credentials, sign out), offers (list, detail, buy form), order flow (place order, verify in dashboard), and dashboard (stats, table, order detail, auth guard).

**Response summary**: AI installed Playwright with Chromium, created config and 4 spec files with 14 tests. Key challenges were handling dual "Sign In" links (header + body) requiring scoped selectors, client-side data fetching requiring extended timeouts, and correct ticker symbols from seed data. Test timeout set to 60s to accommodate login + data fetch latency.

**What I did with it**: Accepted after iterating on timeout tuning and selector fixes. All 14 E2E tests pass alongside 133 unit tests.

---

## Session 9 — Production Hardening & AI-First Documentation

**Prompt**: Deep code review with production hardening. 5 parallel research agents analyzed architecture, tests, logging, docs, code quality, and 2026 best practices. Then implemented a 6-phase plan covering security fixes, observability, Docker, CI/CD, AI docs, and modularity.

**Response summary**: AI implemented across 23 files:

- **Security**: Query param validation on offers/orders routes, security headers middleware (CSP, HSTS, X-Frame-Options), IP-based rate limiting (100 req/min), 1MB body size limit, fixed error handler type cast from `as 400` to `as ContentfulStatusCode`
- **Observability**: React ErrorBoundary, graceful SIGTERM/SIGINT shutdown, health endpoint with DB readiness probe (`SELECT 1`), PII masking in DB query logger
- **Infrastructure**: Multi-stage Dockerfile, docker-compose.yml with SQLite volume, .dockerignore
- **CI/CD**: GitHub Actions CI workflow (lint + typecheck + test on PRs), E2E workflow (Playwright with artifact upload)
- **AI docs**: CLAUDE.md (Claude Code context), CONTEXT.md (generic AI context), PROMPTS.md prompt engineering guidelines
- **Modularity**: Barrel exports for services/routes, aria-labels and aria-describedby for WCAG accessibility

**Known issue found during E2E verification**: Pino's `pino-pretty` transport (via `thread-stream`) throws `Error: the worker has exited` and `Cannot find module thread-stream/lib/worker.js` during Playwright test teardown. This is harmless — it only occurs when Playwright kills the dev server process, causing the Pino worker thread to exit before flushing final log lines. Does not affect test results or production (which uses JSON output, not `pino-pretty`). Documented in CLAUDE.md under "Known Issues".

**What I did with it**: Accepted. All 14 E2E tests pass, 144 unit tests pass, lint and typecheck clean. Pre-commit hooks (lint-staged + typecheck + vitest --changed) all green.
