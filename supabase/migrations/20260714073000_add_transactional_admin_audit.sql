-- Immutable admin action history written atomically with each protected mutation.

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  actor_name text not null check (char_length(actor_name) between 2 and 80),
  target_type text not null check (
    target_type in ('user', 'listing', 'report', 'privacy_request', 'appeal')
  ),
  target_id uuid not null,
  action text not null check (char_length(action) between 3 and 80),
  reason text not null check (char_length(reason) between 10 and 1000),
  before_state jsonb not null check (jsonb_typeof(before_state) = 'object'),
  after_state jsonb not null check (jsonb_typeof(after_state) = 'object'),
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

revoke all on table public.admin_audit_log from anon, authenticated, service_role;
grant select on table public.admin_audit_log to service_role;

create policy "Deny direct admin audit access"
  on public.admin_audit_log for all
  to anon, authenticated
  using (false)
  with check (false);

create index admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);

create index admin_audit_log_actor_created_idx
  on public.admin_audit_log (actor_id, created_at desc);

create index admin_audit_log_target_created_idx
  on public.admin_audit_log (target_type, target_id, created_at desc);

comment on table public.admin_audit_log is
  'Immutable actor, target, action, reason, and bounded state history for administrator mutations.';

create or replace function private.reject_admin_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'admin audit history is immutable' using errcode = '55000';
end;
$$;

revoke all on function private.reject_admin_audit_mutation()
  from public, anon, authenticated, service_role;

create trigger reject_admin_audit_mutation
before update or delete on public.admin_audit_log
for each row execute function private.reject_admin_audit_mutation();

create or replace function private.require_admin_actor(p_actor_id uuid)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_actor_name text;
begin
  select user_profile.name
  into v_actor_name
  from public.users user_profile
  where user_profile.id = p_actor_id
    and user_profile.is_admin
    and not user_profile.banned;

  if v_actor_name is null then
    raise exception 'admin actor is unavailable' using errcode = '42501';
  end if;
  return v_actor_name;
end;
$$;

revoke all on function private.require_admin_actor(uuid)
  from public, anon, authenticated, service_role;

create or replace function private.require_admin_reason(p_reason text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if char_length(v_reason) not between 10 and 1000 then
    raise exception 'admin action reason must contain 10 to 1000 characters'
      using errcode = '22023';
  end if;
  return v_reason;
end;
$$;

revoke all on function private.require_admin_reason(text)
  from public, anon, authenticated, service_role;

create or replace function public.admin_set_user_ban(
  p_actor_id uuid,
  p_target_id uuid,
  p_banned boolean,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_name text := private.require_admin_actor(p_actor_id);
  v_reason text := private.require_admin_reason(p_reason);
  v_previous_banned boolean;
  v_target_is_admin boolean;
  v_target_name text;
begin
  if p_actor_id = p_target_id then
    raise exception 'administrator cannot suspend their own account'
      using errcode = '23514';
  end if;

  select target.banned, target.is_admin, target.name
  into v_previous_banned, v_target_is_admin, v_target_name
  from public.users target
  where target.id = p_target_id
  for update;

  if not found then
    raise exception 'target user not found' using errcode = 'P0002';
  end if;
  if v_target_is_admin then
    raise exception 'administrator accounts cannot be suspended here'
      using errcode = '42501';
  end if;
  if v_previous_banned = p_banned then
    raise exception 'target user already has the requested state'
      using errcode = '23514';
  end if;

  update public.users set banned = p_banned where id = p_target_id;

  insert into public.admin_audit_log (
    actor_id, actor_name, target_type, target_id, action, reason,
    before_state, after_state
  ) values (
    p_actor_id,
    v_actor_name,
    'user',
    p_target_id,
    case when p_banned then 'user.banned' else 'user.unbanned' end,
    v_reason,
    jsonb_build_object('banned', v_previous_banned),
    jsonb_build_object('banned', p_banned)
  );

  return jsonb_build_object(
    'id', p_target_id,
    'name', v_target_name,
    'banned', p_banned
  );
end;
$$;

create or replace function public.admin_moderate_listing(
  p_actor_id uuid,
  p_listing_id uuid,
  p_action text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_name text := private.require_admin_actor(p_actor_id);
  v_reason text := private.require_admin_reason(p_reason);
  v_previous_status public.listing_status;
  v_new_status public.listing_status;
  v_seller_id uuid;
  v_notification_id uuid;
begin
  if p_action not in ('approve', 'reject') then
    raise exception 'unsupported listing moderation action' using errcode = '22023';
  end if;
  v_new_status := case
    when p_action = 'approve' then 'active'::public.listing_status
    else 'draft'::public.listing_status
  end;

  select listing.status, listing.seller_id
  into v_previous_status, v_seller_id
  from public.listings listing
  where listing.id = p_listing_id
  for update;

  if not found then
    raise exception 'target listing not found' using errcode = 'P0002';
  end if;

  update public.listings set status = v_new_status where id = p_listing_id;

  insert into public.notifications (user_id, type, payload)
  values (
    v_seller_id,
    'SYSTEM',
    jsonb_build_object(
      'listingId', p_listing_id::text,
      'message', format(
        'Your listing was %s.',
        case when p_action = 'approve' then 'approved' else 'rejected' end
      )
    )
  )
  returning id into v_notification_id;

  insert into public.admin_audit_log (
    actor_id, actor_name, target_type, target_id, action, reason,
    before_state, after_state
  ) values (
    p_actor_id,
    v_actor_name,
    'listing',
    p_listing_id,
    case when p_action = 'approve' then 'listing.approved' else 'listing.rejected' end,
    v_reason,
    jsonb_build_object('status', v_previous_status::text),
    jsonb_build_object('status', v_new_status::text)
  );

  return jsonb_build_object(
    'listingId', p_listing_id,
    'sellerId', v_seller_id,
    'status', v_new_status::text,
    'notificationId', v_notification_id
  );
end;
$$;

create or replace function public.admin_resolve_report(
  p_actor_id uuid,
  p_report_id uuid,
  p_status text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_name text := private.require_admin_actor(p_actor_id);
  v_reason text := private.require_admin_reason(p_reason);
  v_previous_status text;
begin
  if p_status not in ('resolved', 'dismissed') then
    raise exception 'unsupported report status' using errcode = '22023';
  end if;

  select report.status
  into v_previous_status
  from public.reports report
  where report.id = p_report_id
  for update;

  if not found then
    raise exception 'target report not found' using errcode = 'P0002';
  end if;
  if v_previous_status <> 'open' then
    raise exception 'report has already been reviewed' using errcode = '23514';
  end if;

  update public.reports set status = p_status where id = p_report_id;

  insert into public.admin_audit_log (
    actor_id, actor_name, target_type, target_id, action, reason,
    before_state, after_state
  ) values (
    p_actor_id,
    v_actor_name,
    'report',
    p_report_id,
    'report.' || p_status,
    v_reason,
    jsonb_build_object('status', v_previous_status),
    jsonb_build_object('status', p_status)
  );

  return jsonb_build_object('id', p_report_id, 'status', p_status);
end;
$$;

create or replace function public.admin_resolve_privacy_request(
  p_actor_id uuid,
  p_request_id uuid,
  p_status text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_name text := private.require_admin_actor(p_actor_id);
  v_reason text := private.require_admin_reason(p_reason);
  v_request_type text;
  v_previous_status text;
  v_previous_resolved_at timestamptz;
  v_resolved_at timestamptz;
  v_target_type text;
begin
  if p_status not in ('in_progress', 'completed', 'rejected') then
    raise exception 'unsupported privacy request status' using errcode = '22023';
  end if;

  select request.type, request.status, request.resolved_at
  into v_request_type, v_previous_status, v_previous_resolved_at
  from public.privacy_requests request
  where request.id = p_request_id
  for update;

  if not found then
    raise exception 'target privacy request not found' using errcode = 'P0002';
  end if;
  if v_previous_status in ('completed', 'rejected') or v_previous_status = p_status then
    raise exception 'privacy request cannot transition to the requested state'
      using errcode = '23514';
  end if;

  v_resolved_at := case
    when p_status in ('completed', 'rejected') then now()
    else null
  end;
  v_target_type := case
    when v_request_type = 'appeal' then 'appeal'
    else 'privacy_request'
  end;

  update public.privacy_requests
  set status = p_status,
      resolved_at = v_resolved_at
  where id = p_request_id;

  insert into public.admin_audit_log (
    actor_id, actor_name, target_type, target_id, action, reason,
    before_state, after_state
  ) values (
    p_actor_id,
    v_actor_name,
    v_target_type,
    p_request_id,
    v_target_type || '.' || p_status,
    v_reason,
    jsonb_build_object(
      'status', v_previous_status,
      'resolvedAt', v_previous_resolved_at
    ),
    jsonb_build_object(
      'status', p_status,
      'resolvedAt', v_resolved_at
    )
  );

  return jsonb_build_object(
    'id', p_request_id,
    'type', v_request_type,
    'status', p_status,
    'resolvedAt', v_resolved_at
  );
end;
$$;

revoke all on function public.admin_set_user_ban(uuid, uuid, boolean, text)
  from public, anon, authenticated;
revoke all on function public.admin_moderate_listing(uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.admin_resolve_report(uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.admin_resolve_privacy_request(uuid, uuid, text, text)
  from public, anon, authenticated;

grant execute on function public.admin_set_user_ban(uuid, uuid, boolean, text)
  to service_role;
grant execute on function public.admin_moderate_listing(uuid, uuid, text, text)
  to service_role;
grant execute on function public.admin_resolve_report(uuid, uuid, text, text)
  to service_role;
grant execute on function public.admin_resolve_privacy_request(uuid, uuid, text, text)
  to service_role;
