-- Banned accounts cannot use the direct Data API to retain marketplace access.
-- Server routes enforce the same rule through requireUser().
drop policy if exists "Users view own favorites" on public.favorites;
drop policy if exists "Users add own favorites" on public.favorites;
drop policy if exists "Users remove own favorites" on public.favorites;

create policy "Users view own favorites" on public.favorites for select
  to authenticated
  using (
    public.favorites.user_id = (select auth.uid())
    and private.user_is_active((select auth.uid()))
    and private.favorite_listing_is_visible(public.favorites.listing_id)
  );

create policy "Users add own favorites" on public.favorites for insert
  to authenticated
  with check (
    public.favorites.user_id = (select auth.uid())
    and private.user_is_active((select auth.uid()))
    and private.favorite_listing_is_visible(public.favorites.listing_id)
  );

create policy "Users remove own favorites" on public.favorites for delete
  to authenticated
  using (
    public.favorites.user_id = (select auth.uid())
    and private.user_is_active((select auth.uid()))
  );
