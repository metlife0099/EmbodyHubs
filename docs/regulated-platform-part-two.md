# Regulated platform — part two implementation

This document records the implemented controls derived from the attached part-two product specification. It is an engineering control map, not a statement of legal or regulatory compliance.

## Customer journey accountability

- Prescription API responses now derive a responsible party, what the journey is waiting for, and the next permitted action from persisted workflow state.
- Receipt, review, acceptance, and closure are displayed only when represented by a recorded workflow event.
- General support cases have a reference, order link, owner, due date, escalation level, encrypted details/messages, and immutable status history.
- Support UI warns customers not to place medical or prescription information in general support cases.

## Pricing certainty

- Checkout requests a server-side, 15-minute cash-price quote before payment.
- Quotes contain medicine, delivery, tax, other fees, membership savings, and final total.
- Estimates and confirmed totals are distinct. Production checkout fails closed unless an active `ORDER_PRICING` control explicitly permits confirmed pricing.
- The paid order preserves the quote reference and component-level breakdown. Insurance pricing is explicitly unsupported in this flow.
- Quote use is transactionally single-use and bound to the customer, cart configuration, and destination state.

## Exception and recovery operations

- The admin Journey Operations center synchronizes overdue prescription handoffs, support SLAs, privacy due dates, partner expiry windows, and failed payments into a persisted exception queue.
- Recovery actions can retry a still-pending secure handoff or suspend new routing to a partner.
- Recovery actions cannot accept/reject a prescription, change clinical reasoning, bypass eligibility, or alter a pharmacist's decision.
- Partner metrics separate response acknowledgement and turnaround from rejection categories. Clinical rejection is not scored as poor performance.

## Membership controls

- Admin plans include the annual fee, benefits, eligible products, funding source, savings limits, renewal/cancellation/refund terms, and unit-economics inputs.
- An active plan is rejected when configured projected economics are negative.
- Customer membership shows the paid fee, annual limit, terms, renewal status, and an actual-savings ledger.
- Savings are recorded only when an eligible order is created from a confirmed quote.

## Family access

- Family access uses a verified-account invitation; submitting an invitation grants no access.
- Commerce permissions and health-data scopes are stored separately.
- Requested health scopes become active only after the linked user authenticates and consents.
- Consent expires after one year and either party can revoke it.
- This technical consent flow does not establish that a person is a legal personal representative. Production policy must account for applicable federal and state law.

## Required production gates

Before enabling production prescription or payment flows, the operator must complete legal review, business-model approval, jurisdiction and partner verification, pricing/tax configuration, payment-provider webhook verification, security/risk assessment, incident response, breach-notification procedures, staff training, vendor/BAA review where applicable, and end-to-end acceptance testing. No UI or encryption feature alone establishes HIPAA, FTC, pharmacy-law, tax, or payment compliance.
