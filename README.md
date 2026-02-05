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
| Testing    | Vitest (workspace-wide)                             |
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

## Quick Start

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

## Order Pipeline

Orders progress through stages: **Pending Review → Compliance Check → Approved → Allocated → Settled**. Orders can be **Rejected** from any non-terminal stage.

## Testing

```bash
npm test              # Run all tests
npx vitest run        # Run with Vitest directly
npx vitest --coverage # Run with coverage report
```

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
- **Test strategy**: Prioritized integration tests over unit tests for routes (tests hit real middleware + services + DB), supplemented with unit tests for schemas and stage logic
- **Logging levels**: Separated error vs warn for server errors (5xx) vs client errors (4xx) in error handler

### Key Trade-offs

1. **SQLite vs Postgres**: Chose SQLite for zero-config local dev. Trade-off: no concurrent writes, but acceptable for interview scope.
2. **In-memory test DB**: Tests use `:memory:` SQLite — fast and isolated, but doesn't test migration files.
3. **Monorepo shared types**: TypeBox schemas shared between API and frontend. Ensures type safety but adds coupling.
4. **Service layer pattern**: Business logic in services, not route handlers. Adds a layer but makes testing and reuse easier.
