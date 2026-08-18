# P4H — Hearth Experience Implementation (Design Authority V1.0)

**Status: EXPERIENCE INTEGRATION COMPLETE** against the RecoveryOS Experience Implementation
Specification V1.0. The Hearth design system (Calm Expressive Humanism) is productionized across
every workspace at the token layer, with System/Light/Dark appearance, the composable
brand/appearance/atmosphere architecture, contrast-gated color values, restrained motion at the
approved moments only, and offline-aware truthfulness. `pnpm -r typecheck / test / build` green
(**134 tests**); the token contrast gate (`node scripts/contrast-check.mjs`) **PASSES**; CSS grew
~1 kB gzip and **zero dependencies were added**.

Scope discipline: no routing, domain logic, RPC, RLS, or privacy architecture was reopened. The
P4A–P4G information architecture is untouched (§16). Production-hardening/soft-launch HTTP
verification remains a separate gated effort (P4G report §AN checklist stands).

---

## §1–2 North star & principles

Hearth implemented as a token-first system: person-first weight (names/relationships carry the
strongest ink; IDs and metadata sit in muted/faint tiers), calm surfaces, expressiveness
concentrated at connection moments (Connect acknowledgement, relationship established, message
arrival). No UI state anywhere claims more than canonical truth — the offline banner explicitly
promises "nothing you send will be marked as delivered until it truly is."

## §3 Three registers

One design system, density via tokens:
- **Participant/Resident (warmest)**: Recovery Purple accents, pill-shaped relational CTAs
  (Connect→Message, Today→Check-in, Sessions→Join, Recovery Capital→Connect), 17px body, generous
  spacing (unchanged P4B–P4F layouts).
- **Coach/Navigator/Staff (balanced)**: violet-slate professional accent, person-first rows kept.
- **Admin/Evidence (crispest)**: new `[data-register='crisp']` subtree on the Admin area —
  tighter radii (lg/md → 10px) and **tabular numerals** via one token block; same components,
  sharper rendering; still recognizably RecoveryOS, not an EHR.

## §4 Color system

Three-layer architecture in `packages/design-tokens/src/tokens.css`:
- **GLOBAL**: full Design-Lab scales as raw tokens — Recovery Purple 50–950, Plum 300/500/600/800,
  warm neutrals 0–950, dark field ink-600–950.
- **SEMANTIC**: `surface/surface-raised/surface-sunken/ink/ink-muted/ink-faint/line`, brand
  (purple), and the four functional families (engineering names `accent/positive/attention/critical`
  carrying INFO/AFFIRM/ATTEND/CARE — conventional internally, gentle in copy).
- **COMPONENT**: `experience-*` context accents + new `*-strong` hover-fill tokens (see below).

Values were **locked only after contrast testing passed**: `scripts/contrast-check.mjs` computes
WCAG ratios for 60+ real pairings (body text 4.5:1, UI 3:1) across both appearances and exits
non-zero on regression. One candidate failed during derivation (dark action fill 4.43:1) and was
corrected to #7E58C0 (5.19:1) before adoption. The ~80/15/5 neutral/purple/functional ratio holds;
color never carries state alone (labels/icons/text always accompany it).

**`-strong` tokens**: dark appearance turns `*-700` into light text accents, but button hovers
used `hover:bg-*-700` as fills — every white-text fill hover now uses
`experience-strong/support-strong/critical-strong`, dark-safe by construction and covered by the
gate. Two latent dark-mode defects found and fixed in the sweep: sent-message bubbles and unread
badges/active pills used `bg-experience-700` (would have rendered white-on-lavender) → moved to
the 600 fill.

## §5 Appearance modes

`System / Light / Dark`, system default. Stored preference (`recoveryos-appearance`) resolves to
a stamped `<html data-appearance="light|dark">` — pre-paint script in `index.html` (no flash),
live `prefers-color-scheme` listener while on System. Dark is designed, not inverted: purple-warmed
near-black field (#141019/#1B1622/#0E0B12), tonal elevation with softened shadows, lightened
purple accents, softened functional hues — all in `themes/appearance.css`.

## §6 Contrast mode

Deferred as an explicit in-product surface (no settings page exists yet to host it); the system
tokens are AA-verified in both appearances, focus rings are 3:1+, and the token architecture
accepts a future `prefers-contrast`/manual override block without component changes. Recorded as
follow-up, not silently skipped.

## §6A Theme architecture & atmospheres

The seven monolithic `[data-visual]` themes were **decomposed into the four composable layers**:

| Legacy theme | Mining verdict (source inspected) |
|---|---|
| default | REBUILT ON CURRENT TOKENS → Hearth core (light) |
| dark | REBUILT → dark APPEARANCE (green night → purple-warmed field) |
| space | REFINED → **Cosmic ATMOSPHERE** (static starfield kept, recolored purple; palette merged into dark appearance) |
| gfa | RETIRED as monolith; DEFERRED `[data-brand='gfa']` skin |
| rcoia | DEFERRED `[data-brand='rcoia']` skin |
| sky | DEFERRED atmosphere (rebuild on current tokens) |
| retro | DEFERRED atmosphere (AA-corrected palette preserved in git history) |

Ledger + brand-skin contract (colors/identity only; never behavior, accessibility, or UX) live in
`themes/brand.css`. **Cosmic** ships productionized: ambient only, zero product meaning, no
reward linkage, static imagery (data-URI SVG + gradients — nothing to animate, which satisfies
reduced-motion and the reduced-effects "static optimized background" in one implementation),
opaque raised content surfaces, and it forces the dark field (a lit starfield is not a designed
state). Stored legacy preferences migrate: dark/rcoia→dark, space→dark+cosmic, rest→system+hearth
(tested). P4H fully productionizes GFA/RecoveryOS brand + Hearth + System/Light/Dark as required;
deferred skins/atmospheres are additive later without component rewrites.

## §7 Transparency (Veil)

Exactly one Veil surface: the mobile bottom navigation —
`bg-surface-raised` solid fallback, `supports-[backdrop-filter]` gate for the translucent+blur
variant. No stacking, no image backgrounds beneath it, no device fingerprinting. Everything else
stays opaque.

## §8 Typography

Existing humanist system stack kept (no font-licensing project, no payload): Inter-if-present →
system sans. Roles mapped: display 32, title-1 26, title-2 22, title-3 19, body **17px**
(participant default), captions 13–15; tabular numerals in the crisp register; `.prose-measure`
(70ch) utility added; rem-based type supports 200% zoom/reflow.

## §9–10 Spacing & touch targets

4px foundation via Tailwind defaults; participant surfaces keep their generous P4B spacing;
crisp register tightens via radius/numeric tokens, not a second language. Product standard
44×44 minimum holds (`min-h-11` on standalone controls; 48px+ bottom-nav items; verified during
the sweep — the compact appearance selects are utility controls inside a labeled group).

## §11 Shape

Token scale set to spec: xs 6 / sm 10 / md 14 / lg 20 / xl 28 / pill. Existing utility usage maps
cleanly: inputs `rounded-md` → 14, cards `rounded-lg` → 20, admin (crisp) lg→10. Pill reserved for
human/relational primary actions (four participant CTAs) and the existing Support Now button;
organic treatments remain reserved (avatars/pulse/empty states) — nothing else got rounder.

## §12–13 Surfaces & depth

Five semantic surfaces map to tokens: PAGE=`surface`, CARD=`surface-raised`+`shadow-card`,
HERO=one dominant card per screen (existing pattern), PRIVATE=relationship headers with context
labels (P4D), OVERLAY=sheets/menus (the one Veil candidate). Light: low-opacity soft shadows +
borders; dark: tonal elevation + subtle borders. No parallax, no deep blacks, no floating 3D.

## §14–15 Gradients & iconography

Cosmic's ambient nebula washes are the only gradient field shipped (subtle, one per screen, dark
only); no gradient text, no rainbow effects. Iconography unchanged (the platform is currently
text-labeled with sparse glyphs — no new icon package introduced; §15's tuning applies when an
icon set is adopted). People render as names/initials, never patient glyphs.

## §16 Navigation

IA untouched. Visual refinements only: Veil on the bottom bar, active states carry
weight+background (not color alone), labels always visible, ≤5 mobile destinations with the
existing More sheet. No new "My Support" route — Connect/Today already represent it.

## §17 Forms

Existing pattern already matches (persistent top labels, helper text, calm errors, preserved
input after failure — P4B/P4D behavior). No floating labels anywhere. No new sensitive fields
added.

## §18–20 Presentation priority, priority inputs, Today

Kept the shipped attention models (P4F/P4G): priority derives only from proven time sensitivity
(T), active relational commitments (R), and explicit person state — no engagement/risk scoring
anywhere (tested vocabulary guards remain). Today keeps its P4 architecture; completed items
recede; loading/error are overlays that never destroy visible content (§38 + TanStack keeps
rendered data during refetch).

## §21–23 Connect, Messaging, Scheduling

- **Connect**: canonical P4B states decide rendering; the acknowledgement and
  relationship-established cards now settle in (see §29–33). Human identity dominates the
  relationship card; contexts stay distinct (3-context support team).
- **Messaging**: participant-sent = brand fill (`experience-600`, dark-safe), incoming = neutral
  raised, strong relationship header, quiet purple unread indicators (no red badges),
  content-free notifications unchanged. None of the §22 deferred capabilities (typing, presence,
  read receipts, reply-time claims) were implemented.
- **Scheduling**: canonical booking truth unchanged; confirmed cards calm; completed recedes; no
  countdowns; missed ≠ failure (existing copy).

## §24–25 Recovery Pulse & BARC-10

Untouched this phase (already strengths-oriented, no streaks/flames/pass-fail; BARC-10 canonical
10–60 scoring intact, no normalization/threshold display). Motion does not vary with response
content — the settle utility is uniform.

## §26–28 Navigator, Residence, Admin registers

Navigator keeps people/needs/connections/follow-ups language (no cases/tickets); waiting duration
shown without red-row escalation; warm-handoff visuals remain evidence-bound (P4E). Residence
surfaces restyled only by tokens (plum accents — home, belonging); no meals/community invention.
Admin gains the crisp register; OUTPUT/OUTCOME/CONTRIBUTION distinctions, no rankings, no
message content (P4G posture preserved).

## §29–34 Motion

Semantic tokens in `tokens.css`: instant 80 / micro 150 / standard 240 / emphasis 320 /
transition 420 / moment 560 / exit 180, with out-calm/standard/accelerate-exit easings. Pure CSS —
**no animation library added**. Default intensity Level 0–2. Implemented approved moments only:
1. Support-request acknowledgement — Connect "We've got your request" card settles in.
2. Claim — "Someone is on it" card (same surface, state-driven).
3. Relationship established — "Your Support" card settles (human presence + copy; **no
   thread/connection-line metaphor implemented** — flagged §48 risk avoided by default).
4. Message arrival/send — only the genuinely new last bubble settles; never the list (§47).
5. Calm error recovery/offline — banner + preserved-work copy, no shake/flash.
The global `prefers-reduced-motion` rule collapses every animation/transition to ≤0.01ms —
meaning survives as static end-states. `.loading-late` keeps fast loads silent (§38).

## §35 Accessibility

WCAG 2.2 AA posture: contrast machine-verified both appearances (60+ pairings); visible 3:1+
focus rings (appearance-aware token); keyboard operability and labeled controls preserved from
P4A–P4G (skip link, aria-labeled navs, role=status/alert announcements, labeled selects); no
color-only state; 44px targets; rem type for 200% reflow; reduced-motion honored globally.

## §36–38 Empty, error, loading

Existing purposeful EmptyState (title/meaning/action — no "No records found" anywhere),
human ErrorState (no enum/SQL/RPC strings rendered; retry + preserved work), and now
flash-suppressed LoadingState (indicator fades in only after ~380ms perceived delay; static under
reduced motion). Background refetches never blank rendered content.

## §39–40 Offline & PWA

**Offline-AWARE, not offline-first**: new `useOnlineStatus` + `OfflineNotice` in the shared shell
— truthful state ("nothing you send will be marked as delivered until it truly is"), in-memory
content retained, drafts already survive failed sends (P4D). **Nothing sensitive was persisted to
browser storage**; the only localStorage keys added are appearance/atmosphere preferences. No
service worker exists; if PWA installation arrives later, the §40 default (no SW caching of
private API responses) is recorded here as policy.

## §41–44 Notifications, personalization, privacy-visible design, copy

Unchanged and compliant: content-free calm notifications (no nags/streaks/red escalation);
personalization limited to role/relationships/state/appearance/atmosphere (device-local);
relationship context labels (Your Recovery Coach / Navigator / Residence Support) already visible
without privacy-jargon carpet-bombing; human copy standard maintained (vocabulary tests on
critical derivations continue to pass — no new lint architecture invented).

## §45 Component strategy (classification executed)

KEEP: Field, Alert, PageHeader, EmptyState, ErrorState, Sheet-pattern (More nav), MessageThread
structure. REFINE: Button (strong-fill hovers), Card (token radii), AppShell (Veil, offline
notice, appearance controls), LoadingState (late reveal), message bubbles/badges (dark-safe
fills). EXTEND: tokens (global scales, motion, shape, registers), ThemeSwitcher →
AppearanceControls (+atmosphere). REPLACE: monolithic visual.css → appearance/atmosphere/brand
layers. DEFER: icon family tuning, sheet/dialog primitive, chart primitives, Pulse pebble
visualization (no canonical pulse-visualization surface changed this phase). Nothing working was
replaced for aesthetic reasons.

## §46–47 Responsive & performance

One logic, two reveals — unchanged (mobile sequential bottom-nav + sheets; desktop rail; no
viewport-forked business logic). Performance: transform/opacity-only animation, one backdrop-blur
surface with solid fallback, no font payload, no new dependency, no looping/offscreen animation;
bundle delta ≈ +1.2 kB CSS raw (+0.02 kB gzip), JS unchanged (±0.1 kB). Cosmic is static
background imagery (fixed-attachment data-URIs) — no runtime cost beyond paint.

## §48 User-testing observation list (for soft launch)

Carry into P4H human review: purple safety vs. wellness-branding; My Support relational feel;
unread pressure; dark-mode calm; Residence home-vs-compliance; Admin operational-vs-surveillant;
motion warmth; privacy clarity; action comprehension. (The connection-line metaphor was not
built, so that risk question is moot unless it's introduced later.) Mission principles locked;
evidence may modify visuals.

## §49 Deferred capabilities (recorded, not built)

Typing indicators; presence; read receipts (any flavor); response-time prediction; dynamic
wallpaper; offline sensitive-data sync; participant-photo/media consent; new Pulse sharing;
resource-availability service; command palette; user-custom themes; GFA/RCOIA brand skins;
Sky/Retro atmospheres; in-product increased-contrast toggle (§6); icon-family adoption.

## §50 Acceptance standard — self-assessment

- **Visual**: one product across workspaces (single token system; registers by density). ✓
- **Emotional**: participant surfaces calm/warm/relational; pill CTAs; no shaming states. ✓
- **Operational**: staff surfaces unchanged in scanability; balanced register. ✓
- **Administrative**: crisp register, aggregate-first, non-surveillant. ✓
- **Accessibility**: AA contrast machine-verified; touch/readability standards hold. ✓
- **Motion**: state-meaning only, approved moments, reduced-motion graceful. ✓
- **Privacy**: visual relationships mirror canonical boundaries; nothing new exposed. ✓
- **Performance**: no material mobile cost (numbers above). ✓
- **Truth**: no visual state exceeds canonical proof; offline states honest. ✓

## Verification & gates

- `pnpm -r typecheck` green · `pnpm -r test` green — **134 tests** (77 domain, 40 platform
  including 7 new appearance/migration tests, 17 content) · `pnpm -r build` green.
- `node scripts/contrast-check.mjs` — **CONTRAST GATE PASS** (60+ pairings, both appearances).
- Chunk sizes: AdminArea 35.48 kB (9.61 gzip); total CSS 36.30 kB (7.76 gzip).
- Standing boundaries untouched: no DNS/cutover, no cron activation, no external delivery, no
  HTTP-verification claims, no backend/schema changes at all in this phase.

## What P4H production-hardening still needs (unchanged from P4G §AS)

The experience layer is ready; the soft-launch verification gate (authenticated HTTP/E2E
checklist §AN 1–31, realtime-then-retire-polling, cron activation decision, external-delivery
gate, cutover package) remains the pending, separately-authorized remainder of P4H.
