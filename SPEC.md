# SPEC: Pre-IPO Trading Dashboard

> **Purpose**: This is a technical take-home project for a fintech startup. The evaluator will review the git history, AI conversation transcripts, code quality, test coverage, and engineering judgment. This spec is the single source of truth for the build.

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Tech Stack (Mandatory)](#2-tech-stack-mandatory)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Phase 0 — Scaffolding & DX Infrastructure](#4-phase-0--scaffolding--dx-infrastructure)
5. [Phase 1 — Database Schema & Drizzle ORM](#5-phase-1--database-schema--drizzle-orm)
6. [Phase 2 — Shared Types & TypeBox Validation](#6-phase-2--shared-types--typebox-validation)
7. [Phase 3 — API Layer with Hono](#7-phase-3--api-layer-with-hono)
8. [Phase 4 — Authentication with Better Auth](#8-phase-4--authentication-with-better-auth)
9. [Phase 5 — Frontend (Next.js + TanStack Query)](#9-phase-5--frontend-nextjs--tanstack-query)
10. [Phase 6 — Testing Strategy](#10-phase-6--testing-strategy)
11. [Phase 7 — Logging & Observability](#11-phase-7--logging--observability)
12. [Phase 8 — Pre-Commit Hooks & AI Code Review](#12-phase-8--pre-commit-hooks--ai-code-review)
13. [Phase 9 — Documentation & AI Transcript](#13-phase-9--documentation--ai-transcript)
14. [Commit Strategy](#14-commit-strategy)
15. [Database Seed Data](#15-database-seed-data)
16. [UI/UX Specification](#16-uiux-specification)
17. [Error Handling Patterns](#17-error-handling-patterns)
18. [Environment Variables](#18-environment-variables)

---

## 1. PROJECT OVERVIEW

### What We're Building

A simple pre-IPO trading dashboard where:

- **Users** can register, log in, and manage their account
- **Offers** represent companies about to IPO — users can browse them
- **Orders** are purchase requests — a user clicks "Buy" on an offer, specifies how many shares, and their order enters a multi-stage pipeline
- **Dashboard** shows the user all their orders and what stage each one is in
- Each order moves through **5 pipeline stages** (detailed below), with a full audit trail of transitions

### What This Is NOT

- Not a real trading platform — no payment processing, no real market data
- Not a design contest — clean, functional, professional UI is enough
- Not a massive app — this is intentionally small to demonstrate engineering quality over quantity

### Domain Model

```
User ──< Order >── Offer
              │
              └──< OrderStageHistory (audit log)
```

- A User can have many Orders
- An Offer can have many Orders
- An Order has exactly one current stage and many stage history entries

### Order Pipeline Stages

Every order progresses through these stages in sequence:

| #   | Stage Enum         | Label            | Description                                      |
| --- | ------------------ | ---------------- | ------------------------------------------------ |
| 1   | `PENDING_REVIEW`   | Pending Review   | Order submitted, awaiting initial review         |
| 2   | `COMPLIANCE_CHECK` | Compliance Check | KYC/AML verification in progress                 |
| 3   | `APPROVED`         | Approved         | Cleared for share allocation                     |
| 4   | `ALLOCATED`        | Shares Allocated | Shares reserved from the offer pool              |
| 5   | `SETTLED`          | Settled          | IPO complete, shares deposited in user's account |

Plus one terminal state:
| — | `REJECTED` | Rejected | Order rejected (can happen from any stage) |

**Valid transitions:**

- `PENDING_REVIEW` → `COMPLIANCE_CHECK` or `REJECTED`
- `COMPLIANCE_CHECK` → `APPROVED` or `REJECTED`
- `APPROVED` → `ALLOCATED` or `REJECTED`
- `ALLOCATED` → `SETTLED` or `REJECTED`
- `SETTLED` → (terminal, no further transitions)
- `REJECTED` → (terminal, no further transitions)

---

## 2. TECH STACK (MANDATORY)

These are **non-negotiable** — the evaluator specified them:

| Layer         | Technology                   | Notes                                     |
| ------------- | ---------------------------- | ----------------------------------------- |
| Monorepo      | Turborepo                    | Workspace-based monorepo                  |
| Frontend      | Next.js 14+ (App Router)     | React Server Components where appropriate |
| API           | Hono                         | Use factory pattern for route composition |
| ORM           | Drizzle ORM                  | With drizzle-kit for migrations           |
| Validation    | TypeBox                      | Shared schemas between API and frontend   |
| Auth          | Better Auth                  | Email/password for simplicity             |
| Data Fetching | TanStack Query (React Query) | Client-side data fetching and caching     |
| Database      | SQLite (via better-sqlite3)  | Simple, no external DB dependency         |
| Language      | TypeScript                   | Strict mode throughout                    |

### Additional Tooling (Our Choice)

| Tool                | Purpose                      |
| ------------------- | ---------------------------- |
| Pino                | Structured JSON logging      |
| Vitest              | Unit and integration testing |
| Husky + lint-staged | Pre-commit hooks             |
| ESLint + Prettier   | Code formatting and linting  |
| Tailwind CSS        | Utility-first styling        |

---

## 3. MONOREPO STRUCTURE

```
trading-dashboard/
├── .husky/
│   └── pre-commit                    # Lint, typecheck, test, AI review
├── .claude/
│   └── skills/                       # Claude Code agent skills (committed)
├── .ai-reviews/                      # AI code review outputs (committed)
├── apps/
│   └── web/                          # Next.js frontend application
│       ├── src/
│       │   ├── app/                  # App Router pages
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   ├── auth/
│       │   │   │   ├── login/page.tsx
│       │   │   │   └── register/page.tsx
│       │   │   ├── offers/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [id]/page.tsx
│       │   │   └── dashboard/
│       │   │       ├── page.tsx
│       │   │       └── orders/
│       │   │           └── [id]/page.tsx
│       │   ├── components/
│       │   │   ├── ui/               # Generic UI components
│       │   │   │   ├── Button.tsx
│       │   │   │   ├── Card.tsx
│       │   │   │   ├── Input.tsx
│       │   │   │   ├── Badge.tsx
│       │   │   │   └── Stepper.tsx   # Pipeline stage visualizer
│       │   │   ├── layout/
│       │   │   │   ├── Header.tsx
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   └── AuthGuard.tsx
│       │   │   ├── offers/
│       │   │   │   ├── OfferCard.tsx
│       │   │   │   ├── OfferList.tsx
│       │   │   │   └── BuyForm.tsx
│       │   │   └── orders/
│       │   │       ├── OrderTable.tsx
│       │   │       ├── OrderRow.tsx
│       │   │       ├── OrderTimeline.tsx
│       │   │       └── StageProgress.tsx
│       │   ├── hooks/
│       │   │   ├── useOffers.ts
│       │   │   ├── useOffer.ts
│       │   │   ├── useOrders.ts
│       │   │   ├── useOrder.ts
│       │   │   ├── useCreateOrder.ts
│       │   │   └── useAuth.ts
│       │   ├── lib/
│       │   │   ├── api-client.ts     # Fetch wrapper for Hono API
│       │   │   ├── query-client.ts   # TanStack Query client config
│       │   │   └── auth-client.ts    # Better Auth client setup
│       │   └── providers/
│       │       └── Providers.tsx      # QueryClientProvider + AuthProvider
│       ├── tailwind.config.ts
│       ├── next.config.ts
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   ├── api/                          # Hono API server
│   │   ├── src/
│   │   │   ├── index.ts             # Main Hono app export
│   │   │   ├── factory.ts           # Hono factory with shared middleware
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts          # Session verification middleware
│   │   │   │   ├── logger.ts        # Request/response logging
│   │   │   │   ├── error-handler.ts # Central error handling
│   │   │   │   └── correlation-id.ts # Request tracing
│   │   │   ├── routes/
│   │   │   │   ├── offers.ts        # GET /offers, GET /offers/:id
│   │   │   │   ├── orders.ts        # POST/GET /orders, GET /orders/:id, PATCH /orders/:id/stage
│   │   │   │   └── dashboard.ts     # GET /dashboard (aggregated stats)
│   │   │   ├── services/
│   │   │   │   ├── offer.service.ts
│   │   │   │   ├── order.service.ts
│   │   │   │   └── dashboard.service.ts
│   │   │   └── auth/
│   │   │       └── setup.ts         # Better Auth configuration
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── db/                           # Drizzle ORM + schema
│   │   ├── src/
│   │   │   ├── index.ts             # DB client export
│   │   │   ├── schema/
│   │   │   │   ├── index.ts         # Re-exports all schemas
│   │   │   │   ├── users.ts
│   │   │   │   ├── offers.ts
│   │   │   │   ├── orders.ts
│   │   │   │   └── auth.ts          # Better Auth required tables
│   │   │   ├── migrations/          # Generated by drizzle-kit
│   │   │   └── seed.ts              # Seed script
│   │   ├── drizzle.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── shared/                       # Shared types, schemas, constants
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── schemas/             # TypeBox schemas
│   │   │   │   ├── offer.ts
│   │   │   │   ├── order.ts
│   │   │   │   └── user.ts
│   │   │   ├── types/               # TypeScript types derived from TypeBox
│   │   │   │   └── index.ts
│   │   │   └── constants/
│   │   │       ├── stages.ts        # Stage enum, labels, transitions map
│   │   │       └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── logger/                       # Shared Pino logger
│       ├── src/
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
├── turbo.json
├── package.json                      # Root workspace config
├── tsconfig.base.json               # Shared TS config
├── .eslintrc.js
├── .prettierrc
├── .gitignore
├── .env.example
├── PROMPTS.md                        # AI conversation transcript
├── README.md
└── vitest.workspace.ts              # Vitest workspace config
```

---

## 4. PHASE 0 — SCAFFOLDING & DX INFRASTRUCTURE

### 4.1 Initialize Monorepo

```bash
mkdir trading-dashboard && cd trading-dashboard
git init
npm init -y
```

Configure `package.json` as a workspace root:

```json
{
  "name": "trading-dashboard",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "typecheck": "turbo typecheck",
    "db:generate": "turbo db:generate --filter=@trading/db",
    "db:push": "turbo db:push --filter=@trading/db",
    "db:seed": "turbo db:seed --filter=@trading/db",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\""
  },
  "devDependencies": {
    "turbo": "^2",
    "typescript": "^5",
    "eslint": "^9",
    "prettier": "^3",
    "husky": "^9",
    "lint-staged": "^15"
  }
}
```

### 4.2 Turborepo Configuration

`turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {},
    "typecheck": {}
  }
}
```

### 4.3 TypeScript Base Config

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### 4.4 ESLint & Prettier

Use a flat ESLint config with TypeScript support. Prettier config:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### 4.5 Install Claude Code Agent Skills

Run these from the project root BEFORE writing any application code:

```bash
npx skills add vercel-labs/agent-skills \
  --skill react-best-practices \
  --skill web-design-guidelines \
  --skill frontend-design \
  -a claude-code
```

Verify:

```bash
npx skills list -a claude-code
```

**Commit the `.claude/skills/` directory** so the evaluator can see the AI tooling configuration.

---

## 5. PHASE 1 — DATABASE SCHEMA & DRIZZLE ORM

### 5.1 Package Setup

`packages/db/package.json`:

```json
{
  "name": "@trading/db",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:seed": "tsx src/seed.ts",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "drizzle-orm": "^0.35",
    "better-sqlite3": "^11"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7",
    "drizzle-kit": "^0.28",
    "tsx": "^4"
  }
}
```

### 5.2 Drizzle Config

`packages/db/drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || './local.db',
  },
});
```

### 5.3 Schema Definitions

**IMPORTANT**: All schemas must use Drizzle's SQLite column types. Follow the exact patterns below.

#### `packages/db/src/schema/users.ts`

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID string
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

#### `packages/db/src/schema/offers.ts`

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const offers = sqliteTable('offers', {
  id: text('id').primaryKey(),
  companyName: text('company_name').notNull(),
  ticker: text('ticker').notNull(),
  description: text('description').notNull(),
  sector: text('sector').notNull(), // e.g., "Technology", "Healthcare"
  pricePerShare: real('price_per_share').notNull(),
  totalShares: integer('total_shares').notNull(),
  availableShares: integer('available_shares').notNull(),
  ipoDate: text('ipo_date').notNull(), // ISO date string
  status: text('status', { enum: ['open', 'closed'] })
    .notNull()
    .default('open'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

#### `packages/db/src/schema/orders.ts`

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { offers } from './offers';

// Define as a const array for reuse
export const ORDER_STAGES = [
  'PENDING_REVIEW',
  'COMPLIANCE_CHECK',
  'APPROVED',
  'ALLOCATED',
  'SETTLED',
  'REJECTED',
] as const;

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  offerId: text('offer_id')
    .notNull()
    .references(() => offers.id),
  sharesRequested: integer('shares_requested').notNull(),
  totalCost: real('total_cost').notNull(),
  stage: text('stage', { enum: ORDER_STAGES }).notNull().default('PENDING_REVIEW'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const orderStageHistory = sqliteTable('order_stage_history', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id),
  fromStage: text('from_stage'),
  toStage: text('to_stage').notNull(),
  note: text('note'), // Optional reason for transition
  changedAt: integer('changed_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

#### `packages/db/src/schema/auth.ts`

Better Auth requires specific tables. Let Better Auth's Drizzle adapter generate these — but at minimum it needs `session`, `account`, and `verification` tables. Follow the Better Auth Drizzle docs exactly. Use `npx @better-auth/cli generate` to scaffold the auth schema.

#### `packages/db/src/schema/index.ts`

```typescript
export * from './users';
export * from './offers';
export * from './orders';
export * from './auth';
```

### 5.4 Database Client

`packages/db/src/index.ts`:

```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const sqlite = new Database(process.env.DATABASE_URL || './local.db');

// Enable WAL mode for better concurrent read performance
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
export * from './schema';
```

### 5.5 Drizzle Relations

Define relations in a separate file for type-safe query building:

`packages/db/src/schema/relations.ts`:

```typescript
import { relations } from 'drizzle-orm';
import { users } from './users';
import { offers } from './offers';
import { orders, orderStageHistory } from './orders';

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const offersRelations = relations(offers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  offer: one(offers, { fields: [orders.offerId], references: [offers.id] }),
  stageHistory: many(orderStageHistory),
}));

export const orderStageHistoryRelations = relations(orderStageHistory, ({ one }) => ({
  order: one(orders, { fields: [orderStageHistory.orderId], references: [orders.id] }),
}));
```

---

## 6. PHASE 2 — SHARED TYPES & TYPEBOX VALIDATION

### 6.1 Package Setup

`packages/shared/package.json`:

```json
{
  "name": "@trading/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "dependencies": {
    "@sinclair/typebox": "^0.33"
  }
}
```

### 6.2 Stage Constants

`packages/shared/src/constants/stages.ts`:

```typescript
export const ORDER_STAGES = [
  'PENDING_REVIEW',
  'COMPLIANCE_CHECK',
  'APPROVED',
  'ALLOCATED',
  'SETTLED',
  'REJECTED',
] as const;

export type OrderStage = (typeof ORDER_STAGES)[number];

export const STAGE_LABELS: Record<OrderStage, string> = {
  PENDING_REVIEW: 'Pending Review',
  COMPLIANCE_CHECK: 'Compliance Check',
  APPROVED: 'Approved',
  ALLOCATED: 'Shares Allocated',
  SETTLED: 'Settled',
  REJECTED: 'Rejected',
};

// The pipeline stages in order (excluding REJECTED which is a terminal branch)
export const PIPELINE_STAGES: OrderStage[] = [
  'PENDING_REVIEW',
  'COMPLIANCE_CHECK',
  'APPROVED',
  'ALLOCATED',
  'SETTLED',
];

// Valid transitions map
export const VALID_TRANSITIONS: Record<OrderStage, OrderStage[]> = {
  PENDING_REVIEW: ['COMPLIANCE_CHECK', 'REJECTED'],
  COMPLIANCE_CHECK: ['APPROVED', 'REJECTED'],
  APPROVED: ['ALLOCATED', 'REJECTED'],
  ALLOCATED: ['SETTLED', 'REJECTED'],
  SETTLED: [], // terminal
  REJECTED: [], // terminal
};

export function isValidTransition(from: OrderStage, to: OrderStage): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getStageIndex(stage: OrderStage): number {
  return PIPELINE_STAGES.indexOf(stage);
}

export function isTerminalStage(stage: OrderStage): boolean {
  return stage === 'SETTLED' || stage === 'REJECTED';
}
```

### 6.3 TypeBox Schemas

**CRITICAL**: These schemas are used for BOTH API validation and frontend type inference. Define them once here, use everywhere.

#### `packages/shared/src/schemas/offer.ts`

```typescript
import { Type, Static } from '@sinclair/typebox';

export const OfferSchema = Type.Object({
  id: Type.String(),
  companyName: Type.String(),
  ticker: Type.String(),
  description: Type.String(),
  sector: Type.String(),
  pricePerShare: Type.Number(),
  totalShares: Type.Integer(),
  availableShares: Type.Integer(),
  ipoDate: Type.String({ format: 'date' }),
  status: Type.Union([Type.Literal('open'), Type.Literal('closed')]),
  createdAt: Type.String(), // ISO string when serialized
});

export const OfferListResponseSchema = Type.Array(OfferSchema);

export type Offer = Static<typeof OfferSchema>;
```

#### `packages/shared/src/schemas/order.ts`

```typescript
import { Type, Static } from '@sinclair/typebox';
import { OfferSchema } from './offer';

const OrderStageEnum = Type.Union([
  Type.Literal('PENDING_REVIEW'),
  Type.Literal('COMPLIANCE_CHECK'),
  Type.Literal('APPROVED'),
  Type.Literal('ALLOCATED'),
  Type.Literal('SETTLED'),
  Type.Literal('REJECTED'),
]);

export const CreateOrderSchema = Type.Object({
  offerId: Type.String(),
  sharesRequested: Type.Integer({ minimum: 1 }),
});

export const UpdateOrderStageSchema = Type.Object({
  toStage: OrderStageEnum,
  note: Type.Optional(Type.String()),
});

export const StageHistoryEntrySchema = Type.Object({
  id: Type.String(),
  fromStage: Type.Union([Type.String(), Type.Null()]),
  toStage: Type.String(),
  note: Type.Union([Type.String(), Type.Null()]),
  changedAt: Type.String(),
});

export const OrderSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  offerId: Type.String(),
  sharesRequested: Type.Integer(),
  totalCost: Type.Number(),
  stage: OrderStageEnum,
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const OrderDetailSchema = Type.Object({
  ...OrderSchema.properties,
  offer: OfferSchema,
  stageHistory: Type.Array(StageHistoryEntrySchema),
});

export const OrderListResponseSchema = Type.Array(OrderSchema);

export type CreateOrder = Static<typeof CreateOrderSchema>;
export type UpdateOrderStage = Static<typeof UpdateOrderStageSchema>;
export type Order = Static<typeof OrderSchema>;
export type OrderDetail = Static<typeof OrderDetailSchema>;
export type StageHistoryEntry = Static<typeof StageHistoryEntrySchema>;
```

#### `packages/shared/src/schemas/user.ts`

```typescript
import { Type, Static } from '@sinclair/typebox';

export const UserSchema = Type.Object({
  id: Type.String(),
  email: Type.String({ format: 'email' }),
  name: Type.String({ minLength: 1 }),
});

export type User = Static<typeof UserSchema>;
```

#### `packages/shared/src/schemas/dashboard.ts`

```typescript
import { Type, Static } from '@sinclair/typebox';

export const DashboardStatsSchema = Type.Object({
  totalOrders: Type.Integer(),
  totalInvested: Type.Number(),
  ordersByStage: Type.Record(Type.String(), Type.Integer()),
  recentOrders: Type.Array(
    Type.Object({
      id: Type.String(),
      companyName: Type.String(),
      ticker: Type.String(),
      sharesRequested: Type.Integer(),
      totalCost: Type.Number(),
      stage: Type.String(),
      createdAt: Type.String(),
    }),
  ),
});

export type DashboardStats = Static<typeof DashboardStatsSchema>;
```

---

## 7. PHASE 3 — API LAYER WITH HONO

### 7.1 Package Setup

`packages/api/package.json`:

```json
{
  "name": "@trading/api",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "dependencies": {
    "hono": "^4",
    "@trading/db": "workspace:*",
    "@trading/shared": "workspace:*",
    "@trading/logger": "workspace:*",
    "better-auth": "^1",
    "@sinclair/typebox": "^0.33",
    "@sinclair/typebox-compiler": "^0.33"
  }
}
```

### 7.2 Hono Factory Pattern

**CRITICAL**: The evaluator specifically asked for Hono factories. This is a key evaluation point.

`packages/api/src/factory.ts`:

```typescript
import { Hono } from 'hono';
import { createFactory } from 'hono/factory';
import type { DB } from '@trading/db';
import type { User } from '@trading/shared';

// Define the shared environment/context for all routes
export type AppEnv = {
  Variables: {
    db: DB;
    user: User | null;
    requestId: string;
  };
};

// Create the factory that all route modules will use
export const factory = createFactory<AppEnv>();

// Create a new Hono app instance with the shared env type
export function createApp() {
  return new Hono<AppEnv>();
}
```

**How the factory is used**: Each route file imports `factory` and uses `factory.createHandlers()` to define route handlers. This ensures all handlers share the same typed context (db access, user session, request ID) without prop-drilling.

### 7.3 Middleware

#### Correlation ID Middleware

`packages/api/src/middleware/correlation-id.ts`:

```typescript
import { factory } from '../factory';
import { randomUUID } from 'crypto';

export const correlationId = factory.createMiddleware(async (c, next) => {
  const requestId = c.req.header('x-request-id') || randomUUID();
  c.set('requestId', requestId);
  c.header('x-request-id', requestId);
  await next();
});
```

#### Logger Middleware

`packages/api/src/middleware/logger.ts`:

Implement using Pino (from `@trading/logger`). Log:

- Request: method, path, request ID
- Response: status code, duration in ms
- On error: include error message and stack

Use structured JSON format. Every log line must include the correlation/request ID.

#### Auth Middleware

`packages/api/src/middleware/auth.ts`:

```typescript
import { factory } from '../factory';

// Middleware that REQUIRES authentication — returns 401 if no session
export const requireAuth = factory.createMiddleware(async (c, next) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

// Middleware that OPTIONALLY loads auth — doesn't block if no session
export const optionalAuth = factory.createMiddleware(async (c, next) => {
  // Better Auth session check — sets user if session exists
  // Implementation depends on Better Auth's Hono integration
  await next();
});
```

#### Error Handler Middleware

`packages/api/src/middleware/error-handler.ts`:

Implement a central error handler that:

1. Catches all thrown errors
2. Maps known error types to HTTP status codes
3. Returns structured JSON error responses: `{ error: string, code: string, requestId: string }`
4. Logs the error with full context via the logger
5. Never leaks stack traces in production

Define custom error classes:

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super('Forbidden', 403, 'FORBIDDEN');
  }
}

export class InvalidTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(`Invalid stage transition from ${from} to ${to}`, 400, 'INVALID_TRANSITION');
  }
}
```

#### TypeBox Validation Middleware

`packages/api/src/middleware/validate.ts`:

Create a reusable middleware that validates `c.req.json()` against a TypeBox schema. On failure, return a 400 with the validation errors. On success, set the validated body on the context for the handler to use.

```typescript
import { TSchema } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox-compiler';
import { factory } from '../factory';
import { ValidationError } from './error-handler';

export function validateBody<T extends TSchema>(schema: T) {
  const checker = TypeCompiler.Compile(schema);
  return factory.createMiddleware(async (c, next) => {
    const body = await c.req.json();
    if (!checker.Check(body)) {
      const errors = [...checker.Errors(body)];
      throw new ValidationError(
        `Validation failed: ${errors.map((e) => `${e.path}: ${e.message}`).join(', ')}`,
      );
    }
    // body is now validated — handler can trust it
    c.set('validatedBody' as any, body);
    await next();
  });
}
```

### 7.4 Route Definitions

#### Offers Routes — `packages/api/src/routes/offers.ts`

```
GET /api/offers
  - Public (no auth required)
  - Query params: status (optional, default: 'open'), sector (optional)
  - Response: OfferListResponseSchema
  - Logging: log query params and result count

GET /api/offers/:id
  - Public (no auth required)
  - Path params: id (string)
  - Response: OfferSchema
  - Error: 404 if not found
  - Logging: log offer ID accessed
```

Use `factory.createHandlers()` pattern. Each handler is a separate function exported from the module.

#### Orders Routes — `packages/api/src/routes/orders.ts`

```
POST /api/orders
  - Auth: REQUIRED
  - Body: CreateOrderSchema (validated via TypeBox middleware)
  - Business logic:
    1. Verify the offer exists and status === 'open'
    2. Verify availableShares >= sharesRequested
    3. Calculate totalCost = pricePerShare * sharesRequested
    4. Create the order with stage = 'PENDING_REVIEW'
    5. Decrement offer's availableShares
    6. Create initial stage history entry (fromStage: null, toStage: 'PENDING_REVIEW')
    7. Wrap steps 4-6 in a database TRANSACTION
  - Response: 201 with OrderSchema
  - Logging: log business event "order_created" with order ID, offer ID, user ID, amount

GET /api/orders
  - Auth: REQUIRED
  - Returns only orders belonging to the authenticated user
  - Query params: stage (optional filter)
  - Response: OrderListResponseSchema
  - Logging: log query with result count

GET /api/orders/:id
  - Auth: REQUIRED
  - Returns order detail including offer info and stage history
  - Must verify order belongs to authenticated user
  - Response: OrderDetailSchema (with nested offer and stageHistory)
  - Error: 404 if not found or not owned by user
  - Logging: log order detail access

PATCH /api/orders/:id/stage
  - Auth: REQUIRED
  - Body: UpdateOrderStageSchema (validated via TypeBox middleware)
  - Business logic:
    1. Fetch the order
    2. Verify it belongs to the authenticated user
    3. Validate the transition using isValidTransition(currentStage, toStage)
    4. If transition to ALLOCATED: verify offer still has available shares
    5. Update order's stage and updatedAt
    6. Create stage history entry with from/to/note
    7. Wrap in TRANSACTION
  - Response: 200 with updated OrderSchema
  - Error: 400 if invalid transition, 404 if not found
  - Logging: log business event "stage_changed" with order ID, from, to
```

#### Dashboard Routes — `packages/api/src/routes/dashboard.ts`

```
GET /api/dashboard
  - Auth: REQUIRED
  - Aggregates the authenticated user's data:
    - totalOrders: count of all user's orders
    - totalInvested: sum of totalCost across all orders
    - ordersByStage: count per stage { "PENDING_REVIEW": 2, "APPROVED": 1, ... }
    - recentOrders: last 5 orders with basic offer info, sorted by createdAt desc
  - Response: DashboardStatsSchema
  - Logging: log dashboard access
```

### 7.5 Service Layer Pattern

Each route module should delegate business logic to a corresponding service in `packages/api/src/services/`. Services:

- Accept the `db` instance and typed parameters
- Contain all business rules and validation logic
- Throw `AppError` subclasses on failure
- Return typed results
- Are independently testable (you can pass a test DB instance)

Example signature:

```typescript
// packages/api/src/services/order.service.ts
export async function createOrder(
  db: DB,
  userId: string,
  input: CreateOrder,
): Promise<Order> { ... }

export async function advanceOrderStage(
  db: DB,
  userId: string,
  orderId: string,
  input: UpdateOrderStage,
): Promise<Order> { ... }
```

### 7.6 Main App Assembly

`packages/api/src/index.ts`:

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createApp } from './factory';
import { correlationId } from './middleware/correlation-id';
import { loggerMiddleware } from './middleware/logger';
import { errorHandler } from './middleware/error-handler';
import offersRoutes from './routes/offers';
import ordersRoutes from './routes/orders';
import dashboardRoutes from './routes/dashboard';

const app = createApp();

// Global middleware (order matters)
app.use('*', correlationId);
app.use('*', loggerMiddleware);
app.use('*', cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));

// Mount routes
app.route('/api/offers', offersRoutes);
app.route('/api/orders', ordersRoutes);
app.route('/api/dashboard', dashboardRoutes);

// Mount Better Auth routes
// app.route('/api/auth', authRoutes);

// Global error handler
app.onError(errorHandler);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default app;
```

### 7.7 Connecting Hono to Next.js

The Hono API runs inside Next.js via a catch-all API route:

`apps/web/src/app/api/[...route]/route.ts`:

```typescript
import { handle } from 'hono/vercel';
import app from '@trading/api';

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
```

This means the entire API is accessible at `http://localhost:3000/api/*` — no separate server process needed.

---

## 8. PHASE 4 — AUTHENTICATION WITH BETTER AUTH

### 8.1 Server-Side Setup

`packages/api/src/auth/setup.ts`:

```typescript
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@trading/db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session age every 24 hours
  },
});
```

Mount Better Auth's handler on Hono:

```typescript
import { auth } from './auth/setup';

app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw));
```

### 8.2 Auth Middleware (Detailed)

The auth middleware should use Better Auth's `auth.api.getSession()` to check the incoming request's session cookie:

```typescript
import { auth } from '../auth/setup';
import { factory } from '../factory';

export const loadSession = factory.createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (session?.user) {
    c.set('user', {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    });
  }
  await next();
});
```

Apply `loadSession` globally. Apply `requireAuth` on protected routes only.

### 8.3 Client-Side Auth

`apps/web/src/lib/auth-client.ts`:

```typescript
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

---

## 9. PHASE 5 — FRONTEND (NEXT.JS + TANSTACK QUERY)

### 9.1 App Setup

#### Providers

`apps/web/src/providers/Providers.tsx`:

Wrap the app with:

1. `QueryClientProvider` (TanStack Query)
2. Any auth context from Better Auth

Configure TanStack Query defaults:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

#### API Client

`apps/web/src/lib/api-client.ts`:

Create a thin wrapper around `fetch` that:

- Prepends the API base URL
- Includes credentials (cookies for Better Auth sessions)
- Parses JSON responses
- Throws on non-2xx responses with structured error info
- Includes the `x-request-id` header for tracing

```typescript
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new ApiError(res.status, error.message || 'Request failed', error.code);
    }
    return res.json();
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new ApiError(res.status, error.message || 'Request failed', error.code);
    }
    return res.json();
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new ApiError(res.status, error.message || 'Request failed', error.code);
    }
    return res.json();
  }
}

export const api = new ApiClient('/api');
```

### 9.2 TanStack Query Hooks

**CRITICAL**: These hooks are the core of the data layer. Each must handle loading, error, and success states properly. Use TypeBox-derived types for full type safety.

#### `apps/web/src/hooks/useOffers.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Offer } from '@trading/shared';

export function useOffers(filters?: { status?: string; sector?: string }) {
  return useQuery({
    queryKey: ['offers', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.sector) params.set('sector', filters.sector);
      const query = params.toString();
      return api.get<Offer[]>(`/offers${query ? `?${query}` : ''}`);
    },
  });
}
```

#### `apps/web/src/hooks/useOffer.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Offer } from '@trading/shared';

export function useOffer(id: string) {
  return useQuery({
    queryKey: ['offers', id],
    queryFn: () => api.get<Offer>(`/offers/${id}`),
    enabled: !!id,
  });
}
```

#### `apps/web/src/hooks/useOrders.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Order } from '@trading/shared';

export function useOrders(stage?: string) {
  return useQuery({
    queryKey: ['orders', { stage }],
    queryFn: () => {
      const query = stage ? `?stage=${stage}` : '';
      return api.get<Order[]>(`/orders${query}`);
    },
  });
}
```

#### `apps/web/src/hooks/useOrder.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { OrderDetail } from '@trading/shared';

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => api.get<OrderDetail>(`/orders/${id}`),
    enabled: !!id,
  });
}
```

#### `apps/web/src/hooks/useCreateOrder.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { CreateOrder, Order } from '@trading/shared';

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrder) => api.post<Order>('/orders', input),
    onSuccess: (newOrder) => {
      // Invalidate orders list so it refetches
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // Invalidate the specific offer (availableShares changed)
      queryClient.invalidateQueries({ queryKey: ['offers', newOrder.offerId] });
      // Invalidate offers list
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
```

#### `apps/web/src/hooks/useDashboard.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { DashboardStats } from '@trading/shared';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardStats>('/dashboard'),
  });
}
```

### 9.3 Pages

#### Root Layout — `apps/web/src/app/layout.tsx`

- Wrap with `<Providers>` (TanStack Query + Auth)
- Include `<Header>` with navigation and auth status
- Use Tailwind base styles
- Set metadata (title: "TradeFlow — Pre-IPO Trading Dashboard")

#### Landing/Home — `apps/web/src/app/page.tsx`

- If authenticated: redirect to `/dashboard`
- If not: redirect to `/offers` or show a simple hero section with "Browse Offers" and "Sign In" CTAs

#### Auth Pages

`apps/web/src/app/auth/login/page.tsx`:

- Email + password form
- Use Better Auth's `signIn.email()` client method
- On success: redirect to `/dashboard`
- Show loading and error states
- Link to register page

`apps/web/src/app/auth/register/page.tsx`:

- Name + email + password form
- Use Better Auth's `signUp.email()` client method
- On success: redirect to `/dashboard`
- Basic client-side validation (email format, password length >= 8)
- Link to login page

#### Offers — `apps/web/src/app/offers/page.tsx`

- Use `useOffers()` hook
- Display offers as a grid of cards
- Each card shows: company name, ticker, sector, price per share, available shares, IPO date
- Optional: filter by sector dropdown
- Clicking a card navigates to `/offers/[id]`
- Public page (no auth required)
- Show loading skeleton and empty state

#### Offer Detail — `apps/web/src/app/offers/[id]/page.tsx`

- Use `useOffer(id)` hook
- Full offer details in a clean layout
- **BuyForm component**: Number input for shares, shows calculated total cost, submit button
  - Uses `useCreateOrder()` mutation
  - Validates shares > 0 and <= availableShares on the client
  - Shows success toast/message after purchase
  - Disables form if offer status is 'closed' or availableShares === 0
  - Must be authenticated to see the form (show "Sign in to buy" prompt if not)
- Show loading and error states

#### Dashboard — `apps/web/src/app/dashboard/page.tsx`

- **Auth required** — redirect to `/auth/login` if not authenticated
- Use `useDashboard()` and `useOrders()` hooks
- Layout:
  - **Stats row**: Total orders, total invested, orders by stage (as small badges/pills)
  - **Orders table**: All user's orders with columns: Company, Ticker, Shares, Total Cost, Stage (as colored badge), Date, Actions (view detail link)
  - **StageProgress component**: For each order row, show a mini horizontal stepper showing the 5 pipeline stages with the current one highlighted
- Clicking an order row navigates to `/dashboard/orders/[id]`

#### Order Detail — `apps/web/src/app/dashboard/orders/[id]/page.tsx`

- **Auth required**
- Use `useOrder(id)` hook
- Show:
  - Order summary (company, shares, cost, current stage)
  - **StageProgress**: Large horizontal stepper visualization of the 5 stages
  - **OrderTimeline**: Vertical timeline showing every stage transition from the `stageHistory` array, with timestamps and notes
  - Offer info card (the company they bought into)
- If the order is in a non-terminal stage, show a "Simulate Next Stage" button (for demo purposes, this calls `PATCH /api/orders/:id/stage` with the next valid stage)

### 9.4 Key UI Components

#### `StageProgress` Component

A horizontal stepper that visualizes the 5 pipeline stages:

```
[ Pending ] → [ Compliance ] → [ Approved ] → [ Allocated ] → [ Settled ]
```

- Completed stages: green with checkmark
- Current stage: blue with pulse/glow animation
- Future stages: grey/muted
- If REJECTED: current stage shows red with X icon, all future stages crossed out

Props: `currentStage: OrderStage`

#### `OrderTimeline` Component

A vertical timeline showing stage history entries:

```
● Settled — Jan 15, 2026 at 3:42 PM
│  IPO completed, shares deposited
│
● Shares Allocated — Jan 14, 2026 at 11:20 AM
│  Shares reserved from pool
│
● Approved — Jan 13, 2026 at 9:15 AM
│  Compliance check passed
│
...
```

Props: `stageHistory: StageHistoryEntry[]`

#### `OfferCard` Component

Card displaying an offer in the grid:

- Company name (large)
- Ticker (badge)
- Sector label
- Price per share
- Available shares with progress bar (available/total)
- IPO date
- "View Details" button

### 9.5 Design Direction

**Aesthetic**: Clean fintech — think modern banking app. Not flashy, but refined and trustworthy.

- **Color palette**: Dark navy primary (#0F172A), white backgrounds, emerald green for positive states (#10B981), amber for pending (#F59E0B), red for rejected (#EF4444), blue for active (#3B82F6)
- **Typography**: Use a professional sans-serif. If using Google Fonts, consider "DM Sans" for body and "Space Grotesk" or "Sora" for headings
- **Cards**: Subtle borders, light shadows, rounded corners (8px)
- **Tables**: Clean with hover states, alternating row backgrounds
- **Animations**: Subtle — fade in on page load, smooth transitions on stage changes. Don't over-animate.

---

## 10. PHASE 6 — TESTING STRATEGY

### 10.1 Setup

`vitest.workspace.ts` at root:

```typescript
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/api/vitest.config.ts',
  'packages/db/vitest.config.ts',
  'packages/shared/vitest.config.ts',
]);
```

Each package gets its own `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // or 'jsdom' for frontend tests
  },
});
```

### 10.2 Test Categories & Specific Tests to Write

#### A. Schema Validation Tests (`packages/shared/`)

Test that TypeBox schemas accept valid data and reject invalid data:

```
✓ CreateOrderSchema accepts valid input
✓ CreateOrderSchema rejects sharesRequested = 0
✓ CreateOrderSchema rejects sharesRequested = -1
✓ CreateOrderSchema rejects missing offerId
✓ UpdateOrderStageSchema rejects invalid stage value
✓ UpdateOrderStageSchema accepts valid stage with note
```

#### B. Stage Transition Logic Tests (`packages/shared/`)

```
✓ isValidTransition returns true for PENDING_REVIEW → COMPLIANCE_CHECK
✓ isValidTransition returns true for PENDING_REVIEW → REJECTED
✓ isValidTransition returns false for PENDING_REVIEW → APPROVED (skip)
✓ isValidTransition returns false for SETTLED → anything (terminal)
✓ isValidTransition returns false for REJECTED → anything (terminal)
✓ isValidTransition returns true for every valid forward transition
✓ getStageIndex returns correct index for each pipeline stage
✓ isTerminalStage returns true for SETTLED and REJECTED
✓ isTerminalStage returns false for all other stages
```

#### C. API Route Tests (`packages/api/`)

Use Hono's test client (`app.request()` or `testClient()`):

```
Offers:
✓ GET /api/offers returns list of open offers
✓ GET /api/offers/:id returns offer details
✓ GET /api/offers/:id returns 404 for non-existent offer

Orders (authenticated):
✓ POST /api/orders creates order and returns 201
✓ POST /api/orders decrements available shares on the offer
✓ POST /api/orders rejects if offer is closed
✓ POST /api/orders rejects if requesting more shares than available
✓ POST /api/orders returns 401 if not authenticated
✓ GET /api/orders returns only the authenticated user's orders
✓ GET /api/orders/:id returns 404 for another user's order
✓ PATCH /api/orders/:id/stage advances stage correctly
✓ PATCH /api/orders/:id/stage creates stage history entry
✓ PATCH /api/orders/:id/stage rejects invalid transition
✓ PATCH /api/orders/:id/stage rejects transition on terminal order

Dashboard:
✓ GET /api/dashboard returns correct aggregate stats
✓ GET /api/dashboard returns 401 if not authenticated
```

#### D. Database Tests (`packages/db/`)

```
✓ Seed script runs without errors
✓ Orders cascade correctly with foreign keys
✓ Stage history entries are created with correct timestamps
```

#### E. Integration Test (Stretch Goal)

One happy-path integration test:

```
✓ Full flow: create user → browse offers → place order → advance through all stages → verify settled
```

### 10.3 Test Utilities

Create a `packages/api/src/test-utils.ts` with:

- `createTestDb()`: Returns an in-memory SQLite DB with schema applied
- `createTestApp(db)`: Returns a Hono app instance with the test DB injected
- `seedTestData(db)`: Seeds minimal test data (1 user, 2 offers)
- `authenticateTestUser(app, userId)`: Returns headers/cookies to simulate auth

---

## 11. PHASE 7 — LOGGING & OBSERVABILITY

### 11.1 Logger Package

`packages/logger/src/index.ts`:

```typescript
import pino from 'pino';

export function createLogger(name: string) {
  return pino({
    name,
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  });
}

export const logger = createLogger('trading-dashboard');
```

### 11.2 What to Log (Structured Events)

Every log entry must be JSON with at minimum: `timestamp`, `level`, `msg`, `requestId` (when in request context).

#### Request Lifecycle

```json
{ "level": "info", "msg": "request_started", "requestId": "abc-123", "method": "POST", "path": "/api/orders" }
{ "level": "info", "msg": "request_completed", "requestId": "abc-123", "status": 201, "durationMs": 45 }
```

#### Business Events

```json
{ "level": "info", "msg": "order_created", "requestId": "abc-123", "orderId": "ord-1", "userId": "usr-1", "offerId": "off-1", "shares": 100, "totalCost": 2500 }
{ "level": "info", "msg": "stage_changed", "requestId": "abc-123", "orderId": "ord-1", "fromStage": "PENDING_REVIEW", "toStage": "COMPLIANCE_CHECK" }
{ "level": "info", "msg": "user_registered", "userId": "usr-2", "email": "new@user.com" }
```

#### Database Events

```json
{ "level": "debug", "msg": "db_query", "table": "orders", "operation": "insert", "durationMs": 3 }
{ "level": "debug", "msg": "db_query", "table": "offers", "operation": "update", "durationMs": 2 }
```

#### Errors

```json
{
  "level": "error",
  "msg": "request_error",
  "requestId": "abc-123",
  "error": "Invalid stage transition from SETTLED to APPROVED",
  "code": "INVALID_TRANSITION",
  "status": 400
}
```

---

## 12. PHASE 8 — PRE-COMMIT HOOKS & AI CODE REVIEW

### 12.1 Husky + lint-staged Setup

```bash
npx husky init
```

`.husky/pre-commit`:

```bash
#!/bin/sh
npx lint-staged
npm run typecheck
npm run test -- --run --changed
```

`package.json` (root):

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### 12.2 AI Code Review Hook (Optional but Impressive)

Create a script that runs on pre-commit and sends the staged diff to an AI for review:

`scripts/ai-review.sh`:

```bash
#!/bin/bash
# Get the staged diff
DIFF=$(git diff --cached --diff-filter=ACMR)

if [ -z "$DIFF" ]; then
  echo "No staged changes to review."
  exit 0
fi

# Save diff to a temp file
echo "$DIFF" > /tmp/staged-diff.txt

# Call Claude API (or use claude CLI) to review
# Output goes to .ai-reviews/review-$(date +%Y%m%d-%H%M%S).md
REVIEW_FILE=".ai-reviews/review-$(date +%Y%m%d-%H%M%S).md"
mkdir -p .ai-reviews

# Using claude CLI:
# echo "Review this code diff for bugs, security issues, and style problems. Be concise." | claude --diff /tmp/staged-diff.txt > "$REVIEW_FILE"

# Or using the API directly with curl (requires ANTHROPIC_API_KEY env var)

# Stage the review file so it's committed alongside the code
git add "$REVIEW_FILE"

echo "AI review saved to $REVIEW_FILE"
```

Add to pre-commit hook after linting and tests. The review files accumulate in `.ai-reviews/` and are committed alongside the code — the evaluator can see every review.

---

## 13. PHASE 9 — DOCUMENTATION & AI TRANSCRIPT

### 13.1 README.md Structure

```markdown
# TradeFlow — Pre-IPO Trading Dashboard

## Overview

[2-3 sentence description]

## Architecture

[Simple diagram showing: Browser → Next.js → Hono API → Drizzle → SQLite]

## Tech Stack

[Table of technologies and why each was chosen]

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

npm install
npm run db:push
npm run db:seed
npm run dev

### Environment Variables

[Reference .env.example]

## Project Structure

[Abbreviated tree]

## API Endpoints

[Table of all routes with methods and auth requirements]

## Testing

npm run test # Run all tests
npm run test -- --ui # Run with Vitest UI

## AI Usage

This project was built with AI assistance. See:

- `PROMPTS.md` — Full AI conversation transcript
- `.ai-reviews/` — Automated AI code reviews on each commit
- Commit messages indicate AI-assisted vs manually written code

## Design Decisions

[3-5 key decisions and why, e.g.:]

- SQLite for zero-config local development
- Stage history as a separate audit table for data integrity
- TypeBox schemas shared between API and frontend for single source of truth
- Hono factory pattern for composable, typed route handlers
```

### 13.2 PROMPTS.md

Maintain this throughout the build. Format:

```markdown
# AI Conversation Transcript

## Session 1 — Project Scaffolding

**Prompt**: [What you asked the AI]
**Response summary**: [Brief summary of what it generated]
**What I did with it**: [Accepted as-is / Modified X / Rejected because Y]

## Session 2 — Database Schema

...
```

Be honest. Show where you:

- Accepted AI output directly
- Modified it (and why)
- Rejected it and wrote manually (and why)
- Iterated on a prompt to get better results

This is a **graded dimension** — the evaluator explicitly said they want to see how you work with AI.

---

## 14. COMMIT STRATEGY

Follow conventional commits. Make each commit atomic and meaningful. Suggested sequence:

```
1.  chore: init monorepo with turborepo and workspace config
2.  chore: add eslint, prettier, and base tsconfig
3.  chore: install claude code agent skills (react-best-practices, web-design-guidelines)
4.  chore: add husky pre-commit hooks with lint-staged
5.  feat(db): add drizzle schema for users, offers, orders, stage history
6.  feat(db): add drizzle relations and database client
7.  feat(db): add seed script with sample offers and test users
8.  feat(shared): add typebox schemas for offers, orders, dashboard
9.  feat(shared): add stage constants, transition map, and validation helpers
10. feat(logger): add pino-based structured logger package
11. feat(api): create hono factory with typed app environment
12. feat(api): add correlation-id, logger, and error-handler middleware
13. feat(api): add typebox validation middleware
14. feat(auth): integrate better-auth with drizzle adapter
15. feat(api): add offers routes (GET list, GET detail)
16. feat(api): add orders routes (POST create, GET list, GET detail)
17. feat(api): add order stage transition route (PATCH)
18. feat(api): add dashboard aggregation route
19. test(shared): add typebox schema and stage transition tests
20. test(api): add offers route tests
21. test(api): add orders route tests with auth and validation
22. test(api): add stage transition and dashboard tests
23. feat(web): initialize next.js app with tailwind and providers
24. feat(web): add tanstack query hooks for all api endpoints
25. feat(web): add api client with error handling
26. feat(web): add auth pages (login and register)
27. feat(web): add offers browsing page with offer cards
28. feat(web): add offer detail page with buy form
29. feat(web): add dashboard with stats and orders table
30. feat(web): add stage progress stepper component
31. feat(web): add order detail page with timeline visualization
32. feat(web): add auth guard and protected route handling
33. chore: add ai code review pre-commit hook
34. docs: add PROMPTS.md ai conversation transcript
35. docs: finalize README with architecture and setup instructions
```

**Important**: Commit messages should indicate AI involvement where relevant:

- `feat(api): add offers routes [AI-assisted, manually added error handling]`
- `feat(web): add stage progress stepper [manually written]`
- `test(api): add order stage transition tests [AI-generated, validated and extended]`

---

## 15. DATABASE SEED DATA

`packages/db/src/seed.ts` should create:

### Users (for testing)

| Name          | Email             | Password    |
| ------------- | ----------------- | ----------- |
| Alice Johnson | alice@example.com | password123 |
| Bob Smith     | bob@example.com   | password123 |

### Offers (5 companies)

| Company            | Ticker | Sector       | Price/Share | Total Shares | Available | IPO Date   | Status |
| ------------------ | ------ | ------------ | ----------- | ------------ | --------- | ---------- | ------ |
| NovaTech AI        | NTAI   | Technology   | $24.50      | 1,000,000    | 750,000   | 2026-03-15 | open   |
| GreenPulse Energy  | GPLS   | Clean Energy | $18.75      | 2,000,000    | 1,800,000 | 2026-04-01 | open   |
| MedVault Health    | MVHT   | Healthcare   | $31.00      | 500,000      | 420,000   | 2026-03-20 | open   |
| QuantumLedger      | QLDG   | Fintech      | $42.00      | 750,000      | 600,000   | 2026-05-10 | open   |
| AeroNest Logistics | ANST   | Logistics    | $15.25      | 3,000,000    | 2,500,000 | 2026-04-15 | open   |

### Sample Orders (for Alice)

Create 3-4 orders for Alice at various pipeline stages so the dashboard has data immediately:

| Offer             | Shares | Stage            | History                       |
| ----------------- | ------ | ---------------- | ----------------------------- |
| NovaTech AI       | 500    | ALLOCATED        | Full history through 4 stages |
| GreenPulse Energy | 1000   | COMPLIANCE_CHECK | 2 history entries             |
| QuantumLedger     | 200    | PENDING_REVIEW   | 1 history entry               |
| MedVault Health   | 300    | REJECTED         | Rejected at COMPLIANCE_CHECK  |

---

## 16. UI/UX SPECIFICATION

### Navigation

**Header** (always visible):

- Left: Logo/app name "TradeFlow"
- Center: Nav links — "Offers" | "Dashboard" (dashboard only shows if authenticated)
- Right: If authenticated: User name + "Sign Out" button. If not: "Sign In" button

### Page-Specific UX

#### Offers Grid

- 3-column grid on desktop, 2 on tablet, 1 on mobile
- Cards have subtle hover effect (slight lift shadow)
- Show a "CLOSING SOON" badge if IPO date is within 7 days
- Show progress bar for share availability (available/total)
- Empty state: "No offers currently available"

#### Buy Form (on offer detail)

- Input: Number field for shares with +/- stepper buttons
- Live calculation: "500 shares × $24.50 = $12,250.00"
- Validation: Min 1, max available shares. Show error inline.
- Submit button: "Place Order" with loading spinner during mutation
- Success: Toast notification + redirect to dashboard
- If already at max: Show "Fully Subscribed" disabled state

#### Dashboard

- **Stats cards** at top: Total Orders (count), Total Invested (currency), Active Orders (non-terminal count)
- **Stage filter pills**: Click to filter table by stage. "All" selected by default.
- **Orders table**: Sortable by date. Each row has a mini StageProgress indicator.
- Empty state: "No orders yet. Browse offers to get started." with link to `/offers`

#### Order Timeline

- Most recent at top
- Each entry shows: stage label, timestamp (relative + absolute on hover), note if present
- Connected by a vertical line
- Color-coded dots: green for forward progress, red for rejection

### Responsive Behavior

- Fully responsive. Table collapses to card layout on mobile.
- Navigation becomes a hamburger menu on mobile.

### Loading States

- Use skeleton loading (pulsing grey blocks) not spinners for initial page loads
- Use inline spinners only for mutations (form submits)

### Error States

- API errors show a subtle inline error banner, not alert dialogs
- 404 pages show a friendly "not found" message with link back

---

## 17. ERROR HANDLING PATTERNS

### API Layer

1. **Validation errors** (400): Return `{ error: "Validation failed: ...", code: "VALIDATION_ERROR" }`
2. **Auth errors** (401): Return `{ error: "Unauthorized", code: "UNAUTHORIZED" }`
3. **Not found** (404): Return `{ error: "Order not found", code: "NOT_FOUND" }`
4. **Business logic errors** (400): Return `{ error: "Invalid stage transition from SETTLED to APPROVED", code: "INVALID_TRANSITION" }`
5. **Server errors** (500): Return `{ error: "Internal server error", code: "INTERNAL_ERROR" }` — never expose stack traces

### Frontend Layer

1. **TanStack Query `onError`**: Show toast notification with error message
2. **Mutation errors**: Show inline error below the form
3. **Auth redirect**: If any API call returns 401, redirect to `/auth/login`
4. **Network errors**: Show "Unable to connect. Please try again." banner

---

## 18. ENVIRONMENT VARIABLES

`.env.example`:

```bash
# Database
DATABASE_URL=./local.db

# Auth
BETTER_AUTH_SECRET=your-secret-key-change-in-production
BETTER_AUTH_URL=http://localhost:3000

# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug  # debug | info | warn | error
NODE_ENV=development

# AI Code Review (optional)
ANTHROPIC_API_KEY=sk-ant-...
```

---

## FINAL CHECKLIST

Before submitting, verify:

- [ ] `npm install` → works from clean clone
- [ ] `npm run db:push` → creates schema
- [ ] `npm run db:seed` → populates test data
- [ ] `npm run dev` → app starts on localhost:3000
- [ ] Can register a new user
- [ ] Can log in
- [ ] Can browse offers
- [ ] Can place an order
- [ ] Dashboard shows orders with stage visualization
- [ ] Can view order detail with timeline
- [ ] "Simulate Next Stage" advances the stage correctly
- [ ] Invalid stage transitions are rejected with clear error
- [ ] `npm run test` → all tests pass
- [ ] `npm run lint` → no errors
- [ ] `npm run typecheck` → no errors
- [ ] Pre-commit hooks run on commit
- [ ] PROMPTS.md is populated with AI transcript
- [ ] README.md has setup instructions
- [ ] Git history is clean with conventional commits
- [ ] `.ai-reviews/` directory has review outputs (if AI review hook was set up)
