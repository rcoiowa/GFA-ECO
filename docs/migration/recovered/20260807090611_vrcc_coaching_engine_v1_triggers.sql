-- RECOVERED from live project ykykeioydvtxpyreshhs on 2026-08-07 (grace-coaching audit).
-- Applied live as migration 20260807090611 `vrcc_coaching_engine_v1_triggers` by a prior
-- session that did not commit it to any repository. PROTOTYPE LAYER — see
-- docs/migration/live-drift-reconciliation.md. Verbatim text follows.

-- 8) Confirmation trigger: when a session becomes 'confirmed' with a scheduled_at,
--    attach the coach's Ooma room if missing, seed reminders, notify both parties.
CREATE OR REPLACE FUNCTION v2_on_session_confirmed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_room text;
  v_coach_name text;
  v_part_name text;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') AND NEW.scheduled_at IS NOT NULL THEN
    NEW.confirmed_at := now();

    -- Attach Ooma personal room from coach_meeting_rooms if no link set
    IF NEW.meeting_url IS NULL AND NEW.coach_id IS NOT NULL THEN
      SELECT r.room_url INTO v_room
      FROM coach_meeting_rooms r
      JOIN auth.users u ON lower(u.email) = lower(r.coach_email)
      WHERE u.id = NEW.coach_id AND r.is_active
      ORDER BY r.updated_at DESC LIMIT 1;
      IF v_room IS NOT NULL THEN NEW.meeting_url := v_room; END IF;
    END IF;

    -- Seed reminders (skip any already in the past)
    INSERT INTO v2_session_reminders (session_request_id, remind_at, kind)
    SELECT NEW.id, t.remind_at, t.kind FROM (VALUES
      (NEW.scheduled_at - interval '24 hours', 'day_before'),
      (NEW.scheduled_at - interval '1 hour',  'hour_before'),
      (NEW.scheduled_at - interval '5 minutes','starting_now')
    ) AS t(remind_at, kind)
    WHERE t.remind_at > now()
    ON CONFLICT DO NOTHING;

    SELECT display_name INTO v_coach_name FROM v2_profiles WHERE id = NEW.coach_id;
    SELECT display_name INTO v_part_name  FROM v2_profiles WHERE id = NEW.participant_id;

    INSERT INTO v2_notifications (recipient_id, kind, title, body, link_path) VALUES
      (NEW.participant_id, 'session_confirmed', 'Session confirmed',
       'Your ' || replace(NEW.session_type,'_',' ') || ' session with ' || coalesce(v_coach_name,'your coach') ||
       ' is set for ' || to_char(NEW.scheduled_at AT TIME ZONE 'America/Chicago','Dy Mon DD at HH12:MI AM') || ' (Central). The join link is on your Upcoming Sessions.',
       '/sessions'),
      (NEW.coach_id, 'session_confirmed', 'Session confirmed',
       'Session with ' || coalesce(v_part_name,'participant') || ' confirmed for ' ||
       to_char(NEW.scheduled_at AT TIME ZONE 'America/Chicago','Dy Mon DD at HH12:MI AM') || ' (Central).',
       '/coach/sessions');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_v2_session_confirmed ON v2_session_requests;
CREATE TRIGGER trg_v2_session_confirmed
  BEFORE UPDATE ON v2_session_requests
  FOR EACH ROW EXECUTE FUNCTION v2_on_session_confirmed();

-- 9) Assignment trigger: notify participant + mirror to participants table for residence app views
CREATE OR REPLACE FUNCTION v2_on_coach_assigned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_coach_name text; v_coach_email text;
BEGIN
  IF NEW.is_active THEN
    SELECT p.display_name, u.email INTO v_coach_name, v_coach_email
    FROM v2_profiles p JOIN auth.users u ON u.id = p.id WHERE p.id = NEW.coach_id;

    -- keep v2_profiles.coach_id in sync (residence app reads this)
    UPDATE v2_profiles SET coach_id = NEW.coach_id WHERE id = NEW.participant_id;

    -- mirror to core participants roster when linked
    UPDATE participants SET assigned_coach_name = v_coach_name,
                            assigned_coach_email = v_coach_email,
                            updated_at = now()
    WHERE supabase_user_id = NEW.participant_id;

    INSERT INTO v2_notifications (recipient_id, kind, title, body, link_path) VALUES
      (NEW.participant_id, 'coach_assigned', 'You have a coach',
       coalesce(v_coach_name,'A Grace coach') || ' is now walking with you. You can message them and set up sessions anytime.',
       '/messages'),
      (NEW.coach_id, 'coach_assigned', 'New participant connected',
       'You are now connected. Reach out when you are ready.', '/coach/roster');
  ELSE
    UPDATE v2_profiles SET coach_id = NULL
    WHERE id = NEW.participant_id AND coach_id = NEW.coach_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_v2_coach_assigned ON v2_coach_assignments;
CREATE TRIGGER trg_v2_coach_assigned
  AFTER INSERT OR UPDATE OF is_active ON v2_coach_assignments
  FOR EACH ROW EXECUTE FUNCTION v2_on_coach_assigned();

-- 10) DM notification trigger
CREATE OR REPLACE FUNCTION v2_on_dm_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_recipient uuid; v_sender_name text;
BEGIN
  v_recipient := CASE WHEN NEW.sender_id = NEW.coach_id THEN NEW.participant_id ELSE NEW.coach_id END;
  SELECT display_name INTO v_sender_name FROM v2_profiles WHERE id = NEW.sender_id;
  INSERT INTO v2_notifications (recipient_id, kind, title, body, link_path)
  VALUES (v_recipient, 'new_message', 'New message',
          coalesce(v_sender_name,'Someone') || ': ' || left(NEW.body, 120),
          CASE WHEN v_recipient = NEW.coach_id THEN '/coach/messages' ELSE '/messages' END);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_v2_dm_insert ON v2_direct_messages;
CREATE TRIGGER trg_v2_dm_insert
  AFTER INSERT ON v2_direct_messages
  FOR EACH ROW EXECUTE FUNCTION v2_on_dm_insert();

-- 11) Reminder sweep (called by Worker cron every 5 min via RPC with service role)
CREATE OR REPLACE FUNCTION v2_sweep_session_reminders()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; n int := 0; v_kind v2_notification_kind; v_title text; v_body text;
BEGIN
  FOR r IN
    SELECT rem.id AS rem_id, rem.kind, sr.*
    FROM v2_session_reminders rem
    JOIN v2_session_requests sr ON sr.id = rem.session_request_id
    WHERE rem.sent_at IS NULL AND rem.remind_at <= now()
      AND sr.status = 'confirmed'
    FOR UPDATE OF rem SKIP LOCKED
  LOOP
    IF r.kind = 'starting_now' THEN
      v_kind := 'session_starting'; v_title := 'Your session is starting';
      v_body := 'It''s time. Tap Join Session — your link is ready.';
    ELSE
      v_kind := 'session_reminder';
      v_title := CASE r.kind WHEN 'day_before' THEN 'Session tomorrow' ELSE 'Session in 1 hour' END;
      v_body := 'Your session is at ' || to_char(r.scheduled_at AT TIME ZONE 'America/Chicago','Dy Mon DD, HH12:MI AM') || ' Central.';
    END IF;
    INSERT INTO v2_notifications (recipient_id, kind, title, body, link_path) VALUES
      (r.participant_id, v_kind, v_title, v_body, '/sessions'),
      (r.coach_id,       v_kind, v_title, v_body, '/coach/sessions');
    UPDATE v2_session_reminders SET sent_at = now() WHERE id = r.rem_id;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION v2_sweep_session_reminders() FROM anon, authenticated;
