# EMBODY · MEN’S HEALTH

A production-oriented reference implementation for a US men’s-health storefront, an Express/MongoDB API, and a separate role-aware operations dashboard.

> **Important:** This repository is software infrastructure, not a licensed pharmacy, medical practice, prescribing service, or regulatory certification. Demo product and operational data are synthetic. Clinical copy, labels, formularies, states served, professionals, pharmacy relationships, policies, and integrations require qualified legal, clinical, pharmacy, privacy, and security approval before any real-world use.

## Applications

- `frontend/` — React 19 + Vite 8 customer experience with responsive catalog, cart, account, content, and safety-gated consultation intake.
- `backend/` — Express 5 ES-module REST API with Mongoose models, Zod validation, secure cookies, rate limits, structured/redacted logs, state constants, RBAC middleware, and sandbox service adapters.
- `admin/` — React/Vite operations dashboard. The visible demo dataset is explicitly labeled; API permissions remain the enforcement boundary.

## Quick start

Requirements: Node.js 22.12+ and MongoDB 8+ (a replica set is recommended for production transaction support).

```bash
npm install
copy .env.example .env
npm run seed
npm run dev
```

Storefront: `http://localhost:5173`  
API: `http://localhost:4000/api/v1`  
Admin: `http://localhost:5174`

Run checks:

```bash
npm test
npm run build
```

## Implemented safeguards

- Prescription items open a five-question intake plus a separately presented consent step.
- Under-18 responses cannot proceed.
- Chest pain, sudden vision/hearing loss, or a prolonged erection interrupts the purchase journey with urgent-care instructions.
- Nitrates, riociguat, uncertain answers, and Viagra requests over 100 mg are flagged; nothing auto-recommends or auto-approves treatment.
- Consultation answers are excluded from URLs and deliberately redacted from request logs.
- A paid state remains distinct from clinical review, prescription verification, authorization for fulfillment, and shipment.
- Role permissions distinguish pharmacy administration, pharmacists, clinicians, fulfillment, support, and auditors.
- No card details are stored. Live payment and USPS actions fail safely until explicitly configured.

## API conventions

All routes use `/api/v1`. Success responses use `{ success: true, data, meta? }`; errors use `{ success: false, code, message, requestId, errors? }`. Pagination metadata includes page, limit, total, and pages.

Representative endpoints:

- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
- `GET /products`, `GET /products/:slug`
- `POST /consultations`, `PATCH /consultations/:id/review`
- `POST /checkout` (safe-disabled until providers are configured)
- `GET /shipping/tracking/:number`
- `GET /admin/metrics`
- `GET /health`, `GET /ready`

See [docs/openapi.yaml](docs/openapi.yaml) for the starter API contract.

## Production integration checklist

1. Retain specialist pharmacy, telehealth, FDA/state-board, consumer-protection, and privacy counsel; determine covered-entity/business-associate status and required BAAs.
2. Replace demo catalog copy with authorized labeling and licensed-pharmacy content; add verified clinician/pharmacist identities only after credentialing.
3. Add email verification, token rotation/revocation, MFA/WebAuthn for privileged users, breached-password screening, CSRF tokens, and a production session store.
4. Encrypt consultation payloads with a managed KMS/HSM-backed envelope-encryption service and implement retention/deletion/access policies.
5. Configure a pharmacy-compatible payment account; use hosted payment elements, signed webhooks, idempotency, reconciliation, refunds, and failure recovery.
6. Obtain current USPS API access or choose an authorized provider; implement OAuth, address validation, rates, labels, tracking, caching, webhooks/polling, and rate limits against official current terms.
7. Implement atomic inventory reservations with MongoDB transactions, expiry jobs, compensation, and complete adjustment audit trails.
8. Integrate credentialed clinical/prescription systems with jurisdiction and license checks. Never let payment or an ordinary admin unlock fulfillment.
9. Add a consent-aware, health-data-safe analytics configuration. Do not emit medicine interest, consultation state, answers, or customer health identifiers.
10. Complete WCAG 2.2 AA audit, penetration test, threat model, load tests, disaster recovery rehearsal, breach-response plan, dependency audit, and end-to-end test matrix.
11. Add verified domains, transactional email authentication, production secrets, backups, monitoring, alerting, and audited access reviews.
12. Choose an SEO rendering strategy (SSR or verified prerender) for real catalog/content URLs. The Vite storefront includes metadata, robots rules, and a starter sitemap but does not claim ideal dynamic indexing.

## Deployment

Build outputs are generated with `npm run build`. The private Sites deployment packages `frontend/dist` for stakeholder review. Deploy the backend and admin separately to approved infrastructure with appropriate contracts, network controls, encryption, logging, backups, and runtime secrets. Never place `.env` files or secrets in version control.

## Image provenance

`frontend/public/images/embody-hero.png` is an original AI-generated project asset created for this build with no embedded logos or copied stock imagery. Review organizational policy for AI-created marketing assets before public use.
