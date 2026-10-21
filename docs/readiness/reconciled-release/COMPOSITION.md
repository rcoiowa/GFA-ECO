# Reconciled release candidate — 2026-10-21

Fresh read-only git ls-remote: main = 43bd9c288a397aef1fdcf16afe44e432ca50fb86.
New worktree based on that exact main. Preserved original worktrees and bundles.

## Composition

Applied reviewed main-to-a9ec4bb tree delta, not a broad PR42 merge. Before the
additional fixes, staged tree was byte-identical to a9ec4bbd3e3856bda6fd246a5847b6b49117fc01.
Main's PR39 lobby files already matched d9d0ff9; no rollback of those changes.
The remaining d9d0 applicant baseline restores housing own-record/consent/document
routes, document authorization UX, intake checklist and application status behavior
missing from main. Preserved original production-candidate workflow account binding;
no workflow dispatched or credentials changed.

Includes validated return-path repair ef26ecd, narrow housing/task-link candidate
3f93d250, PR40 consent-expiry fix already included there, and editorial follow-up
a9ec4bb. No duplicate PR40 application. PR42 private Admin, bridge/OAuth, retention,
and PR38 reopening/capacity scope excluded. No migration or permission activation.

## Additional safe local fixes

Grace identity/disclosure and independent support now remain visible while consent
loads or identity is unlinked. Missing person no longer leaves an endless spinner
or a consent button that cannot work. Consent remains false until the existing
check succeeds; stale async consent responses are discarded on identity change.
Public /support link remains reachable without generation. Conversation scrolling
honors prefers-reduced-motion and safely tolerates absent scrollTo capability.
Locked prompt, server consent authority, models/provider and policies unchanged.

## Open decisions / hard gates

- Locked prompt categorical language conflicts with self-description preferences.
  Requires explicitly reviewed semantic prompt/version/lock change and evaluation.
- Clarify whether consent revocation must cancel already-started generation;
  current server check covers each request before provider invocation.
- Actual Auth/email/PostgREST/linked-account acceptance still blocked. Local Docker
  status shows only cached postgres:17 and local Unix socket. No supported setup
  evidence indicates registry access changed; no Forbidden pull retry performed.
  Environment operator must enable approved Docker-daemon access to official
  public.ecr.aws Supabase image endpoints and dependencies, or provision the exact
  approved images via supported environment setup. Do not switch registries,
  bypass TLS, or substitute production. Then inspect loopback ports/internal
  network/local email sink/no external hooks before any synthetic account fixture.
- Browser transport mocks do not prove real service acceptance or provider privacy.
- New Wix artifact QA is separate and pending artifact receipt; app front-door
  browser checks do not validate Wix publication.

User authorized scoped tested merge/deploy, but mandatory real-service gates are
not satisfied. No push/PR/merge/deploy performed by this work. Before publication,
reverify remote main and served artifact, capture exact rollback artifact/config,
complete mandatory acceptance and verify exact deployed SHA/routes afterward.

Parent runtime evidence received 18:03–18:04 UTC: vrcc.app,
recoverycommunity.center, recoveryresidence.org release.json still identify
 d9d0ff93efd0b3018eb0b97cacebced04d8d02ef and cqcxvwoukyhxyokfwnjm.
Historical Worker rollback 30b03fbb-dd22-4bde-8af5-89703434b394 is not freshly
verified available. Cloudflare connector internal errors are not permission denial.
Parent read-only DB metadata confirms recorded activation/prepared migrations and
scoped RPC/private-source permissions; this is not positive service acceptance.
