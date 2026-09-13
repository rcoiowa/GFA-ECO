# Grace naming terminology audit — 2026-09-13

This register supersedes the earlier file-level inventory. Historical labels quoted
in the naming decision and original evidence are **KEEP-HISTORICAL**, not current
product language. Stable technical names are **KEEP-COMPATIBILITY**. No identifier
migration or decommissioning is authorized here. Human roles remain Peer Recovery
Coach, Recovery Ally, and Recovery Navigator.

## Scope and method

Audited the exact PR #8 head `741822dad3f763fe4589752394aae9986a5263d5`:
692 tracked blobs retrieved through GitHub, all verified against Git blob hashes.
The scan includes hidden tracked files and the lockfile. It excludes Git objects,
installed dependencies, and generated build copies, which are checked separately.

Case-insensitive candidate scan: `rg -n -i --hidden --no-ignore 'compani[o]n'`,
restricted to the tracked-file manifest. All seven retired labels, hyphenated and
identifier forms, and line-wrapped labels are covered by this broad token scan.
DOCX XML and PDF text were extracted separately; this is a text audit, not OCR of
embedded artwork. Five app icons were retrieved; visual artwork is outside the
text-scan completeness claim. No tracked 3D model files were found.

## Disposition

- **REPLACE:** current product/role labels replaced by the first two PR commits;
  the final pass adds the missing retired-label variant to the naming decision.
- **REFINE:** canonical disclosure punctuation corrected in Authority V1.1;
  historical provenance notices and this occurrence-level register completed.
- **KEEP-HISTORICAL:** dated quotations, source evidence, ordinary non-product
  source prose, and the decision’s explicit retirement vocabulary, as listed below.
- **KEEP-COMPATIBILITY:** stable function/route/component/field names and immutable
  migration commentary, as listed below. They do not describe Grace’s current role.
- **RETIRE:** no file deletion required; obsolete product labels are retired by
  the naming decision. Original source evidence remains available.
- **MIGRATE-LATER:** none executed or newly authorized. Any future identifier
  change needs its own approved compatibility plan.

## Exact remaining text occurrences

Locations below use one-based line and Unicode character column numbers after
formatting. Every broad-scan occurrence is listed, including ordinary prose that
is not a Grace label. This register avoids repeating source wording so that the
inventory does not manufacture duplicate legacy-label occurrences.

| File                                                                             | Line | Column | Classification     | Why retained                                                                                                                   |
| -------------------------------------------------------------------------------- | ---: | -----: | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `docs/decisions/2026-09-13-grace-ai-support-navigator-naming.md`                 |   13 |     15 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/decisions/2026-09-13-grace-ai-support-navigator-naming.md`                 |   13 |     37 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/decisions/2026-09-13-grace-ai-support-navigator-naming.md`                 |   13 |     63 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/decisions/2026-09-13-grace-ai-support-navigator-naming.md`                 |   13 |     81 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/decisions/2026-09-13-grace-ai-support-navigator-naming.md`                 |   13 |    102 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/decisions/2026-09-13-grace-ai-support-navigator-naming.md`                 |   13 |    131 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/decisions/2026-09-13-grace-ai-support-navigator-naming.md`                 |   13 |    160 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/discovery/grace-coaching-p0-remediation.md`                                |    6 |      1 | KEEP-HISTORICAL    | Ordinary related-document prose in a dated record; not a Grace label.                                                          |
| `docs/discovery/p1-completion-report.md`                                         |   69 |     43 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/discovery/p1-github-source-of-truth.md`                                    |   19 |     25 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/discovery/p1-github-source-of-truth.md`                                    |   19 |     44 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/discovery/p1-github-source-of-truth.md`                                    |   19 |    304 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/discovery/p1-github-source-of-truth.md`                                    |   39 |     39 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/discovery/reos-blueprint-review.md`                                        |    1 |     52 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/discovery/reos-blueprint-review.md`                                        |   80 |     46 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/launch/launch-foundation-completion-report.md`                             |    1 |     52 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/launch/launch-foundation-completion-report.md`                             |  148 |     37 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/launch/launch-foundation-completion-report.md`                             |  148 |    144 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/launch/launch-foundation-completion-report.md`                             |  286 |     71 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/launch/prelaunch-production-reset-audit.md`                                |    1 |     52 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/launch/prelaunch-production-reset-audit.md`                                |  135 |     19 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/launch/prelaunch-production-reset-audit.md`                                |  135 |     38 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/launch/prelaunch-production-reset-audit.md`                                |  135 |     64 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/launch/prelaunch-production-reset-audit.md`                                |  259 |     10 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/launch/prelaunch-production-reset-audit.md`                                |  259 |     80 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/launch/prelaunch-production-reset-audit.md`                                |  260 |     34 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-authority-v1.0-reconciliation.md`                         |   22 |     36 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-canonical-implementation-report.md`                       |    1 |    188 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-canonical-implementation-report.md`                       |   36 |     33 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-canonical-implementation-report.md`                       |   37 |     10 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-canonical-implementation-report.md`                       |   37 |     29 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-canonical-implementation-report.md`                       |   38 |     43 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-canonical-implementation-report.md`                       |  428 |     76 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-canonical-implementation-report.md`                       |  711 |     55 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-canonical-implementation-report.md`                       |  759 |     68 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-implementation-authority-v1.0.md`                         |    3 |     17 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-implementation-authority-v1.0.md`                         |    7 |     25 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-implementation-authority-v1.0.md`                         |   29 |     10 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-implementation-authority-v1.0.md`                         |   55 |     25 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-implementation-authority-v1.0.md`                         |   63 |     61 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-implementation-authority-v1.0.md`                         |   71 |     47 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |    1 |    544 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |   28 |     19 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |   33 |     60 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |   34 |     12 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |   60 |      1 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |   65 |     75 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |   75 |     14 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |   76 |     17 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |   78 |     12 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |   78 |     31 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |   80 |    180 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |   81 |     69 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |   84 |     51 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |   85 |     36 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |   92 |     38 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |   93 |     27 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |   97 |     58 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |  105 |     61 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |  130 |     36 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |  144 |     10 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |  168 |    148 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |  177 |     36 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |  179 |     24 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |  239 |    257 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |  239 |    285 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |  244 |     34 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |  263 |     77 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |  268 |     58 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |  281 |      3 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |  289 |     12 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |  289 |     32 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |  490 |     36 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |  537 |     36 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |  543 |      9 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |  543 |     47 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |  549 |     22 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |  599 |     20 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |  608 |     11 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |  660 |     48 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/product/grace-ai-source-audit.md`                                          |  673 |      6 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/grace-ai-source-audit.md`                                          |  686 |    138 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/product/recoveryos-icare-integration-authority-v1.0-reconciliation.md`     |    3 |     24 | KEEP-HISTORICAL    | Ordinary related-document prose in a dated record; not a Grace label.                                                          |
| `docs/source-documents/recovering-the-mind/gfa_slogans_seed_viewer.html`         |    1 |   8305 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/source-inventory/component-preservation.md`                                |    1 |     52 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/source-inventory/component-preservation.md`                                |   40 |      8 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/source-inventory/feature-matrix.md`                                        |    1 |     52 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/source-inventory/feature-matrix.md`                                        |   16 |    162 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/source-inventory/feature-matrix.md`                                        |   16 |    229 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/source-inventory/route-registry-sources.md`                                |    1 |     52 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `docs/source-inventory/route-registry-sources.md`                                |   57 |     74 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `docs/source-inventory/route-registry-sources.md`                                |   60 |     42 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `scripts/check-no-retired-ref.mjs`                                               |    4 |     17 | KEEP-COMPATIBILITY | Existing helper-script comment means related check; not a product/role label or identifier migration.                          |
| `supabase/functions/README.md`                                                   |   45 |      8 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `supabase/functions/README.md`                                                   |   45 |     27 | KEEP-COMPATIBILITY | Historical technical identifier retained for source provenance and compatibility; no route, slug, field, or component renamed. |
| `supabase/functions/README.md`                                                   |   47 |     18 | KEEP-HISTORICAL    | Dated evidence or explicitly retired vocabulary; historical notices apply. Not current Grace identity.                         |
| `supabase/launch/migrations/0112_navigation_domain.sql`                          |   23 |     33 | KEEP-COMPATIBILITY | Immutable SQL history; ordinary human-coach or related-block wording, not Grace identity.                                      |
| `supabase/launch/migrations/0112_navigation_domain.sql`                          |  931 |     10 | KEEP-COMPATIBILITY | Immutable SQL history; ordinary human-coach or related-block wording, not Grace identity.                                      |
| `supabase/live-drift/cqcx/0123_housing_applications_least_privilege.APPLIED.sql` |   32 |     22 | KEEP-COMPATIBILITY | Immutable SQL history; ordinary human-coach or related-block wording, not Grace identity.                                      |

## Extracted source-document occurrences

The [source-artifact notice](../source-documents/README.md) covers these retained
original files. Occurrences are numbered in extraction order within each page or
DOCX XML part. Human-worker wording is historical human-role evidence and must
never be mechanically renamed to Grace.

| File                                                                         | Page or XML part  | Occurrence | Classification  | Why retained                                                                                                     |
| ---------------------------------------------------------------------------- | ----------------- | ---------: | --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `docs/source-documents/GFA_ExhibitEAlignmentAnalysis.pdf`                    | 2                 |          1 | KEEP-HISTORICAL | Original human-worker or ordinary related-provision wording; not Grace identity. Source-artifact notice applies. |
| `docs/source-documents/GFA_ExhibitEAlignmentAnalysis.pdf`                    | 3                 |          1 | KEEP-HISTORICAL | Original human-worker or ordinary related-provision wording; not Grace identity. Source-artifact notice applies. |
| `docs/source-documents/GFA_ExhibitEAlignmentAnalysis.pdf`                    | 3                 |          2 | KEEP-HISTORICAL | Original human-worker or ordinary related-provision wording; not Grace identity. Source-artifact notice applies. |
| `docs/source-documents/GFA_ExhibitEAlignmentAnalysis.pdf`                    | 3                 |          3 | KEEP-HISTORICAL | Original human-worker or ordinary related-provision wording; not Grace identity. Source-artifact notice applies. |
| `docs/source-documents/GFA_ExhibitEAlignmentAnalysis.pdf`                    | 4                 |          1 | KEEP-HISTORICAL | Original human-worker or ordinary related-provision wording; not Grace identity. Source-artifact notice applies. |
| `docs/source-documents/GFA_ExhibitEAlignmentAnalysis.pdf`                    | 8                 |          1 | KEEP-HISTORICAL | Original human-worker or ordinary related-provision wording; not Grace identity. Source-artifact notice applies. |
| `docs/source-documents/GFA_ExhibitEAlignmentAnalysis.pdf`                    | 8                 |          2 | KEEP-HISTORICAL | Original human-worker or ordinary related-provision wording; not Grace identity. Source-artifact notice applies. |
| `docs/source-documents/GFA_ExhibitEAlignmentAnalysis.pdf`                    | 8                 |          3 | KEEP-HISTORICAL | Original human-worker or ordinary related-provision wording; not Grace identity. Source-artifact notice applies. |
| `docs/source-documents/GFA_ExhibitEAlignmentAnalysis.pdf`                    | 8                 |          4 | KEEP-HISTORICAL | Original human-worker or ordinary related-provision wording; not Grace identity. Source-artifact notice applies. |
| `docs/source-documents/GFA_ExhibitEAlignmentAnalysis.pdf`                    | 9                 |          1 | KEEP-HISTORICAL | Original human-worker or ordinary related-provision wording; not Grace identity. Source-artifact notice applies. |
| `docs/source-documents/GFA_ExhibitEAlignmentAnalysis.pdf`                    | 9                 |          2 | KEEP-HISTORICAL | Original human-worker or ordinary related-provision wording; not Grace identity. Source-artifact notice applies. |
| `docs/source-documents/GFA_ExhibitEAlignmentAnalysis.pdf`                    | 11                |          1 | KEEP-HISTORICAL | Original human-worker or ordinary related-provision wording; not Grace identity. Source-artifact notice applies. |
| `docs/source-documents/GFA_ExhibitEAlignmentAnalysis.pdf`                    | 12                |          1 | KEEP-HISTORICAL | Original human-worker or ordinary related-provision wording; not Grace identity. Source-artifact notice applies. |
| `docs/source-documents/GFA_ExhibitEAlignmentAnalysis.pdf`                    | 12                |          2 | KEEP-HISTORICAL | Original human-worker or ordinary related-provision wording; not Grace identity. Source-artifact notice applies. |
| `docs/source-documents/GFA_ExhibitEAlignmentAnalysis.pdf`                    | 13                |          1 | KEEP-HISTORICAL | Original human-worker or ordinary related-provision wording; not Grace identity. Source-artifact notice applies. |
| `docs/source-documents/recovering-the-mind/GFA_Enneagram_Slogan_Map.pdf`     | 1                 |          1 | KEEP-HISTORICAL | Original source evidence under the source-artifact notice; no current product authority.                         |
| `docs/source-documents/recovering-the-mind/GFA_Enneagram_Slogan_Map.pdf`     | 1                 |          2 | KEEP-HISTORICAL | Original source evidence under the source-artifact notice; no current product authority.                         |
| `docs/source-documents/recovering-the-mind/RecoveringTheMind_PRINT_6x9.docx` | word/document.xml |          1 | KEEP-HISTORICAL | Ordinary description of the book as a recovery/healing resource; not Grace identity. Original source retained.   |
| `docs/source-documents/recovering-the-mind/RecoveringTheMind_PRINT_6x9.docx` | word/document.xml |          2 | KEEP-HISTORICAL | Ordinary description of the book as a recovery/healing resource; not Grace identity. Original source retained.   |

## External surfaces

- **Staging:** `https://recoveryos-staging.thomas-499.workers.dev` returned HTTP 200. Followed all 24 JavaScript assets discovered from the entry bundle. Two
  old-label occurrences remain in `assets/ParticipantArea-B26GJDvu.js`: character
  offsets 237812 and 242909 (zero-based), respectively the disclosure and page
  lede. **REPLACE — prepared in PR #8; deployment intentionally not performed.**
  Other fetched JavaScript assets had zero matches. Authenticated rendered Grace,
  server-deployed disclosure, and provider responses remain unverified.
- **Wix DEV:** authenticated site `53adebd1-dada-486a-938a-6673f7a1ce74`,
  “GFA Public Site - DEV (Rebuild).” Inventoried all 25 CMS collections. Scanned
  public content: 7 blog categories, 15 posts, 13 tags, 0 booking services,
  0 Import1 items (including drafts), 0 badges, 1 store collection, and 30
  products (including hidden products). Zero retired Grace labels found.
  Blog item `6aa4164d2f4cba398341d92a` has two ordinary prose matches in
  `data.plainContent` and `data.richContent.nodes.8.nodes.0.textData.text`:
  **KEEP-HISTORICAL** — existing article metaphor about hope, not Grace identity.
  No external content edits were required in these records.
- Wix’s listed URL `https://coalitionrco.wixsite.com/website-1` returns its
  404 page. Editor canvas, unpublished page copy, separate CMS sandbox,
  unpublished blog drafts, translations, embedded 2D/3D experiences and
  their assets were not verified. Chrome opened at its profile picker;
  no authenticated editor session was available in the inspected browser.
- Retired YKY was not accessed or changed. Its current state is not inferred
  from old repository reports. Other live sites were not changed.

## Verification and approval boundary

See [validation results](2026-09-13-grace-naming-validation.md) for exact check
results and limits. Participant-source and server-source disclosures are checked
against the canonical sentence. Source agreement does not establish deployed
agreement. Provider-backed evaluations and authenticated live accessibility/E2E
require approved credentials and a matching deployed artifact.

This pass changes naming, disclosure punctuation, historical notices, audit
records, and formatting only. Behavior, consent, stateless V1, memory/retention,
safety/handoff, RLS/privacy, schemas/migrations, routes/APIs/slugs/analytics keys,
model/policy locks, infrastructure, and deployment state remain unchanged.
No merge, deployment, or PR #7 change is authorized or performed. Thomas retains
the separate policy-version decision for the already-approved identity wording
and any future deployment or identifier-migration approval.
