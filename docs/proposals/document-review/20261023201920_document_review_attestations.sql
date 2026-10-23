-- Proposed document-review workflow. No policy publication or historical backfill.
-- Apply only after review of this exact migration and its tested application release.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';
SET LOCAL search_path = public;

-- Fail closed if the reviewed document behavior has drifted.
DO $baseline$ BEGIN
 IF md5(pg_get_functiondef('recoveryos.acknowledge_document(bigint,text)'::regprocedure)) <> '77dbdd3060402b39faa78e1c76b7e10e' THEN RAISE EXCEPTION 'Document workflow baseline drift: acknowledge_document'; END IF;
 IF md5(pg_get_functiondef('recoveryos.application_intake_readiness(bigint)'::regprocedure)) <> '5f6eadc2fa5c51d726cc513af9055e53' THEN RAISE EXCEPTION 'Document workflow baseline drift: application_intake_readiness'; END IF;
 IF md5(pg_get_functiondef('recoveryos.ensure_my_document_assignments()'::regprocedure)) <> '8c2b1bd084f51645d0df958a738b206a' THEN RAISE EXCEPTION 'Document workflow baseline drift: ensure_my_document_assignments'; END IF;
 IF md5(pg_get_functiondef('recoveryos.record_paper_signature(bigint,text,text)'::regprocedure)) <> '082064c0e0fb25684484a1ff509f95a5' THEN RAISE EXCEPTION 'Document workflow baseline drift: record_paper_signature'; END IF;
 IF md5(pg_get_functiondef('recoveryos.staff_residence_ids()'::regprocedure)) <> '7b5a724fdb498f6ed336b062c805084e' THEN RAISE EXCEPTION 'Document workflow baseline drift: staff_residence_ids'; END IF;
 IF md5(pg_get_functiondef('recoveryos.trg_document_assignments_immutable()'::regprocedure)) <> 'aefec83bc3457f43058374836086e14f' THEN RAISE EXCEPTION 'Document workflow baseline drift: trg_document_assignments_immutable'; END IF;
 IF md5(pg_get_functiondef('recoveryos.trg_document_evidence()'::regprocedure)) <> '30f5a667a88d4337980e91e19ecc7e61' THEN RAISE EXCEPTION 'Document workflow baseline drift: trg_document_evidence'; END IF;
END $baseline$;


CREATE TABLE recoveryos.document_review_receipts (
  assignment_id bigint PRIMARY KEY REFERENCES recoveryos.document_assignments(id),
  person_id bigint NOT NULL REFERENCES recoveryos.people(id),
  actor_person_id bigint NOT NULL REFERENCES recoveryos.people(id),
  document_version_id bigint NOT NULL REFERENCES recoveryos.document_versions(id),
  document_name text NOT NULL,
  version text NOT NULL,
  content_hash text NOT NULL,
  participant_name text NOT NULL,
  actor_name text NOT NULL,
  signature_name text,
  method text NOT NULL CHECK (method IN ('electronic','acknowledgment','paper','paper_acknowledgment')),
  statements jsonb NOT NULL,
  attestation_version text NOT NULL DEFAULT 'document-review-v1',
  recorded_at timestamptz NOT NULL,
  electronic_consent_grant_id bigint REFERENCES recoveryos.consent_grants(id)
);
CREATE INDEX document_review_receipts_person_idx ON recoveryos.document_review_receipts(person_id);
ALTER TABLE recoveryos.document_review_receipts ENABLE ROW LEVEL SECURITY;
-- RPC-only evidence. No direct client reads/writes; no permissive RLS policy.
REVOKE ALL ON recoveryos.document_review_receipts FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE recoveryos.document_clarification_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  assignment_id bigint NOT NULL REFERENCES recoveryos.document_assignments(id),
  requested_by_person_id bigint NOT NULL REFERENCES recoveryos.people(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  question text CHECK (length(question) <= 2000),
  resolved_at timestamptz,
  resolved_by_person_id bigint REFERENCES recoveryos.people(id),
  CHECK ((resolved_at IS NULL) = (resolved_by_person_id IS NULL))
);
CREATE UNIQUE INDEX document_clarification_open_idx ON recoveryos.document_clarification_requests(assignment_id) WHERE resolved_at IS NULL;
ALTER TABLE recoveryos.document_clarification_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recoveryos.document_clarification_requests FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON SEQUENCE recoveryos.document_clarification_requests_id_seq FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION recoveryos._document_assignment_residence(p_assignment_id bigint)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = recoveryos, pg_temp AS $$
  SELECT coalesce(r.residence_id, p.residence_id)
  FROM document_assignments a
  LEFT JOIN residencies r ON r.id=a.residency_id AND r.person_id=a.person_id
  LEFT JOIN residence_applications p ON p.id=a.application_id AND p.person_id=a.person_id
  JOIN document_versions v ON v.id=a.document_version_id
  JOIN document_templates t ON t.id=v.template_id
  JOIN residences h ON h.id=coalesce(r.residence_id,p.residence_id) AND h.organization_id=t.organization_id
  WHERE a.id=p_assignment_id
    AND (a.residency_id IS NULL OR r.id IS NOT NULL)
    AND (a.application_id IS NULL OR p.id IS NOT NULL)
    AND (r.id IS NULL OR p.id IS NULL OR r.residence_id=p.residence_id)
    AND (t.residence_id IS NULL OR t.residence_id=h.id);
$$;
CREATE FUNCTION recoveryos._document_staff_authorized(p_assignment_id bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = recoveryos, pg_temp AS $$
  SELECT current_person_id() IS NOT NULL
    AND _document_assignment_residence(p_assignment_id) IS NOT NULL
    AND (is_platform_admin() OR _document_assignment_residence(p_assignment_id) IN (SELECT staff_residence_ids()));
$$;
CREATE FUNCTION recoveryos._document_assignment_current(p_assignment_id bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = recoveryos, pg_temp AS $$
  SELECT coalesce((SELECT t.is_active AND (t.requires_signature OR t.requires_acknowledgment)
    AND v.published_at IS NOT NULL AND v.id=(SELECT id FROM document_versions WHERE template_id=t.id AND published_at IS NOT NULL ORDER BY published_at DESC,id DESC LIMIT 1)
    AND _document_assignment_residence(a.id) IS NOT NULL
    AND (EXISTS(SELECT 1 FROM residencies r WHERE r.id=a.residency_id AND r.person_id=a.person_id AND r.residency_status IN ('active','on_pass','transitioning'))
      OR EXISTS(SELECT 1 FROM residence_applications p WHERE p.id=a.application_id AND p.person_id=a.person_id AND p.status='approved'
        AND NOT EXISTS(SELECT 1 FROM residencies r WHERE r.person_id=a.person_id AND r.residency_status IN ('active','on_pass','transitioning') AND r.residence_id<>p.residence_id)))
    FROM document_assignments a JOIN document_versions v ON v.id=a.document_version_id JOIN document_templates t ON t.id=v.template_id WHERE a.id=p_assignment_id),false);
$$;
REVOKE ALL ON FUNCTION recoveryos._document_assignment_residence(bigint), recoveryos._document_staff_authorized(bigint), recoveryos._document_assignment_current(bigint) FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION recoveryos.document_workflow_state(p_assignment_id bigint)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = recoveryos, pg_temp AS $$
DECLARE a document_assignments%ROWTYPE; receipt jsonb; question jsonb; v document_versions%ROWTYPE; t document_templates%ROWTYPE;
BEGIN
  IF current_person_id() IS NULL THEN RETURN jsonb_build_object('ok',false,'code','unauthenticated'); END IF;
  SELECT * INTO a FROM document_assignments WHERE id=p_assignment_id;
  IF NOT FOUND OR (a.person_id<>current_person_id() AND NOT _document_staff_authorized(a.id)) THEN RETURN jsonb_build_object('ok',false,'code','not_authorized'); END IF;
  SELECT * INTO STRICT v FROM document_versions WHERE id=a.document_version_id;
  SELECT * INTO STRICT t FROM document_templates WHERE id=v.template_id;
  SELECT to_jsonb(r) || jsonb_build_object('legacy_record',false) INTO receipt FROM document_review_receipts r WHERE assignment_id=a.id;
  IF receipt IS NULL AND a.acknowledged_at IS NOT NULL THEN
    receipt := jsonb_build_object('assignment_id',a.id,'document_version_id',v.id,'document_name',t.name,'version',v.version,'content_hash',v.content_hash,
      'person_id',a.person_id,'signature_name',a.signature_name,'recorded_at',a.acknowledged_at,'method',a.signature_method,
      'actor_person_id',null,'actor_name',null,'statements','[]'::jsonb,'legacy_record',true);
  END IF;
  SELECT to_jsonb(q) INTO question FROM document_clarification_requests q WHERE assignment_id=a.id AND resolved_at IS NULL;
  RETURN jsonb_build_object('ok',true,'assignment_id',a.id,'current',_document_assignment_current(a.id),'receipt',receipt,'clarification',question);
END $$;
REVOKE ALL ON FUNCTION recoveryos.document_workflow_state(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION recoveryos.document_workflow_state(bigint) TO authenticated;

CREATE FUNCTION recoveryos.request_document_explanation(p_assignment_id bigint, p_question text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = recoveryos, pg_temp AS $$
DECLARE a document_assignments%ROWTYPE; request_id bigint;
BEGIN
  IF current_person_id() IS NULL THEN RETURN jsonb_build_object('ok',false,'code','unauthenticated'); END IF;
  SELECT * INTO a FROM document_assignments WHERE id=p_assignment_id FOR UPDATE;
  IF NOT FOUND OR a.person_id<>current_person_id() THEN RETURN jsonb_build_object('ok',false,'code','not_authorized'); END IF;
  IF a.acknowledged_at IS NOT NULL OR NOT _document_assignment_current(a.id) THEN RETURN jsonb_build_object('ok',false,'code','not_pending_current'); END IF;
  IF length(p_question)>2000 THEN RETURN jsonb_build_object('ok',false,'code','question_too_long'); END IF;
  IF EXISTS(SELECT 1 FROM document_clarification_requests WHERE assignment_id=a.id AND resolved_at IS NULL) THEN RETURN jsonb_build_object('ok',true,'code','already_requested'); END IF;
  INSERT INTO document_clarification_requests(assignment_id,requested_by_person_id,question) VALUES(a.id,current_person_id(),nullif(trim(p_question),'')) RETURNING id INTO request_id;
  INSERT INTO audit_log(actor_person_id,action,entity_table,entity_id,detail) VALUES(current_person_id(),'document_explanation_requested','document_assignments',a.id,jsonb_build_object('request_id',request_id,'document_version_id',a.document_version_id));
  RETURN jsonb_build_object('ok',true,'code','requested');
END $$;
CREATE FUNCTION recoveryos.confirm_document_explanation(p_assignment_id bigint, p_confirm boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = recoveryos, pg_temp AS $$
DECLARE a document_assignments%ROWTYPE; qid bigint;
BEGIN
  IF current_person_id() IS NULL THEN RETURN jsonb_build_object('ok',false,'code','unauthenticated'); END IF;
  SELECT * INTO a FROM document_assignments WHERE id=p_assignment_id FOR UPDATE;
  IF NOT FOUND OR (a.person_id<>current_person_id() AND NOT _document_staff_authorized(a.id)) THEN RETURN jsonb_build_object('ok',false,'code','not_authorized'); END IF;
  IF p_confirm IS DISTINCT FROM true THEN RETURN jsonb_build_object('ok',false,'code','confirmation_required'); END IF;
  UPDATE document_clarification_requests SET resolved_at=now(),resolved_by_person_id=current_person_id() WHERE assignment_id=a.id AND resolved_at IS NULL RETURNING id INTO qid;
  IF qid IS NOT NULL THEN
    INSERT INTO audit_log(actor_person_id,action,entity_table,entity_id,detail) VALUES(current_person_id(),'document_explanation_confirmed','document_assignments',a.id,jsonb_build_object('request_id',qid,'participant_confirmed',true));
  END IF;
  RETURN jsonb_build_object('ok',true,'code','confirmed');
END $$;
REVOKE ALL ON FUNCTION recoveryos.request_document_explanation(bigint,text), recoveryos.confirm_document_explanation(bigint,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION recoveryos.request_document_explanation(bigint,text), recoveryos.confirm_document_explanation(bigint,boolean) TO authenticated;

CREATE FUNCTION recoveryos._complete_document_review(p_assignment_id bigint,p_expected_version_id bigint,p_expected_hash text,p_attestations jsonb,p_signature_name text,p_paper boolean,p_witness_confirmed boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = recoveryos, pg_temp SET lock_timeout = '3s' AS $$
DECLARE a document_assignments%ROWTYPE; v document_versions%ROWTYPE; t document_templates%ROWTYPE;
  me bigint := current_person_id(); stamp timestamptz := clock_timestamp(); method text; grant_id bigint; statements jsonb;
BEGIN
  IF me IS NULL THEN RETURN jsonb_build_object('ok',false,'code','unauthenticated'); END IF;
  -- Same lock order as publication; freeze applicability/flags through atomic completion.
  LOCK TABLE document_templates IN SHARE MODE;
  LOCK TABLE document_versions IN SHARE MODE;
  SELECT * INTO a FROM document_assignments WHERE id=p_assignment_id FOR UPDATE;
  IF NOT FOUND OR (NOT p_paper AND a.person_id<>me) OR (p_paper AND NOT _document_staff_authorized(a.id)) THEN RETURN jsonb_build_object('ok',false,'code','not_authorized'); END IF;
  IF a.acknowledged_at IS NOT NULL THEN RETURN document_workflow_state(a.id) || jsonb_build_object('code','already_acknowledged'); END IF;
  IF NOT _document_assignment_current(a.id) THEN RETURN jsonb_build_object('ok',false,'code','not_pending_current'); END IF;
  stamp := clock_timestamp();
  SELECT * INTO STRICT v FROM document_versions WHERE id=a.document_version_id;
  SELECT * INTO STRICT t FROM document_templates WHERE id=v.template_id;
  IF p_expected_version_id IS DISTINCT FROM v.id OR p_expected_hash IS DISTINCT FROM v.content_hash
     OR v.content_hash IS DISTINCT FROM encode(extensions.digest(convert_to(v.body_markdown,'UTF8'),'sha256'),'hex') THEN RETURN jsonb_build_object('ok',false,'code','document_changed'); END IF;
  IF p_attestations IS DISTINCT FROM '{"provided":true,"received":true,"read_or_explained":true,"understood":true,"questions":true}'::jsonb THEN RETURN jsonb_build_object('ok',false,'code','attestations_required'); END IF;
  IF EXISTS(SELECT 1 FROM document_clarification_requests WHERE assignment_id=a.id AND resolved_at IS NULL) THEN RETURN jsonb_build_object('ok',false,'code','explanation_pending'); END IF;
  IF p_paper AND p_witness_confirmed IS DISTINCT FROM true THEN RETURN jsonb_build_object('ok',false,'code','witness_required'); END IF;
  IF t.requires_signature THEN
    IF p_signature_name IS NULL OR length(trim(p_signature_name))<2 OR length(p_signature_name)>200 THEN RETURN jsonb_build_object('ok',false,'code','signature_name_required'); END IF;
    IF NOT p_paper THEN
      SELECT g.id INTO grant_id FROM consent_grants g JOIN consent_types ct ON ct.id=g.consent_type_id
       WHERE g.person_id=me AND ct.key='electronic_records' AND g.status='granted' AND g.revoked_at IS NULL AND (g.expires_at IS NULL OR g.expires_at>stamp)
       ORDER BY g.id DESC LIMIT 1 FOR SHARE OF g;
      IF grant_id IS NULL THEN RETURN jsonb_build_object('ok',false,'code','electronic_consent_required'); END IF;
    END IF;
    method := CASE WHEN p_paper THEN 'paper' ELSE 'electronic' END;
  ELSE
    IF p_signature_name IS NOT NULL THEN RETURN jsonb_build_object('ok',false,'code','signature_not_required'); END IF;
    method := CASE WHEN p_paper THEN 'paper_acknowledgment' ELSE 'acknowledgment' END;
  END IF;
  statements := '[{"key":"provided","label":"This document has been provided to me and I can access it."},{"key":"received","label":"I have received this document."},{"key":"read_or_explained","label":"I have read this document, or it has been read and explained to me."},{"key":"understood","label":"I understand this document."},{"key":"questions","label":"I have had an opportunity to ask questions and receive answers."}]'::jsonb;
  INSERT INTO document_review_receipts(assignment_id,person_id,actor_person_id,document_version_id,document_name,version,content_hash,participant_name,actor_name,signature_name,method,statements,recorded_at,electronic_consent_grant_id)
   SELECT a.id,a.person_id,me,v.id,t.name,v.version,v.content_hash,concat_ws(' ',p.first_name,p.last_name),concat_ws(' ',actor.first_name,actor.last_name),CASE WHEN t.requires_signature THEN trim(p_signature_name) END,method,statements,stamp,grant_id
   FROM people p CROSS JOIN people actor WHERE p.id=a.person_id AND actor.id=me;
  UPDATE document_assignments SET acknowledged_at=stamp,signed_at=CASE WHEN t.requires_signature THEN stamp END,
    signature_name=CASE WHEN t.requires_signature THEN trim(p_signature_name) END,signature_method=CASE WHEN t.requires_signature THEN method END WHERE id=a.id;
  INSERT INTO audit_log(actor_person_id,action,entity_table,entity_id,detail)
   VALUES(me,CASE WHEN t.requires_signature THEN 'document_signed' ELSE 'document_acknowledged' END,'document_assignments',a.id,
     jsonb_build_object('person_id',a.person_id,'document_version_id',v.id,'version',v.version,'content_hash',v.content_hash,'method',method,'attestation_version','document-review-v1','statements',statements,'recorded_at',stamp,'electronic_consent_grant_id',grant_id));
  RETURN document_workflow_state(a.id) || jsonb_build_object('code','completed');
END $$;
REVOKE ALL ON FUNCTION recoveryos._complete_document_review(bigint,bigint,text,jsonb,text,boolean,boolean) FROM PUBLIC, anon, authenticated, service_role;
CREATE FUNCTION recoveryos.complete_document_review(p_assignment_id bigint,p_expected_version_id bigint,p_expected_hash text,p_attestations jsonb,p_signature_name text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = recoveryos, pg_temp AS $$
 SELECT _complete_document_review(p_assignment_id,p_expected_version_id,p_expected_hash,p_attestations,p_signature_name,false,false);
$$;
CREATE FUNCTION recoveryos.record_document_paper_review(p_assignment_id bigint,p_expected_version_id bigint,p_expected_hash text,p_attestations jsonb,p_signature_name text,p_witness_confirmed boolean)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = recoveryos, pg_temp AS $$
 SELECT _complete_document_review(p_assignment_id,p_expected_version_id,p_expected_hash,p_attestations,p_signature_name,true,p_witness_confirmed);
$$;
REVOKE ALL ON FUNCTION recoveryos.complete_document_review(bigint,bigint,text,jsonb,text), recoveryos.record_document_paper_review(bigint,bigint,text,jsonb,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION recoveryos.complete_document_review(bigint,bigint,text,jsonb,text), recoveryos.record_document_paper_review(bigint,bigint,text,jsonb,text,boolean) TO authenticated;

-- Retire unchecked legacy calls without deleting any historical evidence.
CREATE OR REPLACE FUNCTION recoveryos.acknowledge_document(p_assignment_id bigint,p_signature_name text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = recoveryos, pg_temp AS $$
BEGIN
 IF current_person_id() IS NULL THEN RETURN jsonb_build_object('ok',false,'code','unauthenticated'); END IF;
 IF NOT EXISTS(SELECT 1 FROM document_assignments WHERE id=p_assignment_id AND person_id=current_person_id()) THEN RETURN jsonb_build_object('ok',false,'code','not_authorized'); END IF;
 IF EXISTS(SELECT 1 FROM document_assignments WHERE id=p_assignment_id AND acknowledged_at IS NOT NULL) THEN RETURN jsonb_build_object('ok',true,'code','already_acknowledged'); END IF;
 RETURN jsonb_build_object('ok',false,'code','attestations_required');
END $$;
CREATE OR REPLACE FUNCTION recoveryos.record_paper_signature(p_person_id bigint,p_template_key text,p_signature_name text)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = recoveryos, pg_temp AS $$
 SELECT jsonb_build_object('ok',false,'code',CASE WHEN current_person_id() IS NULL THEN 'unauthenticated' ELSE 'attestations_required' END);
$$;
REVOKE ALL ON FUNCTION recoveryos.acknowledge_document(bigint,text), recoveryos.record_paper_signature(bigint,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION recoveryos.acknowledge_document(bigint,text), recoveryos.record_paper_signature(bigint,text,text) TO authenticated;

CREATE FUNCTION recoveryos.trg_document_review_receipt_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = recoveryos, pg_temp AS $$ BEGIN RAISE EXCEPTION 'document review receipts are immutable evidence'; END $$;
CREATE TRIGGER document_review_receipt_immutable BEFORE UPDATE OR DELETE ON recoveryos.document_review_receipts FOR EACH ROW EXECUTE FUNCTION recoveryos.trg_document_review_receipt_immutable();
CREATE FUNCTION recoveryos.trg_document_completion_requires_receipt()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = recoveryos, pg_temp AS $$
BEGIN
 IF TG_OP='INSERT' AND NEW.acknowledged_at IS NOT NULL THEN RAISE EXCEPTION 'new completion requires an audited document review'; END IF;
 IF TG_OP='UPDATE' AND OLD.acknowledged_at IS NULL AND NEW.acknowledged_at IS NOT NULL THEN
   IF NOT EXISTS(SELECT 1 FROM document_review_receipts r WHERE r.assignment_id=NEW.id AND r.person_id=NEW.person_id AND r.document_version_id=NEW.document_version_id AND r.recorded_at=NEW.acknowledged_at
     AND r.signature_name IS NOT DISTINCT FROM NEW.signature_name
     AND (CASE WHEN r.method IN ('electronic','paper') THEN r.recorded_at END) IS NOT DISTINCT FROM NEW.signed_at
     AND (CASE WHEN r.method IN ('electronic','paper') THEN r.method END) IS NOT DISTINCT FROM NEW.signature_method) THEN RAISE EXCEPTION 'completion requires matching immutable review receipt'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER document_completion_requires_receipt BEFORE INSERT OR UPDATE ON recoveryos.document_assignments FOR EACH ROW EXECUTE FUNCTION recoveryos.trg_document_completion_requires_receipt();
REVOKE ALL ON FUNCTION recoveryos.trg_document_review_receipt_immutable(), recoveryos.trg_document_completion_requires_receipt() FROM PUBLIC, anon, authenticated, service_role;
DROP POLICY IF EXISTS document_assignments_ack_self ON recoveryos.document_assignments;
REVOKE INSERT, UPDATE, DELETE ON recoveryos.document_assignments FROM PUBLIC, anon, authenticated;
-- Include explicit column grants: a table-level REVOKE alone does not remove them.
DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT column_name FROM information_schema.columns WHERE table_schema='recoveryos' AND table_name='document_assignments' LOOP
   EXECUTE format('REVOKE INSERT (%I), UPDATE (%I) ON recoveryos.document_assignments FROM PUBLIC, anon, authenticated',c.column_name,c.column_name);
 END LOOP;
END $$;

CREATE FUNCTION recoveryos._issue_document_review_assignments(p_person_id bigint,p_residence_id bigint,p_residency_id bigint,p_application_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = recoveryos, pg_temp AS $$
BEGIN
  -- Serialize issuance for one person without removing any existing duplicate/history row.
  PERFORM pg_advisory_xact_lock(hashtextextended('document_assignments:'||p_person_id::text,0));
  INSERT INTO document_assignments(document_version_id,person_id,residency_id,application_id)
  SELECT v.id,p_person_id,p_residency_id,p_application_id FROM document_templates t
  JOIN residences h ON h.id=p_residence_id AND h.organization_id=t.organization_id
  JOIN LATERAL(SELECT id FROM document_versions WHERE template_id=t.id AND published_at IS NOT NULL ORDER BY published_at DESC,id DESC LIMIT 1)v ON true
  WHERE t.is_active AND (t.requires_signature OR t.requires_acknowledgment) AND (t.residence_id IS NULL OR t.residence_id=h.id)
    AND NOT EXISTS(SELECT 1 FROM document_assignments a WHERE a.person_id=p_person_id AND a.document_version_id=v.id
      AND _document_assignment_residence(a.id)=p_residence_id
      AND (a.acknowledged_at IS NOT NULL OR _document_assignment_current(a.id)));
END $$;
REVOKE ALL ON FUNCTION recoveryos._issue_document_review_assignments(bigint,bigint,bigint,bigint) FROM PUBLIC, anon, authenticated, service_role;
CREATE OR REPLACE FUNCTION recoveryos.ensure_my_document_assignments()
RETURNS SETOF recoveryos.document_assignments LANGUAGE plpgsql SECURITY DEFINER SET search_path = recoveryos, pg_temp AS $$
DECLARE me bigint := current_person_id(); r residencies%ROWTYPE; p residence_applications%ROWTYPE;
BEGIN
 IF me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 SELECT * INTO r FROM residencies WHERE person_id=me AND residency_status IN ('active','on_pass','transitioning') ORDER BY created_at DESC,id DESC LIMIT 1;
 IF FOUND THEN PERFORM _issue_document_review_assignments(me,r.residence_id,r.id,null);
 ELSE
  SELECT * INTO p FROM residence_applications WHERE person_id=me AND status='approved' ORDER BY submitted_at DESC,id DESC LIMIT 1;
  IF FOUND THEN PERFORM _issue_document_review_assignments(me,p.residence_id,null,p.id); END IF;
 END IF;
 RETURN QUERY SELECT * FROM document_assignments WHERE person_id=me;
END $$;
REVOKE ALL ON FUNCTION recoveryos.ensure_my_document_assignments() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION recoveryos.ensure_my_document_assignments() TO authenticated;

CREATE FUNCTION recoveryos.prepare_application_document_review(p_application_id bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = recoveryos, pg_temp AS $$
DECLARE p residence_applications%ROWTYPE; rid bigint;
BEGIN
 IF current_person_id() IS NULL THEN RETURN jsonb_build_object('ok',false,'code','unauthenticated'); END IF;
 SELECT * INTO p FROM residence_applications WHERE id=p_application_id;
 IF NOT FOUND OR (NOT is_platform_admin() AND p.residence_id NOT IN(SELECT staff_residence_ids())) THEN RETURN jsonb_build_object('ok',false,'code','not_authorized'); END IF;
 SELECT id INTO rid FROM residencies WHERE person_id=p.person_id AND residence_id=p.residence_id AND residency_status IN ('active','on_pass','transitioning') ORDER BY created_at DESC,id DESC LIMIT 1;
 IF p.status<>'approved' AND rid IS NULL THEN RETURN jsonb_build_object('ok',false,'code','application_not_approved'); END IF;
 PERFORM _issue_document_review_assignments(p.person_id,p.residence_id,rid,CASE WHEN rid IS NULL THEN p.id END);
 RETURN jsonb_build_object('ok',true,'code','prepared','residence_id',p.residence_id);
END $$;
CREATE FUNCTION recoveryos.list_staff_document_reviews(p_residence_id bigint,p_application_id bigint DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = recoveryos, pg_temp AS $$
DECLARE items jsonb;
BEGIN
 IF current_person_id() IS NULL THEN RETURN jsonb_build_object('ok',false,'code','unauthenticated'); END IF;
 IF NOT is_platform_admin() AND p_residence_id NOT IN(SELECT staff_residence_ids()) THEN RETURN jsonb_build_object('ok',false,'code','not_authorized'); END IF;
 IF p_application_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM residence_applications WHERE id=p_application_id AND residence_id=p_residence_id) THEN RETURN jsonb_build_object('ok',false,'code','not_authorized'); END IF;
 SELECT coalesce(jsonb_agg(x.item ORDER BY x.person_id,x.assignment_id),'[]'::jsonb) INTO items FROM (
   SELECT a.id AS assignment_id,a.person_id,jsonb_build_object('assignment_id',a.id,'person_id',a.person_id,'person_name',concat_ws(' ',p.first_name,p.last_name),
    'document_name',t.name,'template_key',t.key,'requires_signature',t.requires_signature,'document_version_id',v.id,'version',v.version,'content_hash',v.content_hash,'body_markdown',v.body_markdown,
    'state',document_workflow_state(a.id)) AS item
   FROM document_assignments a JOIN people p ON p.id=a.person_id JOIN document_versions v ON v.id=a.document_version_id JOIN document_templates t ON t.id=v.template_id
   WHERE a.acknowledged_at IS NULL AND _document_assignment_residence(a.id)=p_residence_id AND _document_assignment_current(a.id)
    AND (p_application_id IS NULL OR a.person_id=(SELECT person_id FROM residence_applications WHERE id=p_application_id AND residence_id=p_residence_id))
 )x;
 RETURN jsonb_build_object('ok',true,'items',items);
END $$;
REVOKE ALL ON FUNCTION recoveryos.prepare_application_document_review(bigint), recoveryos.list_staff_document_reviews(bigint,bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION recoveryos.prepare_application_document_review(bigint), recoveryos.list_staff_document_reviews(bigint,bigint) TO authenticated;

-- Latest applicable edition by template identity; historical completion remains visible.
CREATE OR REPLACE FUNCTION recoveryos.application_intake_readiness(p_application_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'recoveryos', 'pg_temp'
AS $function$
declare
  v_me bigint := recoveryos.current_person_id();
  v_app recoveryos.residence_applications%rowtype;
  v_items jsonb := '[]'::jsonb;
  v_blocking jsonb;
  v_t record;
  v_met boolean;
  v_reviewed_none boolean;
  v_sig_count int := 0;
  v_has_screening boolean;
  v_supervision_applies boolean;
  v_accommodation_raised boolean;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_app from recoveryos.residence_applications where id = p_application_id;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_app.person_id <> v_me
     and v_app.residence_id not in (select recoveryos.staff_residence_ids())
     and not recoveryos.is_care_operations_staff()
     and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  for v_t in
    select t.id as template_id, t.key, t.name, latest.id as document_version_id, latest.version, latest.content_hash
    from recoveryos.document_templates t
    join recoveryos.residences r on r.id = v_app.residence_id
     and r.organization_id = t.organization_id
    join lateral (select id,version,content_hash from recoveryos.document_versions where template_id=t.id and published_at is not null order by published_at desc,id desc limit 1) latest on true
    where t.is_active and t.requires_signature
      and (t.residence_id is null or t.residence_id = v_app.residence_id)
      and exists (select 1 from recoveryos.document_versions dv
                  where dv.template_id = t.id and dv.published_at is not null)
    order by t.key
  loop
    v_sig_count := v_sig_count + 1;
    select exists (
      select 1 from recoveryos.document_assignments a
      join recoveryos.document_versions dv on dv.id = a.document_version_id
      join recoveryos.document_templates t2 on t2.id = dv.template_id
      where a.person_id = v_app.person_id and _document_assignment_residence(a.id)=v_app.residence_id and dv.id = v_t.document_version_id and a.signed_at is not null
    ) into v_met;
    v_items := v_items || jsonb_build_object(
      'key', 'sign:' || v_t.key, 'label', 'Sign: ' || v_t.name,
      'class', 'required_before_admission',
      'status', case when v_met then 'met' else 'missing' end,
      'met', v_met, 'overridable', false,
      'document_version_id',v_t.document_version_id,'version',v_t.version,'content_hash',v_t.content_hash,
      'historical_completed',exists(select 1 from recoveryos.document_assignments a join recoveryos.document_versions dv on dv.id=a.document_version_id where a.person_id=v_app.person_id and dv.template_id=v_t.template_id and dv.id<>v_t.document_version_id and a.acknowledged_at is not null),
      'completion_evidence',case when not v_met then 'pending' when exists(select 1 from recoveryos.document_review_receipts dr where dr.person_id=v_app.person_id and dr.document_version_id=v_t.document_version_id and _document_assignment_residence(dr.assignment_id)=v_app.residence_id) then 'attested' else 'legacy_recorded' end);
  end loop;

  if v_sig_count = 0 then
    v_items := v_items || jsonb_build_object(
      'key', 'signature_documents', 'label', 'Residence document edition (signature set)',
      'class', 'required_before_admission',
      'status', 'pending_document_edition',
      'met', false, 'overridable', false);
  end if;

  for v_t in
    select t.id as template_id, t.key, t.name, latest.id as document_version_id, latest.version, latest.content_hash
    from recoveryos.document_templates t
    join recoveryos.residences r on r.id = v_app.residence_id
     and r.organization_id = t.organization_id
    join lateral (select id,version,content_hash from recoveryos.document_versions where template_id=t.id and published_at is not null order by published_at desc,id desc limit 1) latest on true
    where t.is_active and t.requires_acknowledgment and not t.requires_signature
      and (t.residence_id is null or t.residence_id = v_app.residence_id)
      and exists (select 1 from recoveryos.document_versions dv
                  where dv.template_id = t.id and dv.published_at is not null)
    order by t.key
  loop
    select exists (
      select 1 from recoveryos.document_assignments a
      join recoveryos.document_versions dv on dv.id = a.document_version_id
      join recoveryos.document_templates t2 on t2.id = dv.template_id
      where a.person_id = v_app.person_id and _document_assignment_residence(a.id)=v_app.residence_id and dv.id = v_t.document_version_id and a.acknowledged_at is not null
    ) into v_met;
    v_items := v_items || jsonb_build_object(
      'key', 'ack:' || v_t.key, 'label', 'Acknowledge: ' || v_t.name,
      'class', 'required_for_intake_completion',
      'status', case when v_met then 'met' else 'missing' end,
      'met', v_met, 'overridable', false,
      'document_version_id',v_t.document_version_id,'version',v_t.version,'content_hash',v_t.content_hash,
      'historical_completed',exists(select 1 from recoveryos.document_assignments a join recoveryos.document_versions dv on dv.id=a.document_version_id where a.person_id=v_app.person_id and dv.template_id=v_t.template_id and dv.id<>v_t.document_version_id and a.acknowledged_at is not null),
      'completion_evidence',case when not v_met then 'pending' when exists(select 1 from recoveryos.document_review_receipts dr where dr.person_id=v_app.person_id and dr.document_version_id=v_t.document_version_id and _document_assignment_residence(dr.assignment_id)=v_app.residence_id) then 'attested' else 'legacy_recorded' end);
  end loop;

  select exists (
    select 1 from recoveryos.consent_grants g
    join recoveryos.consent_types ct on ct.id = g.consent_type_id
    where g.person_id = v_app.person_id and ct.key = 'residence_screening'
      and g.status = 'granted' and g.revoked_at is null
      and (g.expires_at is null or g.expires_at > now())
  ) into v_has_screening;
  v_items := v_items || jsonb_build_object(
    'key', 'screening_consent', 'label', 'Screening consent (current grant)',
    'class', 'required_before_admission',
    'status', case when v_has_screening then 'met' else 'missing' end,
    'met', v_has_screening, 'overridable', false);

  select exists (
    select 1 from recoveryos.emergency_contacts c
    where c.person_id = v_app.person_id and c.is_active
  ) into v_met;
  v_items := v_items || jsonb_build_object(
    'key', 'emergency_contact', 'label', 'Emergency contact on file',
    'class', 'required_for_intake_completion',
    'status', case when v_met then 'met' else 'missing' end,
    'met', v_met, 'overridable', false);

  select exists (
    select 1 from recoveryos.residency_medication_items m
    where m.person_id = v_app.person_id and m.ended_at is null
  ) into v_met;
  select exists (
    select 1 from recoveryos.medication_status_reviews
    where person_id = v_app.person_id and superseded_at is null
  ) into v_reviewed_none;
  v_items := v_items || jsonb_build_object(
    'key', 'medication_items', 'label', 'Medication status reviewed per medication policy',
    'class', 'conditionally_required',
    'status', case when v_met then 'met'
                   when v_reviewed_none then 'reviewed_none'
                   else 'unconfirmed' end,
    'met', v_met or v_reviewed_none, 'overridable', true);

  v_accommodation_raised := nullif(trim(coalesce(v_app.answers->>'accommodation_needs','')), '') is not null;
  if v_accommodation_raised then
    v_items := v_items || jsonb_build_object(
      'key', 'accommodation', 'label', 'Accommodation need reviewed with staff',
      'class', 'conditionally_required',
      'status', 'needs_staff_review', 'met', false, 'overridable', true);
  else
    v_items := v_items || jsonb_build_object(
      'key', 'accommodation', 'label', 'Accommodation need reviewed with staff',
      'class', 'not_applicable', 'status', 'not_applicable',
      'met', true, 'overridable', false);
  end if;

  v_supervision_applies := lower(coalesce(v_app.answers->>'supervision_coordination','')) = 'yes';
  if v_supervision_applies then
    select exists (
      select 1 from recoveryos.supervision_coordination_records s
      join recoveryos.consent_grants g on g.id = s.consent_grant_id
      where s.person_id = v_app.person_id and s.is_active
        and g.status = 'granted' and g.revoked_at is null
        and (g.expires_at is null or g.expires_at > now())
    ) into v_met;
    v_items := v_items || jsonb_build_object(
      'key', 'supervision', 'label', 'Supervision coordination authorized + contact on file',
      'class', 'conditionally_required',
      'status', case when v_met then 'met' else 'missing' end,
      'met', v_met, 'overridable', true);
  else
    v_items := v_items || jsonb_build_object(
      'key', 'supervision', 'label', 'Supervision coordination authorized + contact on file',
      'class', 'not_applicable', 'status', 'not_applicable',
      'met', true, 'overridable', false);
  end if;

  select coalesce(jsonb_agg(i->>'key'), '[]'::jsonb) into v_blocking
  from jsonb_array_elements(v_items) i
  where (i->>'met')::boolean = false;

  return jsonb_build_object('ok', true,
    'application_id', p_application_id,
    'complete', jsonb_array_length(v_blocking) = 0,
    'items', v_items,
    'blocking_unmet', v_blocking);
end $function$
;
REVOKE ALL ON FUNCTION recoveryos.application_intake_readiness(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION recoveryos.application_intake_readiness(bigint) TO authenticated;
CREATE FUNCTION recoveryos.list_my_document_review_states()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = recoveryos, pg_temp AS $$
 SELECT coalesce(jsonb_agg(document_workflow_state(id) ORDER BY id),'[]'::jsonb) FROM document_assignments WHERE person_id=current_person_id();
$$;
REVOKE ALL ON FUNCTION recoveryos.list_my_document_review_states() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION recoveryos.list_my_document_review_states() TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
