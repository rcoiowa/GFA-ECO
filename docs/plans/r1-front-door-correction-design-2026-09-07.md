# R1 — Public Application Front-Door Correction Design

**Status: PROPOSED — correction design — NOT implementation authority.**
Persisting this document deploys nothing and authorizes nothing. No code, migration,
RLS, secret, staging, or production change is authorized by this file. The server
acceptance gate remains **closed** and is never inferred from `is_active` or
`is_public_directory`. "Accepting applications" is a separate approval, out of R1 scope.

Date: 2026-09-07 · Branch: `claude/recoveryos-canonical-audit-1pvcwr` ·
Supersedes the R1 posture in commit `d7ab99d` (a rendering fix, not a safe front door).

## Disposition carried into this design

- Correction design: accepted with required revisions (this document).
- Documentation persistence: authorized as a proposed plan only.
- Code / migration / RLS / secrets / staging / production: **not authorized.**
- Staging rollback: **not authorized** (staging exposure held as-is; no link
  circulation, no test-submission requests).
- Accepting applications: **not authorized.**

## Owned corrections to earlier overclaims

- "Hard-bound residence_id" was false — the id came from editable inline JS; the
  receiver accepts any integer. Binding was never server-authoritative.
- "Distinct identity" was false — both forms send `kind:"grace_house_application"`,
  the Grace-House-labeled flow. EJWRH carried Grace House identity underneath.
- The SQL insert/rollback proved table shape only — not the HTTP boundary, consent
  or minimization enforcement, notifications, or staff visibility.
- The staging deploy of this change was not separately authorized for a real-user
  pilot; treated as un-authorized exposure.

## Four lifecycle states (preserved, not collapsed)

Canonical residence identity ≠ Accepting applications ≠ Ready to admit ≠ Fully
operational. R1 repairs the front door and receiver to a safe **closed** state. It
does **not** move any residence into "accepting applications"; that mechanism is a
separate, later, separately-approved gate.

---

## Fork decisions (as directed)

1. **Residence binding:** closed **server-side slug map** for R1. No
   `residences.public_key`, no new lifecycle column. The map fails closed, binds each
   slug to exactly one residence, and submission stays disabled until a residence
   separately enters "accepting applications" (a server constant, empty in R1).
2. **Abuse protection:** integrate **Turnstile** into the existing receiver and forms.
   **No** database IP/rate-limit ledger. **No** new Cloudflare Worker in R1. If
   adequate edge rate limiting cannot be achieved with Turnstile + platform controls
   alone, stop and return to a separate architecture gate **before** public activation.
3. **Grace House door:** the directory form becomes the **canonical** application door;
   the in-app Grace House card points there. `gracehouse4.pages.dev` is **not** touched,
   redirected, or described as informational until its ownership, source, and current
   behavior are separately verified and changed.

---

## Corrected design, item by item

### 1. Server-authoritative residence binding (fail closed)
- Forms send an opaque **slug** (`"grace-house"`, `"ejwrh"`) — never a numeric id.
- Receiver resolves slug → authoritative `residence_id` via a **closed const map**.
  Unknown/missing slug → `400 unknown_residence`. Map is 1:1.
- After resolution, the receiver checks an **accepting-applications gate**: a server
  constant set of currently-accepting slugs, **empty in R1** (all submissions refused
  with `applications_not_open`). The gate is **never** derived from `is_active` /
  `is_public_directory`. Opening a residence is a code change under a separate approval.

### 2. Neutral shared application identity
- New neutral `kind:"residence_application"`; handler and comments relabeled neutrally.
- **Legacy alias handling (revision 1):** before removing `grace_house_application`,
  verify whether `gracehouse4.pages.dev` still posts it (its source is not in this repo;
  verification is a prerequisite, not an assumption).
  - If gracehouse4 does **not** use it → remove the alias.
  - If it must remain temporarily → accept it **only** bound server-side and exclusively
    to Grace House (slug forced to `grace-house`, client id ignored), with a recorded
    **removal condition**: "removed once gracehouse4 is confirmed not to use it, or is
    migrated to `residence_application`."

### 3. Boundary-enforced consent, with evidence (revision 2)
- Reject unless `consent_to_contact === true` (`400 consent_required`).
- Record **evidence**: `consent_notice_version` (a receiver-pinned constant string) and
  a **server** `consent_at` timestamp, stored as first-class columns (not in the answers
  blob).
- This is **application-processing consent** only. Any optional email/SMS permission is a
  **distinct** field, deferred until the consent policy is ratified — not built in R1.

### 4. Exact-schema validation + true streaming byte cap (revision 3)
- **Reject** unexpected fields rather than silently dropping them: enforce an exact
  top-level key schema and an exact **answer-key allowlist**
  (`age_18_plus`, `county`, `housing_situation`, `timing`, `accommodation_needs`,
  `voicemail_ok`); any unknown key → `400 unexpected_field` naming it. Silent removal can
  leave a person believing they submitted something they did not.
- **Remove** the free-text "Anything you'd like us to know?" from the pre-account form —
  it invites clinical/trauma/justice/safety disclosure that Gate-B minimization keeps out
  of pre-account intake. Open narrative belongs to the post-account, consented stage.
- Per-field length caps low (≤300).
- Validate the selected **contact method against the supplied contact**: `email` requires
  a valid email; `phone`/`text` require a phone.
- **True streaming byte limit:** read the request body as a stream with a hard cap,
  aborting mid-stream on exceed (`413`) — not a Content-Length check after the body is
  already read.

### 5. Abuse protection (Turnstile only in R1)
- Require a **recognized Origin**: reject when Origin is absent or not allowlisted
  (browsers always send Origin on POST).
- **Turnstile** widget in both forms; token sent; `TURNSTILE_SECRET` set so the existing
  `turnstileOk` check enforces (secret provisioning is a separate ops step, not R1 code).
- **No** DB rate-limit ledger, **no** new Worker. If Turnstile + platform controls are
  judged insufficient for public activation → stop and open a separate architecture gate.

### 6. Accessibility (revision 7)
- Real `<form>` per house with `onsubmit`/`preventDefault` (restores Enter-to-submit).
- Every control programmatically labeled (`<label for>`), `required`/`aria-required`.
- Error/success regions `role="alert"` / `role="status"` with focus management.
- **Remove the honeypot entirely** (Turnstile replaces its bot-protection role),
  eliminating the focusable-inside-`aria-hidden` violation. Verify with automated
  (axe) **and** keyboard testing.

### 7. Remove unratified operational promises
- Strip "within 2 business days" and waitlist-handling language from copy and success
  states. Replace with neutral, dignity-preserving, non-committal language until response
  deadlines, notification, and routing are ratified.

### 8. Production-actor gate across EVERY privileged path (revision 4 — P0)
- Add `is_production_actor()` (true only if the current person's
  `person_classification = 'production'`; **missing classification → deny / fail closed**).
- Apply it to **all** intake-privileged paths, not just SELECT:
  - `residence_application_intake` SELECT policy;
  - `trg_application_intake_notify` recipient query (test identities receive nothing);
  - `review_residence_application_intake` (SECURITY DEFINER — gate the caller);
  - intake conversion RPCs (`find_person_for_intake_conversion`, `convert_application_intake`);
  - `admit_applicant` (admission);
  - any intake staff-queue view/RPC read path.
- This is a **P0 privacy prerequisite** to accepting applications — not deferred to R2.

### 9. Grace House front-door convergence
- In-app Grace House card → directory form (`?apply=grace`), matching EJWRH.
- `gracehouse4.pages.dev` untouched; no "informational" claim, no redirect, until its
  ownership/source/behavior are separately verified.

### 10. Safe HTTP end-to-end verification (revisions 5 + 6)
- **Never** insert-and-clean synthetic applications in CQCX. Use an **ephemeral Supabase
  branch**, seeded with the minimum residence + staff + classification + notification +
  RLS fixtures, exercise the real HTTP receiver and browser flow, then delete the branch
  under explicit cleanup authority.
- The browser can **never** self-designate `test_fixture` (already true — the receiver
  does not read it from the payload). In test environments the server derives fixture
  status only from **protected environment configuration**, never the client body.
- Assertions: allowlisted-origin POST inserts with the **server-resolved** id; missing/
  foreign origin rejected; `consent=false` rejected; oversize rejected mid-stream;
  unknown keys rejected (not dropped); contact-method/contact consistency enforced;
  notification reaches only production-classified staff for the right residence; staff
  visibility matrix (residence-1 staff → residence 1 only; care-ops → both; test identity
  → none); browser (renders as HTML, labels associate, Enter submits, refuse/success).

---

## Exact proposed file / migration inventory (nothing implemented)

### Code — PROPOSED MODIFY
| Path | Change |
|---|---|
| `supabase/functions/residence-intake/index.ts` | Neutral `kind:"residence_application"`; slug→id closed map; empty accepting-gate constant; Origin-required; Turnstile-enforced; consent enforcement + `consent_notice_version`/`consent_at` stamping; exact top-level + answer-key schema with explicit rejection; contact-method/contact consistency; true streaming byte cap; legacy-kind handling per §2; never trusts client `test_fixture`; env-derived synthetic-fixture path. |
| `sites/recoveryresidence-directory/index.html` | Real `<form>` + associated labels + required/aria; `role=alert`/`status` + focus; Turnstile widget + token; send **slug** not id; neutral `kind`; remove honeypot; remove free-text "anything else"; remove unratified promises. |
| `apps/platform/src/public/residenceListings.ts` | Grace House `applyUrl` → `/residence/directory/?apply=grace` (§9). |
| `scripts/verify-intake-boundary.mjs` | Extend static invariants: Origin-required, consent-enforced, neutral kind, answer-key allowlist, streaming cap, Turnstile-gated, closed accepting-gate, no client `test_fixture`. |

*(The synced `apps/platform/public/residence/directory/index.html` is a gitignored build
artifact regenerated by `scripts/sync-directory-site.mjs`; not committed.)*

### Prepared migrations — PROPOSED, live in `supabase/launch/prepared/`, **NOT applied**
| File | Change | Order |
|---|---|---|
| `0148_intake_consent_evidence.prepared.sql` | Add `consent_notice_version text`, `consent_at timestamptz` to `residence_application_intake`; distinct from any future optional-comms permission. | Independent of 0147 |
| `0149_intake_production_actor_gate.prepared.sql` | `is_production_actor()` (fail-closed on missing classification); apply to intake SELECT policy, `trg_application_intake_notify` recipients, `review_residence_application_intake`, `find_person_for_intake_conversion`, `convert_application_intake`, `admit_applicant`, and any intake staff-queue read path. **P0.** | After 0148 |

### Verification harness — PROPOSED (built + run at implementation time, on a branch)
| Path | Change |
|---|---|
| `scripts/verify-intake-e2e.mjs` (new) + `supabase/launch/tests/` fixtures | Ephemeral-branch HTTP + browser E2E per §10; deletes the branch under explicit cleanup authority; no CQCX synthetic rows. |

### Out of R1 (separate approvals; listed so scope is explicit)
- **Accepting-applications mechanism** (opening the closed gate per residence).
- **Turnstile secret/site-key provisioning** (ops/secret step).
- **`gracehouse4.pages.dev`** ownership/source/behavior verification and any change.
- **Optional email/SMS-permission** consent field (awaits consent-policy ratification).
- Any deploy (staging or production), any RLS/migration apply.

## Apply order (when, and only when, separately authorized)
1. Verify gracehouse4's dependence on the legacy kind (§2).
2. Apply `0148` then `0149` to CQCX; preflight PASS.
3. Land the receiver + form + listings changes; provision Turnstile secret/site key.
4. Run the ephemeral-branch E2E (§10) — all assertions green.
5. Separate **accepting-applications** approval opens the gate per residence.
6. Only then is any residence in the "accepting applications" state.
