# Technical debt (recorded, NOT fixed under D28) — obsolete DOCX importer

`scripts/import-grace-house-docs.py` is a defunct one-off:
- self-labeled *"One-off: rebuild … from the uploaded Grace House docx set"*;
- hardcoded **dead absolute paths** from a past session (`SRC=/tmp/claude-0/-home-user-…/gh`, `OUT=/home/user/GFA-ECO/…`);
- not wired into `package.json` or CI; not runnable as-is; would rebuild **all** document modules and likely drop hand-curated fields (`summary`, `narrReferences`, `requiresSignature`, `category`).

Because of this, the `.ts` document modules (labeled "generated from docx") are in practice the maintained source, while the `.docx` files remain the human/binder canonical copies. D28 corrected **both** the `.docx` and the `.ts` directly and did not run this importer.

**Options for a separate decision (out of D28 scope):**
- **Repair** the importer (repo-relative paths; preserve hand-curated fields; add a drift check) so `.docx → .ts` is reproducible; or
- **Retire** it (remove the script; update the `.ts` headers to drop the "generated from docx" claim and mark the `.docx` set historical canonical).

No action taken here.
