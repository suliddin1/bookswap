-- Reviewable, content-minimized records for automated moderation outcomes.

create table public.moderation_decisions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  actor_id uuid references public.users(id) on delete set null,
  surface text not null check (
    surface in ('listing_create', 'listing_update', 'chat_message', 'moderation_api')
  ),
  target_id uuid,
  content_type text not null check (content_type in ('text', 'image')),
  provider text not null check (provider in ('local_rules', 'openai', 'none')),
  outcome text not null check (outcome in ('approved', 'rejected', 'unavailable')),
  reason_code text not null check (char_length(reason_code) between 1 and 80),
  categories text[] not null default '{}'::text[] check (cardinality(categories) <= 32),
  provider_decision_id text check (
    provider_decision_id is null or char_length(provider_decision_id) <= 200
  ),
  created_at timestamptz not null default now()
);

alter table public.moderation_decisions enable row level security;

revoke all on table public.moderation_decisions from anon, authenticated, service_role;
grant select, insert on table public.moderation_decisions to service_role;

create policy "Deny direct moderation decision access"
  on public.moderation_decisions for all
  to anon, authenticated
  using (false)
  with check (false);

create index moderation_decisions_created_at_idx
  on public.moderation_decisions (created_at desc);

create index moderation_decisions_actor_created_idx
  on public.moderation_decisions (actor_id, created_at desc)
  where actor_id is not null;

comment on table public.moderation_decisions is
  'Content-minimized automated moderation outcomes. Raw submitted content is intentionally excluded.';
