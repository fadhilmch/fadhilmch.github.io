-- PREPARATION ONLY. Apply in staging first; see GUIDE.md for approval gates.
-- Inspected 2026-10-10: public.admin_save(text,jsonb), get_recap(text),
-- check_admin(text), admin_export(text); tenisyuk.doc/verify and settings columns.
BEGIN;
-- Fail closed if the backend shape or crypto location changed.
DO $$ BEGIN
  IF to_regprocedure('public.admin_save(text,jsonb)') IS NULL
     OR to_regprocedure('tenisyuk.verify(text,text)') IS NULL
     OR to_regprocedure('extensions.digest(text,text)') IS NULL THEN
    RAISE EXCEPTION 'Backend/crypto preflight failed. Review definitions before applying.';
  END IF;
END $$;
CREATE TABLE tenisyuk.revision (
  id integer PRIMARY KEY CHECK(id = 1), value bigint NOT NULL CHECK(value >= 0)
);
INSERT INTO tenisyuk.revision VALUES (1,0);
CREATE TABLE tenisyuk.bot_capabilities (
  id text PRIMARY KEY, token_hash text UNIQUE NOT NULL CHECK(length(token_hash)=64),
  expires_at timestamptz NOT NULL, revoked_at timestamptz,
  scopes text[] NOT NULL CHECK(scopes <@ ARRAY['sessions:read','summary:read']::text[])
);
-- No capability is provisioned by this migration. Never store a raw token here.
REVOKE ALL ON SCHEMA tenisyuk FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA tenisyuk FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA tenisyuk FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA tenisyuk FROM PUBLIC, anon, authenticated;
ALTER FUNCTION tenisyuk.verify(text,text) SET search_path = pg_catalog, tenisyuk, extensions;

-- Preserve the inspected validation, one-removal rule, soft deletion and audit code.
-- Remove the unversioned entry point and put it behind an owner-only helper.
ALTER FUNCTION public.admin_save(text,jsonb) SET SCHEMA tenisyuk;
ALTER FUNCTION tenisyuk.admin_save(text,jsonb) RENAME TO admin_save_snapshot;
ALTER FUNCTION tenisyuk.admin_save_snapshot(text,jsonb) SET search_path = pg_catalog, tenisyuk, extensions;
REVOKE ALL ON FUNCTION tenisyuk.admin_save_snapshot(text,jsonb) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION tenisyuk.snapshot() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, tenisyuk AS $snapshot$

  select jsonb_build_object(
    'sessions', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'date', date_label, 'billed', billed, 'real', real, 'players', players, 'paid', paid)
        || case when guess is not null then jsonb_build_object('guess', guess) else '{}'::jsonb end
        || case when venue is not null then jsonb_build_object('venue', venue) else '{}'::jsonb end order by pos) from tenisyuk.sessions where deleted_at is null), '[]'),
    'tx', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'date', date_label, 'account', account, 'kind', kind, 'amount', amount, 'note', note) order by pos) from tenisyuk.tx where deleted_at is null), '[]'),
    'venues', coalesce((select jsonb_agg(name order by pos) from tenisyuk.venues where deleted_at is null), '[]'));

$snapshot$;
REVOKE ALL ON FUNCTION tenisyuk.snapshot() FROM PUBLIC, anon, authenticated;
CREATE FUNCTION tenisyuk.bump_revision() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, tenisyuk AS $$
BEGIN UPDATE tenisyuk.revision SET value=value+1 WHERE id=1; RETURN NULL; END $$;
REVOKE ALL ON FUNCTION tenisyuk.bump_revision() FROM PUBLIC, anon, authenticated;
-- Include config changes: snapshots must never mix data and an old version.
CREATE TRIGGER ty_revision AFTER INSERT OR UPDATE OR DELETE ON tenisyuk.sessions
FOR EACH STATEMENT EXECUTE FUNCTION tenisyuk.bump_revision();
CREATE TRIGGER ty_revision AFTER INSERT OR UPDATE OR DELETE ON tenisyuk.tx
FOR EACH STATEMENT EXECUTE FUNCTION tenisyuk.bump_revision();
CREATE TRIGGER ty_revision AFTER INSERT OR UPDATE OR DELETE ON tenisyuk.venues
FOR EACH STATEMENT EXECUTE FUNCTION tenisyuk.bump_revision();
CREATE TRIGGER ty_revision AFTER INSERT OR UPDATE OR DELETE ON tenisyuk.settings
FOR EACH STATEMENT EXECUTE FUNCTION tenisyuk.bump_revision();

CREATE OR REPLACE FUNCTION public.get_recap(p_code text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, tenisyuk, extensions AS $$
DECLARE v text; ver bigint; s tenisyuk.settings;
BEGIN
  v := tenisyuk.verify(p_code,'viewer');
  IF v <> 'ok' THEN RETURN jsonb_build_object('error',v); END IF;
  SELECT value INTO STRICT ver FROM tenisyuk.revision WHERE id=1 FOR SHARE;
  SELECT * INTO STRICT s FROM tenisyuk.settings WHERE id=1;
  RETURN tenisyuk.snapshot() || jsonb_build_object('version',ver::text,'cfg',
    jsonb_build_object('payer',s.payer,'swish',s.swish,'kasOpening',s.kas_opening,'membershipTarget',s.membership_target));
END $$;
-- Two-argument calls from old pages MUST fail rather than bypassing concurrency.
CREATE FUNCTION public.admin_save(p_code text,p_doc jsonb) RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('error','upgrade_required');
$$;
CREATE FUNCTION public.admin_save_v2(p_code text,p_doc jsonb,p_expected_version text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, tenisyuk, extensions AS $$
DECLARE v text; ver bigint; r jsonb;
BEGIN
  v := tenisyuk.verify(p_code,'admin');
  IF v <> 'ok' THEN RETURN jsonb_build_object('error',v); END IF;
  SELECT value INTO STRICT ver FROM tenisyuk.revision WHERE id=1 FOR UPDATE;
  IF p_expected_version IS NULL OR p_expected_version !~ '^[0-9]+$' THEN
    RETURN jsonb_build_object('error','upgrade_required');
  END IF;
  IF ver::text <> p_expected_version THEN
    RETURN jsonb_build_object('error','conflict','version',ver::text);
  END IF;
  r := tenisyuk.admin_save_snapshot(p_code,p_doc);
  IF r ? 'error' THEN RETURN r; END IF;
  SELECT value INTO STRICT ver FROM tenisyuk.revision WHERE id=1;
  RETURN r || jsonb_build_object('version',ver::text);
END $$;

-- Bot authentication is separate from both viewer/admin codes. The verifier
-- reads only stored SHA-256 hashes and enforces existing 5-try/15-minute guards.
CREATE FUNCTION tenisyuk.verify_bot(p_token text,p_scope text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,tenisyuk,extensions AS $$
DECLARE ip text; sc text; g tenisyuk.guard; good boolean;
BEGIN
  BEGIN ip:=split_part(coalesce(current_setting('request.headers',true)::json->>'x-forwarded-for',''),',',1);
  EXCEPTION WHEN OTHERS THEN ip:=''; END;
  sc:='bot:' || coalesce(nullif(trim(ip),''),'global');
  INSERT INTO tenisyuk.guard(scope) VALUES(sc) ON CONFLICT DO NOTHING;
  SELECT * INTO STRICT g FROM tenisyuk.guard WHERE scope=sc FOR UPDATE;
  IF g.locked_until > now() THEN RETURN 'locked'; END IF;
  SELECT EXISTS(SELECT 1 FROM tenisyuk.bot_capabilities
    WHERE token_hash=encode(extensions.digest(coalesce(p_token,''),'sha256'),'hex')
    AND length(coalesce(p_token,''))>=43 AND expires_at>now() AND revoked_at IS NULL
    AND p_scope=ANY(scopes)) INTO good;
  IF good THEN UPDATE tenisyuk.guard SET fails=0,locked_until=NULL WHERE scope=sc; RETURN 'ok'; END IF;
  UPDATE tenisyuk.guard SET fails=CASE WHEN fails+1>=5 THEN 0 ELSE fails+1 END,
    locked_until=CASE WHEN fails+1>=5 THEN now()+interval '15 minutes' ELSE NULL END WHERE scope=sc;
  RETURN 'wrong_capability';
END $$;
REVOKE ALL ON FUNCTION tenisyuk.verify_bot(text,text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.bot_sessions(p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,tenisyuk AS $$
DECLARE v text; ver bigint;
BEGIN
  v:=tenisyuk.verify_bot(p_token,'sessions:read');
  IF v<>'ok' THEN RETURN jsonb_build_object('error',v); END IF;
  SELECT value INTO STRICT ver FROM tenisyuk.revision WHERE id=1 FOR SHARE;
  RETURN jsonb_build_object('version',ver::text,'sessions',tenisyuk.snapshot()->'sessions');
END $$;
CREATE FUNCTION public.bot_summary(p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,tenisyuk AS $$
DECLARE v text; ver bigint; d jsonb; s tenisyuk.settings; owed numeric; mem numeric; kas numeric;
BEGIN
  v:=tenisyuk.verify_bot(p_token,'summary:read');
  IF v<>'ok' THEN RETURN jsonb_build_object('error',v); END IF;
  SELECT value INTO STRICT ver FROM tenisyuk.revision WHERE id=1 FOR SHARE;
  SELECT * INTO STRICT s FROM tenisyuk.settings WHERE id=1;
  d:=tenisyuk.snapshot();
  SELECT coalesce(sum(((e->>'billed')::numeric/jsonb_array_length(e->'players')+5) *
    (SELECT count(*) FROM jsonb_array_elements_text(e->'players') p
      WHERE p<>s.payer AND NOT (e->'paid' ? p))),0),
    coalesce(sum((e->>'billed')::numeric-(e->>'real')::numeric),0),
    coalesce(sum((SELECT count(*) FROM jsonb_array_elements_text(e->'paid') p WHERE e->'players' ? p)*5),0)
    INTO owed,mem,kas FROM jsonb_array_elements(d->'sessions') e;
  SELECT mem+coalesce(sum((CASE WHEN e->>'kind'='in' THEN 1 ELSE -1 END)*(e->>'amount')::numeric),0)
    INTO mem FROM jsonb_array_elements(d->'tx') e WHERE e->>'account'='membership';
  SELECT kas+s.kas_opening+coalesce(sum((CASE WHEN e->>'kind'='in' THEN 1 ELSE -1 END)*(e->>'amount')::numeric),0)
    INTO kas FROM jsonb_array_elements(d->'tx') e WHERE e->>'account'='kas';
  RETURN jsonb_build_object('version',ver::text,'sessionCount',jsonb_array_length(d->'sessions'),
    'outstanding',owed,'membership',mem,'kasReal',kas);
END $$;
REVOKE ALL ON FUNCTION public.get_recap(text), public.admin_save(text,jsonb),
 public.admin_save_v2(text,jsonb,text),public.bot_sessions(text),public.bot_summary(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_recap(text),public.admin_save(text,jsonb),
 public.admin_save_v2(text,jsonb,text),public.bot_sessions(text),public.bot_summary(text) TO anon,authenticated;
-- Preserve these existing gated entry points, but remove implicit PUBLIC access.
ALTER FUNCTION public.check_admin(text) SET search_path=pg_catalog,tenisyuk,extensions;
ALTER FUNCTION public.admin_export(text) SET search_path=pg_catalog,tenisyuk,extensions;
REVOKE ALL ON FUNCTION public.check_admin(text),public.admin_export(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin(text),public.admin_export(text) TO anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
