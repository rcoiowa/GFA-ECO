# RecoveryOS — AI orientation (pointer, not authority)

Memory is **orientation only**. It points at governance; it never replaces it. Verified runtime
evidence — not this file, not memory — determines factual claims about what is deployed.

## ICARE / Emotional Awareness / BARC-10 Authority

**Canonical governance:** `docs/product/recoveryos-icare-integration-authority-v1.0.md`

**Before modifying** ICARE, Grace, BARC-10, emotional-awareness functionality, Support Now, related
reporting, or Thrive-crosswalk behavior — **READ THAT FILE FIRST.**

Non-negotiable summary (the file governs; this is a reminder, not the source of truth):

- ICARE = **Identify → Connect → Assess → Respond → Empower** — a workflow, not assessment domains.
- ICARE is **participant-centered and human-governed**.
- Grace never assigns/infers ICARE stage or participant risk.
- No passive behavioral/emotional surveillance (no emotion inference from text/face/voice/posture/
  breathing/engagement).
- No silent staff alerts and no autonomous escalation.
- BARC-10 = one canonical **10–60 total**. No BARC-derived subdomain scores. No automated BARC
  threshold workflows. **≤35 crisis range is rejected.** **47 = research/reference only** (never an
  automation trigger, cutoff, or access gate).
- Crosswalks (e.g. BARC ↔ Thrive Iowa) are **program-design inference, not validated equivalence**;
  they never auto-trigger eligibility, referral, risk flags, staff notification, or nudges.
- **Human/system-confirmed service events** are the reporting authority; never inflate Grace
  interactions, page views, or drafts into service delivery.
- Research/history may inform design but **cannot override governance.**

## Related locked governance (do not weaken)

- Grace provider config: `grace-model-lock.json` + `scripts/grace-model-lock-verify.mjs`
  (`grace-policy-1.2.0`; provider activation remains OFF; stateless; no transcript persistence).
- ICARE governance locks: `icare-implementation-lock.json` +
  `scripts/icare-lock-verify.mjs`; regression guard `scripts/check-icare-governance.mjs`
  (both wired into CI).
- Canonical backend = Supabase **RecoveryOS-Launch** (`cqcxvwoukyhxyokfwnjm`), `recoveryos` schema;
  retired dev project guarded by `scripts/check-no-retired-ref.mjs`.

Durable project/team memory (if used) should store **only this compact pointer + locks** — never a
copy of the full Authority.
