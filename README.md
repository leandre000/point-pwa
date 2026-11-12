# KIRAKA

> **Find help. Discover opportunity.**  
> A Rwanda-first, two-sided marketplace for local services, built as a mobile-first Progressive Web App.

---

## Architecture Overview

KIRAKA is built as a **modular monolith** in a pnpm monorepo orchestrated with Turborepo:

- `apps/web`: Next.js 15 PWA with App Router, Tailwind CSS, Radix UI, Serwist service worker, and `next-intl` (English, Kinyarwanda, French).
- `apps/api`: NestJS 10 REST & WebSocket API, PostgreSQL 16 via Prisma ORM, Redis + BullMQ.
- `apps/admin`: Internal moderation and operations dashboard.
- `packages/contracts`: Shared Zod validation schemas, TypeScript domain types, and marketplace enums.
- `packages/ui`: Design system, CSS variables design tokens, accessible components, and icon primitives.
- `packages/config`: Shared TypeScript, ESLint, and Prettier configurations.
- `docs/`: Living architectural decision log, requirements traceability matrix, and project context.

---

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 10.0.0
- Docker & Docker Compose (for PostgreSQL and Redis)

### Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start local database & Redis:**
   ```bash
   docker compose -f infrastructure/docker/docker-compose.yml up -d
   ```

3. **Run database migrations:**
   ```bash
   pnpm --filter @kiraka/api prisma:generate
   ```

4. **Start all development servers:**
   ```bash
   pnpm dev
   ```
   - Web App (PWA): [http://localhost:3000](http://localhost:3000)
   - API: [http://localhost:3001/api/v1](http://localhost:3001/api/v1)
   - Health check: [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health)

---

## Quality & CI Gates

```bash
# Run automated WCAG AA color contrast check (enforces 4.5:1 min ratio)
npx tsx scripts/contrast-check.ts

# Run i18n completeness checker (ensures no missing keys in en, rw, fr)
npx tsx scripts/check-i18n.ts

# Run unit tests
pnpm test

# Run type check
pnpm typecheck

# Run linter
pnpm lint
```

---


