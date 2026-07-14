-- Support deterministic catalog price cursors and public seller inventory cursors.
create index if not exists listings_active_price_id_idx
  on public.listings (price, id)
  where status = 'active';

create index if not exists listings_public_seller_created_idx
  on public.listings (seller_id, created_at desc, id desc)
  where status in ('active', 'sold');
