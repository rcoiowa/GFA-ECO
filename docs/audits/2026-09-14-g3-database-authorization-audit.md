# G3 database-authorization audit — read-only/prepared (2026-09-14)

**Gate:** G3 (SEC-DB-001) — database authorization and data isolation
**Method:** full catalog inventory of an isolated Postgres 16 replay of launch
migrations 0001–0146 + seeds (the lineage matching the CQCX applied ledger
tail), with exploit-style negative tests executed as `anon` / `authenticated`.
**Posture:** read-only against all live systems; remediation is PREPARED, not
applied, and NOT yet authorized (the 2026-09-14 executive authorization covers
0148 and the fixture-role revocation only).
**Controlling caveat:** every result is **0146-lineage-derived**. CQCX was not
reachable from this session (Supabase connector unauthenticated). Before G3 can
close, this inventory must be diffed against the live CQCX catalog — live
drift (e.g. dashboard-made objects, the drifted `public.housing_applications`
family, Storage policies) is invisible here.

## 1. Inventory summary (0146 lineage)

| Surface | Result |
|---|---|
| RLS coverage | **84/84 tables** in `recoveryos`/`public` have RLS enabled (none forced; owner/service-role bypass by design). |
| Direct `anon` table/view grants | Only `recoveryos.referrals` INSERT (policy-bounded: `status='received'`, unhandled) + `referrals_id_seq` usage, and `residence_directory_public` SELECT. Matches LIVE-DB-007. |
| Policies | 230 policies. Fully-permissive quals (`true`) exist only on three reference-vocabulary tables (`domains`, `domain_subcategories`, `resource_domains`) — benign. Person-scoped policies are self- or relationship-scoped; staff paths ride the privileged predicates (classification-guarded once 0148 applies). |
| SECURITY DEFINER functions | All have pinned `search_path`; none grants EXECUTE to anon explicitly. |
| Views | 6 total; 4 analytics views are `security_invoker=true` + service-role-only. Two findings below. |
| Sequences | `anon` holds usage only on `referrals_id_seq` (consistent with the referral insert path). |
| Policy role hygiene (informational) | Many 0009/0026-era policies are `TO public` rather than `TO authenticated`; table grants still gate anon, so no exposure — tighten opportunistically, not urgent. |

## 2. Findings (each exploit-confirmed on the replay, then refuted by prepared 0149)

### G3-F1 — HIGH: authenticated write-through on the public directory view
`recoveryos.residence_directory_public` is auto-updatable, owned by `postgres`,
not `security_invoker`, and `authenticated` holds INSERT/UPDATE on it.
**Confirmed:** a plain authenticated role UPDATEd the underlying
`recoveryos.residences` row through the view (renamed a residence), bypassing
residences RLS. Any signed-in participant could alter public residence truth
(names, fees, contact details shown to the public). INSERT is additionally
blocked by base-table NOT NULLs the view doesn't expose, but the grant is real.

### G3-F2 — MEDIUM (hygiene): excess write grants on `check_ins_staff_view`
`authenticated` holds INSERT/UPDATE; `security_invoker=true` means base-table
checks stop actual writes, but the grants are excess privilege.

### G3-F3 — HIGH: anonymous compliance-evidence writes via default function ACLs
Six callable functions were left on Postgres **default ACLs → EXECUTE to
PUBLIC** (anon included; `recoveryos` is PostgREST-exposed per 0010):
`current_person_id`, `has_role`, `staff_residence_ids`,
`my_assigned_document_template_ids`, `my_assigned_document_version_ids`, and
`narr_auto_evidence`. The first five leak little (self-scoped/boolean), but
`narr_auto_evidence` is SECURITY DEFINER and **writes `narr_compliance`**.
**Confirmed:** the `anon` role set a NARR standard to `met` with arbitrary
evidence text. Root cause: pre-0030-era migrations created functions without
explicit `revoke … from public`, and default privileges grant PUBLIC execute.

## 3. Prepared remediation (approval requested — not applied)

`supabase/launch/prepared/0149_view_and_function_exposure_hardening.prepared.sql`
(+ exact rollback):

- revokes client write privileges on both views (anon keeps directory SELECT);
- replaces default PUBLIC execute with explicit grants (`authenticated` for the
  five helpers; owner/trigger-context only for `narr_auto_evidence`);
- root-cause hardening: `alter default privileges` in `recoveryos`/`public`
  stops granting PUBLIC execute on future functions.

Grants/ACL DDL only — no table-structure changes, no row-data mutations, no
function-body changes.

**Replay evidence (2026-09-14):** 0149 applied clean → G3-F1 refuted
(`permission denied`), G3-F3 refuted (`permission denied`, 0 rows written);
anon directory SELECT still permitted; full P0 battery re-passed **36/36**
post-0149 (no regression to predicates, RLS reads, or RPCs); rollback
rehearsed (both exploits return exactly) and 0149 re-applied clean. Static
guard: `scripts/verify-0149-prepared.mjs` (CI).

**Decision requested (yes/no):** apply 0149 to CQCX after 0148, under the same
conditions pattern (pre-apply ledger check, restore point, artifact-hash pin,
post-apply read-back: repeat the two exploit probes expecting refusal, and an
anon directory SELECT expecting success).

## 4. What G3 still needs before it can close

1. **Live CQCX catalog diff** against this inventory (objects, grants,
   policies, ACLs) — requires an authenticated CQCX path; detects live drift
   this replay cannot see.
2. **Storage policies/buckets** — not representable in the replay (stub only);
   live inspection required (the `sites` bucket privacy from 0138 included).
3. **Edge Function service-role usage review** — service role bypasses RLS by
   design; each of the seven active functions' write scope needs review against
   its contract (overlaps SUPA-FN-001/G5; `verify-intake-boundary` already
   covers `residence-intake` statically).
4. **`public.housing_applications` drift family** — deprecated/contained per
   0123/0138; live confirmation that no client privilege returned.
5. Cross-tenant/organization isolation testing at the row level for
   multi-organization scenarios (current data model is effectively
   single-organization; becomes material for White Label/statewide scope).

## 5. Register updates

- **SEC-DB-001**: inventory phase complete on the 0146 lineage; two
  exploit-confirmed findings remediated in PREPARED 0149; disposition now
  *prepared/awaiting authority + live-diff*. G3 stays **BLOCKED/INCOMPLETE**
  until 0149 applies and the live diff + Storage/service-role reviews run.
- New: **SEC-DB-002** (proposed) — policy role hygiene (`TO public` →
  `TO authenticated`) opportunistic cleanup; low risk, no urgency.
