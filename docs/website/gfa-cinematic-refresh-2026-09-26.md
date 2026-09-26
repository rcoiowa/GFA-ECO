# GFA public website refresh — September 26, 2026

## Delivery

Three progressive layers at `/gfa/`, `/gfa/connect.html`, and `/gfa/housing.html`, included automatically in the existing Vite public-assets build. Plain semantic HTML and scoped CSS intentionally keep public information and contact links usable without JavaScript, authentication, or the full app bundle. JavaScript only enhances the mobile navigation and copyright year. No new package, schema, auth rule, intake receiver, or application is introduced.

The website is a review candidate. Its pages use `noindex,nofollow`. The existing domain homepages are unchanged. Release requires visual and functional staging verification, then the existing domain cutover process; remove preview indexing directives only for the approved public launch.

## Content and asset evidence

| Item | Source checked on 2026-09-26 | Treatment |
| --- | --- | --- |
| Identity, nonprofit positioning, services, contact roles, housing separation | Thomas DeGarmeaux's explicit build brief in this session | Published as supplied; no invented schedules, response targets, credentials, bed availability, or impact statistics |
| Original logo | Live GFA homepage image `https://static.wixstatic.com/media/ee9b52_4ca4962561254238ad6eb031ded4f991~mv2.png` | Original image preserved with no recoloring or reconstruction |
| Logo palette | Pixel analysis of original logo | Teal #5AB2B4, graphite #4E4F50, black #060606; supporting surfaces and darker accessible teal are design extensions |
| Decorative landscape | Existing live GFA homepage asset `https://static.wixstatic.com/media/84770f_0cf5b6c1550a4b8c92f92f1064cc68de~mv2.jpg` | Decorative image, empty alt; no claim it depicts Iowa, a participant, or a GFA facility. Confirm license portability before a domain/platform cutover |
| Contact Connect | Live homepage DOM, heading ID `comp-mgl4q6kp` and form container `comp-mikvyvq2` | Explicit link to the existing form on the current Wix site; does not simulate submission or create a second intake pipeline |
| Office/email | Wix production site context 5518d7be-0d95-44f4-96ba-89c21748f731 and latest leadership brief | 515-220-8771, connect@graceforaddictions.org |
| Warmline | Latest leadership brief | 515-310-3425; distinct peer-support role; no hours promised |
| Donations | GET https://www.graceforaddictions.org/donate returned 200 | Existing donation destination retained |
| Backend | Supabase project listing | RecoveryOS-Launch cqcxvwoukyhxyokfwnjm ACTIVE_HEALTHY; older GFA/contact dashboard projects inactive |
| Lead receiver | Live `lead-intake` v14 source from Supabase connector | Requires server-side shared secret. No secret shipped to browser; existing Wix workflow preserved. No end-to-end lead delivery claim made |
| Residence applications / community center | `apps/platform/src/App.tsx` at 252e8d80442cca593049313c1077aba42d12e5e1 | Existing relative routes reused. Runtime acceptance, account linking, and admissions are not inferred from source |
| Attached App & Wix App_Wixsite.docx | Supplied read-only snapshot | Historical conceptual integration notes, not operational evidence. No speculative Base44, CRM, Zoom, RingCentral or AI integrations added |

## Boundaries and remaining checks

- No Wix site content, DNS, Supabase schema, participant record, or production deployment changed by this source addition.
- Current Wix page design is not editable through the available management APIs. This candidate ships in the GitHub-backed RecoveryOS deployment and can be reviewed before any Wix replacement.
- No new contact form or automatic account creation; the existing authoritative flows remain in control.
- Publicly reachable does not prove staff processing: Contact Connect receipt into the canonical staff queue still needs a controlled, authorized end-to-end check.
- Signed-out requests from this execution environment to the staging/candidate Worker URLs returned 403. This is recorded as an access limitation, not a finding that those applications are broken.
- Grace AI is intentionally not added as a new chat surface. The repository provider lock remains unchanged.
- No unverified event dates are published; current meeting information is available through a human inquiry route.
- Final canonical hosting, route map, and any changes to the current Wix domain must preserve the existing application routes and Contact Connect destination. Do not cut over the Wix domain without replacing its Contact Connect link with the confirmed surviving route.

## Validation

- Existing complete Vite platform production build passed (609 modules); static GFA files included.
- Repository package files and lockfile preserved; local runtime uses newer pnpm and initially requested build-script config, so build was performed directly with the installed Vite executable.
- Visual browser checks and deployment evidence to be appended after staging review.
- Static validation passed: three pages, 83 links, all local page/fragment references and image paths resolved; one H1 per page and alt attributes present.
- Measured solid-color text/action contrast: 6.52:1 dark teal/white; 6.47:1 primary button; 5.91:1 muted body/paper; 5.81:1 contact band; 10.98:1 light teal/dark. This is not a claim of complete WCAG conformance.
- Local visual QA infrastructure unavailable: bundled Playwright browser absent; official browser download returned a truncated archive. Cloud browser blocked localhost. Responsive CSS and reduced-motion/no-JS behavior are implemented but rendered mobile QA remains outstanding until a reachable staging preview.

## Staging result — supersedes earlier desktop-preview limitation

- Source release: `7b968ad701f17d4398ecb86d8bf16a1b6cf674b6`.
- GitHub CI run 36271040808 (CI #224): success, including governance checks, typecheck, tests, and production build.
- Existing Deploy staging workflow run 36271129703: success. It checked out the exact source release and passed the exact-commit CI gate.
- Verified rendered preview: https://recoveryos-staging.thomas-499.workers.dev/gfa/
- Cloud-browser desktop review at 1363 CSS pixels: logo and landscape loaded; no horizontal overflow; main typography and service-section layout reviewed; service disclosure interaction opened correctly.
- Housing page links opened the correct signed-out `Apply to Grace House` and `Apply to EJWRH` forms, with optional account setup described after submission. No forms were submitted.
- Contact Connect link opened the existing Wix Contact Connect form and scrolled to its heading (165px below viewport top). Its legacy technical field labels remain on Wix; the refreshed pages do not reproduce those labels. Submission-to-staff-queue delivery remains untested.
- Community-center link opened Iowa's Recovery Community Center. The existing center displayed an honest live-weather-unavailable fallback during the check; this refresh makes no live-weather claim.
- Actual phone-sized viewport, 200% text zoom, complete automated accessibility audit, and end-to-end intake delivery remain outstanding. Responsive and reduced-motion rules are implemented; do not label them independently certified.
- Production Wix and production-candidate deployments remain unchanged. No production domain cutover was performed.
