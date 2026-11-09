# Circle operational-note sharing decision — November 9, 2026

## Executive direction

The assistant asked: “The immediate decision I need from you is about facilitator notes: should only the person who wrote a note see it, or should other authorized GFA staff be able to see it too?”

Thomas DeGarmeaux answered: “Other authorized GFA staff and leadership are able to see it too.”

This authorizes shared visibility of minimized operational Circle notes. It does not authorize general participant narratives, email-domain membership as staff authority, role creation/assignment, technical-admin narrative access, or production activation without the remaining safety checks.

## Narrow implementation

- The recorder can read their own notes while retaining Circle recording eligibility. Every new documentation reader/writer must have a valid nonanonymous/nondeleted/nonbanned Auth identity and an explicit `production` classification.
- Shared readers need an active GFA recovery-circle series/organization and a qualifying nonrevoked canonical role assignment explicitly scoped to GFA by organization, program or residence. Every supplied scope must agree on the same organization, on that same role row. A role with all scope fields null is not sufficient for sharing.
- Standard Circle staff roles: coach, navigator, program coordinator, residence staff and residence manager.
- CBH staff roles: coach or navigator. A GFA email does not widen this list.
- Read-only leadership roles: program manager, administrator and executive. These roles receive no new recording, assignment, participant or housing access.
- A technical system-administrator role alone, intake-only roles, participant roles, explicit Circle facilitator assignment alone, or GFA-domain email alone do not authorize reading someone else's notes. Non-GFA series are not shared by this rule.
- Series currently has no program/residence foreign key. Those role scopes establish GFA organizational compatibility, not a claim that a series belongs to a particular house or program.
- Current role or classification changes are enforced on the next request. New documentation writes lock the classification row and retain the existing occurrence writer's Auth/role/assignment locks.
- Notes remain limited to meeting process and future facilitation, with no participant names, contact information, diagnoses, trauma details or personal stories. Shared labels appear before entry and on readback.

Existing leadership permissions were primarily aggregate/administrative metadata, not general narrative entitlements. The shared-note branch is therefore a narrow implementation of this new decision, not an assertion that leadership already had narrative access.

## Still unresolved before activation

No Circle-specific retention schedule or correction/removal owner was established by the reviewed sources. Do not invent a duration, promise indefinite retention or declare notes permanently uncorrectable. The implementation preserves originals and rejects conflicting duplicates; it does not yet provide an amendment/removal workflow.

Activation needs a retention rule and responsible reviewer for correction/removal requests, or an explicit interim policy pending those decisions. It also needs isolated real-JWT/PostgREST and concurrency tests, browser acceptance, and live baseline/ledger reconciliation. This sharing decision does not remove those checks.

## Evidence

- Current executive sharing decision: conversation of November 9, 2026, quoted above. Applies to operational Circle notes only.
- Repository: October 5 Circle logging/county/access decisions, September 5 functional-access directive, and P4G access governance. Reviewed against main `b0af2c1` and PR49 `b553035`.
- CQCX catalog metadata, read November 9 around 18:35 UTC: role keys/helpers, schema and current Circle authorization. No participant records read. The current production helper treats absent classification as production; the new documentation gate deliberately requires an explicit row instead.
- [Governance Bundle](https://docs.google.com/document/d/1ENGZmmVWkISp0IGui9AP0cq5A3U6jXg4lOOvR1CNq9Q/edit): original successfully read November 9 at 18:39:15 UTC, modified October 30 at 19:40:15.038 UTC. Supports minimum sufficient records and no convenience-based access expansion. Provider revision/owner and controlling status remain unverified.
- [Privacy policy candidate](https://docs.google.com/document/d/1sHrSYfBXYPiCifGVNgtsUpWh2msQ-tEX/edit): original successfully read November 9 at 18:39:18 UTC, modified October 30 at 19:42:55.016 UTC; effective August 2024. Describes requesting correction/deletion/restriction by contacting GFA, but supplies no Circle retention duration. Provider revision/owner and controlling status remain unverified.

No role, identity, classification, participant record or live schema was changed by this work.
