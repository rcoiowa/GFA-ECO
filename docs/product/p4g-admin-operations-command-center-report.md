# P4G — Admin / Operations Command Center, Access Governance & Evidence

**Status: COMPLETE.** Backend: migration `0117_access_governance.sql` (731 lines) applied to
RecoveryOS-Launch (`cqcxvwoukyhxyokfwnjm`); full privilege/invitation/governance/evidence/audit
verification matrices executed live and rolled back; expanded launch preflight PASSES live.
Frontend: `/admin` placeholder replaced by a real eight-surface command center (lazy chunk
35.44 kB / 9.59 kB gzip); P4F attention models wired into Staff Today and Resident Today;
referral triage moved to its RPC. `pnpm -r typecheck / test / build` all green (127 tests).

Verification vocabulary (unchanged): **DB-VERIFIED** (rolled-back transactional tests against
the live database as real JWT roles), **CODE/BUILD/TYPECHECK/TEST-VERIFIED** (this repo).
**HTTP verification is NOT claimed anywhere** — environment egress to `*.supabase.co` is blocked.

---

## A. Admin contract audit

Audited the live effective policy set (not names, not intentions) for all eight roles before
building UI. Method: enumerated every `pg_policies` row and every SECURITY DEFINER RPC guard
touching admin-relevant tables, then impersonated each role with real JWT claims and measured
actual row visibility and RPC envelopes. Findings that drove corrections:

- `staff_preauthorizations` had a `FOR ALL using is_admin_staff()` posture reachable by
  navigator/program_manager under the helper's historical meaning — the §3 security blocker.
- `referrals_staff_update` (P4F residual) allowed scoped whole-row UPDATE including
  `handled_by_person_id` forgery — closed (§K).
- `audit_log` had no admin read path (write-only) — read policy added, writes remain server-only.
- Messaging/navigation surfaces already corrected in P4D/P4E held: no admin body read anywhere.

## B. Final role/capability matrix

| Role | Reads | Mutates | Scope | Participant-level? | Roles/invites? |
|---|---|---|---|---|---|
| system_administrator | everything platform-admin reads + audit | all governance RPCs incl. system_administrator tier | platform | metadata only, never message bodies/narrative | yes, all tiers |
| administrator | ops summary, evidence, people/roles, invitations, audit, residences | governance RPCs except system_administrator tier; residence/coaching/navigation fallbacks | platform | metadata only, never message bodies/narrative | yes, non-system tiers |
| executive | `admin_evidence_summary` only (aggregate) | nothing | platform aggregate | no | no |
| program_manager | care-operations reads (`is_care_operations_staff`) | operational RPCs only | program/care ops | operational metadata | **no** (verified refused) |
| navigator | own navigation relationships, dispatcher pool | navigation RPCs | relationship | own relationships | **no** (verified refused) |
| coach | own coaching relationships | coaching RPCs | relationship | own relationships | no |
| residence_manager | own residences | residence lifecycle RPCs; grant/revoke limited to residence_staff/resident **within own residence** | residence | residence metadata | scoped only |
| residence_staff | own residences | scoped operational writes | residence | residence metadata | no |

Authority is never inferred from a role name: every cell was exercised as the impersonated role.

## C. Platform-wide `is_admin_staff()` sweep

Swept the entire canonical schema (`pg_proc` prosrc + `pg_policies` quals). Resolution: rather
than chasing ~28 historical call sites forever, `is_admin_staff()` was **redefined to be the
platform-admin predicate** (`select recoveryos.is_platform_admin()`), which tightened every
remaining caller in one drift-free step. It is documented as a deprecated alias, forbidden in
new code (use `is_platform_admin()` / `is_care_operations_staff()` / scoped helpers), and the
preflight permanently asserts its prosrc contains `is_platform_admin` — the misleading name can
never again silently mean "navigator or program manager." No security decision now depends on it.

## D. Staff-preauthorization security correction

`staff_preauthorizations` is now: SELECT limited to platform admins
(`staff_preauth_platform_select`); **zero client write policies** (preflight-guarded); all
writes through `create_staff_invitation` / `revoke_staff_invitation`, both platform-admin
gated with server-derived actors and audit rows. The historic escalation path was tested
explicitly: a navigator calling `create_staff_invitation` receives `not_authorized`
(DB-VERIFIED: `nav_invite=not_authorized`), and direct INSERT/UPDATE as navigator dies at RLS.

## E. Operator-invitation semantic correction

The two colliding meanings were separated with `purpose ('staff'|'operator')`:

- **staff purpose** — consumed by the signup trigger `handle_new_auth_user` v2, which grants
  exactly the pre-authorized scoped roles at signup and stamps `consumed_at`/`consumed_person_id`
  plus an `invitation.consumed` audit row.
- **operator purpose** — explicitly **skipped** by the signup trigger (no premature unscoped
  residence_manager grant; DB-VERIFIED `z_premature_manager=0`), and consumed only inside
  `create_residence_for_current_user`, which validates open/unexpired/unrevoked state and grants
  residence_manager **scoped to the newly created residence** (`z_scoped_manager=1`).

Constraint hygiene: the one-email-forever unique constraint was replaced by a partial unique
index on `lower(email)` where open — re-invitation after consumption/revocation works;
duplicate open invitations are impossible.

## F. Preauthorization lifecycle

Full real path proven DB-side by simulating actual `auth.users` INSERT (the trigger's real
entry point), not by fixture shortcuts: admin creates staff invitation → invited email signs
up → trigger grants exactly the intended scoped role once → invitation consumed → **replay
blocked** (second signup grants nothing: `replay=blocked`); expired and revoked invitations
grant nothing; operator invitation → signup grants nothing → provisioning consumes it exactly
once with the correct scope (`z_consumed=1`). Invitations carry expiry (default 30 days),
revocation, note, creator; consumed rows are historical/read-only.

## G. Privileged-role governance

Explicit tiers, server-enforced: operational staff roles via the ordinary invitation workflow;
`administrator` invitations only by platform admins; `system_administrator` invitations/grants
**only by an existing system administrator** (`privilege_tier` refusal otherwise — a plain
administrator cannot silently mint one). Operator invitations are structurally constrained to
`{residence_manager}` with no pre-existing residence.

## H. Role grant/revoke RPCs

`grant_role_assignment` / `revoke_role_assignment`: caller from JWT; target person validated;
role validated against the enum; scope validated (residence roles require an existing
residence); grantor pinned server-side (`granted_by_person_id`); duplicate active assignment
answered idempotently (`already_granted`); revocation via `revoked_at` — **history is never
deleted**; audit row on both operations. `role_assignments` has zero client write policies
(preflight-guarded).

## I. Scope enforcement

Residence managers can grant/revoke only `residence_staff`/`resident` **within a residence
they manage**; cross-residence attempts and platform-role attempts return `not_authorized`
(DB-VERIFIED). Staff invitations for residence roles refuse a null residence
(`residence_scope_required`) — no accidental global residence_manager. Revocation is
immediate: helpers (`staff_residence_ids`, `is_platform_admin`, …) all filter
`revoked_at is null`, so RLS reflects the change on the next query with no session state.

## J. Lockout/bootstrap protection

`revoke_role_assignment` refuses to revoke the last unrevoked
administrator/system_administrator assignment (`last_admin` envelope; DB-VERIFIED under lock).
No system_administrator was silently invented. Documented recovery path: bootstrap/recovery of
the highest tier happens via the Supabase SQL editor (service role) as a deliberate,
out-of-band operation — never through the application surface.

## K. Residence-referral triage correction

`referrals_staff_update` dropped; preflight asserts no UPDATE/DELETE/ALL policy on `referrals`
ever returns. `triage_residence_referral(referral_id, status)` implements
received → contacted → converted|closed with: residence-scope or platform-admin check,
server-derived handler and `handled_at`, refusal to reopen settled referrals, and forged
`handled_by_person_id` structurally impossible (DB-VERIFIED `forge_rows=0`). The staff UI's
triage buttons now call this RPC (the old direct-update repository path was rewired this
phase — it would have died at RLS otherwise). No automatic identity matching: linkage remains
a human decision (§41 sequence documented in the workflow).

## L. Admin information architecture

Exactly the recommended eight destinations, no module sprawl:
`/admin` (home/attention) · `/admin/operations` · `/admin/access` · `/admin/people` ·
`/admin/residences` · `/admin/evidence` · `/admin/system` · `/admin/audit`.
`AdminArea` is a lazy route area (like Coach/Navigator) guarded by
`RequireRole ['administrator','executive','system_administrator']` — the guard is UX only;
every read is a platform-admin-gated RPC and every write is RPC-only, so the shell grants
nothing. The P4A `AdminWorkspaceShell` placeholder was deleted.

## M. Admin home/attention

Home answers "What needs organizational attention right now?" via
`deriveAdminAttention` (pure, tested): support request waiting past the 24-hour operational
target → unreviewed incidents → overdue follow-ups → applications waiting → open referral
loops → pending invitations; max 5; a quiet system derives an explicitly calm empty state.
Fresh requests under target are **not** alarms (tested). Vocabulary tested to exclude
risk/score/rank/alert/violation. No participant risk ranking, no staff leaderboards.

## N. People & Access

`/admin/people` = `admin_list_people()` (definer, platform-admin gated): display identity,
classification (fixture accounts labeled and excluded from evidence), active role assignments
with scope, and three yes/no engagement facts (active coaching / navigation / residency).
Inline grant/revoke uses the governance RPCs with two-step confirmation and
`roleAuthorityLabel` (e.g. "Residence Manager — Grace House"). **Not a dossier**: no messages,
no notes, no screenings, no grievances, no Pulse narrative — those stay in their authorized
workspaces.

## O. Message/privacy boundary

Permanent and preflight-guarded: `messages` SELECT policies are member-only (preflight fails
if any SELECT qual mentions admin). DB-VERIFIED this phase as an administrator:
`admin_bodies=0` — a platform admin who is not a conversation member reads zero message rows.
Relationship counts in evidence use message **existence** only, computed inside definer SQL;
no body ever transits an admin surface, analytics event, URL, or notification.

## P. Executive role

Posture implemented as designed: aggregate-only. `admin_evidence_summary` admits
administrator **or executive**; `admin_operations_summary`, people, invitations, and audit all
answer `not_authorized`/empty for an executive (DB-VERIFIED: `exec_evidence=true`,
`exec_ops=not_authorized`). Executives route to `/admin` (their role home) where non-evidence
pages state the limitation and point to Evidence. No role mutation, no participant content.

## Q. Program Manager role

`is_care_operations_staff()` (navigator|program_manager|platform admin) was introduced for the
surfaces where program managers have legitimate operational reach (coach assignment,
active-coach listing); everything platform-administrative refuses them. DB-VERIFIED: a program
manager cannot create invitations, grant roles, or read preauthorizations. Program managers
are no longer "administrators by helper naming."

## R. Operator/residence administration

`/admin/residences` shows the portfolio (name, capacity, population served, level of support)
plus waiting counts, and points day-to-day operations at the scoped staff workspace. New
operators enter only through operator invitations (Access page). Grace House remains one
configured residence — nothing Grace-House-specific is hardcoded in platform behavior.

## S. Configuration authority/audit

High-impact transitions and governance writes are RPC-only, actor-pinned, and audited
(invitations, role changes, residence lifecycle, triage). Reference-data edits (residence
descriptive fields) remain ordinary scoped writes — deliberately not ceremonialized. The
consequential-change audit trail is the `audit_log` (§U).

## T. Consent administration boundary

No admin consent-mutation surface was built. There is no "grant consent for participant"
capability anywhere in the admin area; participant authorization remains participant
authorization (P4E consent gating for partner confirmation unchanged). Any future
reconciliation of malformed consent records will be a separate audited exceptional workflow.

## U. Audit viewer

`/admin/audit` reads `audit_log` (SELECT for platform admins; **zero client write policies**,
preflight-guarded). Shows timestamp, action, entity table/id, actor person id, and safe JSON
detail (identifiers and action metadata only — no narrative, no message content).
DB-VERIFIED: actor is pinned server-side (`grant_actor=pinned` — a client cannot spoof it) and
an authenticated user's attempts to edit/delete audit rows touch zero rows (`tamper_rows=0`).

## V. Operational evidence architecture

Aggregation happens in PostgreSQL: `admin_operations_summary()` and
`admin_evidence_summary()` are stable definer SQL functions returning jsonb, gated in-function
(no broad raw-table admin grants added to power dashboards). Both are fixture-aware
(`is_production_person` filters demonstration accounts out of every count). The React layer
only fetches and renders — no client-side joins over sensitive domains, no
`loadEverythingAdminCanSee()`.

## W. Connection funnel T0–T4b

Evidence funnel: requests (denominator), claimed (count + % of requests), still-waiting
(never silently excluded), median and p90 minutes-to-claim (`percentile_cont`, not averages).
Relationship stages: established, active, T1 (coach responded — message existence), T4a
(two-way exchange), each with the established denominator. T4b lives in service evidence
(§AA). **No measure is named TTMHC**; the Evidence page states explicitly that
time-to-meaningful-human-contact is not yet approved and is deliberately not published.
DB-VERIFIED accuracy by exact deltas under controlled fixtures: `req_delta=1 claimed_delta=1
t1_delta=1 t4a_delta=1`.

## X. Navigation outcomes

Needs identified / by category / resolved / partially resolved / unresolved; referrals,
warm handoffs, confirmed connections, participant declined, partner unavailable — every rate
shown against its denominator. Referral-made is labeled OUTPUT; only participant-confirmed
connection is labeled OUTCOME (`ref_delta=1` with `connected_delta=0` proved a referral does
not count as connected).

## Y. Unmet-needs denominator

Unresolved needs have equal structural visibility: the operations summary counts them, the
attention model surfaces open loops, and the Evidence page renders "Unresolved — kept visible"
against the identified denominator with copy stating an unmet need is community evidence, not
a performance failure. DB-VERIFIED: `unresolved_delta=1` — an unresolved need stays counted.
No success-only dashboard exists.

## Z. Residence evidence

Applications, decision distribution, currently housed vs. total capacity, median
length-of-stay from actual admission/discharge dates. House-rule compliance (chores, curfew,
screens) appears nowhere in evidence; discharge carries no good/bad label.

## AA. Service-event evidence

`service_events` is the delivered-service authority: unduplicated people served, events,
by-type breakdown. `appointment ≠ service`, `message ≠ service`, `referral ≠ service` hold
structurally (only attestation RPCs write service events) and were delta-verified
(`served_delta=1` only after attestation). The page states "an appointment on the calendar is
not a service delivered."

## AB. Funding-attribution readiness

Read-only readiness view: events with a funding source vs. unattributed, against the events
denominator. No allocation rules, no double-assignment, no frontline grant-accounting —
attribution remains optional at capture and is a fiscal-review concern for the crosswalk phase.

## AC. Reporting-crosswalk boundary

No funder-specific dashboard/form was built (no Exhibit E/GPRA/RCORP surfaces). The canonical
evidence layer is the single source the future reporting crosswalk will consume; small-cell
suppression is documented as reporting-layer policy, not applied to internal operational truth.

## AD. System health

`/admin/system` shows only provable states with a three-level vocabulary rendered as a legend:
**Configured** vs **DB-verified** vs **HTTP-verified**. Honest states shipped: RLS/privileges
and all governance RPCs DB-verified; realtime doorbell Configured (polling fallback stays until
HTTP proof); reminder engine DB-verified with cron **READY — NOT ACTIVATED** (rendered as
deliberate, not as failure); external SMS/email **Off by design**; public cutover and archive
retirement **Not performed**. Nothing claims "healthy" from configuration alone.

## AE. Staff/resident attention wiring (§39)

`deriveResidenceStaffAttention` now drives a "Needs attention" card on Staff Today (added
`listIncidents` to its existing parallel load; inputs: unreviewed incidents,
submitted/in-review applications, pending passes, active residencies without a bed assignment,
follow-ups 0 for now). `deriveResidentAttention` drives a quiet "For you today" card on
Resident Today (unacknowledged document assignments via `listMyDocumentAssignments`,
incomplete chores due today; pass/meeting inputs false until cheaply derivable). Neither page
was redesigned; quiet-language standard kept. Resident attention routes were corrected to real
destinations (`/residence/schedule` for pass/chores/meeting).

## AF. Analytics

Seven process-only events added to the typed union and wired: `admin_command_center_viewed`,
`admin_evidence_viewed` (page views), `staff_invitation_created` / `staff_invitation_revoked`,
`role_assignment_granted` / `role_assignment_revoked` (after server `ok`),
`residence_referral_triaged` (staff triage action). No emails, names, roles-audit narrative,
or content in properties. The DB `audit_log` — not product analytics — remains the authority
for privileged actions.

## AG. Performance/query architecture

`adminKeys` query-key factory (`operations/evidence/people/invitations/residences/audit`);
TanStack Query throughout; two jsonb aggregate RPC calls power home+operations+evidence
(PostgreSQL does all aggregation); bounded lists elsewhere (invitations 100, audit 100,
people via single definer RPC). No per-row fan-out queries, no client-side totals over raw rows.

## AH. Privacy test matrix (DB-VERIFIED, rolled back)

- administrator cannot read private message bodies (`admin_bodies=0`) ✓
- executive gets aggregates only; no participant content, ops summary refused ✓
- program_manager is not platform admin (invitations/roles refused) ✓
- navigator cannot manage preauthorizations (`nav_invite=not_authorized`; reads empty) ✓
- navigator cannot grant roles ✓
- residence_manager cannot grant cross-residence or platform roles ✓
- foreign residence manager cannot administer another residence ✓
- ordinary participant sees no admin resources (RPCs refuse; tables empty) ✓
- revoked staff immediately lose scoped access (revocation-aware helpers) ✓

All tested against database policy as impersonated JWT roles, not route guards.

## AI. Preauthorization test matrix (DB-VERIFIED)

Staff: create → real signup trigger consumes → exactly the scoped role granted once →
`replay=blocked`; expired fails; revoked fails; invitee cannot modify intended roles (no write
policy). Operator: create (constrained shape) → signup grants nothing (`z_premature_manager=0`,
`z_unconsumed=1`) → provisioning grants scoped residence_manager (`z_scoped_manager=1`) and
consumes exactly once (`z_consumed=1`). Attack paths: navigator/program manager/participant
creation refused; administrator cannot invite system_administrator (`privilege_tier`).

## AJ. Role-governance test matrix (DB-VERIFIED)

Grant scoped correctly; grantor pinned; duplicate active grant idempotent; revocation
preserved historically (`revoked_at`, row kept); revocation immediate through helpers;
cross-scope grant denied; self-escalation denied; unauthorized privileged-role grant denied;
last-admin protection verified (`last_admin=last_admin`).

## AK. Evidence-accuracy tests (DB-VERIFIED)

Controlled fixtures, exact deltas, rolled back: request/claim/T1/T4a each moved their counter
by exactly 1; appointment-only person **not** counted as served; attestation moved
people-served by exactly 1; referral did not count as connected (`connected_delta=0`);
unresolved need stayed in the denominator; medians use stage timestamps via `percentile_cont`;
no TTMHC label exists anywhere; occupancy respects active residency states; length-of-stay
uses actual admission/discharge dates.

## AL. Audit tests (DB-VERIFIED)

Privileged operations write audit rows with the real actor, action, entity, timestamp, and
safe metadata; the client cannot spoof the actor (`grant_actor=pinned`); ordinary
authenticated users cannot edit/delete audit history (`tamper_rows=0`, no write policies).

## AM. Launch preflight

`supabase/launch/preflight/launch_contract_check.sql` extended with §7 access-governance
guards: no client write policies on `staff_preauthorizations`/`role_assignments`/`audit_log`;
no `referrals` UPDATE/DELETE/ALL policy; message SELECT quals contain no admin predicate;
`is_admin_staff` prosrc must contain `is_platform_admin`. Re-run against RecoveryOS-Launch
after all P4G work: **"LAUNCH CONTRACT PASS — schema usage, table privileges, anon scope, RLS
posture verified."** Still not a substitute for HTTP.

## AN. HTTP/E2E soft-launch checklist (prepared for P4H — not run, not claimed)

Each item = authenticated HTTP against the launch project via the real frontend or harness:

1. Register (invited + ordinary) / sign in / sign out
2. Person bootstrap + onboarding completion
3. Role routing to each workspace home (participant, coach, navigator, staff, resident, admin, executive)
4. Participant support request (T0) + Connect states
5. Coach claim (T2) + open-pool disappearance
6. Participant ↔ coach messages both directions (T1/T4a observed)
7. Mark read + unread counts + content-free notifications
8. Scheduling: request → propose times → accept/counter → appointment
9. Notification doorbell over live realtime (only then may polling retire)
10. Session completion (complete_session) → service event exactly once
11. Navigator claim of navigation request
12. Navigation message (context='navigation')
13. Need identified
14. Referral created
15. Warm handoff / participant confirmation → loop closure
16. Navigation service attestation
17. Residence application submit (public form)
18. Residence review → decision
19. Admission → residency
20. Bed assignment / release
21. Resident reads own residence surfaces (and nothing else)
22. Residence-support designation + message (context='residence')
23. Residence service attestation
24. Admin staff invitation → real invited signup → scoped role granted
25. Operator invitation → signup → provision residence → scoped manager
26. Admin role grant/revoke + immediate effect on the affected session
27. Cross-role denial spot-checks (participant→admin surfaces, navigator→invitations, admin→message bodies)
28. Cross-residence denial (foreign manager)
29. Admin evidence + operations summaries render with real data
30. Referral triage received→contacted→converted/closed
31. Preflight + advisors re-run post-verification

## AO. Reminder/external-delivery status

Unchanged and rendered honestly in `/admin/system`: reminder **ENGINE = DB-VERIFIED**,
**CRON (0104) = READY — NOT ACTIVATED**; external SMS/email **OFF**; in-app notifications the
only delivery channel. No cron activation and no external delivery occurred in P4G.

## AP. Accessibility/mobile

Admin pages use the shared shell/primitives: labeled selects (explicit `<label htmlFor>`),
44px minimum touch targets (`min-h-11`), `role="alert"`/`status` on feedback, two-step
destructive confirmations rendered as text buttons with visible state, responsive grids
(`sm:`/`lg:` breakpoints), and the same nav shortLabel treatment as other areas on small
screens. No color-only meaning; status chips carry text.

## AQ. Build/typecheck/test results

- `pnpm -r typecheck` — green (10 projects).
- `pnpm -r test` — green: **127 tests** (77 domain — including 5 new admin attention/authority
  tests — 33 platform, 17 recovery-content).
- `pnpm -r build` — green; **AdminArea chunk 35.44 kB (9.59 kB gzip)**, lazy-loaded.
- Preflight against RecoveryOS-Launch — **PASS** (§AM).

## AR. Backend migrations/gaps

Launch migration set now 0100–0117; P4G added `0117_access_governance.sql` (helpers +
preauthorization hardening + signup trigger v2 + operator gate + governance RPCs + triage +
audit read + evidence layer). Applied to the live launch project; in git; preflight-guarded.
Known accepted gaps (deliberate, not defects): follow-up counts in staff attention default 0
until a scoped residence follow-up read exists; resident pass-decision/meeting attention
inputs default false until cheaply derivable; executive surface reuses `/admin/evidence`
rather than a separate `/executive` area; HTTP-dependent items (realtime retirement of
polling, cron activation, external delivery, public cutover) remain gated.

## AS. Exact P4H recommendation

P4H = **Production Hardening & Soft-Launch Verification**, in this order:

1. Stand up an environment with real HTTPS egress to the launch project and run §AN 1–31,
   recording each as HTTP-VERIFIED; fix-and-rerun until clean.
2. Only after §AN 9 passes: retire the messaging polling fallback.
3. Activate reminder cron 0104 (explicit authorization) and observe one full cycle.
4. Decide external-delivery gate (SMS/email) separately — consent + provider verification.
5. Security advisors re-run + secrets/env review + error-monitoring hookup.
6. Soft-launch cohort (staff + invited participants) behind the existing auth wall; watch
   audit log, notifications, and evidence counters against reality.
7. Then, and only then, the vrcc.app cutover decision package (DNS, redirects, rollback plan)
   as its own explicitly authorized step.

---

*Report generated as part of P4G. Backend facts are DB-VERIFIED against RecoveryOS-Launch
(`cqcxvwoukyhxyokfwnjm`) via rolled-back transactional matrices; nothing herein claims HTTP
verification.*
