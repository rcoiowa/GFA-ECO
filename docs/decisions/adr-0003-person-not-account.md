# ADR-0003: Person ≠ account — identity chain auth.users → people → relationships

**Status:** Accepted · **Date:** 2026-07-29

## Decision

`people` is the canonical human record with a nullable `auth_user_id`. Roles
(`role_assignments`), participation (`program_enrollments`), residency (`residencies`),
and professional relationships are all separate scoped tables keyed by `person_id`.

## Rules

1. Never create a second person row because a person gains a relationship.
2. A person may exist without an account (staff-entered applicant) and gain one later.
3. VRCC participation and residency are never interchangeable and never merged.
4. Unique-people-served analytics count deduplicated `person_id`s, never enrollment sums.

## Consequences

`ensure_person_for_current_user()` provisions person + profile + participant role
idempotently on first sign-in. Duplicate-person merge tooling becomes an admin feature
(Phase 7) rather than a data-model workaround.
