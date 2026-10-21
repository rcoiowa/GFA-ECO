# October 21 language guide reconciliation

Status: implementation candidate for review. No merge, deployment, publication, provider activation, new operational-policy ratification, or live acceptance is represented by this record.

## Authority and provenance

The user directed application of the October 21, 2026 integrated guide throughout RecoveryOS and graceforaddictions.org, then explicitly requested the corrections. The user supplied START_HERE and identified [the current Language Guide](https://docs.google.com/document/d/1-d14PsU94gOCkaVCtAVMBzg0mZ7chzFcvIqgkazfpm4) as matching revised Guide 08. It was read in full (12 sections; modified October 21 at 16:00:21 UTC). Its text is preserved under `docs/source-documents/language-guide/2026-10-21.txt` and rendered as the current `docs/language-guide.md`. The former repository edition is retained under `docs/archive/`.

The separate uploaded developer handoff, claims guide, and detailed 113-pair review were not readable in this Mac task. This patch applies the confirmed Guide 08; it does not claim review of those additional files. Their reconciliation remains part of the root task's review.

Base: `43bd9c288a397aef1fdcf16afe44e432ca50fb86`. This is a separate review branch. The candidate `fixed3f93d250436c725f92e6ff642487a74a9dcf8236` in the saved coding task was not available here and was not changed.

## Corrections

- Canonical tagline and formal Grace name across the active public UI and embedded GFA site.
- Contextual Grace language: respect self-description and identity, distinguish observation from inference, preserve precise service and required terms, avoid unsupported neurological and outcome claims, and explain actual requirements.
- Clear distinction between opening support options and completing a human connection; removal of blanket availability and free-service claims where this review did not establish their scope.
- More precise staff incident wording and participant learning copy.
- Housing status wording now distinguishes receipt from review, waitlisting from priority or availability, bed assignment from readiness, and a declined application from a completed referral. Required move-in steps and uncertain loading states are described directly.
- Current editorial authority linked from agent orientation; regression checks added to ordinary CI.

## Operational boundaries

Actual rights, eligibility, fees, screening, safety, privacy, and human support remain governed by current operational authorities. Original policy documents, legal terminology, validated instruments, historical audits, and database identifiers are not subjected to automatic replacements. Specific policy commitments are not withdrawn merely because they contain words such as “always.”

The Grace prompt changes semantically, so code reports `grace-policy-1.2.1`. The approved model lock and its `grace-policy-1.2.0` evaluation evidence are preserved. Those historical results do not qualify this candidate. Consent requirements, provider activation posture, deterministic safety floor, AI disclosure, permissions, and data handling remain unchanged. Provider evaluation of 1.2.1 and release approval are required before activation/deployment; no live provider call is part of this patch.

## Coverage and outstanding acceptance

Current source scope: platform UI, embedded GFA HTML/JS, UI and safety packages, current directory landing page, Grace system prompt, and editorial authority. The guard catches named regressions; it is not a claim-evidence engine or proof that every phrase is compliant. Participant records, testimonials, CMS content, and policy source files require contextual review with their evidence and permissions.

The Wix published site and DEV rebuild were identified. Public homepage claims were inspected and draft replacements are recorded in `docs/content/wix-language-replacements-2026-10-21.md`. Saving source does not update Wix Editor or prove the Cloudflare-served artifact is current. Wix publication, Cloudflare deployment, authenticated service tests, external communications, and database writes are outside this patch.

The Wix API returned the DEV Editor URL, but no API for editing static Editor text was established. The in-app browser was unavailable to this task. Native Chrome opened the DEV editor tab; subsequent interaction was paused because the browser reported active user changes. No Wix text edit or save was attempted.

Supabase metadata confirmed RecoveryOS-Launch (`cqcxvwoukyhxyokfwnjm`) as active; this does not prove application acceptance. The Cloudflare connector returned an internal error on two read-only schema requests. No Cloudflare mutation was attempted.

Required completion evidence: review the remaining integrated sources, resolve Wix draft edits, pass CI on the exact review commit, visually inspect changed pages and flows, evaluate the candidate Grace policy, and obtain separate release authorization. A block or skip is not a passed required check.

Local checks: all four language-guard tests passed, the regression scan passed across 150 authored files, and `git diff --check` passed. These verify bounded source properties only. Node, pnpm, Docker, and the Supabase CLI were not available on this Mac; no runtime or container installation was performed. Ordinary pull-request CI is the available path for compile, unit-test, and build evidence. The existing live Grace workflows deploy and use service credentials, so they must not be used as a substitute for an approved isolated evaluation.
