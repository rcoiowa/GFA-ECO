# ADR-0005: service_events is the single service-attribution spine

**Status:** Accepted · **Date:** 2026-07-29

Every delivered service — coaching session, check-in, assessment, circle, navigation —
records a `service_events` row carrying `delivery_context`, organization, and nullable
program/residence/residency/funding attribution. Feature tables (goals, check_ins, …) hold
feature data; attribution and analytics always flow through service_events. A DB check
constraint requires `residence_id` whenever `delivery_context = 'recovery_residence'`.
This is what makes "VRCC services" vs "residence-context services" separable without
double counting, and unique-people-served a deduplicated person count.
