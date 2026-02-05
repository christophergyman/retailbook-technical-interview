# TradeFlow — Pre-IPO Trading Dashboard

A pre-IPO trading dashboard where users can browse upcoming IPO offers, place share purchase orders, and track their orders through a multi-stage pipeline from submission to settlement.

## Tech Stack

| Layer         | Technology              | Purpose                                                   |
| ------------- | ----------------------- | --------------------------------------------------------- |
| Monorepo      | Turborepo               | Workspace-based monorepo with task orchestration          |
| Frontend      | Next.js 15 (App Router) | React framework with server components                    |
| API           | Hono                    | Lightweight, type-safe API framework with factory pattern |
| ORM           | Drizzle ORM             | Type-safe SQL ORM with drizzle-kit migrations             |
| Validation    | TypeBox                 | Shared JSON schemas between API and frontend              |
| Auth          | Better Auth             | Email/password authentication                             |
| Data Fetching | TanStack Query          | Client-side data fetching and caching                     |
| Database      | SQLite (better-sqlite3) | Zero-config embedded database                             |
| Logging       | Pino                    | Structured JSON logging                                   |
| Testing       | Vitest                  | Unit and integration testing                              |
| Styling       | Tailwind CSS v4         | Utility-first CSS framework                               |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Environment Variables

See `.env.example` for all required environment variables.

## Project Structure

```
trading-dashboard/
├── apps/
│   └── web/                 # Next.js frontend application
├── packages/
│   ├── api/                 # Hono API server
│   ├── db/                  # Drizzle ORM schemas and migrations
│   ├── shared/              # Shared types, schemas, constants
│   └── logger/              # Pino structured logger
├── turbo.json               # Turborepo task configuration
├── tsconfig.base.json       # Shared TypeScript config
├── eslint.config.mjs        # ESLint v9 flat config
├── .prettierrc              # Prettier config
├── vitest.workspace.ts      # Vitest workspace config
└── .husky/pre-commit        # Pre-commit hooks
```

## Scripts

| Command               | Description                        |
| --------------------- | ---------------------------------- |
| `npm run dev`         | Start all apps in development mode |
| `npm run build`       | Build all apps and packages        |
| `npm run lint`        | Lint all workspaces                |
| `npm run typecheck`   | Type-check all workspaces          |
| `npm run test`        | Run all tests                      |
| `npm run format`      | Format all files with Prettier     |
| `npm run db:generate` | Generate Drizzle migrations        |
| `npm run db:push`     | Push schema to database            |
| `npm run db:seed`     | Seed database with sample data     |

## AI Usage

This project was built with AI assistance using [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

### Claude Code Skills

Three agent skills are installed in `.claude/skills/` to guide code generation:

| Skill                         | Source                                                                  | Purpose                                                       |
| ----------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| `vercel-react-best-practices` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | React/Next.js performance patterns (57 rules)                 |
| `web-design-guidelines`       | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | Web Interface Guidelines compliance                           |
| `frontend-design`             | [anthropics/skills](https://github.com/anthropics/skills)               | Typography, color, motion, and spatial composition guidelines |

### Other AI Artifacts

- `PROMPTS.md` — AI conversation transcript
- `.ai-reviews/` — Automated AI code reviews on each commit
- Commit messages indicate AI-assisted vs manually written code

## Design Decisions

- **SQLite** for zero-config local development — no external database dependency
- **Stage history as a separate audit table** for data integrity and full audit trail
- **TypeBox schemas shared between API and frontend** for a single source of truth on validation
- **Hono factory pattern** for composable, typed route handlers with shared context
- **Turborepo** for efficient task orchestration and caching across the monorepo
