# Owner Approval Checklist — Gate A

Decisions only the owner can make. Phase A is not complete, and no
implementation gate opens, until each is answered (in writing, in this file
or a successor).

## Structural decisions

- [ ] **R-01 — HousingOps boundary.** Choose one:
  - (a) Housing operations move out of RecoveryOS: this repo keeps only the
    §4.6 bridge (discovery, referral, consent, limited status). Existing
    housing tables/pages are carved out under a governed migration plan.
  - (b) Amend §4.6: this repo/Supabase project remains the housing system of
    record (status quo of phases 4–8).
- [ ] **R-02 — Privacy gate.** Confirm gate status. If closed, approve the
      compliance-remediation stance for data production already collects.
- [ ] **R-05 — Master Spec.** Provide `claude/RecoveryOS-Master-Spec.md` or
      confirm the 2026-08-04 directive supersedes it.
- [ ] **Canonical branch.** Approve creating protected `main` in
      rcoiowa/GFA-ECO from `recoveryos-greenfield-build-8pns7n`, then merging
      `residence-application-flow-jsesw6` (subject to R-01).

## Access grants (unblock discovery/execution)

- [ ] Authorize the Supabase connector (claude.ai settings) → unlocks live
      DB inventory (B-01).
- [ ] Approve sessions on `Grace-For-Addictions/vrcc.app` and
      `RecoveryResidenceOS` (B-02).
- [ ] Provide `CLOUDFLARE_API_TOKEN` for gated deploys (B-03), or perform
      dashboard actions on request.

## Cleanup authorizations (non-destructive until confirmed)

- [ ] Confirm workers `vite-react-template`…`template5` and `vrcc-app` are
      disposable (delete) or state their purpose.
- [ ] Confirm freezing RecoveryResidenceOS `db-migrations.yml` (R-06).
- [ ] Confirm Worker `recovery-residence-os` stays read-only ARCHIVED.
- [ ] Confirm legacy Supabase project `gffosjyiunshhmtpjsqa` audit-then-
      decommission plan (currently UNVERIFIED — may not exist).

## Explicitly NOT requested yet

- No destructive migration approval is sought.
- No production cutover approval is sought.
- No React/framework upgrades are proposed (React 19 already in place).
