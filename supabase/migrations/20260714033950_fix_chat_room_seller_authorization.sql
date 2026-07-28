-- RLS policies cannot read protected public.users.banned columns after the
-- table was reduced to safe column grants. Keep that field private and expose
-- only a boolean predicate from a schema that is not part of the Data API.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.user_is_active(target_user_id uuid)
returns boolean
language sql
stable
strict
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users
    where public.users.id = target_user_id
      and not public.users.banned
  );
$$;

revoke all on function private.user_is_active(uuid)
  from public, anon, authenticated;
grant execute on function private.user_is_active(uuid)
  to anon, authenticated;

-- Rebuild policies that previously joined protected users columns directly.
drop policy if exists "Active listings are public" on public.listings;
create policy "Active listings are public" on public.listings for select
  to anon, authenticated
  using (
    public.listings.seller_id = (select auth.uid())
    or (
      public.listings.status in ('active', 'sold')
      and private.user_is_active(public.listings.seller_id)
    )
  );

drop policy if exists "Active sellers create listings" on public.listings;
create policy "Active sellers create listings" on public.listings for insert
  to authenticated
  with check (
    public.listings.seller_id = (select auth.uid())
    and private.user_is_active((select auth.uid()))
  );

drop policy if exists "Active sellers update listings" on public.listings;
create policy "Active sellers update listings" on public.listings for update
  to authenticated
  using (public.listings.seller_id = (select auth.uid()))
  with check (
    public.listings.seller_id = (select auth.uid())
    and private.user_is_active((select auth.uid()))
  );

drop policy if exists "Active sellers delete listings" on public.listings;
create policy "Active sellers delete listings" on public.listings for delete
  to authenticated
  using (
    public.listings.seller_id = (select auth.uid())
    and private.user_is_active((select auth.uid()))
  );

-- Qualify every outer chat_rooms column so the inner listings relation cannot
-- capture an ambiguous seller_id reference. The previous policy compiled the
-- ownership check to listing.seller_id = listing.seller_id.
drop policy if exists "Buyers open valid rooms" on public.chat_rooms;

create policy "Buyers open valid rooms" on public.chat_rooms for insert
  to authenticated
  with check (
    public.chat_rooms.buyer_id = (select auth.uid())
    and public.chat_rooms.buyer_id <> public.chat_rooms.seller_id
    and private.user_is_active(public.chat_rooms.buyer_id)
    and private.user_is_active(public.chat_rooms.seller_id)
    and exists (
      select 1
      from public.listings as listing
      where listing.id = public.chat_rooms.listing_id
        and listing.seller_id = public.chat_rooms.seller_id
        and listing.status = 'active'
    )
  );

drop policy if exists "Active room members send messages" on public.messages;
create policy "Active room members send messages" on public.messages for insert
  to authenticated
  with check (
    public.messages.sender_id = (select auth.uid())
    and private.user_is_active((select auth.uid()))
    and exists (
      select 1
      from public.chat_rooms as room
      where room.id = public.messages.room_id
        and (select auth.uid()) in (room.buyer_id, room.seller_id)
    )
  );

drop policy if exists "Users submit reports" on public.reports;
create policy "Users submit reports" on public.reports for insert
  to authenticated
  with check (
    public.reports.reporter_id = (select auth.uid())
    and private.user_is_active((select auth.uid()))
  );

-- Enforce the listing/seller relationship even for privileged server writes.
do $$
begin
  if exists (
    select 1
    from public.chat_rooms as room
    join public.listings as listing on listing.id = room.listing_id
    where room.seller_id <> listing.seller_id
  ) then
    raise exception
      'Cannot enforce chat room seller ownership: mismatched rows exist';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_id_seller_id_key'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_id_seller_id_key unique (id, seller_id);
  end if;

  -- Replace, rather than duplicate, the existing relation so PostgREST has
  -- exactly one chat_rooms -> listings relationship to embed.
  alter table public.chat_rooms
    drop constraint if exists chat_rooms_listing_seller_fkey;
  alter table public.chat_rooms
    drop constraint if exists chat_rooms_listing_id_fkey;
  alter table public.chat_rooms
    add constraint chat_rooms_listing_id_fkey
    foreign key (listing_id, seller_id)
    references public.listings (id, seller_id)
    on delete cascade;
end
$$;
