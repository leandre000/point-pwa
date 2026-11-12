# KIRAKA Architecture & Product Decisions (DECISIONS.md)

See full log at [`docs/decisions/decision-log.md`](file:///c:/Users/Onbillboards/Documents/kiraka/docs/decisions/decision-log.md).

| ID | Date | Decision | Status | Summary |
|---|---|---|---|---|
| **D-001** | 2026-11-06 | PWA first, no native mobile apps in MVP | **Confirmed** | Next.js App Router, Serwist PWA service worker |
| **D-002** | 2026-11-06 | One account holds both customer and provider roles | **Confirmed** | Eliminates dual accounts; mode toggles between Find Help and Find Work |
| **D-003** | 2026-11-06 | Core marketplace is free at launch; no paywall before value | **Confirmed** | Zero fees during pilot; 3,500 RWF upfront fee rejected |
| **D-004** | 2026-11-06 | Modular monolith with Next.js, NestJS, PostgreSQL & Prisma | **Confirmed** | pnpm monorepo with `@kiraka/contracts`, `@kiraka/ui`, `@kiraka/api`, `@kiraka/web`, `@kiraka/admin` |
| **D-005** | 2026-11-06 | No escrow or holding of customer funds in MVP | **Confirmed** | Direct payment between parties; zero float or wallet licensing risk |
| **D-006** | 2026-11-11 | **(Revised)** Passwordless OTP authentication by EMAIL or PHONE | **Confirmed** | User chooses email or phone; smart detection; multi-identifier per account; HMAC hashing |
| **D-007** | 2026-11-11 | In-app messaging first; phone calling deferred | **Confirmed** | In-app chat after Match protects privacy; telco calling links optional post-match |
| **D-008** | 2026-11-11 | Job expiry default: 72 hours; Offer expiry default: 48 hours | **Confirmed** | Keeps marketplace liquid; prevents stale jobs |
| **D-009** | 2026-11-11 | Image upload for jobs in MVP (compressed on client) | **Confirmed** | Client-side compression; Cloudflare R2 presigned direct uploads |
| **D-010** | 2026-11-11 | **(Revised/New)** Interactive maps allowed (MapLibre GL JS, list-first, privacy-safe) | **Confirmed** | Lazy-loaded on `/map` routes; PostGIS coarse circular area (300-1000m); exact address revealed only post-match |
| **D-011** | 2026-11-11 | **(Revised/New)** Gmail SMTP with app password as INTERIM email transport | **Confirmed** | Interim transport behind `EmailTransport` adapter; migrate to Resend/Postmark before public pilot |
| **D-012** | 2026-11-11 | Admin portal has ONE seeded Super admin only | **Confirmed** | Super admin `Iamshemaleandre@gmail.com`; no staff invites or role matrix for now |
| **D-013** | 2026-11-11 | File uploads use Cloudflare R2 (S3-compatible) with presigned direct-to-bucket uploads | **Confirmed** | Presigned direct PUT uploads with browser-side compression; short-lived signed GET URLs |
| **D-014** | 2026-11-11 | No demo or mock data anywhere | **Confirmed** | Only reference data (categories, areas) and the single Super admin are seeded; empty states are purposeful |
| **D-015** | 2026-11-11 | Accounts must be VERIFIED before a session exists | **Confirmed** | Registration -> PENDING_VERIFICATION -> OTP verification -> ACTIVE -> session issued; requireVerifiedSession guard |
| **D-016** | 2026-11-11 | Non-essential settings removed from initial release | **Confirmed** | Dark mode, high-contrast, storage settings deferred; clean, warm light theme only |
| **D-017** | 2026-11-12 | Authentication = EMAIL + PASSWORD, or "Continue with Google" | **Confirmed** | OTP is used ONLY for email verification during sign-up and password reset; login NEVER prompts for OTP |
| **D-018** | 2026-11-12 | Phone numbers deprecated from authentication screens | **Confirmed** | Phone is an optional, private field in Personal Details only; zero SMS anywhere |
| **D-019** | 2026-11-12 | Guest browsing permitted; gated actions preserve intent | **Confirmed** | Guests may browse home, categories, and jobs; posting, offering, messaging, and profile trigger AuthGate and restore intent post-auth |
| **D-020** | 2026-11-12 | Admin console login = Email + Password only | **Confirmed** | Single seeded Super Admin `Iamshemaleandre@gmail.com`; no OTP required at login |
| **D-021** | 2026-11-12 | Category visuals use real photography + Phosphor UI icons | **Confirmed** | Real photography cards (4:3 ratio), no AI art, no stickers/emojis, clean typography |
| **D-022** | 2026-11-12 | Zero test OTP / magic codes in source code and API responses | **Confirmed** | All devCode and OTP bypass markers purged; enforced by CI guard script `pnpm guard:forbidden` |
| **D-023** | 2026-11-12 | PointMe PWA visual design alignment & relaxed input validation | **Confirmed** | Forest green `#1F513F`, cream `#FAF9F6`, top Seeking/Offering switcher, responsive single-screen sheets, relaxed job title/description character limits (min 2 chars) |
| **D-024** | 2026-11-12 | Post-offer state transitions & feed filtering | **Confirmed** | Submitting an offer immediately updates provider role (`OFFERED_PROVIDER`), hides "Make Offer" in favor of submitted summary + Withdraw CTA, filters job out of "Open Bids" to "Offers Sent", and accepted offers immediately update status and link to direct messages |
