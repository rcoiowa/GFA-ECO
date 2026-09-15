# Wix live vs DEV inventory — read-only (2026-09-15)

**Gate:** G14 (WIX-001). **Method:** read-only Wix MCP site-context reads plus
anonymous HTTPS crawls of the public surfaces. **Nothing was published,
modified, or configured on either site.** The DEV-first sequence (DEC-008)
remains intact.

## 1. Site-level comparison (fresh, read-only)

| Fact | Live "Grace For Addictions" (`5518d7be…`) | "GFA Public Site - DEV (Rebuild)" (`53adebd1…`) |
|---|---|---|
| URL | https://www.graceforaddictions.org/ (Premium, custom domain) | https://recoveryos.wixsite.com/website-1 — **public URL returns 404** (corroborates the PR #8 external-audit record; DEV is reachable via authenticated APIs/editor only) |
| Status | Published | Published (Free plan) |
| Created / updated | Jun 05 2024 / **Sep 13 2026 23:20** | Sep 11 2026 / Sep 13 2026 23:09 |
| Velo | Enabled | Enabled |
| Contact email | connect@graceforaddictions.org | connect@graceforaddictions.org |
| **Contact phone** | **515-220-8771** (also displayed on the live homepage) | **515-310-3425** | 
| Apps | Identical 14-app suite on both, including Wix Stores (V1), Bookings, Donations, Forms ×2, Groups, Members Area, Chat, Multilingual — and **Wix Hotels**, apparent template residue on a recovery nonprofit site (flag for DEV cleanup review). |

**Finding W-1 (content truth, blocking for G14):** the two sites carry
**different phone numbers**. This is exactly the LIVE-WIX-003 hazard made
concrete — neither value is ratified by recency; the canonical phone must be
explicitly ratified before any DEV content is accepted or published (the
handoff's "do not publish unresolved facts" rule).

**Finding W-2 (change activity):** the live site was edited **Sep 13 2026
23:20** — after the Sep 13 reconciliation records. What changed is not
determinable read-only from here; the Wix editor's revision history should be
reviewed (human step) and the live rollback point captured before DEV work
concludes (the ratified sequence already requires rollback capture).

## 2. Live public page tree (42 pages from `pages-sitemap.xml`)

| Class | Pages | G14 notes |
|---|---|---|
| Core | home, mission, core-values, about, services, services-7, donate, volunteer, privacy-policy, testimonials, events-meetings, sponsors-partners, bylaws-articles, feed, groups, members | `services` vs `services-7` duplication; `testimonials` needs consent verification; `bylaws-articles` maps to the ratified Organizational Transparency section. |
| People | 15 individual person pages (coaches/board) + `copy-of-halina-cegielski` | Leadership/coach roster is an unratified-facts class — every published person page needs current-roster ratification at DEV acceptance. |
| Programs | grace-addiction, anchor-justice, live-out-program, gfa-recovery-circle, inititiave (typo slug), gfa-summer-soirée | Program availability claims need ratification; the typo slug needs a redirect decision. |
| VRCC-era | **`/vrcc`** and **`/app-landing-page`** (both titled "VRCC"); homepage carries a "GFA VRCC" button and "Virtual Recovery Community Center (VRCC)" narrative (5 references) | Naming supersession applies at DEV implementation: the public concept is now **Recovery Community Center — powered by RecoveryOS** (DEC-002/003/005/006); these pages/CTAs are the Wix-side entries in the DOMAIN-003 migration story. No change now. |
| Residue | `copy-of-mission`, `copy-of-faqs`, `copy-of-halina-cegielski`, `gfa-apparel` (Stores V1), member-profile chunks | Duplicate `copy-of-*` slugs → redirect/retire at DEV acceptance; apparel/store scope is a content decision. |

Homepage checks: displayed phone = 515-220-8771; no direct links to
`vrcc.app`, `recoverycommunity.*`, `recoveryresidence.*`, or any Supabase
endpoint were found **on the homepage** (deeper per-page form-endpoint
extraction is follow-up F-2).

## 3. DEV site content (carried forward, not re-crawled)

The public 404 means page-level DEV inspection needs authenticated
Pages/CMS API pulls or the editor. Carried-forward evidence (PR #8 external
audit, 2026-09-13): 25 CMS collections inventoried; public CMS content
including 15 blog posts and 30 products scanned; **no retired Grace labels
found**. The DEV rebuild is 4 days old and structural review has not been
performed page-by-page from this session.

## 4. Follow-ups (read-only, in order)

- **F-1:** ratify the canonical phone (W-1) and the other externally visible
  facts (roster, program availability) into a content-truth register before
  any DEV acceptance.
- **F-2:** per-page crawl of the live site's forms (action endpoints, what
  data each collects, where it lands — Wix Forms vs RecoveryOS receivers) —
  the shadow-intake check (G14/J).
- **F-3:** authenticated DEV page-tree pull (Pages API) for the sitemap
  reconciliation against the ratified architecture (Home / Get Support / What
  We Do / … / Privacy-Consent-Accessibility-Nonclinical Scope).
- **F-4:** live-site revision/rollback state capture (W-2) — required by the
  ratified sequence before publication anyway.
- **F-5:** redirect map for `copy-of-*`, typo, and VRCC-era slugs as part of
  the DEV cutover plan.

No gate state changes: G14 remains BLOCKED (DEV acceptance program not
started); this inventory advances WIX-001 evidence only.

## 5. F-2 addendum — live form/endpoint crawl (2026-09-15, read-only)

Twelve live pages crawled (home, services, volunteer, vrcc, app-landing-page,
donate, grace-addiction, anchor-justice, events-meetings, about, coaches,
testimonials):

- **One public intake form, site-wide:** the Wix "Contact Connect" form
  (`form-8ce6b3ab-…`) renders on every crawled page (master/footer section).
  Its field set — first name, last name, email, phone, readiness dropdown,
  interest, message — maps one-to-one onto the `lead-intake` receiver payload,
  consistent with the canonical pipeline (Wix Forms → server-side automation →
  secret-gated `lead-intake` → `recoveryos.leads`).
- **No shadow intake found in page HTML:** zero Supabase endpoints, zero
  external form actions, zero external iframes in any crawled page. Client
  pages do not write to the backend directly; submission data lives in Wix
  Forms plus the automation hop (the "approved minimum" question for Wix data
  retention remains a G14 policy item — what Wix keeps, for how long).
- **Analytics:** Google Tag Manager / gtag is present site-wide. Governance
  items: what is measured, whether consent-mode applies, and whether any
  form-field data reaches analytics (G4 V8 / privacy plane). No other trackers
  (no Facebook/Hotjar/Clarity/TikTok signatures) were found.
- A second small Wix form component (`comp-mm9hnpl41`) appears on at least one
  page — identify at DEV reconciliation (F-3 scope).

F-2 verdict: the live site is **not** operating as a shadow intake database in
page HTML; the one lead pipe is the known, canonical one. Remaining risk sits
in Wix-side retention of form submissions and automation configuration —
review those in the Wix dashboard during DEV acceptance (human step).
