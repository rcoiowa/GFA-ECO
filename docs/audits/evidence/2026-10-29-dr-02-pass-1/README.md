# Evidence bundle: DR-02 Runtime Verification, Read-Only Pass 1 (2026-10-29)

This bundle supports
[`../../2026-10-29-dr-02-runtime-verification-read-only-pass-1.md`](../../2026-10-29-dr-02-runtime-verification-read-only-pass-1.md).
It lets another reviewer reproduce or challenge each finding without relying on
the original session. The original captures lived in an ephemeral container and
no longer exist outside this bundle.

**Reviewing environment:** Claude Code cloud session (Linux container, egress
proxy, curl, Playwright Chromium, Node v22.22.0, pnpm 10.34.5).
**Observation window:** 2026-10-29 04:06:13Z – 04:12:02Z.
**Repository revision used for source comparison:** `95b3e6c17ab5ce6ed9431e7f2a5eb4a54c7eec8b`.
The report branch was created from `main` at `3f710a3`.

## Files

| File | Evidence type | Contents |
|---|---|---|
| `http-observations.json` | Live HTTP observation | 42 `curl` GET requests: hosts, the release identifier, routes, and Worker behaviors. Each records URL, method, timestamp, status, an allowlist of sanitized headers, body SHA-256 and size. |
| `browser-observations.json` | Live HTTP observation (browser) | 17 Playwright page loads: navigation status, final URL, every request made, every non-GET request aborted, form field *names*, cookie count, `localStorage` keys, and a SHA-256 of rendered page text |
| `served-artifact-hashes.json` | Downloaded application artifact | SHA-256 and size of the 28 served JavaScript assets (the CSS asset hash is in `http-observations.json`) |
| `supplementary-observations.json` | Mixed; typed per entry | DNS lookups, `/release.json` bodies, the Supabase auth settings read, the **CORS preflight scope deviation**, and the reproducible-build comparison. These were printed to the session transcript rather than written to capture files, and are transcribed here. |
| `harness/probe.js` | Test-harness configuration | The exact Playwright script used. It aborts every request whose method is not GET, HEAD or OPTIONS. |

## The three levels of technical evidence

| Evidence type | Establishes | Does not establish |
|---|---|---|
| **Live HTTP observation** | What a server returned to a specified request at a specified time, from this vantage point | Behavior for other requests, other times, other locations, or signed-in users |
| **Downloaded application artifact** | What code and configuration were present in the served bundle | That the code paths run, or that the server enforces what the client implies |
| **Reproducible source build** | That a named source revision can reproduce the observed artifact byte for byte | The deployment event, the Worker script version, or the Cloudflare bindings |

None of these, alone or together, proves that all three domains share one Worker
configuration, or that cross-domain identity continuity works.

## Sanitization

These items are **excluded**:
- Supabase keys (including the public publishable key).
- Turnstile secrets.
- Cookies and authorization headers.
- Session identifiers.
- Cloudflare `report-to`/`nel` headers, which carry signed reporting URLs.
- Per-session Turnstile challenge tokens. Their URL paths are replaced with `[redacted-per-session-token]`.
- Screenshots.
- Full response bodies and rendered page text. These are represented by SHA-256 hashes.

These are **retained**:
- `cf-ray` and `sb-request-id` request identifiers. Operators can correlate them with server logs; they carry no user data.
- The Turnstile site key prefix (`0x4AAAAA…`), which is public by design.

No participant information was requested or captured. All requests were
unauthenticated, and no account existed in any browser context.

## Reproducing

- **HTTP:** `curl -sS -D - -o /dev/null https://<host><path>` for any entry in `http-observations.json`. Compare the status, headers and body hash.
- **Browser:** `node harness/probe.js <outdir>` with Playwright's Chromium.
- **Artifact:** `sha256sum` of each served `/assets/*` file, compared against `served-artifact-hashes.json`.
- **Build:** follow `supplementary-observations.json` → `reproducible_build_comparison`, then `cmp` each file in `apps/platform/dist/assets` against the served file.
- **Do not repeat** the `residence-intake` CORS preflight under the 2026-10-29 Pass 1 authorization. See the scope deviation entry.

Results will differ if a new build has been deployed since 2026-10-29. Check
`/release.json` first.
