# Dormant Cloudflare API prototype

Status: **quarantined; do not deploy**.

This Worker overlaps the canonical Supabase Edge Functions for public intake, uses a
service-role write path, and is not part of an approved deployment workflow. It is
retained only to preserve implementation history while consolidation is reviewed.

Canonical runtime ownership:

- Public lead intake: `supabase/functions/lead-intake`
- Residence intake: `supabase/functions/residence-intake`
- EJWRH intake: `supabase/functions/ejwrh`
- Web application: `apps/platform`, deployed with Cloudflare Workers Static Assets

A future API Worker requires a new architecture decision, a non-overlapping contract,
explicit secret boundaries, abuse controls, observability, and a reviewed deploy flow.
