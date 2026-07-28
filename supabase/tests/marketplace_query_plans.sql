-- Representative development-only query-plan probe for the public marketplace.
--
-- Run this file only against the authorized non-production BookSwap project.
-- It inserts deterministic fixtures inside an explicit transaction, captures
-- EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) output for the API query shapes,
-- removes every fixture, restores table statistics, commits the cleanup, and
-- only then returns the captured evidence. Any error aborts the transaction,
-- so a terminated session rolls the fixture writes back.

begin;

set local lock_timeout = '10s';
set local statement_timeout = '120s';
set local idle_in_transaction_session_timeout = '120s';
set local session_replication_role = replica;

do $preflight$
declare
  missing_indexes text[];
begin
  select array_agg(expected.name order by expected.name)
  into missing_indexes
  from (
    values
      ('listings_active_created_idx'),
      ('listings_active_price_id_idx'),
      ('listings_filters_idx'),
      ('listings_public_seller_created_idx'),
      ('listings_search_idx'),
      ('reviews_listing_id_author_id_key')
  ) as expected(name)
  where not exists (
    select 1
    from pg_index index_state
    join pg_class index_class on index_class.oid = index_state.indexrelid
    join pg_namespace index_namespace on index_namespace.oid = index_class.relnamespace
    where index_namespace.nspname = 'public'
      and index_class.relname = expected.name
      and index_state.indisready
      and index_state.indisvalid
  );

  if missing_indexes is not null then
    raise exception 'Required marketplace indexes are missing or invalid: %', missing_indexes;
  end if;

  if exists (
    select 1
    from public.users
    where email like 'query-plan-%@bookswap.invalid'
      or id in (
        select md5('bookswap-query-plan-seller-' || seller_number)::uuid
        from generate_series(1, 200) as fixture(seller_number)
      )
  ) then
    raise exception 'Representative query-plan users already exist; refusing to overlap fixtures';
  end if;
end
$preflight$;

create temporary table marketplace_query_plan_evidence (
  query_name text primary key,
  expected_indexes text[] not null,
  explicit_sort_allowed boolean not null,
  plan jsonb not null
);

create or replace function pg_temp.capture_marketplace_plan(statement text)
returns jsonb
language plpgsql
as $function$
declare
  captured jsonb;
begin
  execute 'explain (analyze, buffers, format json) ' || statement into captured;
  return captured;
end
$function$;

insert into public.users (id, name, email, city, banned, is_admin, created_at)
select
  md5('bookswap-query-plan-seller-' || seller_number)::uuid,
  'Query Plan Seller ' || seller_number,
  'query-plan-' || seller_number || '@bookswap.invalid',
  (array[
    'Baku',
    'Ganja',
    'Sumqayit',
    'Khirdalan',
    'Mingachevir',
    'Lankaran',
    'Shaki',
    'Shirvan',
    'Nakhchivan',
    'Other'
  ])[1 + (seller_number % 10)],
  seller_number = 200,
  false,
  timestamptz '2025-01-01 00:00:00+00' + seller_number * interval '1 minute'
from generate_series(1, 200) as fixture(seller_number);

insert into public.listings (
  id,
  title,
  author,
  description,
  isbn,
  price,
  original_price,
  images,
  category,
  condition,
  city,
  status,
  seller_id,
  created_at
)
select
  md5('bookswap-query-plan-listing-' || listing_number)::uuid,
  case
    when listing_number % 997 = 0 then 'Nadirtermin riyaziyyat kitabı ' || listing_number
    when listing_number % 17 = 0 then 'Riyaziyyat dərsliyi ' || listing_number
    else 'İkinci əl kitab ' || listing_number
  end,
  'Müəllif ' || (listing_number % 500),
  'Təhlükəsiz representative marketplace təsviri ' || listing_number,
  case when listing_number % 5 = 0 then '978' || lpad(listing_number::text, 10, '0') end,
  (5 + (listing_number % 5000)::numeric / 100)::numeric(10, 2),
  null,
  array[]::text[],
  (array[
    'Textbooks',
    'Fiction',
    'Exam Prep',
    'Notes',
    'Rare Finds',
    'Business',
    'Design',
    'Science',
    'History',
    'Children',
    'Academic'
  ])[1 + (listing_number % 11)],
  (array['Like new', 'Very good', 'Good', 'Well read'])[1 + (listing_number % 4)],
  (array[
    'Baku',
    'Ganja',
    'Sumqayit',
    'Khirdalan',
    'Mingachevir',
    'Lankaran',
    'Shaki',
    'Shirvan',
    'Nakhchivan',
    'Other'
  ])[1 + (listing_number % 10)],
  (
    case
      when listing_number % 20 < 15 then 'active'
      when listing_number % 20 < 18 then 'sold'
      when listing_number % 20 = 18 then 'draft'
      else 'locked'
    end
  )::public.listing_status,
  md5(
    'bookswap-query-plan-seller-'
      || (1 + ((listing_number + (listing_number / 200)) % 200))
  )::uuid,
  timestamptz '2026-07-01 00:00:00+00'
    - (listing_number / 4) * interval '1 second'
from generate_series(1, 60000) as fixture(listing_number);

insert into public.reviews (
  id,
  listing_id,
  rating,
  comment,
  author_id,
  created_at
)
select
  md5('bookswap-query-plan-review-' || listing.id)::uuid,
  listing.id,
  (1 + (row_number() over (order by listing.id) % 5))::smallint,
  'Representative review',
  md5(
    'bookswap-query-plan-seller-'
      || (1 + (row_number() over (order by listing.id) % 200))
  )::uuid,
  listing.created_at + interval '1 day'
from public.listings as listing
where listing.status = 'sold'
  and listing.seller_id in (
    select md5('bookswap-query-plan-seller-' || seller_number)::uuid
    from generate_series(1, 200) as fixture(seller_number)
  );

analyze public.users;
analyze public.listings;
analyze public.reviews;

insert into marketplace_query_plan_evidence
values
  (
    'catalog_newest_first',
    array['listings_active_created_idx'],
    false,
    pg_temp.capture_marketplace_plan($query$
      select
        listing.*,
        seller.id as joined_seller_id,
        seller.name as seller_name,
        seller.city as seller_city,
        seller.created_at as seller_created_at
      from public.listings as listing
      join public.users as seller
        on seller.id = listing.seller_id and not seller.banned
      where listing.status = 'active'
      order by listing.created_at desc, listing.id desc
      limit 25
    $query$)
  ),
  (
    'catalog_newest_cursor',
    array['listings_active_created_idx'],
    false,
    pg_temp.capture_marketplace_plan($query$
      select
        listing.*,
        seller.id as joined_seller_id,
        seller.name as seller_name,
        seller.city as seller_city,
        seller.created_at as seller_created_at
      from public.listings as listing
      join public.users as seller
        on seller.id = listing.seller_id and not seller.banned
      where listing.status = 'active'
        and (listing.created_at, listing.id) < (
          timestamptz '2026-06-30 22:00:00+00',
          md5('bookswap-query-plan-listing-28800')::uuid
        )
      order by listing.created_at desc, listing.id desc
      limit 25
    $query$)
  ),
  (
    'catalog_price_low_cursor',
    array['listings_active_price_id_idx'],
    false,
    pg_temp.capture_marketplace_plan($query$
      select
        listing.*,
        seller.id as joined_seller_id,
        seller.name as seller_name,
        seller.city as seller_city,
        seller.created_at as seller_created_at
      from public.listings as listing
      join public.users as seller
        on seller.id = listing.seller_id and not seller.banned
      where listing.status = 'active'
        and (listing.price, listing.id) > (
          30.00,
          md5('bookswap-query-plan-listing-2500')::uuid
        )
      order by listing.price, listing.id
      limit 25
    $query$)
  ),
  (
    'catalog_price_high_cursor',
    array['listings_active_price_id_idx'],
    false,
    pg_temp.capture_marketplace_plan($query$
      select
        listing.*,
        seller.id as joined_seller_id,
        seller.name as seller_name,
        seller.city as seller_city,
        seller.created_at as seller_created_at
      from public.listings as listing
      join public.users as seller
        on seller.id = listing.seller_id and not seller.banned
      where listing.status = 'active'
        and (listing.price, listing.id) < (
          30.00,
          md5('bookswap-query-plan-listing-2500')::uuid
        )
      order by listing.price desc, listing.id desc
      limit 25
    $query$)
  ),
  (
    'catalog_rare_search',
    array['listings_search_idx'],
    true,
    pg_temp.capture_marketplace_plan($query$
      select
        listing.*,
        seller.id as joined_seller_id,
        seller.name as seller_name,
        seller.city as seller_city,
        seller.created_at as seller_created_at
      from public.listings as listing
      join public.users as seller
        on seller.id = listing.seller_id and not seller.banned
      where listing.status = 'active'
        and listing.search @@ websearch_to_tsquery('simple', 'nadirtermin')
      order by listing.created_at desc, listing.id desc
      limit 25
    $query$)
  ),
  (
    'catalog_combined_filters',
    array['listings_filters_idx'],
    true,
    pg_temp.capture_marketplace_plan($query$
      select
        listing.*,
        seller.id as joined_seller_id,
        seller.name as seller_name,
        seller.city as seller_city,
        seller.created_at as seller_created_at
      from public.listings as listing
      join public.users as seller
        on seller.id = listing.seller_id and not seller.banned
      where listing.status = 'active'
        and listing.category = 'Science'
        and listing.city = 'Baku'
        and listing.condition = 'Good'
        and listing.price <= 40.00
        and listing.search @@ websearch_to_tsquery('simple', 'riyaziyyat')
      order by listing.created_at desc, listing.id desc
      limit 25
    $query$)
  ),
  (
    'seller_inventory_cursor',
    array['listings_public_seller_created_idx'],
    false,
    pg_temp.capture_marketplace_plan($query$
      select
        listing.*,
        seller.id as joined_seller_id,
        seller.name as seller_name,
        seller.city as seller_city,
        seller.created_at as seller_created_at
      from public.listings as listing
      join public.users as seller
        on seller.id = listing.seller_id and not seller.banned
      where listing.seller_id = md5('bookswap-query-plan-seller-7')::uuid
        and listing.status in ('active', 'sold')
        and (listing.created_at, listing.id) < (
          timestamptz '2026-06-30 22:00:00+00',
          md5('bookswap-query-plan-listing-28800')::uuid
        )
      order by listing.created_at desc, listing.id desc
      limit 13
    $query$)
  ),
  (
    'seller_sold_reviews',
    array['listings_public_seller_created_idx', 'reviews_listing_id_author_id_key'],
    true,
    pg_temp.capture_marketplace_plan($query$
      select review.rating
      from public.reviews as review
      join public.listings as listing on listing.id = review.listing_id
      where listing.seller_id = md5('bookswap-query-plan-seller-7')::uuid
        and listing.status = 'sold'
    $query$)
  );

do $assertions$
declare
  failed_query record;
begin
  for failed_query in
    select
      evidence.query_name,
      expected_index
    from marketplace_query_plan_evidence as evidence
    cross join lateral unnest(evidence.expected_indexes) as expected(expected_index)
    where evidence.plan::text not like '%' || expected.expected_index || '%'
  loop
    raise exception
      'Query % did not use required index %',
      failed_query.query_name,
      failed_query.expected_index;
  end loop;

  select evidence.query_name
  into failed_query
  from marketplace_query_plan_evidence as evidence
  where not evidence.explicit_sort_allowed
    and evidence.plan::text like '%"Node Type": "Sort"%'
  limit 1;

  if found then
    raise exception 'Query % introduced an avoidable explicit sort', failed_query.query_name;
  end if;

  select evidence.query_name
  into failed_query
  from marketplace_query_plan_evidence as evidence
  where not evidence.explicit_sort_allowed
    and evidence.plan @? '$.** ? (@."Rows Removed by Filter" > 100)'
  limit 1;

  if found then
    raise exception 'Query % discarded more than 100 rows after its index scan', failed_query.query_name;
  end if;

  select evidence.query_name
  into failed_query
  from marketplace_query_plan_evidence as evidence
  where coalesce((evidence.plan #>> '{0,Plan,Actual Rows}')::numeric, 0) = 0
  limit 1;

  if found then
    raise exception 'Query % returned no representative rows', failed_query.query_name;
  end if;
end
$assertions$;

set local role anon;

do $rpc_security$
begin
  if exists (
    select 1
    from public.catalog_listings_page(p_limit => 51) as listing
    where listing.status <> 'active'
      or listing.seller_id = md5('bookswap-query-plan-seller-200')::uuid
  ) then
    raise exception 'Catalog RPC exposed a non-public listing or banned seller';
  end if;

  if exists (
    select 1
    from public.seller_listings_page(
      md5('bookswap-query-plan-seller-200')::uuid,
      null,
      null,
      13
    )
  ) then
    raise exception 'Seller RPC exposed a banned seller';
  end if;

  if exists (
    select 1
    from public.seller_listings_page(
      md5('bookswap-query-plan-seller-7')::uuid,
      null,
      null,
      51
    ) as listing
    where listing.status not in ('active', 'sold')
      or listing.seller_id <> md5('bookswap-query-plan-seller-7')::uuid
  ) then
    raise exception 'Seller RPC crossed its seller or status boundary';
  end if;

  if not exists (
    select 1
    from public.catalog_listings_page(
      p_query => 'nadirtermin',
      p_sort => 'price-low',
      p_cursor_price => 30.00,
      p_cursor_id => md5('bookswap-query-plan-listing-2500')::uuid,
      p_limit => 26
    )
  ) then
    raise exception 'Catalog RPC did not return representative cursor/search data';
  end if;

  begin
    perform 1 from public.catalog_listings_page(p_limit => 52);
    raise exception 'Catalog RPC accepted an excessive page limit';
  exception
    when sqlstate '22023' then null;
  end;

  begin
    perform 1 from public.catalog_listings_page(p_sort => null);
    raise exception 'Catalog RPC accepted a null sort';
  exception
    when sqlstate '22023' then null;
  end;
end
$rpc_security$;

reset role;

delete from public.reviews
where author_id in (
  select md5('bookswap-query-plan-seller-' || seller_number)::uuid
  from generate_series(1, 200) as fixture(seller_number)
)
or listing_id in (
  select id
  from public.listings
  where seller_id in (
    select md5('bookswap-query-plan-seller-' || seller_number)::uuid
    from generate_series(1, 200) as fixture(seller_number)
  )
);

delete from public.listings
where seller_id in (
  select md5('bookswap-query-plan-seller-' || seller_number)::uuid
  from generate_series(1, 200) as fixture(seller_number)
);

delete from public.users
where email like 'query-plan-%@bookswap.invalid';

analyze public.users;
analyze public.listings;
analyze public.reviews;

do $cleanup$
begin
  if exists (
    select 1
    from public.users
    where email like 'query-plan-%@bookswap.invalid'
  ) or exists (
    select 1
    from public.listings
    where seller_id in (
      select md5('bookswap-query-plan-seller-' || seller_number)::uuid
      from generate_series(1, 200) as fixture(seller_number)
    )
  ) or exists (
    select 1
    from public.reviews
    where author_id in (
      select md5('bookswap-query-plan-seller-' || seller_number)::uuid
      from generate_series(1, 200) as fixture(seller_number)
    )
  ) then
    raise exception 'Representative query-plan fixture cleanup was incomplete';
  end if;
end
$cleanup$;

commit;

select
  query_name,
  expected_indexes,
  not explicit_sort_allowed as sort_elided,
  (plan #>> '{0,Plan,Plan Rows}')::bigint as root_planned_rows,
  (plan #>> '{0,Plan,Actual Rows}')::bigint as root_actual_rows,
  round((plan #>> '{0,Planning Time}')::numeric, 3) as planning_time_ms,
  round((plan #>> '{0,Execution Time}')::numeric, 3) as execution_time_ms,
  coalesce((
    select sum((node #>> '{}')::bigint)
    from jsonb_path_query(
      marketplace_query_plan_evidence.plan,
      '$.**."Rows Removed by Filter"'
    ) as removed(node)
  ), 0) as rows_removed_by_filter,
  (
    select array_agg(distinct node #>> '{}' order by node #>> '{}')
    from jsonb_path_query(
      marketplace_query_plan_evidence.plan,
      '$.**."Index Name"'
    ) as used(node)
  ) as used_indexes,
  (plan #>> '{0,Plan,Shared Hit Blocks}')::bigint as root_shared_hit_blocks,
  (plan #>> '{0,Plan,Shared Read Blocks}')::bigint as root_shared_read_blocks
from marketplace_query_plan_evidence
order by query_name;
