# Housing and private Admin release

This release layers the reviewed feature branch onto the exact verified live commit
`d9d0ff93efd0b3018eb0b97cacebced04d8d02ef`. It preserves that commit's applicant intake,
recorded release/permission distinctions, and accessible lobby behavior. Later PR40
commits `8381f27` and `1126bfe` are excluded; PR40 is not merged.

The manual `deploy-staging.yml` workflow targets the live custom-domain Worker
`recoveryos-staging` despite its legacy name. Dispatch from this release branch with
`release_ref` set to the tested full commit SHA, `confirmation=DEPLOY_STAGING`, and
`housing_follow_through_enabled=true`. The exact-commit CI gate remains mandatory.
The Housing/private Admin database activation is recorded in ACTIVATION.md.
The app deploy does not execute SQL, deploy the collaboration bridge, configure OAuth,
change roles, enable deletion, or change custom-domain routes.

## Rollback evidence

Before this release, Cloudflare deployment `f516e83e-804f-483f-8861-df67a9d9e68a`
served version `30b03fbb-dd22-4bde-8af5-89703434b394` at 100%, deployed
2026-10-16T13:22:07.573048Z. GitHub Deploy staging run 38907235038 (job
116993768894) records the exact live source commit above and matching version.
Retain that Worker version for rollback. Application rollback must not delete the
new database tables or recorded commitments.

## Verification boundaries

Authenticated live UI verification requires an authorized session and remains pending.
Direct external HTTP from this environment is blocked by the network proxy; do not
bypass that route. GitHub CLI API requests likewise return Forbidden; the installed
GitHub connector supports CI inspection but exposes no workflow-dispatch action.
Deployment requires an available authorized workflow-dispatch route. No deployment
success is implied by preparing or pushing this release.
