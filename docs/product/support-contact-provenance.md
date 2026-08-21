# Support-contact provenance

Canonical source in code: `packages/safety/src/ladder.ts` (`GFA_CONTACTS`,
`EXTERNAL_SUPPORT_CONTACTS`). Every user-facing surface reads from there — never hard-code a
support phone number elsewhere.

## Internal — GFA-owned contacts

Verified from the canonical Grace House documents (contact block of every form):

| Contact                     | Number              | Tel URI        |
| --------------------------- | ------------------- | -------------- |
| Grace warmline              | 515-310-DIAL (3425) | `+15153103425` |
| Grace For Addictions office | 515-220-8771        | `+15152208771` |

GFA controls these; a change is an internal decision and lands via `GFA_CONTACTS`.

## External — externally governed crisis/support contacts

GFA does **not** control these numbers. They can drift with no change in this repository, so they
**require periodic re-verification against their authoritative sources** — at minimum at every
launch-readiness review, and whenever a source publishes an update.

| Contact            | Number       | Tel URI        | Authoritative source                      | Last verified |
| ------------------ | ------------ | -------------- | ----------------------------------------- | ------------- |
| Iowa Warm Line     | 844-775-9276 | `+18447759276` | Your Life Iowa (official crisis services) | 2026-08-15    |
| 988 Lifeline       | 988          | `988`          | 988 Suicide & Crisis Lifeline (national)  | —             |
| Emergency services | 911          | `911`          | National                                  | —             |

Copy discipline: claim only what the source supports. Per the 2026-08-15 Your Life Iowa
verification, the Iowa Warm Line is available 24/7 and can connect callers with a Peer Support
Specialist — no stronger claims (e.g. confidentiality guarantees) unless the source states them.

## Drift history

- **2026-08-15 — SAFETY CONTACT DRIFT corrected:** the Iowa Warm Line shipped as 844-309-4304;
  Your Life Iowa lists 844-775-9276. Corrected everywhere in deployable surfaces; the old number
  is retained only in historical/provenance records like this one.

## Guard

`apps/platform/src/lib/supportContacts.test.ts` pins the shipped values (and rejects the drifted
number). A passing test proves what we ship — it can never prove an external number is still
current. Re-verify at the source.
