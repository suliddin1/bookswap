-- Keep public marketplace pagination indexable without weakening direct-table
-- RLS. These narrowly granted readers reproduce the public visibility rule
-- explicitly and return only the fields consumed by the public API.

create or replace function public.catalog_listings_page(
  p_query text default '',
  p_category text default null,
  p_city text default null,
  p_condition text default null,
  p_max_price numeric default null,
  p_sort text default 'newest',
  p_cursor_created_at timestamptz default null,
  p_cursor_price numeric default null,
  p_cursor_id uuid default null,
  p_limit integer default 25
)
returns table (
  id uuid,
  title text,
  author text,
  description text,
  isbn text,
  price numeric,
  original_price numeric,
  images text[],
  category text,
  condition text,
  city text,
  status public.listing_status,
  seller_id uuid,
  created_at timestamptz,
  seller jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  cursor_clause text;
  order_clause text;
begin
  if p_query is null or char_length(p_query) > 200 then
    raise exception using errcode = '22023', message = 'invalid catalog query';
  end if;
  if p_sort not in ('newest', 'price-low', 'price-high') then
    raise exception using errcode = '22023', message = 'invalid catalog sort';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 51 then
    raise exception using errcode = '22023', message = 'invalid catalog limit';
  end if;
  if p_max_price is not null and (p_max_price <= 0 or p_max_price > 10000) then
    raise exception using errcode = '22023', message = 'invalid maximum price';
  end if;
  if p_cursor_id is null
    and (p_cursor_created_at is not null or p_cursor_price is not null)
  then
    raise exception using errcode = '22023', message = 'incomplete catalog cursor';
  end if;

  if p_sort = 'newest' then
    if p_cursor_id is not null
      and (p_cursor_created_at is null or p_cursor_price is not null)
    then
      raise exception using errcode = '22023', message = 'invalid newest cursor';
    end if;
    cursor_clause :=
      '($9 is null or (listing.created_at, listing.id) < ($7, $9))';
    order_clause := 'listing.created_at desc, listing.id desc';
  elsif p_sort = 'price-low' then
    if p_cursor_id is not null
      and (p_cursor_price is null or p_cursor_created_at is not null)
    then
      raise exception using errcode = '22023', message = 'invalid price cursor';
    end if;
    cursor_clause := '($9 is null or (listing.price, listing.id) > ($8, $9))';
    order_clause := 'listing.price, listing.id';
  else
    if p_cursor_id is not null
      and (p_cursor_price is null or p_cursor_created_at is not null)
    then
      raise exception using errcode = '22023', message = 'invalid price cursor';
    end if;
    cursor_clause := '($9 is null or (listing.price, listing.id) < ($8, $9))';
    order_clause := 'listing.price desc, listing.id desc';
  end if;

  return query execute format(
    $query$
      select
        listing.id,
        listing.title,
        listing.author,
        listing.description,
        listing.isbn,
        listing.price,
        listing.original_price,
        listing.images,
        listing.category,
        listing.condition,
        listing.city,
        listing.status,
        listing.seller_id,
        listing.created_at,
        jsonb_build_object(
          'id', seller_row.id,
          'name', seller_row.name,
          'city', seller_row.city,
          'created_at', seller_row.created_at
        ) as seller
      from public.listings as listing
      join public.users as seller_row
        on seller_row.id = listing.seller_id
       and not seller_row.banned
      where listing.status = 'active'
        and (nullif($1, '') is null
          or listing.search @@ websearch_to_tsquery('simple', $1))
        and ($2 is null or listing.category = $2)
        and ($3 is null or listing.city = $3)
        and ($4 is null or listing.condition = $4)
        and ($5 is null or listing.price <= $5)
        and %s
      order by %s
      limit $10
    $query$,
    cursor_clause,
    order_clause
  )
  using
    p_query,
    p_category,
    p_city,
    p_condition,
    p_max_price,
    p_sort,
    p_cursor_created_at,
    p_cursor_price,
    p_cursor_id,
    p_limit;
end
$function$;

create or replace function public.seller_listings_page(
  p_seller_id uuid,
  p_cursor_created_at timestamptz default null,
  p_cursor_id uuid default null,
  p_limit integer default 13
)
returns table (
  id uuid,
  title text,
  author text,
  description text,
  isbn text,
  price numeric,
  original_price numeric,
  images text[],
  category text,
  condition text,
  city text,
  status public.listing_status,
  seller_id uuid,
  created_at timestamptz,
  seller jsonb
)
language plpgsql
stable
security definer
set search_path = ''
set plan_cache_mode = force_custom_plan
as $function$
begin
  if p_seller_id is null then
    raise exception using errcode = '22023', message = 'invalid seller';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 51 then
    raise exception using errcode = '22023', message = 'invalid seller limit';
  end if;
  if (p_cursor_id is null) <> (p_cursor_created_at is null) then
    raise exception using errcode = '22023', message = 'incomplete seller cursor';
  end if;

  return query
  select
    listing.id,
    listing.title,
    listing.author,
    listing.description,
    listing.isbn,
    listing.price,
    listing.original_price,
    listing.images,
    listing.category,
    listing.condition,
    listing.city,
    listing.status,
    listing.seller_id,
    listing.created_at,
    jsonb_build_object(
      'id', seller_row.id,
      'name', seller_row.name,
      'city', seller_row.city,
      'created_at', seller_row.created_at
    ) as seller
  from public.listings as listing
  join public.users as seller_row
    on seller_row.id = listing.seller_id
   and not seller_row.banned
  where listing.seller_id = p_seller_id
    and listing.status in ('active', 'sold')
    and (
      p_cursor_id is null
      or (listing.created_at, listing.id) < (p_cursor_created_at, p_cursor_id)
    )
  order by listing.created_at desc, listing.id desc
  limit p_limit;
end
$function$;

revoke all on function public.catalog_listings_page(
  text,
  text,
  text,
  text,
  numeric,
  text,
  timestamptz,
  numeric,
  uuid,
  integer
) from public, anon, authenticated;
grant execute on function public.catalog_listings_page(
  text,
  text,
  text,
  text,
  numeric,
  text,
  timestamptz,
  numeric,
  uuid,
  integer
) to anon, authenticated;

revoke all on function public.seller_listings_page(
  uuid,
  timestamptz,
  uuid,
  integer
) from public, anon, authenticated;
grant execute on function public.seller_listings_page(
  uuid,
  timestamptz,
  uuid,
  integer
) to anon, authenticated;

comment on function public.catalog_listings_page(
  text,
  text,
  text,
  text,
  numeric,
  text,
  timestamptz,
  numeric,
  uuid,
  integer
) is 'Indexable public active-listing pagination that excludes banned sellers.';
comment on function public.seller_listings_page(
  uuid,
  timestamptz,
  uuid,
  integer
) is 'Indexable public active/sold seller inventory pagination that excludes banned sellers.';
