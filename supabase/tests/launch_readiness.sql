-- Run after `supabase db reset` against local Supabase only:
--   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
--     -v ON_ERROR_STOP=1 -f supabase/tests/launch_readiness.sql

begin;
set local lock_timeout = '10s';
set local statement_timeout = '60s';

do $test$
declare
  v_allowed boolean;
  v_remaining integer;
  v_retry integer;
begin
  if exists (
    select 1
    from pg_class table_state
    join pg_namespace schema_state on schema_state.oid = table_state.relnamespace
    where schema_state.nspname = 'public'
      and table_state.relkind = 'r'
      and not table_state.relrowsecurity
  ) then
    raise exception 'Every public table must have RLS enabled';
  end if;

  if has_table_privilege('anon', 'public.legal_acceptances', 'select')
    or has_table_privilege('authenticated', 'public.legal_acceptances', 'insert')
    or has_table_privilege('authenticated', 'public.legal_acceptances', 'update')
    or has_table_privilege('authenticated', 'public.legal_acceptances', 'delete')
    or not has_table_privilege('authenticated', 'public.legal_acceptances', 'select')
    or not has_table_privilege('service_role', 'public.legal_acceptances', 'delete')
  then
    raise exception 'Legal acceptance ACLs are not read-own/immutable with service-only retention cleanup';
  end if;

  if has_function_privilege(
    'authenticated',
    'private.record_signup_legal_acceptance()',
    'execute'
  ) or has_function_privilege(
    'anon',
    'private.record_signup_legal_acceptance()',
    'execute'
  ) then
    raise exception 'Browser roles must not execute the legal acceptance trigger';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'legal_acceptances'
      and policyname = 'Users view their own legal acceptances'
      and cmd = 'SELECT'
  ) then
    raise exception 'Own-row legal acceptance policy is missing';
  end if;

  if has_function_privilege(
    'anon',
    'public.consume_rate_limit(text,text,integer,integer)',
    'execute'
  ) or has_function_privilege(
    'authenticated',
    'public.consume_rate_limit(text,text,integer,integer)',
    'execute'
  ) then
    raise exception 'Browser roles must not execute the durable rate limiter';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.consume_rate_limit(text,text,integer,integer)',
    'execute'
  ) then
    raise exception 'Service role must execute the durable rate limiter';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'Users upload listing images',
        'Users remove own listing images',
        'Users select own listing images'
      )
  ) then
    raise exception 'Browser storage mutation policies must remain removed';
  end if;

  if private.normalize_az_text('İŞIQ Işıq') <> 'işıq ışıq' then
    raise exception 'Azerbaijani dotted/dotless I normalization regressed';
  end if;

  if (
    select count(*)
    from pg_constraint
    where conname in (
      'listings_title_length',
      'listings_author_length',
      'listings_description_length',
      'listings_price_upper_bound',
      'listings_image_count',
      'reviews_comment_length'
    )
  ) <> 6 then
    raise exception 'Launch-critical database constraints are incomplete';
  end if;

  delete from private.rate_limit_buckets where scope = 'test.launch';
  select allowed, remaining, retry_after_seconds
  into v_allowed, v_remaining, v_retry
  from public.consume_rate_limit(
    'test.launch', repeat('a', 64), 2, 60
  );
  if not v_allowed or v_remaining <> 1 or v_retry not between 1 and 60 then
    raise exception 'First rate-limit decision is invalid';
  end if;

  select allowed, remaining
  into v_allowed, v_remaining
  from public.consume_rate_limit(
    'test.launch', repeat('a', 64), 2, 60
  );
  if not v_allowed or v_remaining <> 0 then
    raise exception 'Second rate-limit decision is invalid';
  end if;

  select allowed, remaining
  into v_allowed, v_remaining
  from public.consume_rate_limit(
    'test.launch', repeat('a', 64), 2, 60
  );
  if v_allowed or v_remaining <> 0 then
    raise exception 'Rate limit must deny above the configured threshold';
  end if;
end
$test$;

rollback;
select 'launch-readiness database checks passed' as result;
