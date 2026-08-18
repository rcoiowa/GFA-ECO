# P4D — Messaging & Scheduling Connection Loop Report

**Date:** 2026-08-08
**Backend authority:** RecoveryOS-Launch (`cqcxvwoukyhxyokfwnjm`), schema `recoveryos` only
**Frontend authority:** `apps/platform`
**Gate status:** typecheck ✅ · build ✅ · tests ✅ (103/103)
**Sub-slice order honored:** P4D-1 messaging completed and verified before P4D-2 scheduling began.

P4B promised *"We've got your request."* P4C put a person behind it. P4D lets those
two people actually talk and choose a time — the technology now sits behind the
relationship, not in front of it.

---

## A. Messaging schema/contract audit

Audited both git (`supabase/launch/migrations/0025/0026`) and the live launch
project before writing any UI. Findings:

- `conversations` already carries a **(participant, coach, context) unique
  index** and an optional `coaching_relationship_id` — a reliable uniqueness
  link existed; no schema addition needed.
- `conversation_members` is **explicit membership** (role, `can_read_history`),
  so ending a relationship does not silently revoke or grant visibility.
- `messages` had body length 1–4000 enforced, but **no creation path existed at
  all** — no INSERT policy on conversations/members, no RPC. Messaging was
  structurally unreachable, which meant P4D could define the write path cleanly.
- `msg_member_insert` allowed direct member INSERT (sender pinned to self by
  RLS but **no active-relationship check** and no notification/measurement
  evidence).
- `msg_mark_read` was an **unrestricted row UPDATE** for members — a member
  could rewrite message *bodies*, and a sender could mark their own messages
  read. Unsafe read-state mutation, corrected (§G).
- `msg_member_select` included `is_admin_staff()` — **admins could read message
  bodies** (§I).
- **No realtime publication existed** for any table.
- **Launch-blocking discovery:** the curated launch `0010` kept schema USAGE but
  dropped dev's table-level grants — the `authenticated` role had **no
  privileges on any recoveryos table**. Every direct PostgREST read/write in the
  platform (P4A–P4C surfaces included) would have failed with 42501 on the first
  real HTTP request. SECURITY DEFINER RPCs masked it in DB verification; the
  deliberately un-passed HTTP gate is precisely the gate that would have caught
  it at soft launch. Fixed in `0110` (below) by restoring the archive project's
  proven posture, verified against the archive's actual grant matrix.

## B. Conversation lifecycle

Coaching Relationship → Conversation → Members → Messages, exactly as the
canonical schema models it. One relationship pair ⇒ one `coaching` conversation
(unique index is the arbiter). The conversation **survives relationship end**:
members keep read access to history; sending is blocked server-side with the
humane code `relationship_ended` ("This conversation is read-only now.").
**Policy flag for your approval (conservative default shipped):** former
participants and coaches retain read-only history access indefinitely; no new
messages after the relationship ends; no admin body access ever. If you want a
different retention/visibility rule, it's a one-function change server-side.

## C. Conversation creation/uniqueness

**Option B — lazy, on first open/send** — via `ensure_relationship_conversation`
(0109, SECURITY DEFINER). Chosen because it needs no change to the claim
transaction and creates nothing until a human actually goes to talk. Properties,
all DB-verified: server-authoritative (caller from `auth.uid()`, counterpart
validated against an ACTIVE coaching relationship — the client never supplies
the pairing as authority), idempotent (`ENSURE p1=ready idem=same_id
coach_side=same_id` — both sides resolve the same conversation forever),
participant may omit the argument (primary active coach implied), and an
unrelated user gets `not_authorized` — arbitrary pairings are impossible.

## D. Message send authority

`send_message(conversation_id, body)` (0109) is **the only write path** — the
direct INSERT policy was dropped, so the RPC's guarantees are structural, the
same pattern as P4C's cancellation hardening. Server derives `auth.uid()` →
person → membership; sender identity and `created_at` are pinned server-side.
Body is trimmed; empty → `empty_message`; > 4000 chars → `too_long`; non-member
→ `not_authorized`; ended relationship → `relationship_ended`. DB-verified:
spoofed direct INSERT as another member is denied by RLS
(`direct_insert=denied`), a member UPDATE touching bodies hits **0 rows**
(`member_update_rows=0`), and foreign send/read both fail
(`foreign_send=not_authorized foreign_read=0`).

## E. Participant messaging experience

`/vrcc/messages`, now a real nav destination (the deliberate 8th — Messages is
the first genuinely two-way human surface, documented in the shell comment).
One thread with the primary coach, resolved server-side. Shows the coach's
display name and role label, chronological thread grouped by day
(Today/Yesterday/date), clear sender distinction (aligned bubbles + screen-reader
"You said:"/"Jordan said:" attribution), per-message local times, a labeled
composer with 4000-char bound, send state, and a humane failure alert — **the
draft survives a failed send** (tested). Auto-scroll follows new messages only
when the reader is already at the bottom; it never fights someone re-reading
older messages. If there's no relationship yet, the page explains gently and
points at Connect — no dead thread, no fake chat. Mode C of Connect gained a
real **Message** action.

## F. Coach messaging experience

`/coach/messages` (thread list: participant name via the relationship-scoped
roster RPC, unread badge, unread-first ordering) and `/coach/messages/:personId`
(thread). This is strictly "my threads": RLS scopes reads to membership, and the
list additionally filters to conversations where the caller is personally one of
the two people — **no universal inbox exists**, and an admin visiting the page
sees nothing that isn't theirs. Threads whose participant is no longer on the
active roster render as "Earlier participant (no longer an active participant)"
— readable history, honestly labeled. The coach participant view gained a real
**Message {name}** action.

## G. Read/unread semantics

Inspected `messages.read_at`: a single recipient-side timestamp is semantically
sound **for a strict two-member conversation** (each message has exactly one
non-sender), and P4D's conversations are exactly that. Explicitly defined:

- A message becomes read when its conversation is **actually presented** to the
  recipient — `mark_conversation_read` is called from the thread view only,
  never from background fetches or list pages.
- Only the recipient side can mark: the RPC updates rows where
  `sender <> caller`; a sender can never alter read state (verified:
  `own_msgs_marked=0`), and clients cannot UPDATE messages at all.
- Unread count = incoming messages with `read_at is null`, derived per
  conversation (`getUnreadMessageCounts`, RLS-scoped).
- **Future flag:** this model does NOT scale to multi-member conversations
  (navigator joins, group support). That needs per-member read receipts
  (`conversation_members.last_read_at` or a receipts table) — noted for the
  slice that first adds a third member; nothing in P4D builds toward the wrong
  model.

## H. Messaging privacy/RLS

Full rolled-back verification on the launch project (fixture identities, every
assertion in one transaction ending in a deliberate exception):

```
ENSURE p1(default)=ready idem=same_id coach_side=same_id foreign=not_authorized
SEND p1=sent trimmed=yes empty=empty_message overlong=too_long
     foreign_send=not_authorized foreign_read=0 direct_insert=denied member_update_rows=0
COACH unread_in=1 reply=sent notif_coach=1 notif_part=1 body_leak=0 dedup=1
READ code=marked marked=2 own_msgs_marked=0 notif_cleared=0 foreign_mark=not_authorized
T1=derivable T4a=derivable
ENDED send=relationship_ended history_readable=3
ADMIN conv_meta=1 msg_bodies=0
```

Participant A cannot read/send into B's conversation; coach A cannot touch coach
B's threads; ended relationships are read-only; notification bodies never
contain message content (`body_leak=0`).

## I. Admin transcript-access review

The audit found admin message-body access existed **solely from broad
support-staff logic** (0026's `is_admin_staff()` in `msg_member_select`), not
from a deliberate care-access decision — exactly the case §43 says to tighten.
0109 removed it: **administrators now see conversation metadata (existence,
membership, recency) and zero message bodies** (`ADMIN conv_meta=1
msg_bodies=0`). System administration is not care access. If a future
safeguarding/compliance requirement needs supervised transcript access, that
should be an explicit, audited capability you approve — not a role side effect.

## J. Realtime architecture/status

First genuine need, adopted with the canonical-authority shape:
`postgres_changes` → doorbell → TanStack invalidation → canonical refetch.
**No second websocket-owned message store exists.**

- 0109 added exactly `recoveryos.messages` and `recoveryos.notifications` to the
  `supabase_realtime` publication — no all-database subscription. RLS
  (member-only / recipient-only SELECT, freshly tightened) gates which rows the
  server delivers to a subscriber.
- The thread subscribes filtered to its own `conversation_id`; subscriptions are
  torn down on unmount/route change (`removeChannel` in the effect cleanup);
  supabase-js re-joins channels on reconnect.
- Duplicates are structurally impossible: events only invalidate; the message
  list is always the canonical read, and sends refetch rather than append.
- **Fallback:** the thread query keeps a 15 s polling heartbeat and unread
  counts poll at 20 s, so messaging degrades to P4B-style refresh semantics if
  the channel can't connect.
- **Honesty:** websocket delivery could not be exercised end-to-end from this
  environment (no HTTPS egress to `*.supabase.co` — same boundary as the HTTP
  gate). Publication + RLS gating are DB-VERIFIED; the client wiring is
  CODE/TEST-VERIFIED; live socket behavior belongs to the soft-launch HTTP
  harness run. **Because realtime is not yet proven live, P4B/P4C's 20-second
  polling was NOT retired anywhere (§14)** — realtime is an accelerator on top
  of a correct baseline.

## K. T1 evidence — First Human Response

**Defined and measurable.** T1 = the earliest coach-authored message in the
relationship's canonical conversation:

```sql
select min(m.created_at)
from recoveryos.messages m
join recoveryos.conversations c on c.id = m.conversation_id
where c.coaching_relationship_id = :relationship_id
  and m.sender_person_id = c.coach_person_id;
```

Timestamp authority is `messages.created_at` — pinned server-side in
`send_message`, immutable to clients (no UPDATE path exists), so the evidence
cannot be backdated or edited. Frontend analytics
(`first_human_response_observed`) is instrumentation only, never the source.
**Association logic for multiple requests:** T1 attaches to the
*relationship* (via `conversations.coaching_relationship_id`); a support
request's T1 is that of the relationship its claim created (the claim
transaction links request → relationship, with `support_request_events` as the
audit trail). A second request from an already-connected participant does not
reset T1 — it belongs to the same relationship conversation. DB-verified
derivable on the fixture chain.

## L. First two-way exchange evidence — T4a

T4a = the moment both people have authored at least one message:

```sql
select greatest(
  (select min(m.created_at) from recoveryos.messages m
    join recoveryos.conversations c on c.id = m.conversation_id
    where c.coaching_relationship_id = :rid and m.sender_person_id = c.participant_person_id),
  (select min(m.created_at) from recoveryos.messages m
    join recoveryos.conversations c on c.id = m.conversation_id
    where c.coaching_relationship_id = :rid and m.sender_person_id = c.coach_person_id));
```

DB-verified derivable. **T4a is recorded as raw evidence and is NOT labeled
"meaningful human connection"** — a "Hi"/"Thanks" exchange is bidirectional
without being meaningful. T4b (first substantive service event) remains
unmeasurable until service-event attestation exists (§W). **TTMHC: NOT YET
APPROVED — not calculated, not published, not named anywhere in code or docs.**

## M. Messaging notifications

`send_message` emits an in-app notification to the other member: title **"New
message from {first name}"**, body deliberately empty — message content is never
copied into notifications (verified `body_leak=0`), URLs, analytics, or logs.
Links use safe internal paths (`/vrcc/messages` participant-side,
`/coach/messages/{participant}` coach-side; `safeLinkPath` passes both, still
refusing external/protocol paths). **Dedup:** one unread message-notification
per thread surface — a second incoming message doesn't stack another
(`dedup=1`). **No notification loop:** presentation-marking clears the thread's
notifications inside `mark_conversation_read`; reading emits nothing. External
fanout remains OFF.

## N. Messaging tests

- **DB (rolled back, §H):** creation idempotency both directions, foreign
  create/send/read/mark denial, spoof + tamper impossibility, trim/empty/
  overlength, unread→read transition scoping, notification dedup + content-free
  bodies, ended-relationship policy, admin metadata-not-bodies, T1/T4a
  derivation.
- **Domain (7 new):** day grouping (Today/Yesterday/older), empty thread,
  unread incoming counts per side, thread attention (unread + who spoke last).
- **Component:** `MessageThread` (5) — both-sender attribution, day labels,
  trimmed send + composer clear, **failed send preserves draft** with humane
  copy and no technical detail, empty-draft disabled, gentle empty thread.
  `MessagesPage` (2) — no-coach state points at Connect with no dead composer;
  connected state opens the thread under the coach's name with no database
  vocabulary.

## O. Scheduling contract audit

Re-verified all six canonical RPCs on the launch project before UI:
`create_booking_request`, `propose_booking_times`,
`counter_propose_booking_times`, `accept_booking_proposal`, `cancel_booking`,
`reschedule_booking` (0027/0100 — the P3C-B machinery, already proven from the
empty-DB bootstrap). **No appointment mutation logic was recreated; the RPCs
remain the only transaction authority.** RLS: booking rows are two-parties+admin
readable (0026), confirmed live. One genuine gap surfaced: nothing announced
"times were suggested" (only confirm/cancel notified, via
`trg_appointment_notify`). Fixed with the smallest capability: 0111 adds an
exception-safe AFTER INSERT trigger on `booking_proposals` notifying the other
party **once per round** (dedup `times:{booking}:{round}:{recipient}` —
verified: three inserted times produced exactly one notification).

## P. Coach scheduling experience

From the coach participant view, a Scheduling card with four honest states:
**offer** ("Schedule a session" → modality + up to three `datetime-local` times
→ `create_booking_request`; server validates future-ness and the active
relationship); **waiting** ("Times are with {name}" + withdraw via
`cancel_booking`); **respond** (participant's counter-offers listed with
"Confirm this time" via `accept_booking_proposal`, or "Offer different times
instead" via counter — rounds never shown); **confirmed** (session appears in
Today's Sessions/Sessions as before). Client validates the obvious (past times)
with a gentle message; the server remains authoritative.

## Q. Participant scheduling experience

One coherent destination: **`/vrcc/sessions`** ("Sessions"), reached from
Connect (real "View times"/"Open Sessions" links), Today's Next Connection and
Needs Attention, and notification links — deliberately *not* a ninth nav item
(the nav stays calm; every scheduling notification and attention item lands
here). Shows "{Coach} suggested these times" — each rendered in the
participant's local time with the zone spelled out — with **Choose this time**,
and **"These times don't work — suggest another time"** (no raw timestamps: the
counter form is the same three `datetime-local` pickers). Waiting state is
quiet; empty state points at Messages. The confirmed session shows Join (video
with a meeting URL), **Find another time**, and **Cancel session** with a plain
consequence explanation.

## R. Proposal/counter/accept workflow

Server codes map to product truth and nothing else: `confirmed` /
`already_confirmed` → confirmed (a double-tap returns the **same** appointment —
DB-verified `double=already_confirmed same_appt=yes appts=1`); `own_proposal` →
you wait for the other person (verified blocked); `stale_proposal` /
`confirmed_other_time` / `not_open` → "Those times just changed — take a look at
the latest options" and a refetch. Buttons disable while pending; there is **no
optimistic confirmation** — the UI never claims a session the database hasn't
created. Counter-rounds supersede cleanly (`old_round_active=0`) and history
stays canonical without cluttering the UI. Round numbers, proposal ids,
`booking_request` lifecycle, `appointment_id`, and `confirmed_at` never render.

## S. Cancellation/rescheduling

Copy is **"Cancel session"** (never "cancel booking request") with a stated
consequence ("We'll let {coach} know. You can always schedule a new one.") and
an explicit confirm step. `cancel_booking` cancels the negotiation and any
confirmed appointment canonically (verified `appt_cancelled=1`); appointments
are never mutated directly. **"Find another time"** → `reschedule_booking`:
verified the old appointment is marked `rescheduled` and the newly confirmed one
carries `rescheduled_from_appointment_id` lineage (`old_marked=1 lineage=1`).
Reminder cancellation/reseeding stays inside the canonical reminder engine
exactly as P3C-B built it — untouched. Participants see only the current
relevant session.

## T. Timezone/DST verification

Canonical storage stays `timestamptz`; nobody does offset arithmetic — Intl owns
every conversion. Proposal times render via `formatOfferedTime` in the viewer's
own timezone **with the zone label always spelled out**, so the same instant can
never read contradictorily across workspaces (it's the same UTC instant,
labeled). Confirmed appointments keep P4B/P4C's `formatAppointmentTime`, which
honors the appointment's own IANA zone. Time entry uses native `datetime-local`
(the person types in their own local time; conversion to an instant happens on
submit). **DST tested** (domain test, fixed zone): 14:00 UTC renders as 8:00 AM
CST before the 2026-03-08 spring-forward and 9:00 AM CDT after — both hour and
zone label shift correctly. Known server-side limitation, documented: 0100 pins
new appointments' display timezone to `America/Chicago` (correct for the launch
cohort); a per-person timezone preference is future work and is display-only
(instants are already correct).

## U. Appointment/meeting integration

Join Session appears only for a confirmed video appointment that already has a
`meeting_url` — provisioned exclusively through the existing server-authoritative
create-meeting path (0105 edge function). No public fallback URLs are
manufactured, no meeting is provisioned from client data, and P4D changed
nothing in that architecture.

## V. Reminder status

Unchanged and restated: **reminder engine VERIFIED; reminder cron (0104) READY,
NOT ACTIVATED.** Confirmed appointments seed canonical reminder rows exactly as
designed; nothing dispatches until the cron is deliberately enabled at the
HTTP/deployment/soft-launch gate. No UI text promises SMS or email — scheduling
surfaces speak only of what appears in the app.

## W. Service-event distinction/readiness

DB-verified in the scheduling chain: a full propose→accept→confirm→reschedule→
cancel cycle produced **zero service_events rows**. An appointment is still not
proof of service; a message is a communication artifact; a conversation is a
relationship channel. **Recommended completion point (for the relevant future
slice):** an explicit `complete_session(appointment_id, …)` attestation RPC —
coach-initiated, at/after the appointment window — writing a `service_events`
row typed by service_type, with messaging/appointment evidence linkable but
never auto-counted; group/navigation/accompaniment events get their own
explicit attestations. No grant-reporting table was invented.

## X. Measurement timeline T0–T4b

| Metric | Definition | Evidence source | Authority | Denominator | Measurable now? |
| --- | --- | --- | --- | --- | --- |
| **T0** | Support requested | `support_requests.created_at` | DB | all non-fixture requests | ✅ |
| **T1** | First coach-authored message in the relationship conversation | `messages.created_at` (§K SQL) | DB (server-pinned, immutable) | relationships with a conversation | ✅ (new in P4D) |
| **T2** | Request claimed (human acknowledgement — **not** a response) | `support_request_events` type `claimed` / `claimed_at` | DB | claimed requests | ✅ |
| **T3** | Relationship established | `coaching_relationships.started_at` | DB | established relationships | ✅ |
| **T4a** | First two-way digital exchange | §L SQL over `messages` | DB | relationships with a conversation | ✅ (new in P4D) |
| **T4b** | First substantive service event | future explicit attestation (§W) | DB (future) | — | ❌ not yet |

Edge cases documented: multi-request participants attribute T1/T4a to the
relationship (§K); conversations without relationships cannot exist (creation
requires one); ended relationships freeze the evidence rather than deleting it.
**TTMHC NOT YET APPROVED** — no operational definition is calculated or named;
T4a is not converted into it. The raw evidence is now recorded so a future
definition (T4a, T4b, participant confirmation, or a combined rule) loses no
history.

## Y. Analytics instrumentation

Fourteen process-only events added to the typed union: `messages_page_viewed`,
`conversation_opened`, `message_send_attempted`, `message_sent`,
`first_human_response_observed`, `first_two_way_exchange_observed`,
`scheduling_started`, `times_proposed`, `proposal_accepted`, `times_countered`,
`session_rescheduled`, `session_cancelled` (plus the P4C set unchanged). No
message bodies, no scheduling notes, no focus text, no participant content —
ids and timestamps only; the sink remains buffered/pluggable. Canonical
database timestamps remain the measurement authority; analytics is product
instrumentation.

## Z. Accessibility/mobile review

Composer is a properly labeled textarea (`sr-only` label), send is a real
button, disabled states are honest; sender attribution exists for screen readers
independent of bubble alignment; day separators are text, not color; alerts are
tone components with full sentences; scheduling uses native `datetime-local`
inputs (mobile OS pickers, no custom calendar to trap focus); time buttons are
full-width-wrapping rows with ≥44 px targets; the thread column is
`min-h`-bounded flex so the mobile keyboard compresses the scroll area rather
than the composer; auto-scroll never yanks a reader who has scrolled up. No
red-alert urgency styling on unread — quiet counts and plain sentences (§40).

## AA. Build/typecheck/test results

- `pnpm -r typecheck`: green, all 10 packages.
- `pnpm -r build`: green. Chunks: CoachArea 25.51 kB (was 18.72 — messaging list
  + thread + scheduling card), shared messaging/scheduling chunk 34.76 kB
  (11.36 kB gzip, split by lazy import and shared across both areas),
  ParticipantArea 243.60 kB (was 237.02). Realtime adds **zero** new
  dependencies (supabase-js already ships the realtime client). No regression
  worth premature optimization; P4H remains the performance-hardening slice.
- `pnpm -r test`: **103/103** (domain 57, platform 29, recovery-content 17) —
  up from 82 at P4C. New: 7 messaging-domain, 7 scheduling-domain (view
  derivation + timezone/DST), 5 MessageThread, 2 MessagesPage.

## AB. Backend migrations/gaps

**Three migrations, each through the 10-step rule (gap proven → smallest
capability → security review → source-controlled → applied → DB-verified →
repository → UI → tests → this report):**

1. **`0109_messaging.sql`** — `ensure_relationship_conversation`,
   `send_message`, `mark_conversation_read`; drops `msg_member_insert` +
   `msg_mark_read`; removes admin from message SELECT; adds
   messages + notifications to the realtime publication.
2. **`0110_table_grants.sql`** — **launch-blocking fix**: restores table-level
   `SELECT/INSERT/UPDATE` grants to `authenticated` (plus `anon` INSERT on
   referrals and default privileges for future tables), matching the archive
   project's proven posture. Without this, every direct PostgREST call in the
   platform would 42501 at soft launch. RLS policies remain the only row gate.
3. **`0111_scheduling_notifications.sql`** — exception-safe AFTER INSERT
   trigger notifying the other party once per proposal round.

**Known gaps (none block P4D):** pre-claim pool projection still returns `focus`
server-side (render layer omits; carried from P4C); pool/notification realtime
adoption deferred until messaging realtime is proven over live HTTP; appointment
timezone pinned `America/Chicago` server-side (display-only limitation);
multi-member read receipts needed before any third conversation member; T4b
awaits service-event attestation. Standing gates untouched: **no
HTTP-VERIFIED claims** (nothing here traversed the public boundary — statuses
used: DB-, CODE-, BUILD-, TYPECHECK-, TEST-VERIFIED), 0104 cron off, no DNS or
vrcc.app changes, archive project untouched, external SMS/email off, no public
cutover.

## AC. Exact P4E recommendation

**P4E — Navigator Workspace**, in this order:

1. **Navigator contract audit first**: `navigation_relationships` exists (0005)
   but has no lifecycle RPCs, no navigator-scoped disclosure RPC, and
   `assign_participant_coach` (0027) is the only assignment surface — audit
   before building, same as P4C/P4D.
2. **Assignment & triage**: the navigator's pool view over open requests plus
   deliberate assignment (reusing `assign_participant_coach`), with the same
   progressive-disclosure discipline (no pre-relationship free text).
3. **Reuse P4D wholesale**: messaging (`context='navigation'` conversations are
   already modeled — needs only an ensure-RPC extension), scheduling, and the
   attention pattern; presentation differs, hooks don't.
4. **Service-event attestation** (§W) fits naturally here or immediately after —
   navigators and coaches both need "record what actually happened," which
   unlocks T4b and honest service reporting.
5. **Realtime decision**: if the soft-launch HTTP harness proves messaging
   realtime, retire pool/notification polling in P4E; otherwise keep the
   heartbeats.

---

**P4D COMPLETE — READY FOR NAVIGATOR WORKSPACE**
