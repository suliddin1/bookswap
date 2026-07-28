-- Least-privilege and marketplace integrity hardening.
-- This migration is safe to apply after the three original BookSwap migrations.

-- Profiles: keep public identity fields readable while protecting contact and role data.
revoke all on table public.users from anon, authenticated;
grant select (id, name, city, created_at) on table public.users to anon, authenticated;
grant update (name, phone, city) on table public.users to authenticated;

-- Explicit Data API grants. RLS below still controls which rows are accessible.
revoke all on table public.listings, public.chat_rooms, public.messages, public.reviews,
  public.notifications, public.favorites, public.reports from anon, authenticated;

grant select on table public.listings, public.reviews to anon;
grant select, insert, update, delete on table public.listings to authenticated;
grant select, insert on table public.chat_rooms, public.messages, public.reviews to authenticated;
grant select on table public.notifications to authenticated;
grant update (read) on table public.notifications to authenticated;
grant select, insert, delete on table public.favorites to authenticated;
grant select, insert on table public.reports to authenticated;

-- RLS helper predicates are intentionally repeated so policies remain independently auditable.
drop policy if exists "Public profiles are visible" on public.users;
drop policy if exists "Users update themselves" on public.users;
create policy "Public profiles are visible" on public.users for select
  to anon, authenticated
  using (not banned or id = (select auth.uid()));
create policy "Users update safe profile fields" on public.users for update
  to authenticated
  using (id = (select auth.uid()) and not banned)
  with check (id = (select auth.uid()) and not banned);

drop policy if exists "Active listings are public" on public.listings;
drop policy if exists "Sellers create listings" on public.listings;
drop policy if exists "Sellers update listings" on public.listings;
drop policy if exists "Sellers delete listings" on public.listings;
create policy "Active listings are public" on public.listings for select
  to anon, authenticated
  using (
    seller_id = (select auth.uid())
    or (
      status in ('active', 'sold')
      and exists (select 1 from public.users seller where seller.id = seller_id and not seller.banned)
    )
  );
create policy "Active sellers create listings" on public.listings for insert
  to authenticated
  with check (
    seller_id = (select auth.uid())
    and exists (select 1 from public.users seller where seller.id = (select auth.uid()) and not seller.banned)
  );
create policy "Active sellers update listings" on public.listings for update
  to authenticated
  using (seller_id = (select auth.uid()))
  with check (
    seller_id = (select auth.uid())
    and exists (select 1 from public.users seller where seller.id = (select auth.uid()) and not seller.banned)
  );
create policy "Active sellers delete listings" on public.listings for delete
  to authenticated
  using (
    seller_id = (select auth.uid())
    and exists (select 1 from public.users seller where seller.id = (select auth.uid()) and not seller.banned)
  );

drop policy if exists "Room members can view rooms" on public.chat_rooms;
drop policy if exists "Buyers open rooms" on public.chat_rooms;
create policy "Room members can view rooms" on public.chat_rooms for select
  to authenticated
  using ((select auth.uid()) in (buyer_id, seller_id));
create policy "Buyers open valid rooms" on public.chat_rooms for insert
  to authenticated
  with check (
    buyer_id = (select auth.uid())
    and buyer_id <> seller_id
    and exists (
      select 1 from public.listings listing
      join public.users buyer on buyer.id = (select auth.uid()) and not buyer.banned
      where listing.id = listing_id and listing.seller_id = seller_id and listing.status = 'active'
    )
  );

drop policy if exists "Room members view messages" on public.messages;
drop policy if exists "Room members send messages" on public.messages;
create policy "Room members view messages" on public.messages for select
  to authenticated
  using (exists (
    select 1 from public.chat_rooms room
    where room.id = room_id and (select auth.uid()) in (room.buyer_id, room.seller_id)
  ));
create policy "Active room members send messages" on public.messages for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.chat_rooms room
      join public.users sender on sender.id = (select auth.uid()) and not sender.banned
      where room.id = room_id and (select auth.uid()) in (room.buyer_id, room.seller_id)
    )
  );

drop policy if exists "Reviews are public" on public.reviews;
drop policy if exists "Buyer reviews sold listing once" on public.reviews;
create policy "Reviews are public" on public.reviews for select to anon, authenticated using (true);
create policy "Buyer reviews sold listing once" on public.reviews for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.chat_rooms room
      join public.listings listing on listing.id = room.listing_id
      where room.listing_id = reviews.listing_id
        and room.buyer_id = (select auth.uid())
        and listing.status = 'sold'
    )
  );

drop policy if exists "Users view notifications" on public.notifications;
drop policy if exists "Users mark notifications read" on public.notifications;
create policy "Users view notifications" on public.notifications for select
  to authenticated using (user_id = (select auth.uid()));
create policy "Users mark notifications read" on public.notifications for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users view own favorites" on public.favorites;
drop policy if exists "Users add own favorites" on public.favorites;
drop policy if exists "Users remove own favorites" on public.favorites;
create policy "Users view own favorites" on public.favorites for select
  to authenticated using (user_id = (select auth.uid()));
create policy "Users add own favorites" on public.favorites for insert
  to authenticated with check (user_id = (select auth.uid()));
create policy "Users remove own favorites" on public.favorites for delete
  to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users submit reports" on public.reports;
drop policy if exists "Users view own reports" on public.reports;
create policy "Users submit reports" on public.reports for insert
  to authenticated
  with check (
    reporter_id = (select auth.uid())
    and exists (select 1 from public.users reporter where reporter.id = (select auth.uid()) and not reporter.banned)
  );
create policy "Users view own reports" on public.reports for select
  to authenticated using (reporter_id = (select auth.uid()));

-- Storage uploads stay isolated by user folder. Public delivery is intentional for listing covers.
drop policy if exists "Users upload listing images" on storage.objects;
drop policy if exists "Users remove own listing images" on storage.objects;
create policy "Users upload listing images" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'listing-images' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "Users remove own listing images" on storage.objects for delete
  to authenticated
  using (bucket_id = 'listing-images' and (select auth.uid())::text = (storage.foldername(name))[1]);

-- Data-integrity constraints and abuse-resistant indexes.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'chat_rooms_distinct_participants') then
    alter table public.chat_rooms add constraint chat_rooms_distinct_participants check (buyer_id <> seller_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reports_reason_length') then
    alter table public.reports add constraint reports_reason_length check (char_length(reason) between 10 and 500);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'users_name_length') then
    alter table public.users add constraint users_name_length check (char_length(name) between 2 and 80);
  end if;
end $$;

create unique index if not exists reports_one_open_per_listing_idx
  on public.reports (reporter_id, listing_id) where status = 'open';
create index if not exists listings_active_created_idx
  on public.listings (created_at desc, id desc) where status = 'active';

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('access', 'correction', 'export', 'deletion', 'objection', 'appeal')),
  details text not null check (char_length(details) between 10 and 2000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.privacy_requests enable row level security;
revoke all on table public.privacy_requests from anon, authenticated;
grant select, insert on table public.privacy_requests to authenticated;
create policy "Users create privacy requests" on public.privacy_requests for insert
  to authenticated with check (user_id = (select auth.uid()));
create policy "Users view privacy requests" on public.privacy_requests for select
  to authenticated using (user_id = (select auth.uid()));
create index if not exists privacy_requests_user_created_idx on public.privacy_requests (user_id, created_at desc);
create index if not exists privacy_requests_open_idx on public.privacy_requests (created_at) where status in ('open', 'in_progress');

-- The auth trigger is privileged by necessity, but is not a public RPC endpoint.
alter function public.handle_new_user() set search_path = '';
revoke all on function public.handle_new_user() from public, anon, authenticated;
