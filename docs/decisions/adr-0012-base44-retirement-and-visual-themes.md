# ADR-0012: Base44 fully retired; legacy look preserved as visual themes

**Status:** Accepted · **Date:** 2026-08-02

## Base44

Grace For Addictions is not using Base44. Verified: the canonical repo contains zero
Base44 references. Base44 code exists only in the frozen legacy `vrcc.app` repo
(SOURCE, to be archived at cutover). Rules: no new work builds on Base44; legacy
features are rebuilt against the canonical Supabase model, never migrated with their
Base44 data layer; the Base44 MCP connector can be disconnected.

## Production rollback (context)

The owner rolled the live vrcc.app deployment back to an earlier version. Known
issues there — a hard-to-use coaching-session request flow and buttons routing to
wrong pages — are treated as requirements for the canonical build, not bugs to fix
in the legacy app: the canonical `/app/connect` now ships a two-field session
request, and the legacy app stays frozen.

## Visual themes

The canonical clean design stays the foundation ("Default"). The legacy app's theme
system is preserved as user IP: any user can switch between **Default, Dark, Space,
Sky, Retro** (`[data-visual]` overrides in
`packages/design-tokens/src/themes/visual.css`, pre-paint localStorage apply,
`ThemeSwitcher` in shells/profile/landing). Retro and Space port the legacy
palettes ("70s sunrise · warm paper", deep-space violet) with contrast corrected to
WCAG AA — the legacy retro nav-text readability problem is fixed in the port, not
reproduced. Experience accents (VRCC/residence) remain distinct inside every theme.

## Brand themes (added 2026-08-02, same day)

Two organization-brand themes join the set: **GFA Brand** and **RCOIA**. Accuracy
review of graceforaddictions.org found the legacy app's purple "GFA Brand" (#6B33D6)
did not match the live site, which uses a deep teal/jade palette (#276156 / #389884)
with terracotta and gold accents — the port corrects this. rcoiowa.org shares the
identical Wix palette with graceforaddictions.org, so the two themes differentiate
within that family: GFA anchors on the deep teal, RCOIA on the green (#2d8149) with
the palette's gold as its attention hue. Both verified against the live sites'
Wix theme variables (colors 11–35), both AA-contrast.

## RCOIA correction (owner-provided spec, 2026-08-02)

The owner supplied the authoritative RCO Iowa brand direction (a new site design,
not the current Wix palette): cosmic deep-purple ground (#07041A/#160F38), purple
primary (#6B3FBF/#9B6FEF), gold (#D4A843) and teal (#00CCA8) accents, lavender-white
ink (#EDE8FF). The RCOIA theme now follows this spec — palette only, per the owner's
instruction; no structural elements were taken from the supplied code. GFA Brand
awaits the owner's screenshot before any further change.

## GFA Brand correction (owner-provided screenshot, 2026-08-02)

The owner's screenshot of graceforaddictions.org shows the true brand feel: an
airy sky/mist ground, charcoal ink, and the GFA compass logo's bright aqua-teal
(banner band ~#5cb5b5) with the gold 501(c)(3) badge as a warm accent. The GFA
Brand theme now follows the screenshot (light aqua surfaces, charcoal text,
aqua-teal primary darkened to AA for buttons/links, gold attention hue),
superseding the deep forest-teal derived from the Wix palette variables.
