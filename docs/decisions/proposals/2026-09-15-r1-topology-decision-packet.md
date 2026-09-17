# R1 topology decision packet (2026-09-15)

**Status: DECISION PACKET — nothing implemented, deployed, or applied.**
Grounded in the PROPOSED R1 front-door correction design
(`docs/plans/r1-front-door-correction-design-2026-09-07.md`, PR #7 lineage),
reconciled against everything approved since it was written. R1 remains the
last PENDING stage of the ratified lifecycle:
0148 APPROVED → fixture cleanup APPROVED → 0149 APPROVED → revised 0147
APPROVED → receiver redeploys PENDING → **R1 PENDING**.

## What changed since the design was written (reconciliation)

1. **Its §8 "production-actor gate across every privileged path" is now
   structurally delivered** by the approved chain, verified on the replay
   catalog: 0148 guards every role-based predicate (`staff_residence_ids`
   included, closing the residence-scope arm of the intake SELECT policy) and
   filters `trg_application_intake_notify` recipients to production persons;
   0147R guards the intake queue; and all five privileged RPCs the design
   names (`review_residence_application_intake`,
   `find_person_for_intake_conversion`, `convert_application_intake`,
   `admit_applicant`, `review_residence_listing_submission`) authorize through
   the guarded predicates. What survives of §8 is only decision D4 below
   (missing-classification semantics).
2. **`is_production_actor()` now exists** (0147R) — but with
   *missing classification = production* semantics, whereas the design
   specified *missing = deny*. That difference is a real decision (D4).
3. **Numbering collision:** the design proposed prepared migrations numbered
   `0148_intake_consent_evidence` and `0149_intake_production_actor_gate`.
   Both numbers are now taken by approved artifacts. Anything R1 prepares is
   renumbered from **0150** (repeat of the 0147 collision foot-gun avoided).
4. **PR #7's hardened receiver already implements part of §5** (missing-Origin
   rejection, fail-closed Turnstile, siteverify hostname+action). R1's
   receiver work is a **delta on that handler**: slug map, accepting-gate,
   consent boundary, exact schema, streaming byte cap, honeypot removal.
5. **Receiver redeploys are separately gated** (decision 5) and require
   SUPA-FN-001 provenance first — R1 ratification here changes design
   authority only, not deployment authority.

## Decisions requested

**D1 — Topology (the reconciliation record's open "thin gateway vs direct
receiver" question).** Ratify the design's fork: R1 uses the **hardened direct
receiver** (Supabase Edge Function) with Turnstile + platform controls — **no
new Cloudflare gateway Worker**, no DB rate-limit ledger — with the explicit
escape clause retained: if edge rate limiting proves insufficient at
public-activation review, STOP and open a separate architecture gate before
any public activation.
*Recommendation: YES.* Evidence: the receiver's write scope is two INSERT-only
tables with bounded payloads; a gateway Worker adds a second deploy surface and
provenance burden (currently the weakest plane) without removing the need for
receiver-side validation; the Cloudflare account itself is still
UNKNOWN-provenance (plane 6). Fewer moving parts is currently the safer
topology. Risk accepted by YES: rate-limiting depends on Turnstile + platform
controls until the escape clause triggers.

**D2 — Server-authoritative binding + closed accepting-gate.** Ratify the
slug→residence closed map (forms send `"grace-house"`/`"ejwrh"`, never an id;
unknown slug → refuse) and the **accepting-applications server gate, empty in
R1** (every submission refused with `applications_not_open` until a residence
is separately approved to open). The gate is never derived from
`is_active`/`is_public_directory`; the four lifecycle states stay distinct.
*Recommendation: YES — this is the ratified server-authoritative-binding
requirement, fail closed.*

**D3 — Consent boundary + evidence.** Ratify: reject unless
`consent_to_contact === true`; stamp receiver-pinned `consent_notice_version`
+ server `consent_at` as first-class columns (prepared migration, renumbered
**0150_intake_consent_evidence**, prepared under its own later approval).
This closes the write-map's G4 flag (today a contactable application can be
stored with consent false). Application-processing consent only; optional
comms permission stays out of R1 pending consent-policy ratification.
*Recommendation: YES.*

**D4 — Missing-classification semantics (choice, not yes/no).**
- **(a) Keep current semantics** (missing classification = production), and
  add a provisioning invariant in a later prepared migration: every new
  signup gets an explicit `person_classification` row (default production) at
  `handle_new_auth_user` time, so "missing" trends to zero without breaking
  any existing login.
- **(b) Adopt the design's strict semantics** (missing = deny on privileged
  paths): stronger on paper, but requires verifying/backfilling a
  classification row for every current staff login first — an unverified
  backfill would lock real staff out (availability risk on day one), and the
  0030 backfill plus (a)'s invariant achieve the same end state without that
  risk.
*Recommendation: (a).* Either choice is a later prepared migration under its
own approval; nothing changes now.

**D5 — Acknowledge the renumbering** (§3 above): R1 prepared artifacts start
at 0150; the design's §8 migration (its "0149") is reduced to whatever D4
selects, since the approved chain delivered the rest.

## Unchanged prerequisites (from the design; still true)

- `gracehouse4.pages.dev` legacy-kind dependence verified before alias removal
  (ownership/source outside this repo).
- Turnstile secret/site-key provisioning is an ops step under the deployment
  gate, not R1 code.
- Verification is HTTP + browser E2E on an **ephemeral Supabase branch** —
  never synthetic rows in CQCX.
- "Accepting applications" per residence is its own later approval; R1 ends
  with the gate closed.

## Not authorized by this packet

Ratifying D1–D5 grants **design authority only**. Implementation lands as
reviewable prepared work; receiver redeploys still require SUPA-FN-001
provenance + the deployment gate; migrations 0150+ require their own apply
approvals; Cloudflare/DNS/Wix and all other STOP/HOLD gates stay closed.
