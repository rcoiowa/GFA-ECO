# GFARC workspace integration — November 9, 2026

Development candidate based on main e8593b1. This is a frontend integration, not a claim of complete feature parity or production release.

## What changes

- Replaces the visual content of the existing `/coach/circles` page, preserving its route, assignment checks, existing scoped RPC calls, historical records and duplicate-safe behavior.
- Carries forward the selected GFA teal/serif direction with spacious form groups, a short facilitator guide and explicit paths to the Recovery Community Center, recorded meetings and GFA website.
- Reuses the portable JSON → generated CSS reference in `packages/design-tokens/reference`. No global semantic, appearance or housing behavior changes.
- Protects unsaved changes on workspace return links and Circle changes, locks inputs during save, validates count/end time, retains entries after errors, and provides explicit reconciliation/refresh after an uncertain result.

## Source limits and remaining parity work

The owner-private Sites v3 screenshot was inspected. Its source archive and original task could not be read through the available authorized tools. The brief facilitation guidance is a new implementation, not a verbatim migration of the complete Sites guide.

Current `record_circle_meeting` and `get_my_circle_workspace` contracts do not support first-time participant counts or facilitator notes. This candidate states that limitation visibly and does not collect fields it cannot save. It does not import device-local Sites drafts. Complete parity requires a separately tested additive schema/RPC extension, exact field mapping, minimized notes policy, synthetic role/denial tests, and explicit migration/deployment verification. No sensitive records were used in testing.

The public Circle discovery experience is not replaced by a private staff form. Coach and participant access remain separate. No new tables, grants, roles or production mutations are included.

## Release prerequisites

Review the active deployment baseline before publishing; main has unrelated changes and is not automatically the production baseline. Verify the exact deployed commit, canonical backend, a permitted synthetic save/read-back/duplicate retry, denied anonymous/unassigned reads and writes, mobile/keyboard/zoom, direct route refresh and browser history. Do not enable Grace or ship unreviewed migrations as part of this UI change. First-time/notes support and source-guide parity are still open, so do not call the full requested migration finished.

## Local checks

- Final rebased candidate: 113 domain, 21 recovery-content and 230 platform tests passed (364 total); focused Circle suite has 9 passing tests.
- Workspace typecheck and production build passed. Build retains an existing >500 kB chunk warning.
- Core contrast gate, 16 portable theme pairings, canonical-backend guard, ICARE lock/guard, language regression, table access and Grace static model lock passed.
- Browser attempt failed at Chromium process startup (`socket() failed: Operation not permitted`) including the permitted escalated attempt. No visual, keyboard, mobile or browser accessibility pass is claimed for the candidate.
- No production write, migration or authenticated live save was attempted.
