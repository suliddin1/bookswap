-- Keep privileged marketplace readers out of the exposed Data API schema.
-- Public wrappers execute with the caller's role and can only delegate to the
-- fixed private implementations; the private schema itself is not exposed.

alter function public.catalog_listings_page(
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
) set schema private;

alter function public.seller_listings_page(
  uuid,
  timestamptz,
  uuid,
  integer
) set schema private;

grant usage on schema private to anon, authenticated;
revoke all on function private.catalog_listings_page(
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
) from public;
grant execute on function private.catalog_listings_page(
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
revoke all on function private.seller_listings_page(
  uuid,
  timestamptz,
  uuid,
  integer
) from public;
grant execute on function private.seller_listings_page(
  uuid,
  timestamptz,
  uuid,
  integer
) to anon, authenticated;

create function public.catalog_listings_page(
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
language sql
stable
security invoker
set search_path = ''
as $function$
  select *
  from private.catalog_listings_page(
    p_query,
    p_category,
    p_city,
    p_condition,
    p_max_price,
    p_sort,
    p_cursor_created_at,
    p_cursor_price,
    p_cursor_id,
    p_limit
  );
$function$;

create function public.seller_listings_page(
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
language sql
stable
security invoker
set search_path = ''
as $function$
  select *
  from private.seller_listings_page(
    p_seller_id,
    p_cursor_created_at,
    p_cursor_id,
    p_limit
  );
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

comment on function private.catalog_listings_page(
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
) is 'Privileged fixed-query implementation for indexable public catalog pagination.';
comment on function private.seller_listings_page(
  uuid,
  timestamptz,
  uuid,
  integer
) is 'Privileged fixed-query implementation for indexable public seller pagination.';
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
) is 'Caller-context Data API wrapper for the fixed private catalog reader.';
comment on function public.seller_listings_page(
  uuid,
  timestamptz,
  uuid,
  integer
) is 'Caller-context Data API wrapper for the fixed private seller reader.';
