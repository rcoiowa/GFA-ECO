# 16 — Gap & Conflict Report

- **Residence applicability:** both · **Evidence date:** 2026-09-20 · **State:** PREPARED · **Owner:** ED · **Approval required:** yes · **Supersession:** none
- Classification per completion standard: **available & current · available but needs controlled distribution · incomplete · missing · blocked by decision · blocked by counsel · blocked by technical · not applicable.**

## Conflicts (do not silently resolve)
| # | Conflict | Evidence | Resolution path |
|---|---|---|---|
| C1 | **Intake row "real" vs "fixture"** | Reconciled 2026-09-20: r2 row is `test_fixture=true`, `ejwrh-portal`, closed. Prior "1 real intake row" was **wrong**. | Corrected across package. Writer proven; real applicant NOT proven. |
| C2 | **EJWRH capacity 10 (PSA Art. 3) vs NULL (DB)** | PSA "furnish all ten resident beds"; DB `capacity=null` | Operator confirms; then set capacity + build inventory (D12/D13) |
| C3 | **Operator/provider model** | PSA: EJWRH LLC operates, GFA provides; DB: only org GFA (id 1), EJWRH residence is `organization_id=1`, `organization_relationships` empty | Do not infer GFA ownership from org_id=1. Correct via §16 options + D5 (a data-model change, not done here) |
| C4 | **PSA execution status** | Canonical .md = "FINAL FOR EXECUTION … NOT executed authority until signed" | Verify signatures (D6) before relying on operator authority |
| C5 | **Grace House move-in fee** | DB has weekly/monthly fees; no move-in fee | Confirm (part of D10) |
| C6 | **Documents active vs operationally used** | EJWRH 6 editions published, **0 assignments**; GH editions assigned | Training + assignment (D22/D24); active ≠ trained |

## Operator/provider model — decision options (D5; implement nothing here)
- **Option A:** Create an EJWRH **operator organization** row + an `organization_relationships` row (GFA *provides* → EJWRH *operates*); decide whether residence 2's `organization_id` moves to the operator org. (Schema/data change → future migration.)
- **Option B:** Keep residence 2 under org 1 for now; represent the support relationship via `organization_relationships` once its taxonomy + access semantics are decided (ties to the parked Cognitive-Data-Architecture decision). (Still a data change → future.)
- Constraint: never model GFA as a residence; never create a second EJWRH residence record.

## Gap register (by residence)
| Item | EJWRH | Grace House | Class |
|---|---|---|---|
| Canonical residence | id 2 | id 1 | available & current |
| Document editions | 6 published (0 assign) | 14 + 6 shared (assigned) | available & current; EJWRH needs controlled distribution/training |
| EJWRH curfew/emergency/exit/good-neighbor/conduct/employment content | **present in handbook** §1–§4/§6/§9 (A) | separate editions | **not missing** (item 4) — only standalone editions absent, by design |
| EJWRH fee edition / emergency-contact form / printable intake edition | none | (GH: fee edition; GH: intake package) | **missing** (genuine — not merely "no separate doc") |
| DOC referral/placement approval | not established | n/a | **current verification required** (not "DOC-approved") |
| Fees | PSA + DB ($750 private/mo, $250 move-in) | DB; **move-in fee** | available & current / incomplete (GH move-in) |
| Bed inventory (RecoveryOS records) | 0 rows; capacity null | 0 rows; capacity 12 (configured) | **data gap** — not a physical-bed count; confirm physically, then reconcile |
| Real applicant proven | no (fixture only) | no (fixture only) | incomplete |
| Intake owner / backup | — | — | blocked by decision (D20) + Latisha email |
| Final admission authority incumbent | Operator (Curtis White) — role clear; incumbent decisions | GFA — clear | available (authority) / blocked by decision (staffing) |
| ROI / release of information | none | none | **missing** + **blocked by counsel** |
| Emergency-contact form | draft | draft | incomplete |
| Bed-hold policy | draft | draft | incomplete (blocked by decision) |
| Public profile page | none | exists | incomplete (EJWRH) |
| Directory publication | closed | closed | blocked by decision |
| Public routes / clean `/apply/*` | proposed | proposed | blocked by technical (Gate B) |
| Cloudflare DNS/route/cert bindings | unknown | unknown | blocked by technical (**REQUIRES ACCESS**) |
| Turnstile secret for `.org` | unverified | unverified | blocked by technical |
| Email accounts | Latisha/Yvette `@graceforaddictions.org` current | same | available & current (no new accounts) |
| `rcoiowa.org` identities | — | — | not applicable now (PROPOSED/FUTURE) |
| Staff training completion | unknown | unknown | incomplete |
| Latisha/Yvette authority | UNKNOWN — AUTH REQ | UNKNOWN — AUTH REQ | blocked by decision + evidence (email) |
| Operator/provider data model | discrepancy | n/a | blocked by decision (D5) |

## Top blockers (both residences)
1. **RecoveryOS bed/occupancy/residency records incomplete** (0 beds; EJWRH capacity unset) → cannot *establish real-world availability from the database*. Physical availability requires **authorized operator/manager confirmation** (manual/paper acceptable if authorized), then reconciliation into RecoveryOS. Do not read the empty database as proof the residence has no bed/residents; log the digital gap as an operational risk.
2. **ROI:** EJWRH **missing/held**; Grace House has an **unratified draft** (`form_release_of_information.md` v2026.07, not in CQCX). Participant-specific disclosure stays **counsel-gated** (see 11 for the finer communication-type taxonomy — administrative coordination is not automatically ROI-gated).
3. **Role authority (Latisha/Yvette, intake owners)** unestablished → and **Latisha's email is not in evidence**, so her specific requests cannot be mapped yet.
4. **EJWRH PSA execution status** unverified → operator authority basis.
5. **Operator/provider data model** discrepancy (EJWRH under org GFA).
6. **Directory publication + Gate B/C** not authorized.

**Nothing in this package is implemented; all files are uncommitted drafts.**
