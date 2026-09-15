# FiveCRM retirement packet (decision 8A, 2026-09-15) — PREPARATION ONLY

**Decision:** FiveCRM is RETIRE — not ratified in the GFA/RecoveryOS intake
architecture; no new intake architecture may depend on it. **This packet
authorizes nothing:** no record deletion, no account closure, no live-site
removal. Evidence is preserved before retirement; any live removal gets its
own Wix approval. Fields marked ☐ are evidence slots for the human/dashboard
steps.

| # | Determination (8A) | Current evidence | Status |
|---|---|---|---|
| 1 | Exact Wix form/page/link creating the handoff | Live form "My Form" (`58582b0f-63bf-40ba-834e-611cc4187af8`, created 2026-01-25): one APPOINTMENT field booking "Prevention Check-In" (30-min phone); its **thank-you message links to** `https://awsna01.fivecrm.com/273529/user_files/webpage/001/IntakeDemographicsForm.html`. Page placement: best candidate is component `comp-mm9hnpl41` (component→form mapping not REST-verifiable). ☐ Editor confirmation of which page(s) host the form. | PARTIAL (REST-proven link; placement pending) |
| 2 | FiveCRM account ownership / administrative control | ☐ Who holds the `awsna01.fivecrm.com` account (`273529` appears in the URL path); credentials custody; admin contacts. | OPEN (human) |
| 3 | Historical GFA records in FiveCRM? | ☐ Yes/no; date range; approximate volume. | OPEN (human) |
| 4 | Data categories collected (schema level, no unnecessary PII) | The linked page is titled "IntakeDemographicsForm" — demographics implied. ☐ Field-list capture from the form page itself (schema only, no submissions). | OPEN |
| 5 | Contractual / retention / export / deletion obligations | ☐ Contract/subscription terms; export capability; deletion process; any BAA/DPA. | OPEN (human) |
| 6 | Current staff workflow dependency? | The Wix automation for "My Form" emails a staff contributor role, so a staff-facing flow exists around the check-in booking; whether anyone works *inside* FiveCRM is ☐ staff confirmation. | OPEN (human) |
| 7 | RecoveryOS-native replacement pathway | Prevention Check-In booking → the canonical appointments path (`create-meeting-canonical` → `recoveryos.appointments` RPC once the booking convergence lands); demographics/intake → the Contact Connect lead workflow (0147R lifecycle) and, for housing, the hardened `residence-intake`. No new Wix-side data store. | PROPOSED (rides existing gated work) |
| 8 | DEV-first removal/replacement + verification plan | On DEV (under the DEV implementation authorization when granted): remove the FiveCRM link from the thank-you message; re-point the check-in flow at the ratified replacement (or a neutral "we'll contact you" message until the replacement is release-ready); verify no other FiveCRM reference exists on DEV (site-wide search); executive review; live change only under its own Wix approval per the ratified DEV-first sequence. | PREPARED (plan only) |

**Evidence-preservation rule:** before any retirement mutation anywhere,
capture: the form's current configuration (done, REST), the thank-you link
(done), the FiveCRM form page itself (☐ capture), and the determinations
above. Historical FiveCRM records are preserved per #5 obligations — export
before any account action, under its own approval.

**Boundary reminder:** decision 8A does not authorize touching the live Wix
site, the FiveCRM account, or any data. Every mutation is a later, separately
approved step.
