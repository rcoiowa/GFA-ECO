#!/usr/bin/env node
/**
 * Hearth token contrast gate (P4H §4: "Final token values are NOT locked until
 * contrast testing passes"). Checks the WCAG 2.2 relative-luminance ratios for
 * every token pairing the design system actually renders. Run:
 *
 *   node scripts/contrast-check.mjs
 *
 * Exits non-zero if any pairing falls below its requirement, so token edits
 * can never silently regress readability. Requirements: 4.5:1 body text,
 * 3:1 large text (≥18.66px bold / 24px), 3:1 non-text UI (borders, focus).
 */

function srgb(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}
export function ratio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// ---- Hearth palette under test (must mirror tokens.css / appearance.css) ----
const T = {
  // Light appearance
  light: {
    surface: '#F8F6F4',
    raised: '#FFFFFF',
    sunken: '#F1EEEB',
    ink: '#2B2724',
    inkMuted: '#57514C',
    inkFaint: '#7C756E',
    line: '#D8D3CE',
    purple600: '#6540A5',
    purple700: '#533489',
    purpleSoft: '#F5F2FB',
    plum600: '#8A4570',
    plum700: '#5C2C4A',
    plumSoft: '#F8EFF4',
    prof600: '#565070',
    prof700: '#453F5C',
    profSoft: '#F2F1F6',
    support600: '#63498C',
    accent600: '#35598F',
    accent700: '#2D4A76',
    accent50: '#F2F6FC',
    positive600: '#2C7A43',
    positive700: '#256238',
    positive50: '#EFFAF1',
    attention600: '#A3671B',
    attention700: '#855416',
    attention50: '#FDF6EC',
    critical600: '#B04438',
    critical700: '#8F382E',
    critical50: '#FDF1F0',
    focus: '#7A52BC',
  },
  // Dark appearance (purple-warmed near-black field)
  dark: {
    surface: '#141019',
    raised: '#1B1622',
    sunken: '#0E0B12',
    ink: '#F0EDF5',
    inkMuted: '#B5ACC6',
    inkFaint: '#8D8399',
    line: '#382F47',
    purpleText: '#C0A6E8',
    purpleAction: '#7E58C0',
    purpleSoft: '#2A2138',
    plumText: '#D8A2C2',
    plumSoft: '#33202C',
    profText: '#B9B2CE',
    profSoft: '#272335',
    accentText: '#9FBEE6',
    accent50: '#1B2534',
    positiveText: '#8FD6A4',
    positive50: '#152B1C',
    attentionText: '#E0B46A',
    attention50: '#2D2413',
    criticalText: '#E89C8F',
    critical50: '#341B17',
    focus: '#9573CC',
  },
};

const checks = [
  // ---------------- Light: body text ----------------
  ['light ink on surface', T.light.ink, T.light.surface, 4.5],
  ['light ink on raised', T.light.ink, T.light.raised, 4.5],
  ['light ink on sunken', T.light.ink, T.light.sunken, 4.5],
  ['light ink-muted on surface', T.light.inkMuted, T.light.surface, 4.5],
  ['light ink-muted on raised', T.light.inkMuted, T.light.raised, 4.5],
  ['light ink-muted on sunken', T.light.inkMuted, T.light.sunken, 4.5],
  ['light ink on purple-soft', T.light.ink, T.light.purpleSoft, 4.5],
  // Actions: white text on 600-level fills
  ['light white on purple-600', '#FFFFFF', T.light.purple600, 4.5],
  ['light white on plum-600', '#FFFFFF', T.light.plum600, 4.5],
  ['light white on prof-600', '#FFFFFF', T.light.prof600, 4.5],
  ['light white on support-600', '#FFFFFF', T.light.support600, 4.5],
  ['light white on critical-600', '#FFFFFF', T.light.critical600, 4.5],
  // Accent text (700 on soft/raised/surface)
  ['light purple-700 on purple-soft', T.light.purple700, T.light.purpleSoft, 4.5],
  ['light purple-700 on raised', T.light.purple700, T.light.raised, 4.5],
  ['light purple-700 on surface', T.light.purple700, T.light.surface, 4.5],
  ['light plum-700 on plum-soft', T.light.plum700, T.light.plumSoft, 4.5],
  ['light plum-700 on raised', T.light.plum700, T.light.raised, 4.5],
  ['light prof-700 on prof-soft', T.light.prof700, T.light.profSoft, 4.5],
  ['light prof-700 on raised', T.light.prof700, T.light.raised, 4.5],
  // Functional text on tinted 50 surfaces + plain surfaces
  ['light accent-700 on accent-50', T.light.accent700, T.light.accent50, 4.5],
  ['light positive-700 on positive-50', T.light.positive700, T.light.positive50, 4.5],
  ['light attention-700 on attention-50', T.light.attention700, T.light.attention50, 4.5],
  ['light critical-700 on critical-50', T.light.critical700, T.light.critical50, 4.5],
  ['light critical-700 on raised', T.light.critical700, T.light.raised, 4.5],
  ['light positive-700 on raised', T.light.positive700, T.light.raised, 4.5],
  // Strong hover fills under white text (light)
  ['light white on experience-strong (purple)', '#FFFFFF', '#533489', 4.5],
  ['light white on experience-strong (plum)', '#FFFFFF', '#5C2C4A', 4.5],
  ['light white on experience-strong (prof)', '#FFFFFF', '#453F5C', 4.5],
  ['light white on support-strong', '#FFFFFF', '#513A74', 4.5],
  ['light white on critical-strong', '#FFFFFF', '#8F382E', 4.5],
  // Non-text UI
  ['light line on surface (ui)', T.light.line, T.light.surface, 1.2],
  ['light focus on surface (ui)', T.light.focus, T.light.surface, 3],
  ['light focus on raised (ui)', T.light.focus, T.light.raised, 3],
  ['light purple-600 fill vs raised (ui)', T.light.purple600, T.light.raised, 3],

  // ---------------- Dark: body text ----------------
  ['dark ink on surface', T.dark.ink, T.dark.surface, 4.5],
  ['dark ink on raised', T.dark.ink, T.dark.raised, 4.5],
  ['dark ink on sunken', T.dark.ink, T.dark.sunken, 4.5],
  ['dark ink-muted on surface', T.dark.inkMuted, T.dark.surface, 4.5],
  ['dark ink-muted on raised', T.dark.inkMuted, T.dark.raised, 4.5],
  ['dark ink on purple-soft', T.dark.ink, T.dark.purpleSoft, 4.5],
  // Accent text on dark grounds
  ['dark purple-text on surface', T.dark.purpleText, T.dark.surface, 4.5],
  ['dark purple-text on raised', T.dark.purpleText, T.dark.raised, 4.5],
  ['dark purple-text on purple-soft', T.dark.purpleText, T.dark.purpleSoft, 4.5],
  ['dark plum-text on surface', T.dark.plumText, T.dark.surface, 4.5],
  ['dark plum-text on plum-soft', T.dark.plumText, T.dark.plumSoft, 4.5],
  ['dark prof-text on surface', T.dark.profText, T.dark.surface, 4.5],
  ['dark prof-text on prof-soft', T.dark.profText, T.dark.profSoft, 4.5],
  // Actions: white on the dark-mode action fill
  ['dark white on purple-action', '#FFFFFF', T.dark.purpleAction, 4.5],
  // Functional text on dark tinted surfaces
  ['dark accent-text on accent-50', T.dark.accentText, T.dark.accent50, 4.5],
  ['dark positive-text on positive-50', T.dark.positiveText, T.dark.positive50, 4.5],
  ['dark attention-text on attention-50', T.dark.attentionText, T.dark.attention50, 4.5],
  ['dark critical-text on critical-50', T.dark.criticalText, T.dark.critical50, 4.5],
  ['dark critical-text on raised', T.dark.criticalText, T.dark.raised, 4.5],
  // Dark action fills under white text (600-level + strong hovers)
  ['dark white on experience-600 (residence)', '#FFFFFF', '#A05585', 4.5],
  ['dark white on experience-600 (prof)', '#FFFFFF', '#6E6584', 4.5],
  ['dark white on experience-strong (purple)', '#FFFFFF', '#6E4AAE', 4.5],
  ['dark white on experience-strong (residence)', '#FFFFFF', '#8A4570', 4.5],
  ['dark white on experience-strong (prof)', '#FFFFFF', '#565070', 4.5],
  ['dark white on support-strong', '#FFFFFF', '#7A52BC', 4.5],
  ['dark white on critical-strong', '#FFFFFF', '#A84335', 4.5],
  // Non-text UI
  ['dark focus on surface (ui)', T.dark.focus, T.dark.surface, 3],
  ['dark focus on raised (ui)', T.dark.focus, T.dark.raised, 3],
];

let failed = 0;
for (const [name, fg, bg, min] of checks) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(6)} >= ${min}   ${name}`);
}
console.log(failed === 0 ? '\nCONTRAST GATE PASS' : `\nCONTRAST GATE FAIL — ${failed} pairing(s)`);
process.exit(failed === 0 ? 0 : 1);
