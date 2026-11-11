# KIRAKA Technical Architecture

## Monorepo Architecture
- **Package Manager:** pnpm workspaces (v10)
- **Monorepo Engine:** Turborepo
- **Apps:**
  - `apps/web`: Next.js 15 App Router PWA (React 19, TypeScript strict)
  - `apps/api`: NestJS REST & WebSocket API (TypeScript strict)
  - `apps/admin`: Next.js Admin & Moderation portal (Role-based access)
- **Shared Packages:**
  - `packages/contracts`: Zod schemas, TypeScript types, and domain enums shared by frontend and backend
  - `packages/ui`: Design system, CSS tokens, Radix UI primitives, Lucide icons
  - `packages/config`: Shared ESLint, Prettier, and TypeScript configurations

## Frontend (apps/web)
- **Framework:** Next.js 15 with React Server Components where appropriate to minimize client JS
- **Styling:** CSS-variable driven design tokens in `packages/ui/src/tokens/`, mapped to Tailwind CSS utilities
- **i18n:** `next-intl` supporting English (`en`), Kinyarwanda (`rw`), and French (`fr`)
- **PWA / Offline:** Serwist service worker, installable web manifest, cache versioning, offline shell
- **Accessibility:** WCAG 2.2 AA compliant, 48px min touch targets, tabular numerals for currency

## Backend (apps/api)
- **Framework:** NestJS 10 (modular monolith)
- **ORM / Database:** Prisma 6 with PostgreSQL 16
- **Cache & Queues:** Redis 7 with BullMQ (for OTP, reminders, and background expiry)
- **Validation:** Zod pipes using `@kiraka/contracts`
- **Security:** Helmet, CORS with strict origin, HTTP-only cookie sessions, audit logging

## Quality Gates Enforced in CI
1. **Automated Contrast Check:** `scripts/contrast-check.ts` validates WCAG AA (>= 4.5:1, >= 3:1 for large text) for all theme token pairs.
2. **i18n Completeness:** `scripts/check-i18n.ts` guarantees zero missing keys across `en`, `rw`, and `fr`.
3. **Typecheck & Lint:** `tsc --noEmit` and ESLint flat config with strict rules.
4. **Unit & E2E Testing:** Vitest for domain logic and components, Playwright for user journeys.
