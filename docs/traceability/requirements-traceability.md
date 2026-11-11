# KIRAKA Requirements Traceability Table

*Living document mapping SRS requirements to screens, endpoints, database entities, tests, and acceptance criteria.*

| Req ID | Requirement Summary | Screens | API Endpoints | Database Entities | Tests / AC |
|---|---|---|---|---|---|
| **FR-AUTH-01** | Phone OTP registration & sign in | `/auth/phone`, `/auth/otp` | `POST /auth/otp/request`<br>`POST /auth/otp/verify` | `User`, `UserSession` | AC-AUTH-01, unit tests |
| **FR-AUTH-02** | OTP expiry (5 min), rate limits | `/auth/otp` | `POST /auth/otp/request` | Redis OTP keys | Rate-limit test |
| **FR-AUTH-05** | Shared customer/provider account | `/me`, `/` (mode toggle) | `GET /me`, `PATCH /me` | `User`, `CustomerProfile`, `ProviderProfile` | Profile unit tests |
| **FR-PROF-04** | Coarse location; no public phone or exact address | `/providers/:id`, `/jobs/:id` | `GET /providers/:id`<br>`GET /jobs/:id` | `CustomerProfile`, `ServiceArea` | AC-PRIV-02 privacy leak test |
| **FR-CAT-01** | Dynamic service categories and areas | `/`, `/post` (step 1) | `GET /categories`<br>`GET /areas` | `ServiceCategory`, `ServiceArea` | Category CRUD tests |
| **FR-JOB-01** | Create service request (job) | `/post` (4-step stepper) | `POST /jobs` | `Job` | CreateJob schema test |
| **FR-JOB-03** | Public job shows coarse area only | `/jobs/:id` | `GET /jobs/:id` | `Job`, `ServiceArea` | Privacy audit test |
| **FR-OFR-01** | Submit priced offer (minor units) | `/jobs/:id/offer` | `POST /jobs/:id/offers` | `Offer` | MoneySchema integer test |
| **FR-OFR-02** | Counteroffers with immutable history | `/jobs/:id/offers/:id` | `POST /offers/:id/counter` | `Offer` (versioned) | Immutable version test |
| **FR-OFR-05** | Deliberate acceptance with confirmation | `/jobs/:id/offers/:id/accept` | `POST /offers/:id/accept` | `Match`, `Offer`, `Job` | Confirmation sheet test |
| **FR-OFR-08** | Concurrent accept creates exactly one Match | Match confirmation sheet | `POST /offers/:id/accept` | `Match` (unique jobId) | AC-OFR-08 concurrency test |
| **FR-MATCH-01** | Exactly one active Match per job | Job progress view | `GET /matches/:id` | `Match` | DB partial unique index test |
| **FR-MSG-01** | In-app messaging for matched parties | `/messages/:id` | `GET /conversations/:id`<br>`WS /chat` | `Match` | Auth & membership guard |
| **FR-COMP-01** | Provider reports done; Customer confirms | Job timeline card | `POST /matches/:id/completion`<br>`POST /matches/:id/confirm-completion` | `Match` | AC-COMP-01 state guard |
| **FR-REV-01** | Reviews only after confirmed completion | Review sheet | `POST /matches/:id/reviews` | `Match` | BR-09 rule guard test |
| **BR-14** | Critical actions disabled when offline | Offline banner / buttons | All mutation endpoints | — | AC-PWA-04 offline test |
