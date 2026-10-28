# My Health Hub — 64-point implementation register

This register maps the attached product specification to the implemented EmbodyHubs surfaces. The PDF is treated as a product specification; the repository's security, legal, and deployment controls remain authoritative. “Production ready” here means implemented, tested, feature-gated, and ready for required U.S. legal, pharmacy, privacy, accessibility, and security review—not permission to launch regulated functionality without those approvals.

## Requirement traceability

| # | Requirement | Implementation |
|---:|---|---|
| 1 | Health Hub, not a conventional account | `/account` is now **My Health Hub**; private and `noindex`. |
| 2 | Answer where/what/next/who/control | Dashboard aggregates verified next step, responsible party, last activity, and direct controls. |
| 3 | Prioritize action, journey, orders, support | `healthHubController.dashboard` and `HealthHubOverview` order these surfaces explicitly. |
| 4 | Calm premium responsive identity | New `MyHealthHub.css` uses existing teal/sage/ivory identity, responsive grids, keyboard-native controls, and no new UI library. |
| 5 | Named dashboard and specified promise | Hero and page title use “My Health Hub” and “Everything important, organized in one place.” |
| 6 | Safe greeting and verified primary card | Preferred/first name only; primary card is produced by the server next-step engine. |
| 7 | Controlled status vocabulary | `JOURNEY_STATES`, event classifications, and `buildNextSteps`; estimates/unknown remain explicit. |
| 8 | Current journey card | Journey cards include stage, activity, next step, owner, continue, resume, and archive. |
| 9 | Verified orders | Dashboard reads server order/payment/shipment state; no client-invented milestones. |
| 10 | Viewed/Saved/Journey separation | `SavedItem` requires an explicit save; `CustomerJourney` is separate; server recently-viewed tracking is disabled. |
| 11 | Customer-facing support card | Existing encrypted `SupportCase` workflow exposes reference, subject, state, customer timeline, and next action only. |
| 12 | Bound assistant architecture | Ask Embody uses authenticated context, policy intent routing, approved read tools, verified sources, and audit events. |
| 13 | Desktop information architecture | Overview, My Journey, My Orders, Saved & Compared, Support, Benefits, Family Access, Privacy & Security; regulated items are contextual. |
| 14 | Mobile navigation | Fixed Home, Journey, Orders, Support, Account bar on small screens. |
| 15 | Journey entry points | Products, comparisons, learning guides, orders, prescriptions, and support can be represented as distinct source types. |
| 16 | Discover-to-track flow | Starter journeys and public Start Journey actions cover discover, compare, learn, act, track, and support. |
| 17 | Journey state machine | Implemented in `CustomerJourney`; state transitions append immutable customer-visible events. |
| 18 | Multiple separated journeys | One customer owns multiple isolated journey documents. |
| 19 | Journey controls | Start, pause-ready state, archive, resume, and eligible removal APIs; transactions cannot be erased as a shortcut. |
| 20 | Anonymous journey and migration | 30-day signed HttpOnly device cookie, hashed server token, TTL deletion, duplicate prevention, verified-account migration, cookie invalidation. |
| 21 | Fast registration | Existing signup remains minimal and does not add medical history. Public exploration remains open. |
| 22 | Reuse authentication | Existing OTP-on-signup, email verification, sign-in, reset, secure cookie sessions, rotation, and expiry are reused. |
| 23 | Separate consent | Existing terms/privacy acknowledgement and optional marketing consent remain separate. |
| 24 | Practical profile fields | Existing profile plus explicit Health Hub language/accessibility preferences; shipping address remains optional after signup. |
| 25 | No medical profile by default | Health Hub schemas contain no diagnosis, symptom, medication-list, or clinical-suitability fields. |
| 26 | Explicit preferences only | `CustomerPreference` stores format, broad budget, brands, shopping style, accessibility, language, and assistant opt-ins. |
| 27 | Order accuracy | Existing order views retain verified item, quote, tax, shipping, discount, total, status, and tracking fields. |
| 28 | Price clarity | Existing quote/order certainty fields distinguish estimates from confirmed price; realized savings ledger is unchanged. |
| 29 | Contextual prescription/pharmacy | Prescription Center remains a restricted contextual route, not a general profile field. |
| 30 | Restricted prescription data | Existing encrypted prescription documents, access logs, separate storage, and pharmacy controls are not available to Ask Embody. |
| 31 | Integrated support | Existing encrypted support cases, order linking, response continuation, and internal-note separation are reused. |
| 32 | Support states | Existing OPEN/WAITING/ESCALATED/RESOLVED/CLOSED model maps to customer-facing next-step classifications. |
| 33 | Optional Family Access | Existing `FamilyProfile` feature remains a separate Health Hub area. |
| 34 | Explicit family permissions | Existing commerce and health scopes remain separate; sensitive data is never inherited automatically. |
| 35 | Dependents/minors | Current family flow is verified-adult only; dependent/minor expansion remains gated pending legal model approval. |
| 36 | Benefits, not a wallet | Existing Membership Center shows eligible benefits, fee, realized savings, limits, renewal, and cancellation. |
| 37 | Membership detail | Existing plans and ledgers provide frequency, terms, eligibility, actual savings, and family-related controls. |
| 38 | Saved/compared/learned separation | Explicit item types are shown in a dedicated page; viewed activity is not persisted by Health Hub. |
| 39 | Privacy & Security | Unified page links profile, sessions/password, communications, privacy requests, preferences, lifecycle, and memory deletion. |
| 40 | Separate histories/retention | Lifecycle endpoint documents purchases, saved items, journeys, support, Rx, assistant, security, and viewed data separately. |
| 41 | Assistant is not a health record | Temporary requests are not stored; saved conversations require opt-in, are encrypted, and expire after 90 days. |
| 42 | One assistant surface | Ask Embody presents product guide, account guide, and journey guide capabilities under one interface. |
| 43 | Context boundary | Authentication → intent → least-data tool → verified result; the assistant cannot authorize or directly mutate regulated records. |
| 44 | Assistant examples | Supports product search, latest order, next step, memory summary, support status, and verified deletion controls. |
| 45 | Assistant prohibitions | Clinical intent is blocked; no diagnosis, prescription, approval, overrides, unauthorized access, or invented states. |
| 46 | Shared next-step engine | `healthHubNextStepService` feeds both dashboard and Ask Embody. |
| 47 | Customer control outside AI | Every saved item, journey, preference, session, family permission, and privacy request has direct UI controls. |
| 48 | Security baseline | Server auth/CSRF, object ownership, session validation, rate limits, encryption, audit events, minimization, and isolation. |
| 49 | Late-response invalidation | `authSessionBarrier` discards protected responses when account/session identity changes; auth expiry clears local account/cart state. |
| 50 | Synthetic fixtures | Tests and documentation use no production patient, prescription, account, or token data. |
| 51 | Test domains | Health Hub tests cover state classification, priority, lifecycle, memory barrier, and schema boundaries; existing auth/order/privacy/family suites remain. |
| 52 | Accessibility | Native labels, fieldsets, keyboard actions, focusable controls, live results, error recovery, contrast, and responsive layouts. |
| 53 | Responsive hierarchy | Desktop is spacious; mobile collapses cards and exposes current-action navigation persistently. |
| 54 | Not a medical record | UI and data schemas state and enforce this boundary. |
| 55 | Data lifecycle | Each category declares purpose, retention, control, ownership boundary, and separate access expectations. |
| 56 | Account deletion | Existing formal deletion request explains identity/legal-retention checks; Security revokes sessions; stale-response restoration is blocked. |
| 57 | Feature flags | Eight independent `PlatformControl` keys default **off in production** and can use existing draft/review/approve/activate/rollback workflow. |
| 58 | Phased rollout | Flags allow dashboard, persistence, migration, support, benefits, family, prescription context, and assistant to ship independently. |
| 59 | Definition of done | Build/tests, security boundaries, rollback controls, and this report are part of delivery validation. |
| 60 | Phase-one inventory gate | Completed before implementation: existing account/auth/order/support/family/privacy controls were mapped and reused. |
| 61 | No unnecessary dependencies | No new framework, ORM, auth, state, UI, or data library was introduced. |
| 62 | Real implementation | Models, APIs, controls, UI, encryption, TTL, ownership, migration, and tests are executable—not mock documentation. |
| 63 | Delivery report | This register plus the final handoff records files, verification, flags, and remaining external approvals. |
| 64 | Context, not surveillance | The implemented model uses explicit saves/opt-ins, verified reality, minimization, and direct customer controls. |

## Production feature controls

Create each key in Admin → Operational Control Center with group `PLATFORM` and value `{"enabled": true}`. Production defaults to disabled until the version passes the existing submit, independent approval, activation, and rollback workflow.

- `HEALTH_HUB`
- `JOURNEY_PERSISTENCE`
- `ANONYMOUS_JOURNEY_MIGRATION`
- `HUB_SUPPORT`
- `HUB_BENEFITS`
- `HUB_FAMILY_ACCESS`
- `HUB_PRESCRIPTION_CONTEXT`
- `AI_PERSONAL_COMPANION`

The assistant flag enables the bounded, deterministic tool layer only. It does not enable a general-purpose model, clinical decision support, prescription interpretation, or autonomous action.

## Required external approvals before regulated launch

- U.S. pharmacy counsel confirms business model, state scope, prescription handling, family/dependent access, retention, and deletion limitations.
- Privacy/security review confirms data maps, encryption keys, audit retention, breach response, vendor agreements, and least-privilege roles.
- Accessibility review validates WCAG behavior with keyboard, screen readers, zoom, reduced motion, and mobile devices.
- Operations validates customer-facing state mappings, support ownership, service-level expectations, and rollback exercises.
