# Phase C3-B1 — DEV Project Creation Report (2026-11-12)

**Authorization:** Executive authorization "Phase C3-B1" of 2026-11-12 — creation and
verification of the isolated Supabase DEV project only. **Restrictions honored:** no
migration, bootstrap, fixture, Auth change, Edge Function, Worker, GitHub environment, or
credential change; PR #53 unmerged; production untouched; AR-Prevention-Trials and all
retired projects untouched; no expenditure; no password printed, committed, or transmitted
anywhere (none was ever handled — see §3).

## 1. Pre-creation verification (immediately before creation)

Organization `GFAVRCC's Org` (free tier) reverified as the one containing production CQCX —
unambiguous. Four projects; **only CQCX ACTIVE** → the free tier's second active slot was
open. No project named `recoveryos-dev` existed. The creation tool quoted **no cost** (a
nonzero quote would have required confirmation and triggered the stop condition — it did
not arise).

## 2. Created project — identity record

| Field | Value |
| --- | --- |
| Name | `recoveryos-dev` |
| **Project ref** | **`swvelaicdcatzudeymly`** |
| Organization | `kbnlehuzvpzbupklsiaj` (GFAVRCC's Org) |
| Region | `us-west-1` (same as production) |
| Plan / cost | Free tier / **$0** |
| Status | `ACTIVE_HEALTHY` (verified after creation) |
| Database | Postgres 17.11 (`db.swvelaicdcatzudeymly.supabase.co`) |
| API URL | `https://swvelaicdcatzudeymly.supabase.co` |
| Created | 2026-11-12T04:01:36Z |

**Distinctness verified:** the ref differs from production CQCX (`cqcx…`), retired YKY
(`ykyk…`), `contact-connect-dashboard` (`vlsx…`), and `AR-Prevention-Trials` (`mtgo…`).

## 3. Database password custody

The creation path used generates and holds the password platform-side; **no password
passed through this session at any point.** Executive custody is established by you
setting/resetting the database password from the project's dashboard (Settings →
Database) into your password manager. That reset is also the natural first step of
C3-B2 (the bootstrap needs `DEV_DB_PASSWORD` supplied transiently by you or an
explicitly authorized operator).

## 4. Read-only initial-state verification (item 8)

- **Migration ledger: EMPTY** — exactly the state `bootstrap-dev.py --target dev-project`
  requires before it will apply anything.
- **No `recoveryos` schema; zero user rows anywhere** — only pristine `auth` and `storage`
  internals (GoTrue schema at its platform baseline; no buckets; no users).
- **Extensions:** `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `plpgsql`, `vault`
  installed; **`pg_cron` 1.6.4 available** (installed by the 0104 activation during
  bootstrap), `pg_graphql`, `pg_net` and the rest of the managed catalog available — no
  extension gap against the manifest.
- Service configuration is at platform defaults (Auth confirmations and URLs to be set in
  C3-B3 per the readiness plan; untouched now per the restrictions).

## 5. Production-unchanged verification (item 9, after creation)

- CQCX: `ACTIVE_HEALTHY`, unchanged identity and version.
- All probed public domains still serve `release=4990829e…` against CQCX; the candidate
  Worker still serves `3761d644…`.
- Cloudflare account: the same nine Workers, names and modification times unchanged; no
  `recoveryos-dev` Worker exists (none was authorized).

## 6. Readiness for C3-B2 and the one decision it needs

Everything the bootstrap's gates require is now true: the target exists, is healthy, is
empty, is distinct from production and retired refs, and costs nothing. **C3-B2 needs:**
(1) your approval of the exact identity above, recorded as
`scripts/dev-project-identity.json` (`{"ref":"swvelaicdcatzudeymly","approved_by":…,
"approved_on":…}`) on the feature branch — the artifact the cloud target refuses to run
without; (2) the database password reset into your custody and supplied transiently at
bootstrap time; (3) per your staging direction, C3-B2's preflight will verify managed
permissions, ledger behavior, and synthetic-Auth handling before and during the
hash-pinned bootstrap, with the fingerprint `f7dcadce…` as the acceptance bar.

**Stopped per the authorization.** The project stands created and verified; nothing has
been applied to it.
