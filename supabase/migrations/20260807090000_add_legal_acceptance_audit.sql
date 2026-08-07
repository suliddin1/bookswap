create table public.legal_acceptances (
  user_id uuid not null,
  terms_version text not null,
  privacy_version text not null,
  marketplace_rules_version text not null,
  age_18_plus_confirmed boolean not null,
  personal_data_processing_consent boolean not null,
  cross_border_transfer_disclosed_and_consented boolean not null,
  accepted_at timestamptz not null default clock_timestamp(),
  constraint legal_acceptances_pkey primary key (
    user_id,
    terms_version,
    privacy_version,
    marketplace_rules_version
  ),
  constraint legal_acceptances_current_versions check (
    terms_version = '2026-08-07'
    and privacy_version = '2026-08-07'
    and marketplace_rules_version = '2026-08-07'
  ),
  constraint legal_acceptances_affirmative_consent check (
    age_18_plus_confirmed
    and personal_data_processing_consent
    and cross_border_transfer_disclosed_and_consented
  )
);

alter table public.legal_acceptances enable row level security;

revoke all on table public.legal_acceptances
from public, anon, authenticated, service_role;

grant select on table public.legal_acceptances to authenticated, service_role;
grant delete on table public.legal_acceptances to service_role;

create policy "Users view their own legal acceptances"
on public.legal_acceptances
for select
to authenticated
using ((select auth.uid()) = legal_acceptances.user_id);

create or replace function private.record_signup_legal_acceptance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'terms_version', '') <> '2026-08-07'
    or coalesce(new.raw_user_meta_data ->> 'privacy_version', '') <> '2026-08-07'
    or coalesce(new.raw_user_meta_data ->> 'marketplace_rules_version', '') <> '2026-08-07'
    or coalesce(new.raw_user_meta_data ->> 'age_18_plus_confirmed', '') <> 'true'
    or coalesce(new.raw_user_meta_data ->> 'personal_data_processing_consent', '') <> 'true'
    or coalesce(new.raw_user_meta_data ->> 'cross_border_transfer_disclosed_and_consented', '') <> 'true'
  then
    raise exception 'Current BookSwap legal acceptance is required.'
      using errcode = '23514';
  end if;

  insert into public.legal_acceptances (
    user_id,
    terms_version,
    privacy_version,
    marketplace_rules_version,
    age_18_plus_confirmed,
    personal_data_processing_consent,
    cross_border_transfer_disclosed_and_consented
  )
  values (
    new.id,
    '2026-08-07',
    '2026-08-07',
    '2026-08-07',
    true,
    true,
    true
  );

  return new;
end;
$$;

revoke all on function private.record_signup_legal_acceptance()
from public, anon, authenticated, service_role;

drop trigger if exists record_signup_legal_acceptance on auth.users;
create trigger record_signup_legal_acceptance
after insert on auth.users
for each row execute function private.record_signup_legal_acceptance();

alter table public.privacy_requests
drop constraint privacy_requests_type_check;

alter table public.privacy_requests
add constraint privacy_requests_type_check
check (
  type in (
    'access',
    'correction',
    'export',
    'deletion',
    'consent_withdrawal',
    'objection',
    'appeal'
  )
);
