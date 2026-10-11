# RecoveryOS Today and notes workflow prototype

This buildless, synthetic demonstration explores a minimum necessary workday: role-specific priorities, short private capture, promotion to a commitment, accepted handoff, evidence-based closure, and day close. It extends the direction of the existing staff Today and canonical coach follow-up surfaces without changing their production behavior.

Open `index.html` in a modern browser. All state is in memory and disappears on reload. Use invented information only. Switching demo roles is not authentication or a production permission check. No backend, model, notification, calendar, disclosure, or service record is connected. The interface's private-note filtering is a demonstration, not a security boundary.

## Rebuild and verify

Run from this directory:

```sh
node build.mjs
node core.test.mjs
node --check app.js
```

The ten core tests verify that capture alone creates no commitment; missing next check prevents promotion; replay is idempotent; archiving does not close work; sender ownership persists until acceptance; an unrelated role cannot accept; declined handoffs remain with the sender; evidence and a relational return are required for closure; waiting requires a next check; non-success dispositions remain distinct; and a pending handoff cannot silently disappear. Some scenarios share one test.

These are workflow checks, not production RLS or consent tests. Automated browser checking was attempted in the preparation environment but could not launch Chromium because of sandbox process restrictions. The browser checklist below remains outstanding.

## Browser acceptance

1. Capture invented text, including literal markup; it must render as text.
2. Promote a note with beneficiary, action, outcome, permission basis, and next check.
3. Archive the note; the commitment remains open.
4. Request a handoff; sender stays owner. Switch to receiver and accept or decline.
5. Close with a supported disposition, evidence and return. Missing required fields do not save.
6. Close the demo day and select tomorrow's first action.
7. Check keyboard access, dialog focus, screen-reader labels, mobile width, readability and empty states.

## Integration handoff

Use `apps/platform/src/staff/pages/StaffTodayPage.tsx`, existing coach and navigator follow-up paths, shared UI components, and authorized Supabase data-access contracts as the first integration points. The relational operations architecture already identifies reusable request, relationship, appointment, service-event and follow-up primitives. A global new task database is not justified by this prototype.

Separate capture from institutional records. A private note stays private until its author deliberately promotes permitted information. Service shortcuts must use existing consent and provenance-controlled writers. Operational commitment statuses in this demo are proposed vocabulary and must not be written into existing live follow-up tables without an approved compatible contract.

Before implementation, specify exact object ownership, organization visibility, residence and relationship scopes, human review, retention, assignment acceptance, retry keys, backend denial behavior, and the authorized transition rules. Reuse existing primitives where their semantics fit. Confirm any genuinely missing schema through current metadata and migration-ledger inspection. Do not use browser role labels for authorization.

Production acceptance requires direct API allow and deny tests for actual roles, consent withdrawal, wrong residence, unrelated user, revoked role, repeated request, failed save, failed delivery and unaccepted critical handoff. Retain unique people versus encounters, attempted contact versus human connection, and delivered service versus outcome.

The inspected Cloudflare custom-domain configuration targets `recoveryos-staging` for live community domains. Its name does not establish isolated staging. Verify the actual environment and deployed commit before release; reconcile older repository deployment instructions. Prepared database changes, Edge Function release, frontend deployment, and domain cutover are separate actions. The dormant API prototype is not a fallback.

This package is a design and verification aid. It does not ratify policy, assign staff, grant authority, apply a migration, or authorize an uncontrolled production rollout. Existing GFA governance and an actual accepted implementation scope govern further work.
