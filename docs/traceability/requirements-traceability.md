# KIRAKA Requirements Traceability Table

*Living document mapping SRS requirements to screens, endpoints, database entities, tests, and acceptance criteria.*

| Req ID | Requirement Summary | Screens | API Endpoints | Database Entities | Tests / AC |
|---|---|---|---|---|---|
| **FR-AUTH-01** | Phone OTP registration & sign in | `/auth` | `POST /auth/otp/request`<br>`POST /auth/otp/verify` | `User`, `UserSession` | `otp.service.spec.ts` |
| **FR-AUTH-02** | OTP expiry (5 min), rate limits | `/auth` | `POST /auth/otp/request` | In-memory / Redis token bucket | `otp.service.spec.ts` |
| **FR-AUTH-03** | 60-second cooldown timer | `/auth` | `POST /auth/otp/request` | RateLimitTracker | `otp.service.spec.ts` |
| **FR-AUTH-04** | Revocable sessions & device listing | `/me` | `GET /auth/sessions`<br>`POST /auth/sessions/revoke-others`<br>`POST /auth/sign-out` | `UserSession` | Auth controller tests |
| **FR-AUTH-05** | Shared customer/provider account | `/me`, `/`, `/auth` | `GET /me`, `POST /me/onboarding` | `User`, `CustomerProfile`, `ProviderProfile` | `profiles.service.spec.ts` |
| **FR-PROF-01** | Customer profile (name, neighborhood, locale) | `/me`, `/auth` | `GET /me`, `PUT /me/customer-profile` | `CustomerProfile` | Profile update tests |
| **FR-PROF-02** | Provider profile (business name, bio, isVisible) | `/me` | `GET /me`, `PUT /me/provider-profile` | `ProviderProfile` | Provider update tests |
| **FR-PROF-04** | Coarse location; no public phone or exact address | `/providers/:id`, `/jobs/:id` | `GET /providers/:id`<br>`GET /jobs/:id` | `CustomerProfile`, `ServiceArea` | `profiles.service.spec.ts` (BR-13) |
| **BR-12** | Phone verified is never presented as ID check | `/me`, `/providers/:id` | `GET /me`, `GET /providers/:id` | `VerificationRecord` | UI Badge test |
| **FR-CAT-01** | Dynamic service categories and areas | `/`, `/post`, `/providers` | `GET /categories`<br>`GET /areas` | `ServiceCategory`, `ServiceArea` | Categories & areas integration |
| **FR-CAT-02** | Country, city, district hierarchy on areas | `/providers`, `/post` | `GET /areas` | `ServiceArea` | Data hierarchy test |
| **FR-CAT-03** | Staged category rollout without redeployment | `/providers` | `GET /categories` | `ServiceCategory` | Seed / CRUD test |
| **FR-DISC-01** | Browse and search providers by keyword | `/providers` | `GET /providers` | `ProviderProfile`, `User` | Discovery service search test |
| **FR-DISC-02** | Filter providers by category and neighborhood | `/providers` | `GET /providers` | `ProviderProfile` | Filter query test |
| **FR-DISC-03** | Relevance & quality default ranking (relevance, rating, jobs) | `/providers` | `GET /providers` | `ProviderProfile` | Ranking order test |
| **FR-DISC-05** | Manual area selection fallback | `/providers`, `/post` | `GET /areas` | `ServiceArea` | Area chip selector test |
| **FR-DISC-06** | Skeletons, empty, error, and cached offline states | `/providers` | Client UI | — | UI state tests |
| **FR-JOB-01** | Create service request (job) | `/post` (4-step stepper) | `POST /jobs` | `Job`, `JobAttachment` | `jobs.service.spec.ts` |
| **FR-JOB-02** | Local draft autosave | `/post` | LocalStorage client | — | Local draft restore test |
| **FR-JOB-03** | Public job shows coarse area only | `/jobs`, `/jobs/:id` | `GET /jobs`, `GET /jobs/:id` | `Job`, `ServiceArea` | `jobs.service.spec.ts` (BR-13) |
| **FR-JOB-05** | Cancel open job by customer | `/jobs/:id` | `POST /jobs/:id/cancel` | `Job`, `AuditLog` | `jobs.service.spec.ts` |
| **FR-JOB-06** | 72-hour default job expiry | Scheduled cleanup | `POST /jobs` | `Job.expiresAt` | `jobs.service.spec.ts` |
| **FR-JOB-07** | Anti-spam job rate limiting (5/day) | `/post` | `POST /jobs` | `Job` | `jobs.service.spec.ts` |
| **D-009** | Photo attachments with pre-compression | `/post` (step 2) | `POST /jobs` | `JobAttachment` | `ImageUploader` canvas test |
| **FR-OFR-01** | Submit priced offer (minor units) | `/jobs/:id/offer` | `POST /jobs/:id/offers` | `Offer`, `OfferVersion` | `offers.service.spec.ts` |
| **FR-OFR-02** | Counteroffers with immutable history | `/jobs/:id/offers` | `POST /offers/:id/counter` | `OfferVersion` | `offers.service.spec.ts` |
| **FR-OFR-03** | Max 5 negotiation rounds | `/jobs/:id/offers` | `POST /offers/:id/counter` | `Offer.version` | Round limit test |
| **FR-OFR-04** | Neutral, quality-first sort order | `/jobs/:id/offers` | `GET /jobs/:id/offers` | `Offer` | Sorting comparator test |
| **FR-OFR-05** | Deliberate accept confirmation sheet | `/jobs/:id/offers` | `AcceptConfirmationSheet` | `Match` | Sheet UI state test |
| **FR-OFR-06** | Snapshot agreed price and terms on accept | `/jobs/:id/offers` | `POST /offers/:id/accept` | `Match` | `offers.service.spec.ts` (BR-04) |
| **FR-OFR-07** | Provider offer withdrawal | `/jobs/:id/offers` | `POST /offers/:id/withdraw` | `Offer` | Withdrawal test |
| **FR-OFR-08** | Atomic accept prevents concurrent double-matching | `/jobs/:id/offers` | `POST /offers/:id/accept` | `Match` | `offers.service.spec.ts` (BR-01, BR-05) |
| **FR-MATCH-01** | Exactly one active Match per job | `/jobs/:id` | DB partial unique index | `Match` | DB constraint verification |
| **FR-MATCH-02** | Competing offers closed on Match | `/jobs/:id/offers` | `POST /offers/:id/accept` | `Offer` | Competing offers rejection test |
| **BR-14** | Offline accept & offer disabled with explanation | Offer & Accept UI | `AcceptConfirmationSheet` | — | Offline button guard test |
| **FR-MSG-01** | In-app messaging for matched parties | `/messages/:id` | `GET /conversations/:id`<br>`WS /chat` | `Match` | Auth & membership guard |
| **FR-COMP-01** | Provider reports done; Customer confirms | Job timeline card | `POST /matches/:id/completion`<br>`POST /matches/:id/confirm-completion` | `Match` | AC-COMP-01 state guard |
| **FR-REV-01** | Reviews only after confirmed completion | Review sheet | `POST /matches/:id/reviews` | `Match` | BR-09 rule guard test |
| **BR-14** | Critical actions disabled when offline | Offline banner / buttons | All mutation endpoints | — | AC-PWA-04 offline test |

