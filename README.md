# EMBODY Pharmacy Platform

EMBODY is a full-stack US pharmacy and health-commerce platform with a customer storefront, an operations/admin application, and an Express/MongoDB API. It includes catalog management, configurable pricing, authenticated cart questionnaires, customer accounts, prescription intake and partner routing, health education, newsletters, human support, inventory, fulfillment controls, and auditable administrative workflows.

> **Regulatory notice:** this repository is software infrastructure, not a pharmacy license, legal opinion, HIPAA certification, DEA authorization, or permission to dispense. Prescription sales and controlled-substance handling fail closed by default. Production activation requires approval by the real operating pharmacy, counsel, privacy/security reviewers, payment provider, carriers, and applicable federal and state authorities.

## Contents

1. [Architecture](#architecture)
2. [Applications and technology](#applications-and-technology)
3. [Complete feature inventory](#complete-feature-inventory)
4. [End-to-end workflows](#end-to-end-workflows)
5. [Local setup](#local-setup)
6. [Environment reference](#environment-reference)
7. [Security and permissions](#security-and-permissions)
8. [Data model](#data-model)
9. [API conventions](#api-conventions)
10. [Complete backend API](#complete-backend-api)
11. [Storefront API client](#storefront-api-client)
12. [Admin API client](#admin-api-client)
13. [External services](#external-services)
14. [Testing and deployment](#testing-and-deployment)
15. [SEO and accessibility](#seo-and-accessibility)
16. [Production checklist and known limits](#production-checklist-and-known-limits)
17. [Troubleshooting](#troubleshooting)

## Architecture

```mermaid
flowchart LR
  C[Customer storefront\nReact + Vite :5173] -->|HTTPS JSON + store cookies| A[Express API :4000]
  S[Staff admin\nReact + Vite /admin :5174] -->|HTTPS JSON + admin cookies| A
  P[Approved partner portal] -->|permission checked workflow| A
  A --> M[(MongoDB / Atlas)]
  A --> B[Brevo\nOTP, invoices, campaigns]
  A --> D[Cloudinary\nmedia + encrypted raw objects]
  A --> N[NPPES\noptional NPI lookup]
  A --> X[Malware scanner\nprotected uploads]
```

Browsers never connect to MongoDB. Public product images can go directly to Cloudinary only after an authorized staff user obtains a short-lived signature. Prescription and partner files take a protected path: the API validates and scans the bytes, encrypts them with AES-256-GCM, records integrity metadata, and stores an authenticated raw object without a public URL.

## Applications and technology

| Application | Directory | Local URL | Responsibility |
|---|---|---|---|
| Storefront | `frontend/` | `http://localhost:5173` | Public pages, auth, catalog, cart, checkout, account, Health Hub, prescriptions and applications |
| API | `backend/` | `http://localhost:4000/api/v1` | Validation, authentication, business rules, database, integrations and audit |
| Admin | `admin/` | `http://localhost:5174/admin/` | Products, orders, content, customers, campaigns, support and regulated operations |
| Health checks | `backend/` | `http://localhost:4000/health`, `/ready` | Liveness and readiness |

```text
EmbodyHubC/
|- frontend/                 Customer React application
|- admin/                    Staff React application
|- backend/
|  |- src/config/            Environment and database
|  |- src/controllers/       HTTP orchestration
|  |- src/middleware/        Auth, CSRF, errors, sanitation
|  |- src/models/            Mongoose schemas/indexes
|  |- src/routes/            Routes and permissions
|  |- src/services/          Workflows and integrations
|  |- src/scripts/           Seed/provisioning scripts
|  `- test/                  Backend tests
|- docs/                     Architecture/regulatory notes
|- scripts/                  Build assembly
|- .env.example              Safe configuration template
`- package.json              Workspace commands
```

Main stack: Node.js 22.12+, npm workspaces, React 19, Vite, Express 5, MongoDB/Mongoose, Zod, Argon2id, signed JWT access tokens backed by server-side sessions, Vitest/Node Test, PDFKit, Pino, Helmet, Brevo, and Cloudinary.

## Complete feature inventory

### Public storefront and education

- Responsive Home, Online Care, category, product details, search, cart, checkout, Learn, Glossary, Compare, Health Info, About, How It Works, policies, contact, and tracking pages.
- Product mega-menu generated from admin-managed categories and published products.
- Product content supports active ingredient, description, dosage/form/pack, directions, warnings, benefits, images, FAQs, related products, publication state, and SEO fields.
- Health Info has editable categories/articles, reviewer metadata, review dates, related content, caching, and a dynamic navigation menu.
- Learn groups treatment basics, condition guides, comparisons, safety, FAQs, and plain-language terms without labeling the section as a generic blog.
- Compare supports multiple admin-authored comparisons, flexible rows, multiple compared items, and a journey CTA.
- Newsletter signup stores full name, normalized email, consent time, subscriber state, and resubscription state.
- Floating customer-to-admin chat entry is displayed throughout the storefront; messages require login.

### Authentication and account

- Registration collects identity, adult confirmation, US state, broad service goal, pharmacist-support preference, and separate Terms/Privacy acknowledgements.
- A six-digit email OTP is required **only for signup**. Normal customer sign-in and admin sign-in are password-only.
- Password recovery uses a one-time email challenge and single-use reset grant.
- Customer and privileged sessions have a fixed 24-hour absolute lifetime. Customer access tokens last 10 minutes; refresh tokens rotate without extending that absolute deadline.
- Customers can explicitly log out, edit their profile/address, manage marketing preference, change password, and revoke other sessions.
- Account navigation includes Overview, My Journey, Orders, Upload prescription, Saved & Compared, Support, Benefits, Family access, Privacy & Security, and Ask Embody.
- Browser refresh requests are coordinated across tabs; expired auth clears stale user/cart state.

### Products, variants and pricing

- Products may have one or many variants with SKU, dosage, form, pack size, price, stock, reserved units, low-stock threshold, and active state.
- Optional flexible pricing supports dosing frequency, medication choice, dose count, shipping frequency, and an exact admin-managed price matrix.
- `Taken daily` is fixed at 30 units per month; `Taken as needed` exposes only configured dose-count choices.
- Every selection must resolve to a configured server price. The API issues a short-lived authoritative quote and never trusts browser arithmetic.
- Products without a pricing configurator continue to use the selected active variant price.

### Cart questionnaires

- Anonymous Add to cart never mutates state; the user is sent to login/register and the intended route is preserved.
- Admin enables/disables questions per product. Supported types are yes/no, single choice, and multiple choice.
- Product questions allow two to eight unique options and reusable admin-managed questions.
- The API checks customer ownership, product, required current revisions, allowed answers, and response age.
- Checkout stores an immutable question/answer snapshot in the order for authorized staff.
- Logout clears the local cart so it cannot pass to another account on the same device.

### Checkout, orders, stock, shipping and invoices

- Checkout requires authentication, CSRF, `Idempotency-Key`, current products/variants/quotes, sufficient stock, and required answers.
- MongoDB transactions atomically claim the quote, update inventory, create adjustment/order/audit records, and record membership savings.
- Default shipping is free at $50 and $6 below it unless an approved production pricing control changes it.
- A paid order begins at `PAID_REVIEW_REQUIRED`; prescription/pharmacy checks must pass before fulfillment authorization.
- Inventory reasons include receipt, return, damage, expired, cycle count, and manual correction. Stock cannot fall below reserved quantity.
- Shipment transitions are validated; public tracking returns a restricted view by tracking number.
- Paid-order invoices are generated in memory with PDFKit and emailed with Brevo.

### My Health Hub

- Dashboard combines journeys, orders, support, benefits, prescriptions, saved content, preferences, and next actions.
- Authenticated journey CRUD plus a 30-day guest journey that can migrate after sign-in.
- Saved content/comparisons/products, explicit preferences, data-lifecycle explanation, and optional saved assistant history.
- Ask Embody provides navigation and verified account information; it does not diagnose or prescribe. Saving history requires opt-in and transcripts are encrypted.
- Individual Hub capabilities can be disabled and require approved active controls in production.

### Prescription intake and pharmacy routing

- Customers upload PDF, JPEG, or PNG up to 5 MB from **Account -> Upload prescription**.
- Intake validates state, type, controlled-substance declaration, consent, release gates, and eligible product context.
- Files are malware-scanned, encrypted, integrity-protected, stored without a public URL, and downloaded only after permission and audit checks.
- Workflow covers upload, storage, eligibility, pharmacy assignment, handoff, receipt, review, clarification, acceptance/rejection, order authorization, fulfillment, and closure.
- Routing requires an active pharmacy with current contract/insurance, enabled portal/capability, authorized customer state, and availability.
- Clinical decisions stay with the licensed pharmacy. Operations can route, hold, release, or retry transport, but cannot replace the pharmacist's decision.

### Pharmacy partnership

- Eight-step application with working Previous/Next buttons and a final Submit action.
- Required identifiers include 10-digit NPI, EIN (`12-3456789`), State Tax ID, 13-digit GLN, NABP identifier, DEA number (two letters + seven digits), DEA expiry, state license number, and license expiry.
- Business fields include enterprise type, wholesalers, pharmacy type/software, operating hours, locations, contacts, ownership, service states, and attestations.
- Required files: DEA license, state pharmacy license, professional license, business license, EIN document, W-9, certificate of insurance, and ownership agreement; at least two facility images; one 30-60 second MP4 walkthrough.
- Sensitive identifiers use authenticated field encryption and blind indexes. Documents follow scan/encrypt/integrity/authenticated-storage controls.
- Partner accounts cannot receive operational access until admin approval. Admin verifies licenses and ownership, completes assessment, enables explicit capabilities/states, configures SLA, and can suspend routing.
- Approved partners can acknowledge assigned prescriptions, start review, record a structured decision, and securely download assigned files.

### Professional, marketing and support

- Signed-in healthcare professionals submit NPI, state licenses, and attestations; optional NPPES lookup validates public registry data, not licensure approval.
- Newsletter groups and campaigns target all active, selected, or grouped subscribers. A leased worker snapshots recipients and sends through isolated Brevo lists.
- Brevo events update delivery/open/click/bounce/unsubscribe/complaint reporting and suppress unsubscribed/complaining recipients.
- Authenticated human chat maintains unread counts, status, and idempotent customer messages. Admin email notification excludes the private message body.
- Structured support cases add priority, SLA, optional order link, encrypted details/messages/resolution, staff assignment, and customer replies.
- Family access invites a verified adult, separates commerce permissions from health scopes, requires acceptance, expires consent, and supports immediate revocation.
- Memberships show actual savings through a ledger; admin plans cannot activate when configured unit economics are negative.

### Admin application

- Overview metrics, journey operations, control center, prescription oversight, partner routing, privacy, and redacted audit events.
- Products/categories/variants/images/pricing matrices/questionnaires, Health Info, comparisons, inventory, orders, shipping and invoices.
- Customer directory with privacy-minimized registration details; no password/session/OTP material.
- Newsletter subscribers/groups/campaigns, human chat, structured support, professional applications, and partnership review.
- Operational exceptions, secure handoff retry, routing suspension, partner SLA reporting, membership economics, and settings placeholder.

## End-to-end workflows

### Startup

1. API validates configuration and connects using `MONGODB_URI` plus explicit `MONGODB_DB_NAME`.
2. MongoDB is retried up to five times; HTTP starts only after connection.
3. Request IDs, redacted logs, Helmet, CORS, cookies, body parsing, Mongo operator rejection, rate limits, and versioned routes are mounted.
4. Storefront/admin use the Vite proxy locally or `VITE_API_BASE_URL` in deployment.

### Signup, sign-in and sign-out

1. `POST /auth/register` validates profile, age/policy acknowledgements, password, and unique normalized email.
2. A pending user/OTP challenge is created and Brevo sends the code.
3. `POST /auth/verify-otp` activates the account and creates cookies.
4. Future sign-in calls `POST /auth/login` with email/password only.
5. Protected mutations mirror the readable CSRF cookie in `X-CSRF-Token`; access/refresh cookies remain HttpOnly.
6. `/auth/refresh` rotates refresh state until the fixed 24-hour deadline.
7. `/auth/logout` revokes the session, clears cookies, and clears customer-local state.

### Product to order

1. Public endpoints return published categories/products.
2. Customer selects a variant or completes every pricing selector.
3. Configured pricing obtains a server quote.
4. If logged out, Add to cart opens authentication without changing the cart.
5. If enabled, customer answers the current questionnaire and receives a response reference.
6. Checkout submits item/configuration/quote/response references plus an idempotency key.
7. API reloads products, validates fingerprint/expiry/stock/revisions, verifies payment, and commits once in a Mongo transaction.
8. Customer sees the order in Account; staff sees immutable detail in Orders/Shipping.

### Prescription to pharmacy decision

1. Account -> Upload prescription first calls readiness and explains closed gates.
2. Intake validates state, consent, type, file and global controls.
3. Protected bytes are scanned, encrypted, integrity-protected, stored, and represented by workflow metadata.
4. Operations assigns only an eligible pharmacy; secure handoff and response SLA start.
5. Pharmacy acknowledges receipt, starts review, and records clarification/acceptance/rejection.
6. Clarification responses append to history rather than silently overwriting it.
7. Only an accepted, verified path may authorize the linked order; unsafe paths close without dispensing.

### Partner activation

1. Signed-in applicant completes all eight application steps.
2. Required files/media upload separately and pass scan/encryption/integrity controls.
3. Staff reviews credentials through purpose-limited reveal, documents, licenses, ownership, insurance, service states, risk, and readiness.
4. Staff grants only reviewed capabilities and service configuration.
5. Routing remains unavailable until status and every eligibility condition are active.

### Campaign delivery

1. Admin creates an optional group and a draft campaign.
2. Send validates and snapshots the audience.
3. Background worker leases queued jobs every 15 seconds to prevent duplicate workers.
4. Brevo receives an isolated list/campaign; signed webhooks update statistics and suppression.

## Local setup

Requirements: Node.js 22.12+, npm 10+, MongoDB 8 or Atlas, and a modern browser.

```bash
npm install
copy .env.example .env
npm run seed
npm run dev
```

Use `cp` instead of `copy` on macOS/Linux. Run one workspace with `npm run dev -w backend`, `-w frontend`, or `-w admin`.

### Atlas setup

1. Create a least-privilege Atlas database user and allow the development IP.
2. Set the SRV URI in `.env`; URL-encode special username/password characters.
3. Keep `MONGODB_DB_NAME=embody_health`. It is passed explicitly even when the URI has no database path.
4. Restart the backend after changes.

```dotenv
MONGODB_URI=mongodb+srv://USER:ENCODED_PASSWORD@cluster.example.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=embody_health
```

### Seed and administrator

Set strong `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD`, then:

```bash
npm run seed
npm run admin:provision
```

Seed creates initial catalog/questions/comparisons/Health Info and control drafts. Provision creates/repairs the super admin, writes an Argon2id hash, clears locks, and revokes old sessions/challenges. For Atlas Data Explorer only, `npm run admin:json` creates an ignored `admin-atlas.json` containing a hash, not plaintext; import it to `embody_health.users` and delete it afterward.

## Environment reference

Copy `.env.example`; never commit `.env`. Production secrets should come from a secret manager and be independently random.

| Variable(s) | Purpose and requirement |
|---|---|
| `NODE_ENV`, `PORT` | Runtime mode and API port (`4000` default) |
| `VITE_SITE_URL`, `VITE_API_BASE_URL` | Public canonical origin and browser API base |
| `MONGODB_URI`, `MONGODB_DB_NAME` | Database connection and explicit database name |
| `FRONTEND_URL`, `ADMIN_URL` | Exact allowed CORS origins |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` | Different secrets, each at least 32 random characters |
| `OTP_PEPPER` | 32+ character HMAC secret for OTP digests |
| `ENCRYPTION_KEY` | Base64-encoded 32-byte AES key; production should use managed key lifecycle |
| `EMAIL_FROM`, `EMAIL_FROM_NAME`, `SUPPORT_NOTIFICATION_EMAIL` | Verified sender and admin notification target |
| `BREVO_API_KEY`, `BREVO_OTP_TEMPLATE_ID`, `BREVO_INVOICE_TEMPLATE_ID` | Transactional email; template IDs optional |
| `BREVO_NEWSLETTER_LIST_ID`, `BREVO_WEBHOOK_SECRET` | Campaign parent list/folder and webhook authentication |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary credentials; secret never enters browser |
| `CLOUDINARY_UPLOAD_FOLDER`, `CLOUDINARY_UPLOAD_PRESET` | Restricted public product-image destination/preset |
| `PARTNER_DOCUMENT_MAX_BYTES`, `PARTNER_VIDEO_MAX_BYTES` | Defaults 5 MB and 50 MB |
| `MALWARE_SCAN_URL` | Approved protected-file scanner; required in production |
| `TURNSTILE_SECRET_KEY`, `VITE_TURNSTILE_SITE_KEY` | Partnership bot protection; required for public production intake |
| `PHARMACY_LEGAL_NAME`, `PHARMACY_US_ADDRESS`, `PHARMACY_US_PHONE`, `PHARMACIST_CONTACT_EMAIL` | Real operating-entity readiness fields |
| `PHARMACY_LICENSES_JSON`, `PHARMACY_LICENSED_STATES` | Verified licenses and allowed state codes |
| `NPPES_API_URL`, `NPPES_LOOKUP_ENABLED` | Optional NPI registry lookup |
| `PRESCRIPTION_DISPENSING_ENABLED` | Global prescription switch; defaults `false` |
| `CONTROLLED_SUBSTANCES_ENABLED` | Separate controlled-substance switch; defaults `false` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Reserved; live payment adapter is not implemented |
| `USPS_CLIENT_ID`, `USPS_CLIENT_SECRET`, `USPS_BASE_URL` | Reserved; production label/rate adapter is not implemented |
| `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` | One-time provisioning; remove after use |

## Security and permissions

### Controls

- Argon2id, 12-character password minimum, complexity checks, generic errors, timing-equalized unknown-user check, temporary lock after five failures, and auth rate limits.
- Cryptographically random OTP, HMAC digest, 10-minute expiry, five attempts, 60-second resend delay, and single use.
- Customer access JWT: 10 minutes. All user/admin absolute sessions: 24 hours. Refresh is rotating, opaque, SHA-256 hashed at rest, revocable, and cannot extend the deadline.
- Separate `store*` and `admin*` cookie families; access/refresh are `HttpOnly`, `SameSite=Strict`, and `Secure` in production.
- Double-submit CSRF, Zod validation, invalid-JSON handling, Mongo operator rejection, restricted CORS, Helmet/CSP, request IDs and redacted structured logs.
- Partner fields use AES-256-GCM plus HMAC blind indexes. Protected files are scanned, encrypted before storage, integrity checked, permission checked, and audited on access.

### Roles

| Role | Scope |
|---|---|
| `CUSTOMER` | Own storefront/account/Hub/prescription/support/family/application data |
| `SUPER_ADMIN` | Every staff permission (`*`) |
| `PHARMACY_ADMIN` | Catalog, inventory, orders, customers, campaigns, fulfillment, support and platform operations |
| `PHARMACIST` | Prescription/order review, protected documents, verification and authorization |
| `FULFILLMENT` | Fulfillable orders and shipping only |
| `SUPPORT` | Limited customer/order/support/chat/privacy/exception operations |
| `AUDITOR` | Read-only audit/report/regulatory visibility |

Every admin endpoint enforces permissions server-side. Menu visibility is not authorization.

### Release gates

Prescription intake depends on `GATE_A_BUSINESS_MODEL`, `GATE_B_JURISDICTION_ELIGIBILITY`, `GATE_C_PRESCRIPTION_TRANSMISSION`, `GATE_D_CONTROLLED_SUBSTANCES`, and `GATE_E_PRIVACY_SECURITY`, plus `PRESCRIPTION_INTAKE` and `GLOBAL_TRANSACTION_PAUSE`. Control versions follow draft, submission, approval, activation, suspension, and rollback. Missing production evidence fails closed.

## Data model

| Area | Models | Purpose |
|---|---|---|
| Identity | `User`, `Session`, `OtpChallenge` | Accounts, sessions, signup/reset challenges |
| Catalog | `Category`, `Product`, `CartQuestion`, `CartQuestionResponse` | Products, variants, pricing and answers |
| Commerce | `PriceQuote`, `Order`, `InventoryAdjustment`, `SavingsLedger` | Quotes, orders, stock and savings |
| Content | `HealthInfoCategory`, `HealthInfoArticle`, `Comparison`, `ComparisonOption` | Education and comparisons |
| Health Hub | `CustomerJourney`, `CustomerPreference`, `SavedItem`, `AssistantConversation` | Journeys, saved content, consent and optional encrypted history |
| Regulated | `PrescriptionSubmission`, `PartnerApplication`, `HealthcareProfessional` | Intake, pharmacy workflow and HCP review |
| Support | `SupportConversation`, `SupportMessage`, `SupportCase` | Chat and encrypted structured cases |
| Marketing | `NewsletterSubscriber`, `SubscriberGroup`, `NewsletterCampaign`, `EmailEvent` | Consent, audiences, sends and events |
| Membership/family | `MembershipPlan`, `CustomerMembership`, `FamilyProfile` | Benefits, savings and delegated access |
| Governance | `PlatformControl`, `PrivacyRequest`, `OperationalException`, `AuditLog` | Release gates, privacy, incidents and evidence |

TTL indexes expire eligible sessions, OTPs, guest journeys, and temporary records. Business records use explicit retention/workflow policies.

## API conventions

- Base path is `/api/v1`; health endpoints sit at `/health` and `/ready`.
- Storefront sends `X-Client: storefront`; admin sends `X-Client: admin` to select the cookie family.
- Mutations with a session send the matching decoded CSRF cookie in `X-CSRF-Token`.
- Checkout and inventory adjustment send `Idempotency-Key`.
- Protected downloads may send `X-Access-Purpose` and always re-check permission.

Success: `{ "success": true, "data": {}, "message": "Optional", "meta": {} }`

Error: `{ "success": false, "code": "VALIDATION_ERROR", "message": "...", "errors": {}, "requestId": "..." }`

Validation errors are `422`. Other common codes: `200`, `201`, `202`, `400`, `401`, `403`, `404`, `409`, `429`, and `500`.

## Complete backend API

Legend: **Public** = no session; **Customer** = authenticated customer/owner; **Staff** = privileged permission; every protected mutation marked `CSRF` also needs the matching token.

### Health and auth

| Method | Path | Access | Function |
|---|---|---|---|
| GET | `/health`, `/ready` | Public | Liveness/readiness with request ID |
| POST | `/api/v1/auth/register` | Public | Create pending customer/send signup OTP |
| POST | `/api/v1/auth/verify-otp` | Public | Activate signup or issue password reset grant |
| POST | `/api/v1/auth/resend-otp` | Public | Reissue eligible challenge |
| POST | `/api/v1/auth/login` | Public | Password-only customer login |
| POST | `/api/v1/auth/admin/login` | Public | Password-only privileged login |
| POST | `/api/v1/auth/forgot-password` | Public | Start reset without account enumeration |
| POST | `/api/v1/auth/reset-password` | Public | Change hash and revoke sessions |
| POST | `/api/v1/auth/refresh` | Cookie | Rotate refresh/access state |
| POST | `/api/v1/auth/logout` | Auth + CSRF | Revoke session/clear cookies |

### Account and Health Hub

| Method | Path | Access | Function |
|---|---|---|---|
| GET | `/account` | Customer | Profile and security summary |
| GET | `/account/orders` | Customer | Paginated owned orders |
| PATCH | `/account/profile` | Customer + CSRF | Profile/default shipping address |
| PATCH | `/account/preferences` | Customer + CSRF | Communication preference |
| POST | `/account/password` | Customer + CSRF | Change password/revoke other sessions |
| POST | `/account/sessions/revoke-others` | Customer + CSRF | Revoke other sessions |
| POST | `/health-hub/guest/journeys` | Public | Save 30-day device journey |
| GET | `/health-hub/dashboard` | Customer | Aggregated dashboard |
| GET, POST | `/health-hub/journeys` | Customer; POST CSRF | List/create journeys |
| PATCH, DELETE | `/health-hub/journeys/:id` | Customer + CSRF | Update/archive/remove eligible journey |
| POST | `/health-hub/journeys/migrate-guest` | Customer + CSRF | Move guest journeys to account |
| GET, POST | `/health-hub/saved` | Customer; POST CSRF | List/save content |
| DELETE | `/health-hub/saved/:id` | Customer + CSRF | Remove saved item |
| GET, PATCH | `/health-hub/preferences` | Customer; PATCH CSRF | Hub privacy preferences |
| GET | `/health-hub/data-lifecycle` | Customer | Retention/data behavior |
| POST | `/health-hub/assistant` | Customer + CSRF | Navigation/account assistant |
| GET, DELETE | `/health-hub/assistant/memory` | Customer; DELETE CSRF | Inspect/delete opted-in memory |

### Catalog, content, questions and commerce

| Method | Path | Access | Function |
|---|---|---|---|
| GET | `/products`, `/products/categories`, `/products/:slug` | Public | Catalog/categories/product detail |
| GET | `/products/admin/list`, `/products/admin/categories` | Staff `products:write` | Complete editor data |
| POST, PUT, DELETE | `/products/admin/categories[/:id]` | Staff `products:write` + CSRF | Category CRUD |
| POST | `/products` | Staff `products:write` + CSRF | Create product |
| PUT, DELETE | `/products/:id` | Staff `products:write` + CSRF | Update/delete product |
| GET | `/comparisons` | Public | Published comparisons |
| GET | `/comparisons/admin` | Staff compare/product permission | Editor data |
| POST, PUT, DELETE | `/comparisons/admin[/:id]` | Staff + CSRF | Comparison CRUD |
| GET | `/health-info`, `/health-info/navigation`, `/health-info/:slug` | Public | Health content/index/menu/detail |
| GET | `/questions/cart?productSlug=...` | Customer | Current product questions |
| POST | `/questions/cart/responses` | Customer + CSRF | Validate/store answers |
| GET | `/questions/admin` | Staff `questions:write` | Question editor list |
| POST, PATCH | `/questions/admin[/:id]` | Staff `questions:write` + CSRF | Create/update question |
| POST | `/pricing/quote` | Customer + CSRF | Issue 15-minute authoritative quote |
| POST | `/checkout` | Customer + CSRF + idempotency | Revalidate and atomically create order |

### Customer services

| Method | Path | Access | Function |
|---|---|---|---|
| POST | `/newsletter/subscribe` | Public, limited | Consent subscribe/resubscribe |
| GET | `/chat` | Customer | Human conversation |
| POST | `/chat/messages`, `/chat/read` | Customer + CSRF | Send message/mark read |
| GET, POST | `/support-cases` | Customer; POST CSRF | List/create support case |
| GET | `/support-cases/:id` | Owner | Case detail |
| POST | `/support-cases/:id/messages` | Owner + CSRF | Reply to case |
| GET, POST | `/professionals/me`, `/professionals/applications` | Customer; POST CSRF | View/submit HCP application |
| GET, POST | `/family` | Customer; POST CSRF | List/invite family profile |
| POST | `/family/:id/accept`, `/family/:id/revoke` | Customer + CSRF | Accept/revoke scoped access |
| GET | `/memberships/plans`, `/memberships/me` | Customer | Plans/current membership/savings |
| POST | `/memberships/enroll`, `/memberships/cancel` | Customer + CSRF | Enroll/cancel renewal |
| POST | `/support` | Public | Lightweight contact reference |

### Prescription, partnership, privacy and utilities

| Method | Path | Access | Function |
|---|---|---|---|
| GET | `/pharmacy/readiness` | Public | Sanitized platform readiness |
| GET | `/prescriptions/readiness`, `/prescriptions/me` | Customer | Gate explanation/owned submissions |
| POST | `/prescriptions` | Customer + CSRF | Protected PDF/JPEG/PNG upload |
| POST | `/prescriptions/:id/cancel` | Owner + CSRF | Cancel eligible submission |
| POST | `/prescriptions/:id/clarifications/:clarificationId/respond` | Owner + CSRF | Clarification response |
| GET | `/partnerships/verify-email?token=...` | Public | Verify application email |
| GET | `/partnerships/me` | Customer | Own partnership application |
| POST | `/partnerships/applications` | Customer + CSRF | Submit partnership application |
| POST | `/partnerships/applications/:id/documents` | Owner + CSRF | Protected document/image/video upload |
| GET | `/partnerships/portal`, `/partnerships/portal/prescriptions` | Approved partner | Portal and assignments |
| POST | `/partnerships/portal/prescriptions/:id/acknowledge` | Partner + CSRF | Confirm receipt |
| POST | `/partnerships/portal/prescriptions/:id/start-review` | Partner + CSRF | Start professional review |
| POST | `/partnerships/portal/prescriptions/:id/decision` | Partner + CSRF | Record decision/clarification |
| GET | `/partnerships/portal/prescriptions/:id/document` | Partner | Audited protected download |
| GET, POST | `/privacy/me`, `/privacy` | Customer; POST CSRF | List/create privacy request |
| POST | `/privacy/:id/cancel` | Owner + CSRF | Cancel eligible request |
| POST, DELETE | `/media/signature`, `/media/asset` | Staff `media:write` + CSRF | Sign upload/delete public product asset |
| POST | `/orders/:id/invoice/email` | Owner or `invoices:send` + CSRF | Generate/email paid invoice |
| GET | `/shipping/tracking/:number` | Public, limited | Restricted tracking view |
| POST | `/webhooks/brevo` | Shared secret | Email events/suppression |

### Admin API

All paths below begin `/api/v1/admin`, require a privileged session, and check the listed permission. Every mutation requires CSRF.

| Method/path | Permission | Function |
|---|---|---|
| `GET /metrics` | `orders:read` or `audit:read` | Dashboard totals |
| `GET /operations` | `reports:read` or `audit:read` | Operations overview |
| `GET /audit-events` | `audit:read` | Redacted audit register |
| `GET /customers` | `customers:read` | Customer directory |
| `GET /orders`, `GET /orders/:id` | `orders:read` | Order queue/detail |
| `GET /inventory` | `inventory:read/write` | Variant stock state |
| `POST /inventory/:productId/:variantId/adjust` | `inventory:write` | Idempotent adjustment |
| `GET /shipping` | shipping/order permission | Shipment queue |
| `POST /shipping/:id/authorize` | `fulfillment:authorize/write` | Readiness authorization |
| `PATCH /shipping/:id` | `shipping:write` | Shipment/tracking update |
| `GET /chat/summary`, `/chat`, `/chat/:id` | `chat:read` or `support:write` | Chat inbox/detail |
| `POST /chat/:id/messages`, `/chat/:id/read`; `PATCH /chat/:id/status` | chat/support permission | Reply/read/status |
| `GET /support-cases`, `/support-cases/:id` | `support:read/write` | Support queue/detail |
| `PATCH /support-cases/:id`, `POST /support-cases/:id/messages` | `support:write` | Update/reply |
| `GET /healthcare-professionals` | `hcp:read` | HCP applications |
| `PATCH /healthcare-professionals/:id` | `hcp:write` | Review HCP |
| `GET /partnerships`, `/partnerships/:id` | `partners:read` | Partnership queue/detail |
| `POST /partnerships/:id/licenses/:licenseId/reveal`, `/credentials/reveal` | `partners:sensitive` | Audited sensitive reveal |
| `PATCH /partnerships/:id/licenses/:licenseId` | `partners:verify` | Verify license |
| `PATCH /partnerships/:id/workflow` | `partners:write` | Update workflow |
| `PATCH /partnerships/:id/assessment`, `/capabilities`, `/service-configuration` | `partners:compliance` | Compliance/capability/routing config |
| `GET /partnerships/:id/documents/:documentId` | `partners:documents` | Protected download |
| `GET /prescriptions` | `prescriptions:read` | Oversight queue |
| `POST /prescriptions/:id/assign` | `prescriptions:assign` | Eligible partner assignment |
| `POST /prescriptions/:id/hold`, `/release-hold` | `prescriptions:hold` | Operational hold/release |
| `GET /prescriptions/:id/document` | `prescriptions:document` | Protected download |
| `GET /controls`; `POST /controls` | `controls:read/write` | List/create control version |
| `POST /controls/:id/{submit,approve,activate,suspend,rollback}` | `controls:write` | Control lifecycle |
| `GET /exceptions` | `exceptions:read` or `reports:read` | Exception queue |
| `POST /exceptions`, `PATCH /exceptions/:id` | `exceptions:write` | Create/update incident |
| `POST /exceptions/:id/retry-handoff` | exception + assign | Retry transport only |
| `POST /exceptions/:id/suspend-partner` | exception + compliance | Stop new routing |
| `GET /partner-performance` | reports/partners read | SLA and rejection categories |
| `GET /privacy-requests`, `/privacy-requests/:id` | privacy read/write | Privacy queue/detail |
| `PATCH /privacy-requests/:id` | `privacy:write` | Process request |
| `GET /health-info` | health read/write | Editor data |
| `POST/PUT/DELETE /health-info/categories[/:id]` | `health:write` | Category CRUD |
| `POST/PUT/DELETE /health-info/articles[/:id]` | `health:write` | Article create/update/archive |
| `GET /newsletter-subscribers`, `/newsletter-groups`, `/newsletter-campaigns` | `newsletter:read` | Marketing data |
| `POST/PUT/DELETE /newsletter-groups[/:id]` | `newsletter:write` | Group CRUD |
| `POST/PUT/DELETE /newsletter-campaigns[/:id]` | `newsletter:write` | Campaign CRUD |
| `POST /newsletter-campaigns/:id/send` | `newsletter:write` | Snapshot/queue send |
| `GET /membership-plans` | membership read/write | Plan list |
| `POST /membership-plans`, `PUT /membership-plans/:id` | `membership:write` | Validate/save plan |

## Storefront API client

[`frontend/src/services/api.js`](frontend/src/services/api.js) sends credentials, refreshes once after eligible `401`, coordinates refresh across tabs, rejects a response from an older auth generation, and emits `embody:auth-expired` when necessary.

| Functions | Responsibility |
|---|---|
| `register`, `verifyOtp`, `resendOtp`, `login`, `forgotPassword`, `resetPassword`, `refresh`, `logout` | Authentication lifecycle |
| `account`, `accountOrders`, `updateProfile`, `updatePreferences`, `changePassword`, `revokeOtherSessions` | Profile/security/orders |
| `products`, `productCategories`, `comparisons`, `healthInfo`, `healthInfoNavigation`, `healthInfoArticle` | Public catalog/content |
| `cartQuestions`, `submitCartAnswers`, `priceQuote`, `checkout` | Cart/pricing/order |
| `healthHubDashboard`, journey CRUD, guest migration, saved-item CRUD, Hub preference/lifecycle methods | Health Hub |
| `askEmbody`, `assistantMemory`, `deleteAssistantMemory` | Assistant and memory control |
| `subscribeNewsletter`, `contact`, `trackShipment` | Public services |
| `chat`, `sendChatMessage`, `markChatRead` | Human chat |
| support-case list/detail/create/reply functions | Structured support |
| `professionalApplication`, `submitProfessionalApplication` | HCP application |
| partnership application/verification/upload methods | Partner onboarding |
| partner portal/list/acknowledge/review/decision/download methods | Approved pharmacy workflow |
| prescription readiness/list/upload/cancel/clarification methods | Customer prescription workflow |
| privacy list/create/cancel methods | Privacy rights |
| membership list/current/enroll/cancel methods | Benefits/savings |
| family list/invite/accept/revoke methods | Delegated access |

## Admin API client

[`admin/src/api.js`](admin/src/api.js) sends `X-Client: admin`, attaches the admin CSRF token to mutations, throws typed `ApiError` values, and returns protected downloads as blobs.

| Functions | Responsibility |
|---|---|
| `login`, `refresh`, `logout` | Privileged session |
| `metrics`, `operations`, `auditEvents` | Dashboard/operations/audit |
| customer/order methods | Customer and order operations |
| product/category CRUD, `mediaSignature` | Catalog/media |
| question and comparison CRUD | Questionnaires/comparisons |
| Health Info category/article CRUD | Content publishing |
| inventory adjustment and shipping methods | Stock/fulfillment |
| subscriber/group/campaign CRUD and send | Newsletter |
| chat summary/list/detail/reply/read/status | Human chat |
| support case list/detail/update/reply | Case operations |
| HCP list/review | Professional review |
| partnership list/detail, reveals, verification, workflow, assessment, capabilities, service config, download | Partner compliance |
| prescription list/readiness/assign/hold/release/download | Prescription oversight |
| platform controls/create/action | Release gates |
| privacy list/detail/update | Privacy operations |
| exception create/update/recovery and partner performance | Incident/routing operations |
| membership list/create/update | Plan economics |

## External services

| Service | Status | Requirements |
|---|---|---|
| MongoDB/Atlas | Implemented | TLS, backups, alerts, least privilege, replica set for transactions |
| Brevo transactional | Implemented | Verified domain, templates/testing and privacy review |
| Brevo campaigns | Implemented | List ID, webhook secret, consent/legal review |
| Cloudinary public media | Implemented | Restricted preset/folder/type/size |
| Cloudinary protected raw | Implemented with application encryption | Vendor/BAA suitability, scanner, retention, deletion, key review |
| NPPES | Implemented/configurable | Availability handling; result is not licensure approval |
| Turnstile | Implemented | Production site/secret keys |
| Malware scan | Adapter implemented | Approved scanner URL required in production |
| Live payment | **Not implemented; fails closed** | Underwriting, provider adapter, signed webhooks, refunds/reconciliation |
| USPS rates/labels | **Not implemented; fails closed** | Carrier certification, validation, rating and labels |

Brevo webhook: `POST /api/v1/webhooks/brevo` with `X-Brevo-Webhook-Secret`. Unsubscribe/complaint suppress the recipient; events retain hashed recipient identity and delivery metadata.

Public Cloudinary media is only for approved product assets. Never upload PHI through `/media/signature`. Protected endpoints use a separate authenticated raw-object path.

## Testing and deployment

| Command | Action |
|---|---|
| `npm run dev` | Start all three workspaces |
| `npm test` | Backend then frontend tests |
| `npm run build` | Build both React apps and assemble output |
| `npm run seed` | Seed initial content/control data |
| `npm run admin:provision` | Create/repair initial super admin |
| `npm run admin:json` | Generate ignored Atlas import JSON |
| `npm run seed:health-info -w backend` | Seed Health Info only |

Before merge/deploy:

```bash
npm test
npm run build
git status --short
```

Deployment outline:

1. Build and serve storefront/admin over HTTPS at configured origins.
2. Run API separately with production secrets and a MongoDB replica set.
3. Proxy `/api/v1` or set `VITE_API_BASE_URL` before build.
4. Keep cookie scope, CORS origins and TLS hosts aligned.
5. Use process supervision, centralized redacted logging, alerts, dependency scanning and tested backups.
6. Do not automatically seed demo/admin data on every production boot.
7. For horizontal API scale, add a distributed rate-limit/session coordination store and retain campaign worker leasing.

## SEO and accessibility

- Route-specific title, description, canonical, Open Graph metadata and robots directives.
- Auth/account/cart/checkout/search/tracking/admin routes are `noindex` and excluded from public crawling.
- Sitemap includes public product and education routes.
- Product/organization JSON-LD uses factual configuration; offers require explicit schema eligibility.
- Stable slugs, category/article links, related content, reviewer and review-date fields.
- Responsive layouts and semantic controls across storefront/admin.

A Vite SPA is not equivalent to reliable SSR. Before launch, prerender or migrate public catalog/education routes to SSR and validate rendered HTML, sitemap, canonicals, structured data, Core Web Vitals and WCAG 2.2 AA.

## Production checklist and known limits

1. Verify the operating entity, pharmacist authority, every service-state license, supply chain, labels, taxes, shipping, consumer protection and privacy obligations.
2. Keep prescription/controlled switches off until evidence and active release gates are approved.
3. Complete threat modeling, penetration/dependency review, incident/breach exercises, backup restoration, retention/deletion tests, vendor agreements and periodic access reviews.
4. Add phishing-resistant staff MFA. Password-only admin login is implemented per the current requirement but is weaker than production best practice.
5. Add shared distributed rate limiting for multiple API instances.
6. Implement/certify real payment and carrier adapters. Current `sandbox_paid` is development-only; live Stripe/USPS paths are intentionally unavailable.
7. Complete WCAG, browser/device, load, recovery and disaster-recovery testing.
8. Complete Brevo/Cloudinary/scanner/NPPES data-flow, BAA applicability and key-rotation reviews.
9. Never display NABP, `.pharmacy`, HIPAA, FDA, DEA, state-board or other approval claims unless actually obtained and verified.

`docs/openapi.yaml` is partial. The route catalog above is derived from current route modules; update/validate OpenAPI before client generation or external integration.

## Troubleshooting

### MongoDB `ECONNREFUSED 127.0.0.1:27017`

The API is using the local fallback. Start local MongoDB or set a valid Atlas `MONGODB_URI`, confirm Atlas network access, and restart backend.

### Data appears in `test`

Set `MONGODB_DB_NAME=embody_health`; the app uses this independently from the URI path.

### Admin login returns `401`

Confirm the record is in `embody_health.users`, is `ACTIVE`, has a privileged role, and is not locked. Prefer `npm run admin:provision` instead of inserting plaintext. Five failures create a temporary lock.

### Development OTP is not visible

When `NODE_ENV=development` and Brevo is absent, explicitly reveal excluded `developmentCode` on the active `otpchallenges` record. `codeDigest` is one-way. Production never stores recoverable OTP.

### CSRF failure

Use the correct `X-Client`, include credentials, and mirror the matching CSRF cookie into `X-CSRF-Token`. Storefront/admin tokens are not interchangeable.

### Session ends before 24 hours

Confirm browser credentials/cookies are allowed, configured origins exactly match, clocks are synchronized, and `/auth/refresh` is reachable. The absolute session still ends exactly 24 hours after login.

### Newsletter `422`

Send a non-empty full name and valid email. Existing emails are an idempotent subscribe/resubscribe case; show the API message instead of treating duplication as failure.

### Prescription intake unavailable

Use `/prescriptions/readiness` and Admin -> Control center to identify the closed switch/gate. Do not bypass it in the browser.

### Protected upload fails in production

Check scanner, Cloudinary, encryption key, type/size, required document type, ownership and controls. Production intentionally rejects when secure scanning/storage is unavailable.

## Related source documentation

- [`docs/regulated-platform-part-one.md`](docs/regulated-platform-part-one.md) - regulated platform mapping.
- [`docs/openapi.yaml`](docs/openapi.yaml) - partial OpenAPI draft.
- [`.env.example`](.env.example) - safe environment template.
- [`frontend/src/services/api.js`](frontend/src/services/api.js) - storefront API wrapper.
- [`admin/src/api.js`](admin/src/api.js) - admin API wrapper.
- [`backend/src/routes`](backend/src/routes) - authoritative route/permission definitions.

## Image provenance

`frontend/public/images/embody-hero.png` is an original AI-generated project asset without an embedded third-party logo. Review licenses for every production image, font, icon and content source.
