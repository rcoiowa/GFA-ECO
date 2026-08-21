-- RECOVERED from live project ykykeioydvtxpyreshhs on 2026-08-07 (grace-coaching audit).
-- Applied live as migration 20260807090536 `vrcc_coaching_engine_v1_tables` by a prior
-- session that did not commit it to any repository. PROTOTYPE LAYER — see
-- docs/migration/live-drift-reconciliation.md. Verbatim text follows.

-- 2) Coach assignments (auditable claim/assign history; drives DM + roster access)
CREATE TABLE IF NOT EXISTS v2_coach_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES v2_profiles(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES v2_profiles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES v2_profiles(id),
  method text NOT NULL CHECK (method IN ('self_claim','admin_assign','request_pickup')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS v2_coach_assignments_one_active
  ON v2_coach_assignments (participant_id) WHERE is_active;

-- 3) Direct messages (assigned coach <-> participant only)
CREATE TABLE IF NOT EXISTS v2_direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES v2_profiles(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES v2_profiles(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES v2_profiles(id),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v2_dm_thread_idx ON v2_direct_messages (participant_id, coach_id, created_at DESC);

-- 4) Session reminders (populated on confirm; swept by Worker cron)
CREATE TABLE IF NOT EXISTS v2_session_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_request_id uuid NOT NULL REFERENCES v2_session_requests(id) ON DELETE CASCADE,
  remind_at timestamptz NOT NULL,
  kind text NOT NULL CHECK (kind IN ('day_before','hour_before','starting_now')),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v2_reminders_due_idx ON v2_session_reminders (remind_at) WHERE sent_at IS NULL;

-- 5) Session request extensions (claim + negotiation + confirm)
ALTER TABLE v2_session_requests
  ADD COLUMN IF NOT EXISTS session_type text NOT NULL DEFAULT 'recovery_coach'
    CHECK (session_type IN ('peer_support','recovery_coach','life_coach','navigation','needs_assessment')),
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_by uuid REFERENCES v2_profiles(id),
  ADD COLUMN IF NOT EXISTS proposal_round int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_actor uuid REFERENCES v2_profiles(id);

-- 6) RLS
ALTER TABLE v2_coach_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2_direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2_session_reminders ENABLE ROW LEVEL SECURITY;

-- Assignments: participant sees own; coaches see all (roster visibility); coach can self-claim unassigned; admin/navigator manage all
CREATE POLICY v2_ca_participant_select ON v2_coach_assignments FOR SELECT
  USING (participant_id = auth.uid());
CREATE POLICY v2_ca_staff_select ON v2_coach_assignments FOR SELECT
  USING (v2_my_role() = ANY (ARRAY['coach','navigator','admin']::v2_role[]));
CREATE POLICY v2_ca_coach_claim ON v2_coach_assignments FOR INSERT
  WITH CHECK (
    (v2_my_role() = 'coach'::v2_role AND coach_id = auth.uid() AND assigned_by = auth.uid()
       AND method IN ('self_claim','request_pickup')
       AND NOT EXISTS (SELECT 1 FROM v2_coach_assignments a WHERE a.participant_id = v2_coach_assignments.participant_id AND a.is_active))
    OR (v2_my_role() = ANY (ARRAY['navigator','admin']::v2_role[]))
  );
CREATE POLICY v2_ca_manage ON v2_coach_assignments FOR UPDATE
  USING (coach_id = auth.uid() OR v2_my_role() = ANY (ARRAY['navigator','admin']::v2_role[]))
  WITH CHECK (coach_id = auth.uid() OR v2_my_role() = ANY (ARRAY['navigator','admin']::v2_role[]));

-- DMs: only members of an ACTIVE assignment pair may read/write their thread
CREATE POLICY v2_dm_select ON v2_direct_messages FOR SELECT
  USING (
    (auth.uid() IN (participant_id, coach_id))
    AND EXISTS (SELECT 1 FROM v2_coach_assignments a
                WHERE a.participant_id = v2_direct_messages.participant_id
                  AND a.coach_id = v2_direct_messages.coach_id AND a.is_active)
  );
CREATE POLICY v2_dm_insert ON v2_direct_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND auth.uid() IN (participant_id, coach_id)
    AND EXISTS (SELECT 1 FROM v2_coach_assignments a
                WHERE a.participant_id = v2_direct_messages.participant_id
                  AND a.coach_id = v2_direct_messages.coach_id AND a.is_active)
  );
CREATE POLICY v2_dm_mark_read ON v2_direct_messages FOR UPDATE
  USING (auth.uid() IN (participant_id, coach_id))
  WITH CHECK (auth.uid() IN (participant_id, coach_id));

-- Reminders: visible to session parties; system (service role) writes
CREATE POLICY v2_rem_select ON v2_session_reminders FOR SELECT
  USING (EXISTS (SELECT 1 FROM v2_session_requests sr
                 WHERE sr.id = session_request_id
                   AND auth.uid() IN (sr.participant_id, sr.coach_id)));

-- 7) Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE v2_direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE v2_coach_assignments;
