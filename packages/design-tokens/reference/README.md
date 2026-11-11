# GFA shared visual reference

Prepared November 9, 2026. Source-level implementation reference, not a production deployment or browser accessibility certification.

## Carry forward

- GFA and GFARC: use the selected headless homepage’s quiet teal palette, Georgia headlines, Arial interface, generous sections, clear next-step cards, and original imagery. The exact source is https://headless-xyrmllfkmwf-recoveryos-140a.wix-site-host.com/index.html and its `site.css`.
- Housing: use the selected design’s Grace House landing at https://headless-xyrmllfkmwf-recoveryos-140a.wix-site-host.com/grace-house.html. It has a distinct plum/warm-paper/amber palette with DM Serif Display and Plus Jakarta Sans. Keep the housing application and residence responsibilities accurate; a shared look must not imply shared ownership.
- Do not use the documents portal at https://gracehouse.graceforaddictions.org as the primary housing design reference. Its current purpose is reading and downloading governing documents, and its system-font/purple CSS is different.
- VRCC's fetched HTML currently advertises purple #6540A5, its CSS asset is `index-HKWrEb7g.css`, and it preserves independent system/light/dark and hearth/cosmic choices. Keep those preferences and semantic states working. Do not replace the entire app stylesheet with a marketing homepage stylesheet.

## One source, two consumers

`gfa-shared-theme.json` is the portable source of truth for this proposed visual contract. Run `python build_reference.py` to regenerate `../src/themes/gfa-shared.css` and verify contrast. Import the resulting CSS into Wix headless `site.css` and RecoveryOS styles without manually maintaining separate color constants. Store the JSON and generator under the existing design-tokens package when integrating; export the generated CSS into the Wix build artifact. This is a design proposal until integration tests pass.

Scope `data-gfa-theme="gfa"` to GFA/VRCC public and meeting-workspace surfaces, and `data-gfa-theme="grace-house"` to housing surfaces. The file supplies aliases only; components consume `var(--gfa-ink)`, `var(--gfa-action)`, etc. It does not globally alter RecoveryOS appearance or status semantics.

The current repository's `packages/design-tokens/src/themes/brand.css` explicitly allows only brand/action accents and limited typography in its brand-skin layer. Implement this through dedicated scoped component styles or reconcile that contract explicitly. Do not silently change global surface tokens to make the screenshot match.

Map existing application typography deliberately: editorial titles can use the display face, but form labels, input text, data tables and operational navigation use the interface face. Keep current participant body size and clear status labels. Housing custom fonts require successful font loading or its declared fallback; never claim a loaded face just from a font-family declaration.

## Space and navigation

Use 48px minimum form controls, 32px between form groups and 20px between related fields. Marketing sections may breathe at 48–96px; do not use a full-screen marketing hero inside a data-entry form. Keep one-column mobile flow, readable text measure around 65ch, and no fixed height that clips enlarged text.

Keep a visible route back to RecoveryOS and to the Circle list. Maintain in-app routing/back-stack behavior rather than opening a new tab for every step. The GFA brand link can lead to the public site; label it clearly so saving a meeting is never confused with leaving the workspace. A Circle discovery page and a staff-only facilitator workspace have different permissions and must not be collapsed into a public form.

## Verified contrast and correction

The included 16 text/control/focus pairing checks pass their stated WCAG ratios. This does not certify the whole interface. The source housing amber focus (#d4a017) against warm paper (#fbf8f6) measures 2.25:1, below the 3:1 non-text threshold. Use plum focus on light backgrounds. Keep amber as a decorative accent with dark ink, or as focus against dark surfaces.

Transparent borders in the original design are decorative, not sufficient as the only boundary for form inputs. Use a verified darker boundary or an alternate visible affordance. Brand colors must not replace error, success, warning, support or consent state labels.

## Evidence and limitations

HTML/CSS read via live HTTPS on November 9, 2026. Files and SHA256 hashes are retained in `source-hashes.json`. The exact HTML/CSS retrieved establishes source values, not deployment commit provenance. Local browser checks were attempted but blocked by missing Playwright browser and then system Chromium socket permissions; no visual QA was completed in this worker. Parent reports separate screenshot review of Sites workspace v3. No database, consent record, live site or production setting was changed by this work.

Before release: run repository contrast guards, typecheck/build/tests, keyboard and screen-reader checks, mobile reflow/zoom, appearance and atmosphere combinations, direct route refresh, Back/Forward, unsaved-change behavior, and actual authorized save/access checks. Preserve existing forms/submissions and canonical residence application links.
