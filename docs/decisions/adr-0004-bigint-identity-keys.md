# ADR-0004: bigint identity primary keys

**Status:** Accepted · **Date:** 2026-07-29

All tables use `bigint generated always as identity` primary keys. UUIDs are not used as
PKs. External platform identifiers (Supabase auth UUIDs, future Wix/partner IDs) live in
dedicated columns (`people.auth_user_id uuid`). Rationale: smaller indexes, readable keys,
simpler joins, and clean separation between internal identity and external references.
