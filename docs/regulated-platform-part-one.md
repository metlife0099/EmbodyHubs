# Regulated platform — part one implementation map

This document maps the nine-page “EmbodyHubs: Complete platform scope of work” specification (version 1.0, October 27, 2026) to the implementation. The source PDF is treated as a product specification, not as legal advice or authority to operate a pharmacy.

## Operating boundaries

The system has three separate authenticated surfaces:

- Customer Account: secure prescription submission, status history, pharmacy clarification response, cancellation where permitted, privacy requests, account and order management.
- Pharmacy Partner Portal: assigned-only prescription queue, secure receipt confirmation, professional review, clarification, accept/reject/hold decisions, and audited document access.
- EmbodyHubs Operations: workflow oversight, eligible-pharmacy routing, operational holds, partner controls, release gates, privacy operations, reporting, alerts, and audit review.

EmbodyHubs operations has no endpoint that records a pharmacy acceptance or rejection. Those decisions are available only through an active, approved pharmacy partner with prescription capability. Operational holds are labeled and stored separately from professional decisions.

## Prescription state machine

The API implements every state specified in the PDF:

`UPLOADED → SECURITY_SCAN_PENDING → SECURELY_STORED → PENDING_ELIGIBILITY_CHECK → PENDING_PHARMACY_ASSIGNMENT → ASSIGNED_TO_PHARMACY → HANDOFF_PENDING → RECEIPT_CONFIRMED → PHARMACY_REVIEWING`

It also enforces the branches for `ADDITIONAL_INFORMATION_REQUIRED`, `ON_HOLD`, `PHARMACY_ACCEPTED`, `PHARMACY_REJECTED`, `CUSTOMER_CANCELLED`, `EXPIRED_OR_INVALIDATED`, `ORDER_AUTHORIZED`, `FULFILLMENT_IN_PROGRESS`, `FULFILLED`, and `CLOSED`. Invalid transitions return a conflict and do not mutate data. Tests specifically prevent an upload or administrator workflow from jumping to pharmacy acceptance.

## Release gates and fail-closed behavior

Prescription intake requires all applicable active controls plus the environment kill switch:

1. `GATE_A_BUSINESS_MODEL`
2. `GATE_B_JURISDICTION_ELIGIBILITY`
3. `GATE_C_PRESCRIPTION_TRANSMISSION`
4. `GATE_D_CONTROLLED_SUBSTANCES` (controlled-substance workflow only)
5. `GATE_E_PRIVACY_SECURITY`
6. `PRESCRIPTION_INTAKE`
7. no active `GLOBAL_TRANSACTION_PAUSE`

Controls are versioned and move through Draft, Pending Approval, Approved, and Active. Creation and approval are separated, activation is explicit, prior active versions retire, and suspension/rollback is audited. Legal-review controls require a named reviewer and HTTPS evidence. The application never generates or self-approves a state-law rule.

The environment values `PRESCRIPTION_DISPENSING_ENABLED` and `CONTROLLED_SUBSTANCES_ENABLED` remain independent kill switches. Both default to false.

## Pharmacy authorization and routing

Partner application approval, portal access, prescription capability, controlled-substance capability, and routing are independent decisions. Routing requires:

- active partner status and explicitly enabled partner portal;
- explicitly enabled prescription capability;
- accepting-new-submissions setting;
- customer state in the partner’s authorized-state list;
- a verified license for every configured authorized state;
- current contract and insurance dates;
- configured response SLA, capacity, priority, allowed order types, and optional product restrictions.

The admin Partner Routing page manages these fields. Assignment re-evaluates eligibility at the time of handoff and does not trust the browser’s candidate list.

## Secure documents and restricted data

- PDF/JPEG/PNG prescription files are capped at 5MB, magic-byte validated, malware-scanned, encrypted with AES-256-GCM before Cloudinary upload, integrity-HMAC protected, and stored as authenticated raw objects without public URLs.
- Partner onboarding documents and clinic media use the same private encrypted-object pattern, with separate file requirements and limits.
- Original filenames, professional notes, clarification text, privacy-request details, legal-hold reasons, and resolutions are encrypted at the application layer.
- Prescription contents and sensitive request text are excluded from logs and operational analytics.
- Document access is permission checked, scoped to the assigned pharmacy or designated privileged staff, returned with `no-store`, and audit logged with an access purpose.
- General support users do not receive prescription-document permission.

Encryption keys must be managed outside source control and rotated under an approved production key-management procedure. Application encryption does not by itself establish HIPAA compliance.

## Privacy operations

Customers may create tracked access, correction, deletion, restriction, export, and consent-withdrawal requests. Requests have reference numbers, due dates, controlled statuses, encrypted details, identity-verification and legal-hold states, encrypted resolutions, and immutable audit events. The UI warns that deletion may be limited by legally required retention.

## Reporting and audit

The control center reports metric definition, source, range, and as-of time. It distinguishes processed order value from accounting revenue and explicitly leaves platform fees, processor fees, settlements, and merchant-of-record accounting unavailable until approved controls exist. Alerts cover prescription SLAs, overdue privacy requests, release-gate readiness, emergency pause, and partner credential expiry.

Audit output filters message, note, document, prescription, contact, and address-like metadata. Audit access itself remains role-gated.

## Before any production prescription release

- Qualified U.S. pharmacy counsel must approve the operating model, seller/merchant-of-record relationships, state activities, transmission method, customer communications, discount claims, refunds, tax, and retention rules.
- Each dispensing pharmacy and pharmacist-in-charge must be verified for every served jurisdiction; contracts and insurance must be current.
- Execute appropriate agreements with every service provider that creates, receives, maintains, or transmits regulated health information, including BAAs where required.
- Complete a documented security risk analysis, threat model, penetration test, incident-response exercise, backup/restore test, access review, and retention/deletion test.
- Configure production malware scanning, private Cloudinary delivery, secret/key management, Brevo agreements and tracking policy, signed payment webhooks, and distributed session/rate-limit infrastructure.
- Add phishing-resistant MFA for privileged workforce accounts. The current password-only 24-hour admin session was a prior local-development requirement and remains a production release blocker.
- Keep controlled-substance workflows disabled until qualified counsel, pharmacy leadership, DEA requirements, and all applicable state requirements are documented and approved.

Part two of the specification should be reviewed before this map is considered complete for the full platform.

## Authoritative review starting points

- HHS, HIPAA Security Rule: https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html
- HHS, cloud computing and HIPAA: https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html
- HHS, covered entities and business associates: https://www.hhs.gov/hipaa/for-professionals/covered-entities/index.html
- NABP, Digital Pharmacy Accreditation: https://nabp.pharmacy/programs/accreditations/digital-pharmacy/

These are starting points only. Applicable federal and state requirements must be determined for the actual entities, activities, jurisdictions, vendors, products, and payment model.
