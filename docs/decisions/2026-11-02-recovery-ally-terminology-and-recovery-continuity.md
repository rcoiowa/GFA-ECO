# Recovery Ally terminology & Recovery Continuity framing — 2026-11-02

**Status:** Executive working-terminology decision (Thomas DeGarmeaux, 2026-11-02).
**Scope:** Working documents, planning narrative, and future drafting in this repository.
This record changes **no** master proposal, website copy, RecoveryOS records, database
schema, routes, or other technical identifiers. Any such change requires its own
approved plan (see the identifier-migration boundary in
`2026-09-13-grace-naming-terminology-audit.md`).

## Decision

1. **Recovery Ally** (singular) / **Recovery Allies** (plural) is the term for GFA's
   volunteer relationship role going forward in working documents.
2. **"Support" is preserved wherever it accurately names a service** — peer support,
   recovery support services, family support, Support Now. The change is about the
   role name, not service vocabulary.
3. The **abbreviation "RA" remains provisional** (see verification findings below).
4. **Recovery Circle is a community setting, not an individual role.**
5. **Recovery Continuity** is adopted as a **proposed organizing principle** for the
   case for support and future platform design — proposal status, not ratified
   doctrine. The journey is presented as flexible and participant-directed.
   **Belonging and stability are outcomes people may define and pursue — not stages
   the system should assume they have achieved.**

## Relationship-role narrative (guide, pending role verification)

These descriptions may guide narrative while each role's actual training,
responsibilities, availability, and boundaries are verified:

- **Recovery Coaches** offer structured guidance toward a person's goals.
- **Recovery Navigators** help people explore and connect with practical resources.
- **Recovery Allies** walk alongside people through encouragement, connection, and
  agreed follow-through.
- **Recovery Circles** offer a community space for connection and belonging.

Approved one-page overview language for the Ally role:

> Recovery Allies are volunteers who walk alongside people through encouragement,
> connection, and practical help within their role and training. They help make room
> for relationships and community as people pursue goals that matter to them.

**"Trained" is a role expectation to verify** before presenting it as true for every
current Ally; it is deliberately absent from the sentence above. Recruitment steps,
background checks, matching criteria, and leadership titles (Lead Ally, Mentor Ally,
etc.) are proposals for a future module — they must not become automatic requirements
or collected personal data until the role and workflow are approved.

## Verification findings (repository scan, 2026-11-02 — verified repository evidence)

Scan of the tracked working tree on branch `claude/clever-mendel-6yi7fu`:

1. **"Recovery Ally" is already the ratified role name here.** The Language Guide
   (`docs/language-guide.md`, editorial edition 2026-10-21) and the 2026-09-13 Grace
   naming decisions list the human roles as **Peer Recovery Coach, Recovery Ally,
   Recovery Navigator**. The public GFA pages under `apps/platform/public/gfa/`
   already use "Recovery Ally."
2. **"Recovery Support Ally" and "RSA" appear nowhere** in tracked text. There is
   nothing to replace in this repository; the rename applies to materials outside it
   (e.g., the master proposal), each on its own authority.
3. **Naming conflict to resolve:** the working narrative above says "Recovery
   Navigator"; some source material used **"Resource Navigator."** The ratified name
   in this repository is **Recovery Navigator**. Working documents should use
   Recovery Navigator unless a future decision changes it.
4. **"RA" abbreviation:** no conflicting use of "RA"/"RAs" was found in tracked
   repository text; residence documents use "House Manager" (no Resident
   Advisor/Assistant role exists in current records). Caution: in the wider
   recovery-housing sector "RA" commonly reads as "Resident Advisor," so the
   abbreviation stays provisional for residence-adjacent contexts.
5. **Earlier alignment:** the 2026-09-02 public-site cleansing audit already
   recommended renaming "Accountability Allies" to **Recovery Allies**
   (`docs/audits/gfa-public-site-cleansing-audit-2026-09-02.md`), consistent with
   this decision.

## Governance guardrails on the Recovery Continuity framing

The Recovery Continuity proposal (see
`proposals/2026-11-02-recovery-continuity-alignment-map.md`) must stay inside
already-ratified constraints:

- The **canonical evidence ladder** is ratified in
  `docs/architecture/domain-vocabulary-v1.0.md`: Activity → Engagement → Connection →
  Progress → Outcome → Sustained Outcome. A referral is not a connection; earlier
  stages never masquerade as later stages.
- The same ratification holds **Retention/Continuity is a separate axis, not a ladder
  stage**, with **no generic Retention Score** and **no composite Connection Score**.
  Any proposed "Continuity Score" KPI is therefore **blocked as a composite** unless
  it is redefined as separately-governed atomic measures (e.g., time to first
  response, follow-ups completed, unresolved requests) with ratified definitions.
- **Human Connection Rate remains a deferred KPI**
  (`docs/product/recovery-connection-funnel-measurement-requirement.md`); "connections
  confirmed" reporting inherits that deferral until definitions are ratified.
- Any Contact Connect **"escalation" tracking is human workflow-status tracking
  only.** Autonomous escalation, silent staff alerts, and risk inference are
  prohibited by the ICARE integration authority
  (`docs/product/recoveryos-icare-integration-authority-v1.0.md`).

## Explicitly not decided here

- No RecoveryOS module, schema, queue, dashboard, or metric is authorized.
- No website, master-proposal, or external-communication change is made.
- The four-role framework's operational claims (training, availability, boundaries)
  remain to be verified before external use.
