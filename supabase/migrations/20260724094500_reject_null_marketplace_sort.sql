-- PostgreSQL NOT IN yields null for a null operand. Keep the exposed reader
-- fail-closed even when a direct RPC caller explicitly sends a null sort.

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
security invoker
set search_path = ''
as $function$
begin
  if p_sort is null then
    raise exception using errcode = '22023', message = 'invalid catalog sort';
  end if;

  return query
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
end
$function$;
