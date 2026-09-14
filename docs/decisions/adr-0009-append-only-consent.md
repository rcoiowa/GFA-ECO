# ADR-0009: Consent history is append-only

**Status:** Accepted · **Date:** 2026-07-29

Consent decisions insert new `consent_grants` rows; nothing is updated or deleted. The
current decision for a consent type is the newest grant. This yields a complete audit
trail (who, what, when, method, document version) for free and makes revocation a
first-class recorded event. Declining an optional consent never gates unrelated services;
`is_required_for_service` marks the narrow set of genuinely required consents.
