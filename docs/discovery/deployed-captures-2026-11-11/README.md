# Deployed-source captures — 2026-11-11 (read-only evidence)

Captured 2026-11-11 from the canonical Supabase project **RecoveryOS-Launch
(`cqcxvwoukyhxyokfwnjm`)** through authorized read-only MCP access, during the Prompt 2
reconciliation review (`docs/plans/2026-11-11-gfa-reconciliation-decision-and-release-plan.md`).
These files are **evidence, not source to build from**. Before any redeploy, re-capture the
live source and compare against these hashes; do not assume this snapshot is still current.

| Function | Live version | `updated_at` (UTC) | `ezbr_sha256` (deployment bundle) | Where the source is otherwise recoverable |
| --- | --- | --- | --- | --- |
| `residence-intake` | v7 | 2026-09-28 | `a85382bf…d26a` (`a85382bfa312a3832b3298f82132c264cb47c6722005ac9f2ed67d2fc744d26a`) | **NOWHERE at any branch head** — all 87 remote heads swept 2026-11-11; only this capture |
| `lead-intake` | v16 | 2026-10-07 | `9688a74f…6e10` (`9688a74fc6ba3276c1c903bcb8070735dfa1b8cf24fe8dcd2bf26246d8d64e10`) | branch `codex/rco-iowa-supabase-inquiry-2026-10-07` (PR #33); implementation verified matching on routing, origin sets, permission texts, and handler extensions |
| `grace` | v16 | ~2026-08-06 | `2eab638d…dbc6` | git history, e.g. commit `79172a47` (`supabase/functions/grace/` with `grace-policy-1.2.0`) |
| `ejwrh` | v7 | ~2026-09-25 | `c1891141…1bcf` | not captured; capture before any redeploy |
| `grace-judge` | v9 | ~2026-08-06 | `d952a7af…8862` | not captured |
| `grace-coaching-canary` | v13 | ~2026-08-06 | `d4376d39…7b36` | not captured |
| `create-meeting` | v13 | ~2026-08-06 | `4838ad88…4119` | not captured |

**Why `residence-intake` is captured in full:** the live v7 contains a CORS preflight fix
(`x-client-info` in `access-control-allow-headers`, needed for `supabase.functions.invoke`
browser calls) that exists in **no branch** of this repository. Redeploying from any current
branch would silently remove it and could break residence applications submitted from the
platform directory. See risk finding R1 in the Prompt 2 plan.

Not deployed on CQCX (verified absent from the live function list): `coaching`,
`notify-fanout` (retired-YKY captures, correctly undeployed), `create-meeting-canonical`.

Transcription note: file contents were transcribed from the authorized MCP read. The bundle
hashes above are the deployment checksums recorded by Supabase and are the authoritative
identity of each deployed version; use them, not this transcription, as the comparison
anchor before redeploys.
