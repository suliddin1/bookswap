-- Favorites are a reference to a public marketplace copy, not a capability
-- for retrieving a draft, locked copy, or a banned seller's inventory.
create or replace function private.favorite_listing_is_visible(
  target_listing_id uuid
)
returns boolean
language sql
stable
strict
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.listings as listing
    join public.users as seller on seller.id = listing.seller_id
    where listing.id = target_listing_id
      and listing.status in ('active', 'sold')
      and not seller.banned
  );
$$;

revoke all on function private.favorite_listing_is_visible(uuid)
  from public, anon, authenticated;
grant execute on function private.favorite_listing_is_visible(uuid)
  to authenticated;

-- RLS does not constrain service-role writes. A trigger keeps the visibility
-- invariant atomic if listing state changes between the route check and insert.
create or replace function private.enforce_favorite_listing_visibility()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.favorite_listing_is_visible(new.listing_id) then
    raise exception using
      errcode = '23514',
      message = 'Favorite target must be publicly visible';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_favorite_listing_visibility()
  from public, anon, authenticated, service_role;

drop trigger if exists enforce_favorite_listing_visibility
  on public.favorites;
create trigger enforce_favorite_listing_visibility
before insert or update of listing_id on public.favorites
for each row execute function private.enforce_favorite_listing_visibility();

drop policy if exists "Users view own favorites" on public.favorites;
drop policy if exists "Users add own favorites" on public.favorites;

create policy "Users view own favorites" on public.favorites for select
  to authenticated
  using (
    public.favorites.user_id = (select auth.uid())
    and private.favorite_listing_is_visible(public.favorites.listing_id)
  );

create policy "Users add own favorites" on public.favorites for insert
  to authenticated
  with check (
    public.favorites.user_id = (select auth.uid())
    and private.favorite_listing_is_visible(public.favorites.listing_id)
  );
