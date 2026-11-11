# KIRAKA Software Requirements Specification (SRS)

*Version 0.1 (draft for owner approval) · November 2026 · Standard followed: structure aligned with ISO/IEC/IEEE 29148*

## 1. Introduction

### 1.1 Purpose

This SRS defines what KIRAKA must do, the rules it must never break, and how we will know it works. It is the contract between product, design, engineering, QA and operations. Per the project source-of-truth order, confirmed owner decisions override this document, and this document overrides the PointMe reference screens.

### 1.2 Scope

KIRAKA is a Rwanda-first, two-sided marketplace that manages the journey from a service need to an agreed and completed service: discovery, request, offers, negotiation, agreement, communication, completion and reputation. The MVP is a mobile-first Progressive Web App (PWA) launched in selected Kigali neighborhoods. The architecture must allow later expansion to the rest of Rwanda, other countries and, eventually, AI-assisted features, without a rewrite.

### 1.3 Labels used in this document

- **\[C\] Confirmed:** decided by the project owner.
- **\[P\] Proposed:** my recommendation, pending approval.
- **\[H\] Hypothesis:** untested; must be validated.
- **\[F\] Future:** explicitly out of MVP.

Priority tags: **M** = must (MVP), **S** = should (MVP if capacity allows), **C** = could (post-MVP).

### 1.4 Definitions

- **Customer / Provider:** roles of one shared account, not separate accounts \[C\].
- **Job:** a customer's service request. **Offer:** a provider's priced proposal for a job. **Match:** the single accepted offer for a job.
- **Coarse location:** neighborhood-level area, not an address.
- **Minor units:** integer amounts (for RWF, whole francs) used for all money.

### 1.5 References

KIRAKA Master Project Context; PointMe reference screens (40 PNGs, historical only); Rwanda Law No. 058/2021 on Personal Data Protection and Privacy (legal advice required); official PWA and browser documentation.

## 2. Product overview

### 2.1 Product perspective

A modular monolith: Next.js PWA front end, NestJS REST API, PostgreSQL via Prisma, WebSockets for live events, and a separate internal admin web interface \[C\].

### 2.2 User classes

| Class | Description | Key needs |
| --- | --- | --- |
| Customer | Person or household needing a service | Find, compare, agree, track, review |
| Provider | Independent tradesperson, freelancer or small business | Be discovered, get relevant jobs, win work, build reputation |
| Admin / Moderator | Internal staff | Handle reports, disputes, categories, suspensions, audit |
| Support agent | Internal staff | Resolve user issues, run disputes process |
| System | Scheduled jobs, notification services | Expiry, reminders, cleanups |

### 2.3 Operating environment

Modern mobile browsers (Chrome Android, Safari iOS, Samsung Internet), desktop and tablet browsers. Entry-level Android devices and unreliable 3G/4G are the design baseline \[P\].

### 2.4 Design and implementation constraints

- TypeScript end to end with strict settings \[C\]. PWA first; no native apps in MVP \[C\].
- No escrow, no holding of funds, no payment guarantees, no lending, no insurance in MVP \[C\].
- Business permissions enforced on the server only; the client is never trusted \[C\].
- Money stored as integer minor units, never floating point \[C\].

### 2.5 Assumptions and dependencies

- &#91;H\] Customers and providers will adopt a structured digital workflow instead of WhatsApp-only negotiation.
- &#91;H\] Initial categories (cleaning, plumbing, electrical, carpentry and furniture repair, general maintenance) have enough demand in chosen neighborhoods.
- Dependency: an SMS gateway with reliable Rwandan delivery; managed hosting; legal review of data protection obligations.

## 3. Decisions register (starter)

| ID | Decision | Status |
| --- | --- | --- |
| D-001 | PWA first, no native apps in MVP | Confirmed |
| D-002 | One account for both customer and provider roles | Confirmed |
| D-003 | Core marketplace free at launch; no paywall before value | Confirmed |
| D-004 | Modular monolith, TypeScript, PostgreSQL | Confirmed |
| D-005 | No funds handling in MVP | Confirmed |
| D-006 | Phone OTP is the MVP authentication method | Confirmed |
| D-007 | Messaging first; call and masked-number features | Open |
| D-008 | Offer expiry default duration | Open |
| D-009 | Image upload in MVP (jobs and portfolios) | Open: recommended Yes |

Note on PointMe: its 3,500 RWF/month paywall after two jobs conflicts with D-003 and is **not** carried into KIRAKA.

## 4. Functional requirements

### 4.1 Authentication and account (AUTH)

- **FR-AUTH-01 (M):** Register and sign in with a phone number plus one-time code; no password.
- **FR-AUTH-02 (M):** OTP expires (default 5 minutes), is single-use, and is rate-limited per phone number, device and IP.
- **FR-AUTH-03 (M):** Resend requires a visible cooldown; repeated failures lock further attempts for a defined period.
- **FR-AUTH-04 (M):** Sessions are server-managed, revocable, and listed so users can sign out other devices.
- **FR-AUTH-05 (M):** One account may hold both customer and provider profiles.
- **FR-AUTH-06 (S):** Changing phone number requires OTP to the new number and resets the phone-verified status until confirmed.
- **FR-AUTH-07 (S):** Account deletion request with a documented retention policy.

### 4.2 Profiles (PROF)

- **FR-PROF-01 (M):** Customer profile: name, neighborhood, preferred language, notification preferences.
- **FR-PROF-02 (M):** Provider profile: display name, description, categories, skills, coverage areas, availability notes, visibility toggle.
- **FR-PROF-03 (S):** Portfolio images with moderation and size and type validation.
- **FR-PROF-04 (M):** Public provider view shows only: name, area, categories, rating summary, completed-job count, verification badges that have a real process. No phone number, no exact address.
- **FR-PROF-05 (M):** Providers can hide their profile without deleting history.

### 4.3 Categories and service areas (CAT)

- **FR-CAT-01 (M):** Admins manage categories and areas; both are data, not code.
- **FR-CAT-02 (M):** Each area has a country, city and parent hierarchy, to support expansion.
- **FR-CAT-03 (M):** Launch with a small validated category set; adding categories requires no deployment.
- **FR-CAT-04 (S):** Per-area activation flags so we can open neighborhoods one at a time.

### 4.4 Discovery (DISC)

- **FR-DISC-01 (M):** Browse providers by category and area; search by keyword.
- **FR-DISC-02 (M):** Filters: category, area, rating, verification level, availability.
- **FR-DISC-03 (M):** Default ranking is relevance and quality (area match, category match, responsiveness, completed work). Paid placement may not override relevance and must be labeled \[C\].
- **FR-DISC-04 (M):** Provider job feed is filtered by the provider's categories and areas.
- **FR-DISC-05 (S):** Manual area selection whenever location permission is denied or unavailable.
- **FR-DISC-06 (M):** Empty, loading, error and offline states for every discovery view.

### 4.5 Jobs (JOB)

- **FR-JOB-01 (M):** Create a job: category, title, description, area, timing preference, optional or negotiable budget, optional images.
- **FR-JOB-02 (M):** Save drafts; publishing validates all required fields on the server.
- **FR-JOB-03 (M):** Public job view shows coarse area only. Exact address is shared with the matched provider only after a match, by explicit customer action \[P\].
- **FR-JOB-04 (M):** Customers can edit an open job; material edits notify providers with pending offers and may reset them.
- **FR-JOB-05 (M):** Customers can cancel an open job; pending offers are closed with notification.
- **FR-JOB-06 (M):** Jobs expire automatically after a configurable period \[P: 72 hours default, open decision D-008\].
- **FR-JOB-07 (S):** Rate limit job creation to prevent spam.

### 4.5b Offers and negotiation (OFR)

- **FR-OFR-01 (M):** A provider submits one offer per job: price (minor units), optional message, availability.
- **FR-OFR-02 (M):** Customer can counter; provider can counter back. Every step creates an immutable offer version.
- **FR-OFR-03 (M):** A negotiation has a maximum number of rounds \[P: 5\] to avoid endless loops.
- **FR-OFR-04 (M):** Offers show a neutral, explicit sort order. No visual nudging toward higher prices \[P\].
- **FR-OFR-05 (M):** Accept requires a confirmation dialog showing the final price and terms.
- **FR-OFR-06 (M):** Accepting creates a Match and snapshots agreed price and terms; later edits never alter the snapshot.
- **FR-OFR-07 (M):** Providers can withdraw an offer before acceptance. Offers expire per D-008.
- **FR-OFR-08 (M):** Concurrent accept requests produce exactly one Match (see BR-05).

### 4.6 Matching and job progress (MATCH)

- **FR-MATCH-01 (M):** Exactly one active Match per job.
- **FR-MATCH-02 (M):** On Match, all other open offers become closed and their providers are notified.
- **FR-MATCH-03 (M):** Either party can cancel a Match with a reason; cancellation reopens or closes the job per rule and is logged.
- **FR-MATCH-04 (M):** Provider marks IN\_PROGRESS when work starts.

### 4.7 Messaging (MSG)

- **FR-MSG-01 (M):** A conversation is created only for matched parties (and, optionally, pre-match offer Q&A scoped to a job \[P\]).
- **FR-MSG-02 (M):** Real-time delivery over WebSockets, with fallback to polling.
- **FR-MSG-03 (M):** Messages require server acknowledgement; failed sends show an error and a retry option, never false success.
- **FR-MSG-04 (M):** Blocking a user ends the ability to message.
- **FR-MSG-05 (M):** Text messages are stored for dispute review under a documented retention policy.
- **FR-MSG-06 (S):** Image attachments with validation.
- **FR-MSG-07 (C):** Masked calling or click-to-call, pending decision D-007.

### 4.8 Completion, disputes and reviews (COMP, DSP, REV)

- **FR-COMP-01 (M):** Provider reports completion; customer confirms. Reported is not confirmed (BR-06).
- **FR-COMP-02 (M):** If the customer does not respond within a defined window, the system reminds both sides, then routes to support. It does not auto-complete silently \[P\].
- **FR-COMP-03 (M):** Customer can raise an issue instead of confirming.
- **FR-DSP-01 (M):** A dispute freezes the job status, collects each side's statement and evidence, and routes to an admin queue.
- **FR-DSP-02 (M):** Resolutions follow a documented policy; outcomes and reasons are logged.
- **FR-REV-01 (M):** Reviews are only possible after confirmed completion, one per party per Match.
- **FR-REV-02 (M):** Ratings and text are moderated; users can report reviews.
- **FR-REV-03 (S):** Providers can publicly respond once to a review.

### 4.9 Notifications (NOT)

- **FR-NOT-01 (M):** In-app notification center for offers, counters, matches, messages, completion, disputes, reports.
- **FR-NOT-02 (S):** Web push where supported, with clear opt-in; SMS fallback for critical events (match, completion confirmation) \[P\].
- **FR-NOT-03 (M):** Per-type preferences, and never rely on push alone for critical actions.

### 4.10 Reporting, blocking and safety (REP)

- **FR-REP-01 (M):** Report a user, job, message or review with a reason and optional evidence.
- **FR-REP-02 (M):** Block and unblock users; blocked users cannot view, offer, message or review each other's content.
- **FR-REP-03 (M):** Every report creates an auditable ticket in the admin queue with a target response time \[P: 24 hours at pilot\].
- **FR-REP-04 (S):** Emergency guidance with tap-to-call local emergency contacts and a way to share job details with a trusted contact \[P\].

### 4.11 Administration (ADM)

- **FR-ADM-01 (M):** Role-based access (admin, moderator, support) with least privilege.
- **FR-ADM-02 (M):** Manage users, provider profiles, categories, areas, reports, disputes and reviews.
- **FR-ADM-03 (M):** Suspend or restrict accounts with a reason, duration and appeal path.
- **FR-ADM-04 (M):** Searchable audit log for every privileged action and every state change.
- **FR-ADM-05 (S):** Operational dashboard: open reports, dispute ageing, jobs with no offers, provider response times.
- **FR-ADM-06 (M):** Admin interface requires stronger authentication than customer sign-in \[P\].

## 5. Business rules (must never be violated)

| ID | Rule |
| --- | --- |
| BR-01 | A job has at most one active accepted Match. |
| BR-02 | Many providers may offer before acceptance. |
| BR-03 | Offer and counteroffer history is immutable. |
| BR-04 | An accepted offer preserves agreed price and terms as a snapshot. |
| BR-05 | Concurrent accept requests never create duplicate Matches (enforced by transaction and database constraint). |
| BR-06 | Completion reported ≠ completion confirmed. |
| BR-07 | Normal completion requires customer confirmation. |
| BR-08 | Disputes follow the documented support process. |
| BR-09 | Reviews require an eligible confirmed completion. |
| BR-10 | All significant status changes are validated by the backend. |
| BR-11 | All significant status changes are auditable. |
| BR-12 | Phone verification is never presented as identity verification. |
| BR-13 | Exact addresses and phone numbers are never public. |
| BR-14 | No silent queuing of critical actions while offline. |

## 6. State models

### 6.1 Job

DRAFT → OPEN → MATCHED → IN\_PROGRESS → COMPLETION\_REPORTED → COMPLETED. Side states: CANCELLED, EXPIRED, CLOSED, DISPUTED.

| From | To | Trigger | Actor | Guard |
| --- | --- | --- | --- | --- |
| DRAFT | OPEN | Publish | Customer | Valid, rate-limit passed |
| OPEN | MATCHED | Accept offer | Customer | No existing active Match |
| OPEN | CANCELLED / EXPIRED | Cancel / timeout | Customer / System | None |
| MATCHED | IN\_PROGRESS | Start work | Provider | Match active |
| IN\_PROGRESS | COMPLETION\_REPORTED | Report done | Provider | None |
| COMPLETION\_REPORTED | COMPLETED | Confirm | Customer | None |
| COMPLETION\_REPORTED / IN\_PROGRESS | DISPUTED | Raise issue | Either | Evidence recorded |
| DISPUTED | COMPLETED / CLOSED | Resolution | Admin | Policy outcome logged |

### 6.2 Offer

SUBMITTED → COUNTERED → ACCEPTED. Side states: REJECTED, WITHDRAWN, EXPIRED. Only one version is "current"; accepting is valid only on the current version by the party who did not author it.

### 6.3 Match

ACTIVE → COMPLETED, CANCELLED, DISPUTED. A Match record carries agreed price, terms, timestamps and parties.

## 7. Data requirements

### 7.1 Core entities

User, UserSession, CustomerProfile, ProviderProfile, ServiceCategory, ProviderCategory, ServiceArea, ProviderServiceArea, Job, JobAttachment, Offer, OfferVersion, Match, Conversation, Message, Notification, CompletionReport, Dispute, Review, UserReport, Block, VerificationRecord, AuditLog.

### 7.2 Key relationships and constraints

- User 1–N sessions; User 0..1 customer profile and 0..1 provider profile.
- Job N–1 customer, N–1 category, N–1 area. Job 1–N offers.
- Offer 1–N OfferVersion. **Unique** (jobId, providerId) for active offers.
- Match 1–1 job (**partial unique index** on jobId where status is ACTIVE or later in the chain). Match stores price and terms snapshot.
- Conversation tied to a Match. Review unique per (matchId, authorId).
- Money: integer minor units plus ISO 4217 currency code on every monetary column.
- Every table has createdAt/updatedAt; soft delete where history matters.
- Add `countryCode` to areas, users and jobs from day one \[P\] so expansion needs configuration, not migration.

## 8. Interface requirements

### 8.1 API (versioned, REST, JSON)

`/api/v1/auth/otp/request`, `/auth/otp/verify`, `/me`, `/providers`, `/categories`, `/areas`, `/jobs`, `/jobs/:id/offers`, `/offers/:id/counter`, `/offers/:id/accept`, `/conversations`, `/conversations/:id/messages`, `/matches/:id/completion`, `/matches/:id/confirm-completion`, `/matches/:id/disputes`, `/matches/:id/reviews`, `/reports`, `/admin/reports`.

Requirements: idempotency keys on accept, create-job and send-message; consistent error format; pagination; schema validation (Zod) shared via a contracts package; rate limits on all write endpoints.

### 8.2 Permission matrix (summary)

| Action | Anonymous | Customer | Provider | Admin |
| --- | --- | --- | --- | --- |
| Browse providers and categories | Yes | Yes | Yes | Yes |
| Create job | No | Yes | Yes (as customer) | No |
| View job feed | No | Own jobs | Relevant open jobs | All |
| Submit offer | No | No | Yes (not on own job) | No |
| Accept offer | No | Own job only | No | No |
| Report completion | No | No | Own Match | No |
| Confirm completion / review | No | Own Match | Own Match | No |
| Resolve dispute | No | No | No | Yes |

A user may never offer on their own job (BR check on the server).

## 9. Non-functional requirements

| ID | Requirement | Target (to be validated on target devices) |
| --- | --- | --- |
| NFR-PERF-01 | Largest content paint on mid-range Android over 4G | ≤ 2.5 s \[H\] |
| NFR-PERF-02 | API p95 latency for read endpoints | ≤ 400 ms \[H\] |
| NFR-PERF-03 | Initial JS budget per route | Defined and enforced in CI |
| NFR-AVAIL-01 | Monthly availability of core API | ≥ 99.5% at pilot, higher later \[P\] |
| NFR-REL-01 | Zero duplicate Matches under concurrent load | Verified by tests |
| NFR-SEC-01 | OWASP ASVS Level 2 as the baseline | Verified before pilot |
| NFR-SEC-02 | Backups with tested restore; defined RPO/RTO | RPO ≤ 24 h, RTO ≤ 4 h at pilot \[P\] |
| NFR-A11Y-01 | WCAG 2.2 AA, touch targets ≥ 44 px, text ≥ 12 px, no color-only status | Audited |
| NFR-I18N-01 | All strings externalized; locale, currency, date and phone formats by country | Required from day one |
| NFR-OBS-01 | Structured logs, error monitoring, metrics, alerting | Required before pilot |
| NFR-SCALE-01 | Stateless API, horizontal scaling, read replicas and caching ready | Design now, apply when needed |

## 10. Security and privacy requirements

- Secure, HTTP-only, same-site cookies; CSRF protection where relevant; strict CORS; Content Security Policy.
- Role-based authorization on every endpoint; IDOR tests for every resource type.
- Server-side validation of all inputs; parameterized queries via ORM; output encoding.
- Uploads: type and size limits, malware scanning where feasible, randomized names, private storage with signed URLs.
- OTP abuse controls (SMS pumping protection, per-destination limits).
- Secrets in a managed secret store; none in source control.
- Data minimization: coarse location by default; precise location only with explicit consent and purpose.
- Privacy by design: purpose statement per data field, retention schedule, export and deletion processes aligned with Rwandan law after legal review.
- Personal data in logs is masked.

## 11. PWA and offline requirements

- Web manifest, installable metadata, service worker, versioned caches, update prompt.
- Cache static assets and safe public content only; label stale data with its age.
- Offline shell with clear banner; drafts (job drafts, message text) saved locally.
- **Critical actions (offer submission, accept, message send, completion confirmation) require server confirmation and are disabled offline** (BR-14).
- Browser capability detection: do not assume background sync or push everywhere.

## 12. Trust, safety and moderation requirements

- Verification ladder: Phone verified → Identity checked → Business checked → Qualification verified. A badge appears only when a documented process and evidence record exist.
- Reviews linked to confirmed completions only; review moderation queue; fraud signals (reciprocal rings, rapid review patterns) flagged for admins.
- Provider quality program: response-time tracking, cancellation tracking, warnings, suspension.
- Disputes: documented SLA, evidence collection, outcome categories, appeal.
- Law-enforcement and legal-request handling procedure defined with counsel.

## 13. Analytics requirements

Event tracking for: sign-up, activation, job published, first offer, offers per job, match, completion, confirmation, review, report, dispute, retention cohorts, CAC by channel. Core health metrics: job response rate, time to first offer, match rate, completion rate, repeat usage, provider retention. Events are privacy-reviewed, and analytics never receive message content.

## 14. Scale-readiness requirements (country, continent, world)

To make later expansion a configuration exercise instead of a rebuild, the MVP architecture must:

1. Store `countryCode`, `locale`, `timezone` and `currency` on relevant entities.
2. Use a **country configuration layer**: categories, areas, legal texts, verification methods, payment methods, support hours.
3. Isolate integrations behind adapters (SMS, payments, identity checks, maps) so new countries swap providers without touching domain logic.
4. Support multiple languages and right-to-left readiness in the design system.
5. Plan data-residency options per country; keep personal data separable by region.
6. Keep the modular monolith clean so modules can be extracted later only if measured load or team size justifies it.
7. Expansion proceeds only when a **market gate** is met (liquidity, completion rate, support capacity, legal clearance). See the business plan.

## 15. AI roadmap requirements \[F\]

AI is excluded from the MVP. When introduced, it must follow these principles:

- **Assistive first, autonomous never by default:** suggestions that a human can accept or ignore.
- Candidate features, in order of risk: job-description helper and category suggestion; provider-job relevance ranking; translation of messages; price-range guidance from historical completed jobs; fraud and spam detection; support triage. Autonomous negotiation or agent-to-agent bargaining is a late, optional experiment, only with explicit user consent and spending limits.
- Prerequisites: sufficient clean data from completed jobs, consent and privacy review, bias testing (language, gender, neighborhood), explainability for ranking, human override, evaluation metrics and monitoring.
- Data design now: keep structured, labeled history (categories, offers, outcomes) and event logs so a future AI layer has quality data.

## 16. Acceptance and verification

### 16.1 Example acceptance criteria

- **AC-OFR-08:** Given two customers' devices accepting different offers on the same job at the same instant, exactly one Match exists, the other request receives a clear conflict response, and the audit log records both attempts.
- **AC-COMP-01:** Given a provider reports completion, the job shows "waiting for customer"; no review can be submitted until the customer confirms.
- **AC-PWA-04:** Given the device is offline, tapping Accept shows an explanation and does not queue the action.
- **AC-PRIV-02:** Given any public API response, no phone number or exact address is present.

### 16.2 Test strategy

Unit tests (Vitest) for domain rules; API integration tests against a real PostgreSQL; concurrency tests for BR-05; end-to-end tests (Playwright) for the full customer and provider journeys and offline behavior; security tests (authorization, IDOR, rate limits); accessibility audits; performance tests on throttled mobile profiles.

### 16.3 Traceability

Every requirement ID maps to: screen(s), endpoint(s), entity/entities, test(s) and acceptance criteria. Maintain this as a living table, for example:

| Requirement | Screen | Endpoint | Entity | Test |
| --- | --- | --- | --- | --- |
| FR-OFR-06 | Offer detail, Match confirmation | POST /offers/:id/accept | Offer, Match | AC-OFR-08 |
| FR-COMP-01 | Active job | POST /matches/:id/completion | CompletionReport | AC-COMP-01 |

## 17. Risks and open questions

| # | Risk or question | Mitigation or next step |
| --- | --- | --- |
| 1 | Off-platform leakage after matching | Value beyond the match: reputation, repeat booking, dispute support, provider tools |
| 2 | Thin supply or demand in a neighborhood | Launch small, recruit supply first, gate expansion |
| 3 | Fake or low-quality providers | Verification ladder, reviews tied to completions, moderation |
| 4 | OTP and SMS cost or abuse | Rate limits, provider monitoring, fallback channels |
| 5 | Safety incidents | Approximate location pre-match, safety tools, rapid response process |
| 6 | Dispute volume with no payment control | Clear policy, evidence capture, escalation path |
| 7 | Legal and tax obligations | Rwanda-specific counsel before pilot |
| 8 | Decisions D-007, D-008, D-009 | Resolve in the next product review |

## 18. Appendices

### A. Decision log template

Decision ID · Date · Decision · Reason · Alternatives considered · Consequences · Status.

### B. Out of scope for MVP (reconfirmed)

Native apps, escrow, funds holding, lending, payment guarantees, insurance, AI matching and negotiation agents, enterprise procurement, multi-country operations, advanced subscriptions, loyalty programs, paid ranking that overrides relevance.

### C. Next SRS revisions

v0.2: resolve open decisions and attach screen references. v0.3: add detailed acceptance criteria per requirement. v1.0: approved baseline before build freeze.
