create table if not exists public.favorites (
  user_id uuid not null references public.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

alter table public.favorites enable row level security;
alter table public.reports enable row level security;

drop policy if exists "Users view own favorites" on public.favorites;
drop policy if exists "Users add own favorites" on public.favorites;
drop policy if exists "Users remove own favorites" on public.favorites;
drop policy if exists "Users submit reports" on public.reports;
drop policy if exists "Users view own reports" on public.reports;
create policy "Users view own favorites" on public.favorites for select using (user_id = auth.uid());
create policy "Users add own favorites" on public.favorites for insert with check (user_id = auth.uid());
create policy "Users remove own favorites" on public.favorites for delete using (user_id = auth.uid());
create policy "Users submit reports" on public.reports for insert with check (reporter_id = auth.uid());
create policy "Users view own reports" on public.reports for select using (reporter_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, name, email, city)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email, new.raw_user_meta_data->>'city')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
