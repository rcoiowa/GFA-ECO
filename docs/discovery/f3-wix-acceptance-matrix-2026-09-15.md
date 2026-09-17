# F-3 — Wix live ↔ DEV page-by-page acceptance matrix (2026-09-15)

**Gate:** G14 (WIX-001/WIX-002). **Method:** authenticated read-only Wix REST
(Item SEO Tags, cursor-paged to completion, 44/44 pages both sites; Form
Schemas List Forms; Automations V2), plus the F-2 crawl. **Nothing was
edited, published, or restored.** Classifications are proposals for the DEV
acceptance program — they authorize nothing.

## 0. Controlling discovery — the DEV "rebuild" is an unmodified clone

**The LIVE and DEV page sets are IDENTICAL: same 44 page itemIds, same slugs,
same titles, same descriptions, same three SEO overrides.** Differences are
only mechanical (domain, title suffix, DEV's whole-site noindex from the free
wixsite.com subdomain). The ratified future information architecture (Home /
Get Support / What We Do / Meetings & Events / Stories & Impact / What GFA Is
Building / About GFA / Get Involved / FAQs / Contact / Privacy-Consent-
Accessibility-Nonclinical Scope) **does not exist on DEV yet** — the rebuild
work is entirely ahead. One matrix therefore serves both sites; the "DEV
slug" column is implied identical.

### Material findings (checkpoint-trigger candidates)

- **F3-A — External third-party intake surface (HIGH, RATIFY FIRST/likely
  RETIRE):** live form "My Form" (`58582b0f-…`, the best REST candidate for
  component `comp-mm9hnpl41`; component→form placement is not REST-verifiable)
  books a "Prevention Check-In" 30-minute phone call and its thank-you message
  links to an **external FiveCRM page**
  (`awsna01.fivecrm.com/...IntakeDemographicsForm.html`) — an intake
  demographics form on a third-party vendor outside RecoveryOS consent,
  minimization, and audit boundaries. No ratified decision covers FiveCRM.
  This is exactly the "Wix as/toward a shadow operational system" condition
  the governance forbids.
- **F3-B — The Wix → lead-intake wiring is UNVERIFIED and possibly absent:**
  the only automation on "Contact Connect" sends a **triggered email to the
  submitter** and upserts a Wix contact — **no webhook, no external POST, no
  staff notification** is visible via the Automations API. The `lead-intake`
  receiver's documented contract expects a Wix automation POST with a shared
  secret. Either the wiring lives in Velo backend code (not readable via
  these REST APIs) or it does not exist — in which case new inquiries reach
  no staff channel except the Wix submissions inbox. Live CQCX historically
  held 2 leads, so *something* wrote leads at least twice. **Dashboard/Velo
  verification item; treat the pipeline as UNKNOWN—EVIDENCE REQUIRED, and do
  not describe Contact Connect → RecoveryOS as wired until proven.**
- **F3-C — "copy-of" slugs are live content, not residue:** `/copy-of-mission`
  is actually the **FAQs** page, `/copy-of-faqs` is **FAQs (Español)** (Spanish
  parity exists!), and `/copy-of-halina-cegielski` is **Kayla Smith**, a real
  person's page under another person's copy-slug (dignity + SEO problem).
  These are REWRITE/REDIRECT, never delete.

## 1. Acceptance matrix (44 pages; live slug = DEV slug)

Legend: classification ∈ KEEP / REWRITE / REDIRECT / RETIRE / **RATIFY FIRST**
/ MISSING. "Future IA" = the ratified sitemap section. W-1 (canonical phone)
stays **RATIFY FIRST** everywhere contact facts appear — no phone value is
chosen by this matrix.

| Slug | Title (verbatim) | Purpose / pathway | Future IA → canonical future slug | Classification | Ratify-first facts | Notes (nav/CTA/forms/terminology/SEO/redirects/a11y) |
|---|---|---|---|---|---|---|
| `/` | "Grace For Addictions \| Compassionate Recovery Support" (override) | Front door; Contact Connect entry | Home → `/` | **REWRITE** | phone (W-1); "free virtual and in-person recovery services" availability claim | Site-wide Contact Connect form (see §2); 5 VRCC references → "Recovery Community Center — powered by RecoveryOS"; GTM site-wide (consent posture G4 V8); keep SEO override pattern. |
| `/mission` | "Mission" | About | About GFA → Mission/Vision/Commitments | REWRITE | — | Merge with core-values under About. |
| `/core-values` | "Core Values" | About | About GFA → Mission/Vision/Commitments | REWRITE | — | Doctrine lines (No Shame… / Connection Prevents Crisis) verify wording against ratified doctrine. |
| `/about` | "About" | About | About GFA | REWRITE | description says GFA "operat[es] as a Virtual Recovery Community Center (VRCC)" — superseded naming | Naming supersession applies (RCC powered by RecoveryOS). |
| `/services` | "Services" | Service overview | What We Do | REWRITE | program availability claims | Split per ratified subsections (Peer Support & Coaching, Recovery Circles, Navigation & Reentry, Recovery Housing, RCC/RecoveryOS). |
| `/services-7` | "Group Workshops" | Service detail | What We Do → Recovery Circles (likely) | REWRITE + REDIRECT | availability | Numeric residue slug → proper slug + redirect. |
| `/grace-addiction` | "Grace & Addiction" | Narrative/philosophy | About GFA → Origin (or Stories) | REWRITE | — | Person-first language pass. |
| `/anchor-justice` | "ANCHOR Justice Program" | Reentry program | What We Do → Navigation & Reentry | REWRITE | program availability | — |
| `/live-out-program` | "Live-Out Program" | Program | What We Do (placement decision) | REWRITE | availability, any fees | — |
| `/gfa-recovery-circle` | "GFA Recovery Circle" | Peer groups | What We Do → Recovery Circles | REWRITE | schedule claims | — |
| `/vrcc` | "VRCC" | VRCC concept page | What GFA Is Building → RCC/RecoveryOS | **REWRITE + REDIRECT** | — | Superseded naming; canonical future content = "Recovery Community Center — powered by RecoveryOS"; redirect old slug. |
| `/app-landing-page` | "VRCC" | App landing | What GFA Is Building (or Get Support CTA) | **REWRITE + REDIRECT** | — | Duplicate "VRCC" title with `/vrcc` (SEO duplicate); future participant-app CTA targets `recoverycommunity.app` per DEC-005 at cutover. |
| `/events-meetings` | "Events \| Meetings" | Meetings calendar | Meetings & Events | REWRITE | schedule accuracy | — |
| `/testimonials` | "Real Stories of Recovery…" (override) | Stories | Stories & Impact | **RATIFY FIRST** | consent + verification for every story | Only consented, verified material may carry over (ratified rule). |
| `/sponsors-partners` | "Sponsors & Partners" | Partners | Get Involved → Partner | **RATIFY FIRST** | every named partner/logo | Never publish unratified partnerships. |
| `/donate` | "Donate" | Giving | Get Involved → Give | KEEP (content refresh) | — | Wix Donations app path; confirmation/receipt flow check at acceptance. |
| `/volunteer` | "Volunteer" | Volunteering | Get Involved → Volunteer | REWRITE | — | CTA must route to the ratified volunteer pathway (RecoveryOS-bound entry point decision pending). |
| `/inititiave` | "RCO \| IOWA" (override) | Statewide RCO initiative | What GFA Is Building | REWRITE + REDIRECT | statewide claims | Typo slug → `/initiative` (or ratified name) + redirect; keep its SEO override intent. |
| `/copy-of-mission` | **"FAQs"** | FAQs (mis-slugged) | FAQs → `/faqs` | **REWRITE + REDIRECT** | — | F3-C: real FAQs page under a copy-slug. |
| `/copy-of-faqs` | **"FAQs (Español)"** | Spanish FAQs | FAQs (Español) → `/es/faqs` or `/faqs-es` | **REWRITE + REDIRECT** | — | Spanish parity EXISTS — preserve it (ratified "Spanish parity where ratified"); Multilingual app is installed. |
| `/copy-of-halina-cegielski` | **"Kayla Smith"** | Person page | About GFA → Leadership (once ratified) | **RATIFY FIRST + REDIRECT** | roster membership | F3-C: real person under another person's copy-slug — dignity + SEO fix at acceptance. |
| 15 person pages: `/halina-cegielski` `/liz-landon` `/veronica-kaldis` `/april-goodman` `/nav-jhansall` `/coaches`* `/dan-becco` `/mark-brown` ("Mark Browne") `/scott-houston` `/maha-khaliq` `/kel-beddard` ("Kel Bedard") `/shana-lapointe` `/nathan-tolman` + `/copy-of-halina-cegielski` above (*`/coaches` is the roster index) | person names | Coach/leadership profiles | About GFA → Current Leadership **once ratified**; coaches under What We Do → Peer Support & Coaching | **RATIFY FIRST** (whole class) | current roster membership, titles, bios, photos-with-consent | Two slug/name mismatches (`/mark-brown` vs "Mark Browne", `/kel-beddard` vs "Kel Bedard") — fix at rewrite; every page needs the person's consent + role verification; departures = REDIRECT to roster. |
| `/bylaws-articles` | "Bylaws + Aricles of Incorporation" (sic) | Transparency | About GFA → Organizational Transparency | REWRITE | documents current? | Title typo "Aricles"; verify the posted documents are the governing versions (Class A evidence). |
| `/privacy-policy` | "Privacy Policy" | Legal | Privacy/Consent/Accessibility/Nonclinical Scope | **RATIFY FIRST** | every privacy/legal claim | Must match actual system behavior (G4); add Consent, Accessibility, Nonclinical Scope pages (currently **MISSING**). |
| `/gfa-apparel` | "GFA Store" | Merch (Stores V1) | Get Involved (optional) or RETIRE | **Decision needed** | pricing/fulfillment reality | Stores V1 app; keep only if operationally real. |
| `/gfa-summer-soirée` | "GFA Summer Soirée" | Past event | Meetings & Events archive | REDIRECT or RETIRE | — | Dated event page; unicode slug. |
| `/groups`, `/feed`, `/members` (member-profile chunks) | Groups/Feed/Members | Community features (Wix Groups/Members) | Decision: does community live in Wix or in RecoveryOS? | **Decision needed** | — | Governance question: Wix must not become the operational community system of record if RCC/RecoveryOS owns it; overlap with `recoverycommunity.center` role. |
| `/donation-thank-you-page`, `/thank-you-page` | "Thank You Page" ×2 | Post-action confirmations | keep as utilities | KEEP | — | `/thank-you-page` is noindexed; dedupe the two at rewrite. |
| `/cart-page`, `/search` | Cart / Search Results | Utilities | keep | KEEP | — | Already noindexed on LIVE (correct). |

**MISSING vs the ratified IA (build on DEV):** Get Support (front-door support
pathway page), Contact (as a page distinct from the site-wide form), What GFA
Is Building (as a section; `/vrcc`+`/inititiave` content feeds it), Stories &
Impact (consented rebuild of testimonials), Refer Someone (Get Involved), and
the Consent / Accessibility / Nonclinical Scope statements.

## 2. Forms and automations (REST-verified)

| Form | ID | Fields | Automation (REST-visible) | Determination |
|---|---|---|---|---|
| "Contact Connect " | `8ce6b3ab…` | first/last (opt), phone (opt), **email (req)**, "How Did You Hear About Us?" (req), "Reason For Connecting" (req), PathwayInterestDropdown (5 options incl. recovery housing / family / faith-based / not-sure), readinessDropdown (3 options) | ONE automation: triggered email **to the submitter**; contact upsert; spam filter; **no webhook/external action, no staff email** | Field set matches the lead-intake contract, but see **F3-B**: the RecoveryOS hop is unverified via REST (Velo? dashboard automation types not exposed? absent?). Staff-notification gap candidate — verify in dashboard/Velo before relying on this pipe. |
| "My Form" | `58582b0f…` | one APPOINTMENT field "Check-In" (books "Prevention Check-In", 30-min phone) | ONE automation: triggered email to a contributor (staff) role | **F3-A**: thank-you message links to the external FiveCRM IntakeDemographicsForm. RATIFY FIRST → likely RETIRE/replace: third-party demographics intake outside consent/minimization/audit boundaries. Best candidate for `comp-mm9hnpl41` (placement not REST-verifiable). |

Submission-retention settings: **not readable via REST** (only the 210-day
file-deletion behavior on the delete API is documented). Stays a
dashboard-verification item, per the F-2 precision rule.

## 3. W-2 — Sep 13 23:20 live-site change

**No REST surface exists for Wix Site History / editor revisions / publish
logs** (confirmed by targeted doc searches; only prospective webhooks, CMS
data-collection backups, and per-contact CRM activity exist). Therefore:
- What changed at 2026-09-13 23:20 is retrievable **only in the Wix dashboard
  UI: Settings → Site History** (human step; capture screenshots/export as
  W-2 evidence).
- **Rollback/recovery reference point:** the newest Site History revision
  timestamped BEFORE 2026-09-13 23:20 — identify and record it during the
  same dashboard session, per the ratified rollback-capture requirement.
  Nothing is restored by this work.
- Corroborating context: PR #8's external audit ran Sep 13 (20:27 CI; Wix DEV
  scan same day) — the 23:20 edit and DEV's 23:09 update are plausibly the
  same working session; that is inference, not established fact.

## 4. Residue and template cleanup (DEV work items)

Wix Hotels app (installed on both sites): template residue on a recovery
nonprofit — **RETIRE (uninstall) on DEV** at rebuild, verify nothing
references it. Stores V1 / Invoices / Pay Links: keep only what the ratified
scope uses (donations vs merch decision). Duplicate copies in the account
("Grace For Addictions Copy", "Grace For Addic 1670", "Just Grace", etc.):
out of scope here; never a content-truth source (already ruled).

## 5. Checkpoint assessment

Per the standing instruction, the next decision checkpoint triggers on a
material Wix architecture/content conflict. **Three candidates qualify now:**
F3-A (external FiveCRM intake), F3-B (unverified/possibly-missing Contact
Connect → RecoveryOS wiring, with a staff-notification gap), and F0 (the DEV
"rebuild" being an unmodified clone — the rebuild program is 100% ahead of
us, which resets any assumption that DEV review is near). W-1 (phone) remains
RATIFY FIRST. These go to the Executive Director as the F-3 checkpoint.
