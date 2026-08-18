# ICARE — Source-Mining Index (RESEARCH / REFERENCE)

**RESEARCH / REFERENCE ONLY — NOT IMPLEMENTATION AUTHORITY.**
RecoveryOS implementation is governed by
`docs/product/recoveryos-icare-integration-authority-v1.0.md`.
Where any document indexed here conflicts with the Authority, the **Authority governs.**

This index catalogs material that may be **mined** for curriculum, coach/navigator training, UX
inspiration, evidence review, grant/proposal research, and terminology provenance. Nothing here may
drive implementation simply because it was retrieved. Every entry declares what it **may inform** and
what it **must not control**.

Classifications: **RESEARCH — MINEABLE** (Class 3) · **ARCHIVE — SUPERSEDED** (Class 4, see
`archive/`) · **OPEN — NOT PRESENT** (named by governance but not yet ingested into the repo).

Per-source template:

```
### <title>
- Path / provenance:
- Date:
- Classification / authority tier:
- Mineable topics:
- MAY inform:
- MUST NOT control:
- Supersession status:
- Governing canonical document: docs/product/recoveryos-icare-integration-authority-v1.0.md
```

---

## Present in repository

### Recovering-the-Mind slogan corpus (59 slogans)

- Path / provenance: `docs/source-documents/recovering-the-mind/` (GFA IP)
- Classification: RESEARCH — MINEABLE (the _canonical_ slogan data ships as governed content in
  `recoveryos.slogans` / `packages/recovery-content`; this folder is the human source)
- MAY inform: curriculum, reflection prompts, slogan tagging, Connect-stage assets
- MUST NOT control: emotion classification, risk scoring, ICARE-stage assignment
- Governing canonical document: the Authority

---

## OPEN — named by the governance directive but NOT present in this repository

These were referenced by the ICARE governance directive as mineable/archival sources. They are
**not in the repo**; they are recorded here so their absence is explicit and they can be ingested to
the correct class when provided. **Do not fabricate their contents.**

| Named source                                                               | Expected class                            | Ingest to                                       | May inform                                                                           | Must not control                                                                                                      |
| -------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| "Developing Awareness of Emotions"                                         | RESEARCH — MINEABLE                       | `docs/research/icare/`                          | self-awareness prompts, state-vs-emotion education, curriculum, reflection questions | emotion classification, staff diagnostic rubric, Grace inference rules, risk scoring                                  |
| Historical ICARE / RecoveryOS Expansion Plan                               | ARCHIVE — SUPERSEDED                      | `docs/research/icare/archive/`                  | ICARE narrative, historical product concepts, research leads                         | Grace safety architecture, automated triage, passive monitoring, BARC threshold logic, Hope Hub deployment truth      |
| "August 13 Research and Analysis Report"                                   | ARCHIVE — SUPERSEDED / MINEABLE synthesis | `docs/research/icare/archive/`                  | source discovery, UX concepts, curriculum structure, future research questions       | implementation, BARC scoring, automated prioritization, deployment state                                              |
| Rapport / mirroring / tonality / physiology / interoception materials      | RESEARCH — MINEABLE                       | `docs/research/icare/`                          | coach/navigator human-training curriculum                                            | automated scoring, emotion/trust/engagement/risk scoring, surveillance, staff forms claiming another's internal state |
| Hope Hub integration architecture (SSO/OAuth/SAML, ownership, FERPA/COPPA) | OPEN — Tier 3                             | `docs/research/icare/archive/` (until verified) | integration concepts, proposals                                                      | any deployment-truth claim, account-binding design treated as settled                                                 |
| BARC-10 validation literature (47 benchmark provenance/population)         | RESEARCH — MINEABLE                       | `docs/research/icare/`                          | evidence review, describing 47 as a research-informed benchmark                      | presenting 47 as clinical cutoff, access gate, or automation trigger                                                  |

### Archive banner (apply to any Class 4 document placed under `archive/`)

```
SUPERSEDED FOR IMPLEMENTATION.
Retained for research/provenance only.
Do not use this document to determine current RecoveryOS behavior.
Governing authority: docs/product/recoveryos-icare-integration-authority-v1.0.md.
```

Historical material containing rejected behavior (passive mood/activity monitoring, automated
emotional/distress inference, silent staff alerts, autonomous escalation, psychographic profiling,
persistent Grace memory, BARC ≤35 "crisis-range" logic, 47 as predictive clinical cutoff, BARC
subdomain scoring, automated BARC triage, AI-generated ICARE stage, unverified Hope Hub architecture
as settled fact) is retained **searchable and mineable as history** and has **zero implementation
authority.**
