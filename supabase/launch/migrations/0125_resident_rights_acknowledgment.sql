-- LAUNCH 0125 — Resident Rights & Responsibilities is a move-in acknowledgment.
--
-- The Grace House signing packet (rendered from this document library) lists
-- Resident Rights & Responsibilities v2.0 (published 2026-08-03) as
-- "Acknowledgment required", but the template row carries
-- requires_signature = false, so ensure_my_document_assignments() (0013) never
-- assigns it and residents cannot acknowledge it electronically — the paper
-- packet and the in-app flow disagree. This migration flips the flag so the
-- electronic flow assigns the document like the other eight packet items.
--
-- No backfill is needed: ensure_my_document_assignments() runs whenever a
-- resident opens the Documents area and picks up newly required templates for
-- active residencies. The canonical body now also lives in
-- packages/residence-content (residentRights.ts), imported verbatim from the
-- published v2.0 row, so the app renders exactly what the assignment records.

set search_path = recoveryos, public;

update document_templates t
set requires_signature = true
from organizations o
where o.id = t.organization_id
  and o.name = 'Grace For Addictions'
  and t.key = 'resident_rights'
  and t.requires_signature is distinct from true;

notify pgrst, 'reload schema';
