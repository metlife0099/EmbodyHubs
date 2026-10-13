# EMBODY Pharmacy

A production-oriented US pharmacy storefront, Express/MongoDB API, and separate role-aware operations dashboard. The public catalog contains general OTC and wellness content only.

> This repository is software infrastructure, not a licensed pharmacy, regulatory certification, or authorization to dispense. Prescription sales default to disabled. Qualified pharmacy, legal, privacy, and security review is required before real-world operation.

## Applications

- `frontend/` — React 19 + Vite storefront with OTC catalog, cart, sandbox checkout, OTP authentication, customer account, education, SEO metadata, robots rules, and sitemap.
- `backend/` — Express 5 ES-module API with Mongoose, Zod, Argon2id, OTP verification, rotating sessions, CSRF protection, Cloudinary media signing, Brevo transactional email and PDF invoices, RBAC, rate limits, and redacted logs.
- `admin/` — Separate responsive pharmacy-operations dashboard. Demo metrics remain clearly labeled.

## Start locally

Requirements: Node.js 22.12+ and MongoDB 8+.

`MONGODB_DB_NAME` defaults to `embody_health`, including when an Atlas SRV URI does not contain a database path.

```bash
npm install
copy .env.example .env
npm run seed
npm run dev
```

Storefront: `http://localhost:5173`  
API: `http://localhost:4000/api/v1`  
Admin: `http://localhost:5174/admin/`

```bash
npm test
npm run build
```

## Authentication security

- Passwords use Argon2id and a 12-character minimum with complexity checks.
- Registration requires a six-digit, single-use email code before activation.
- Registration collects an age range, US state, broad service goal, and pharmacist-support preference. It rejects under-18 signups, records separate Terms and Privacy acknowledgements, and deliberately keeps symptoms, diagnoses, medication lists, and treatment history out of account creation.
- Customer password login requires a second one-time email code. Privileged administrator login uses the dedicated role-gated endpoint and a fixed 24-hour session without email OTP, per the current operations requirement.
- Codes are generated with cryptographic randomness, HMAC-hashed with `OTP_PEPPER`, expire after 10 minutes, allow five attempts, and have a 60-second resend cooldown.
- Password reset uses a one-time verification challenge and a short-lived, single-use reset grant.
- Refresh tokens are opaque, SHA-256 hashed in MongoDB, rotated after use, revocable, and stored only in Secure/HttpOnly/SameSite cookies.
- Access tokens expire after 10 minutes and are checked against the server-side session and user session version.
- Cookie-authenticated mutations use a double-submit CSRF token checked against the session.
- Login errors are generic, missing-account password checks are timing-equalized, and repeated failures trigger a temporary lock.

## Authenticated cart and customer questions

- An anonymous add-to-cart attempt never changes cart state. It opens a clear login/create-account prompt and preserves the intended return route.
- Only signed-in customers can add items. Logging out clears the device-local cart so it cannot be reused by another person on the device.
- Each product has an administrator-controlled add-to-cart questionnaire toggle. When enabled, the customer must complete the current required questions before that product enters the cart; when disabled, the product is added immediately.
- The product editor supports fully customizable multiple-choice questions with two to eight unique options. Administrators can also manage reusable global yes/no, single-choice, and multiple-choice questions.
- The API validates the authenticated customer, product, current question revisions, answer choices, and ownership of the completed response. Answer bodies are redacted from request logs.
- Checkout revalidates each response after confirmed payment and stores an immutable question-and-answer snapshot on the order. Authorized staff can review those answers in admin order details.
- The production payment path fails closed until a verified provider adapter and signed webhooks are configured. Development uses the explicit `sandbox_paid` confirmation only.

## Products and admin access

- Authorized staff can create and edit catalog products, variants, inventory, publication status, warnings, Cloudinary images, and the product-specific questionnaire from the operations dashboard.
- Admin password login has a separate endpoint, rejects customer roles, uses the same lockout controls as customer authentication, and establishes a fixed, non-extendable 24-hour HttpOnly cookie session protected by CSRF checks.
- The permission-gated Customers module shows customer identity, verification status, account dates, and the privacy-minimized answers captured during registration. Password material, session data, OTP records, and network identifiers are never returned.
- Create the initial `SUPER_ADMIN` by setting both `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` before `npm run seed`; no administrator password is hardcoded in source.
- Run `npm run admin:provision` to create or repair that administrator, replace its password with an Argon2id hash, clear login locks, and revoke older sessions and OTP challenges.
- If Atlas Data Explorer import is required, run `npm run admin:json` after setting those variables. Paste the generated ignored `admin-atlas.json` document into the `users` collection, then delete the file. The JSON contains an Argon2id hash, never a plaintext password.
- The dashboard is built under `/admin/`, marked private in `robots.txt`, and every sensitive API route independently enforces role permissions.

## Brevo

Set `BREVO_API_KEY`, verify `EMAIL_FROM`, and optionally configure `BREVO_OTP_TEMPLATE_ID` and `BREVO_INVOICE_TEMPLATE_ID`. OTP and invoice mail uses Brevo transactional email with idempotency headers and disabled recipient tracking. PDF invoices are generated with PDFKit and attached without writing customer documents to disk.

Configure the Brevo transactional webhook to `POST /api/v1/webhooks/brevo` with `X-Brevo-Webhook-Secret` matching `BREVO_WEBHOOK_SECRET`. Only hashed recipient identifiers and delivery metadata are retained.

When `NODE_ENV=development` and Brevo is not configured, a newly issued OTP is stored temporarily as `developmentCode` on the active document in `embody_health.otpchallenges`. This field is excluded from application queries, removed after successful use, and deleted with the challenge by its TTL index. Production never stores a recoverable OTP.

## Cloudinary

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `CLOUDINARY_UPLOAD_PRESET`. Authorized staff request a short-lived signed upload from `POST /api/v1/media/signature`, then upload directly to Cloudinary. The production preset must restrict image formats, maximum file size (8 MB), delivery type, and the configured product-media folder. API secrets never reach the browser. Product images store secure URLs and public IDs; transforms use automatic format and quality.

Cloudinary is limited to approved public product media by default. Do not upload prescriptions, IDs, patient documents, or other sensitive data without a separately approved private-delivery configuration, contract review, retention policy, and access controls.

## US pharmacy launch gates

Prescription publication and fulfillment remain blocked until production configuration verifies:

- the operating pharmacy’s legal identity, US physical address, phone number, and pharmacist contact;
- licenses for both the pharmacy location and every customer state served;
- a valid-prescription verification process and licensed-pharmacist authority;
- authorized US supply-chain products and accurate labeling;
- applicable state privacy, pharmacy, tax, shipping, and consumer-protection requirements.

Controlled substances remain disabled by default and require separate DEA and state authorization. Do not display NABP, `.pharmacy`, HIPAA, FDA, DEA, or state-board approval claims unless actually obtained and verified.

## SEO

- Unique route titles, descriptions, canonicals, Open Graph tags, and robots directives.
- Private account, authentication, cart, checkout, search, and tracking routes use `noindex,nofollow` and are disallowed in `robots.txt`.
- Sitemap covers public products and education pages.
- JSON-LD emits factual `OnlineStore` data. Product offers are emitted only when `schemaEligible` is explicitly enabled for verified production data.
- Product URLs use stable descriptive slugs and internal links.

A Vite SPA is not equivalent to complete SSR. For a public production launch, add verified prerendering or migrate public catalog/content routes to SSR, then validate rendered HTML through Search Console and Rich Results Test.

## Remaining production work

1. Obtain state-by-state pharmacy and legal approval, validate the actual operating entity, and complete NABP/`.pharmacy` evaluation if pursued.
2. Configure Brevo domain authentication, templates, webhook delivery, suppression handling, and appropriate privacy/BAA review.
3. Configure Cloudinary product-media presets, least-privilege credentials, retention, backups, and webhook verification.
4. Add WebAuthn or authenticator-app MFA for privileged staff before production launch. The current password-only admin flow was requested for local operations and provides less protection than phishing-resistant MFA.
5. Add a distributed rate-limit/session layer such as managed Valkey when running multiple API instances.
6. Complete payment-provider pharmacy underwriting, signed webhooks, taxes, MongoDB transaction-backed stock reservations, USPS/provider certification, refunds, and reconciliation.
7. Complete threat modeling, penetration testing, WCAG 2.2 AA audit, incident-response exercises, vendor agreements, breach procedures, and state-law review.

## Image provenance

`frontend/public/images/embody-hero.png` is an original AI-generated project asset with no embedded logos or copied stock imagery.
