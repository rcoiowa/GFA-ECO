# 08 — Bed, Room & Capacity Framework + Bed-Hold Policy

- **Residence applicability:** both (separate inventory + hold policy each) · **Evidence date:** 2026-09-20 · **State:** PREPARED (not effective); **no bed inventory created, no CQCX change** · **Owner:** EJWRH → Operator; Grace House → GFA · **Approval required:** yes · **Supersession:** none

> **Live-evidence caveat:** the **VERIFIED LIVE (2026-09-20)** state below reflects a CQCX read on 2026-09-20 and **must be freshly re-verified before any dependent operational or production action.**

## Current state (VERIFIED LIVE (2026-09-20)) — RecoveryOS records only
- Tables exist: `recoveryos.residence_units`, `residence_rooms`, `residence_beds`, `bed_assignments`. **All empty (0 rows)** for both residences (freshly verified per-residence 2026-09-20). This is a **data gap, not a schema gap** — no migration is needed to populate it.
- **Do not infer physical reality from this.** *"RecoveryOS bed, occupancy and residency records are incomplete and cannot currently establish real-world availability. Physical capacity, occupancy and bed availability require confirmation by the authorized residence operator or manager, followed by controlled reconciliation into RecoveryOS."* The empty inventory does **not** prove a residence is physically empty, lacks beds, or has no current residents.
- Capacity: Grace House `capacity=12`; EJWRH `capacity=null` (PSA says **10 beds** — reconcile).
- Structure: `residence_units → residence_rooms → residence_beds`; occupancy via `bed_assignments (assigned_at/released_at)` linked to `residencies`.

## Framework (both residences; residence-scoped rows)
| Element | Definition |
|---|---|
| Rooms | `residence_rooms` under a `residence_units` row for the residence |
| Beds | `residence_beds` under a room; each bed is the assignable unit |
| Capacity | count of active beds (should reconcile to `residences.capacity`) |
| Bed identifier | stable id/name (e.g., "Unit A · Room 2 · Bed 1") — **never expose a raw DB id publicly** |
| Availability states (proposed) | `available`, `occupied`, `held`, `temporarily_unavailable`, `maintenance` |
| Who may change status | House Manager / residence_manager / residence_staff for that residence (RLS residence-scoped); admin override logged |
| Audit | every status change writes `audit_log` (actor, prior→new, reason) |
| Admission linkage | a bed moves to `occupied` only via a `bed_assignments` row tied to a `residencies` admission |
| Privacy | bed/occupancy is staff-only, residence-scoped; never anonymous/public; occupant identity minimized |

> **Note:** the states `held / temporarily_unavailable / maintenance` are a **proposed** model; `residence_beds` today has only `is_active`. Implementing named states is a **future schema/decision** (out of scope here) — do not build it now.

## Bed-Hold Policy — EJWRH (Operator authority) · DRAFT, not effective
Humane, decision-ready; Operator approves. A hold keeps a resident's bed during an absence rather than treating absence as automatic discharge.
| Situation | Default hold | Fees during hold | Authority |
|---|---|---|---|
| Treatment admission (higher level of care) | up to 30 days | reduced/waived per Operator (PSA 4.2) | Operator |
| Hospitalization | up to 30 days | reduced/waived | Operator |
| Incarceration | case-by-case, short hold + belongings plan | per Operator | Operator |
| Family emergency | up to 14 days | per Operator | House Manager → Operator |
| Approved pass | per Curfew/Pass policy | none | House Manager |
| Unauthorized absence | care-first contact; hold pending documented human decision (never auto-discharge, PSA 6.4) | per Operator | Operator |
Belongings: secured and inventoried; returned respectfully if residency ends. Communication: proactive, documented. Max duration/extension: Operator may extend with documented reason. Return assessment: care conversation + safety/fit review. Accommodation: Fair-Housing/ADA honored. Grievance: resident may grieve a hold/exit decision (Rights & Grievance).

## Bed-Hold Policy — Grace House (GFA authority) · DRAFT, not effective
Same structure; **GFA approves**. Align durations with the Exit & Transition Policy v2.0 and phase model. Family pathway: address dependent children in a hold (belongings, safety, capacity). Outcomes on return: resume / modified support plan / transition (never punitive default).

**Blockers:** enter real inventory (units/rooms/beds) per residence via the authenticated `.app` `/beds` workspace once role authority is set; reconcile EJWRH capacity (10) into DB; decide whether named bed-states need a schema change (future). **No inventory is created here.**
