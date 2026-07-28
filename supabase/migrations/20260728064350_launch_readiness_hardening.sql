-- Non-deployment launch-readiness hardening.
-- Enforce important API invariants in Postgres, keep browser roles
-- least-privileged, and provide a durable server-side rate-limit primitive.

alter table public.listings
  add constraint listings_title_length
    check (char_length(btrim(title)) between 2 and 140),
  add constraint listings_author_length
    check (char_length(btrim(author)) between 2 and 100),
  add constraint listings_description_length
    check (char_length(btrim(description)) between 10 and 2000),
  add constraint listings_isbn_length
    check (isbn is null or char_length(btrim(isbn)) <= 20),
  add constraint listings_price_upper_bound
    check (price <= 10000),
  add constraint listings_original_price_bounds
    check (original_price is null or original_price between 0.01 and 10000),
  add constraint listings_image_count
    check (cardinality(images) <= 5),
  add constraint listings_category_allowed
    check (category in (
      'Textbooks', 'Fiction', 'Exam Prep', 'Notes', 'Rare Finds', 'Business',
      'Design', 'Science', 'History', 'Children', 'Academic'
    )),
  add constraint listings_condition_allowed
    check (condition in ('Like new', 'Very good', 'Good', 'Well read')),
  add constraint listings_city_allowed
    check (city in (
      'Baku', 'Ganja', 'Sumqayit', 'Khirdalan', 'Mingachevir', 'Lankaran',
      'Shaki', 'Shirvan', 'Nakhchivan', 'Other'
    ));

alter table public.users
  add constraint users_email_length
    check (char_length(btrim(email)) between 3 and 320),
  add constraint users_phone_length
    check (phone is null or char_length(btrim(phone)) <= 30),
  add constraint users_city_length
    check (city is null or char_length(btrim(city)) between 2 and 80);

alter table public.reviews
  add constraint reviews_comment_length
    check (char_length(btrim(comment)) between 3 and 1000);

-- One active request of each kind per account prevents duplicate workflows.
create unique index privacy_requests_one_active_type_idx
  on public.privacy_requests (user_id, type)
  where status in ('open', 'in_progress');

-- Reports must target another seller's active or sold listing. This trigger
-- also protects privileged server writes that bypass RLS.
create or replace function private.validate_listing_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seller_id uuid;
  v_status public.listing_status;
begin
  if not private.user_is_active(new.reporter_id) then
    raise exception 'reporter account is unavailable' using errcode = '42501';
  end if;

  if new.listing_id is null then
    return new;
  end if;

  select listing.seller_id, listing.status
  into v_seller_id, v_status
  from public.listings listing
  where listing.id = new.listing_id;

  if not found then
    raise exception 'reported listing not found' using errcode = 'P0002';
  end if;
  if v_seller_id = new.reporter_id then
    raise exception 'users cannot report their own listing' using errcode = '23514';
  end if;
  if v_status not in ('active', 'sold') then
    raise exception 'listing is not reportable' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_listing_report()
  from public, anon, authenticated, service_role;

drop trigger if exists validate_listing_report on public.reports;
create trigger validate_listing_report
before insert or update of reporter_id, listing_id on public.reports
for each row execute function private.validate_listing_report();

-- Reviews require an active buyer, a sold listing, and a matching buyer room.
create or replace function private.validate_listing_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seller_id uuid;
  v_status public.listing_status;
begin
  if not private.user_is_active(new.author_id) then
    raise exception 'review author account is unavailable' using errcode = '42501';
  end if;

  select listing.seller_id, listing.status
  into v_seller_id, v_status
  from public.listings listing
  where listing.id = new.listing_id;

  if not found then
    raise exception 'reviewed listing not found' using errcode = 'P0002';
  end if;
  if v_seller_id = new.author_id then
    raise exception 'sellers cannot review their own listing' using errcode = '23514';
  end if;
  if v_status <> 'sold' then
    raise exception 'listing must be sold before review' using errcode = '23514';
  end if;
  if not exists (
    select 1
    from public.chat_rooms room
    where room.listing_id = new.listing_id
      and room.buyer_id = new.author_id
      and room.seller_id = v_seller_id
  ) then
    raise exception 'review author is not the listing buyer' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_listing_review()
  from public, anon, authenticated, service_role;

drop trigger if exists validate_listing_review on public.reviews;
create trigger validate_listing_review
before insert or update of author_id, listing_id on public.reviews
for each row execute function private.validate_listing_review();

drop policy if exists "Buyer reviews sold listing once" on public.reviews;
create policy "Active buyer reviews sold listing once"
  on public.reviews for insert
  to authenticated
  with check (
    public.reviews.author_id = (select auth.uid())
    and private.user_is_active((select auth.uid()))
    and exists (
      select 1
      from public.chat_rooms room
      join public.listings listing on listing.id = room.listing_id
      where room.listing_id = public.reviews.listing_id
        and room.buyer_id = (select auth.uid())
        and room.seller_id = listing.seller_id
        and listing.seller_id <> (select auth.uid())
        and listing.status = 'sold'
    )
  );

-- An AFTER-trigger exception rolls the message insert back when either
-- participant is no longer active.
create or replace function private.deliver_chat_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  room_buyer uuid;
  room_seller uuid;
  recipient_id uuid;
begin
  select room.buyer_id, room.seller_id
  into room_buyer, room_seller
  from public.chat_rooms room
  where room.id = new.room_id;

  if room_buyer is null or new.sender_id not in (room_buyer, room_seller) then
    raise exception 'message sender is not a room participant' using errcode = '23514';
  end if;

  recipient_id := case
    when new.sender_id = room_buyer then room_seller
    else room_buyer
  end;

  if not private.user_is_active(new.sender_id) then
    raise exception 'message sender account is unavailable' using errcode = '42501';
  end if;
  if not private.user_is_active(recipient_id) then
    raise exception 'message recipient account is unavailable' using errcode = '42501';
  end if;

  update public.chat_rooms
  set last_message_at = greatest(last_message_at, new.created_at)
  where id = new.room_id;

  insert into public.chat_room_reads (
    room_id,
    user_id,
    unread_count,
    last_read_at,
    created_at,
    updated_at
  )
  values (new.room_id, recipient_id, 1, null, new.created_at, new.created_at)
  on conflict (room_id, user_id) do update
  set unread_count = public.chat_room_reads.unread_count + 1,
      updated_at = greatest(public.chat_room_reads.updated_at, excluded.updated_at);

  insert into public.notifications (user_id, type, payload, message_id)
  values (
    recipient_id,
    'MESSAGE',
    jsonb_build_object(
      'roomId', new.room_id::text,
      'messageId', new.id::text,
      'preview', left(new.text, 120)
    ),
    new.id
  );

  return new;
end;
$$;

revoke all on function private.deliver_chat_message()
  from public, anon, authenticated, service_role;

-- Browser uploads could bypass the server's file-signature validation. The
-- public bucket remains readable by URL; only service-role routes may mutate.
drop policy if exists "Users upload listing images" on storage.objects;
drop policy if exists "Users remove own listing images" on storage.objects;
drop policy if exists "Users select own listing images" on storage.objects;

-- Normalize Azerbaijani dotted and dotless I before full-text search.
create or replace function private.normalize_az_text(value text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select lower(replace(replace(value, 'İ', 'i'), 'I', 'ı'));
$$;

revoke all on function private.normalize_az_text(text)
  from public, anon, authenticated;
grant execute on function private.normalize_az_text(text) to service_role;

drop index if exists public.listings_search_idx;
alter table public.listings drop column search;
alter table public.listings
  add column search tsvector generated always as (
    to_tsvector(
      'simple',
      private.normalize_az_text(
        coalesce(title, '') || ' ' ||
        coalesce(author, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(isbn, '')
      )
    )
  ) stored;
create index listings_search_idx on public.listings using gin(search);

create or replace function private.catalog_listings_page(
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
set plan_cache_mode = force_custom_plan
as $function$
declare
  cursor_clause text;
  order_clause text;
begin
  if p_query is null or char_length(p_query) > 200 then
    raise exception using errcode = '22023', message = 'invalid catalog query';
  end if;
  if p_sort is null or p_sort not in ('newest', 'price-low', 'price-high') then
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
        and (nullif(btrim($1), '') is null
          or listing.search @@ websearch_to_tsquery(
            'simple',
            private.normalize_az_text($1)
          ))
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

revoke all on function private.catalog_listings_page(
  text, text, text, text, numeric, text, timestamptz, numeric, uuid, integer
) from public;
grant execute on function private.catalog_listings_page(
  text, text, text, text, numeric, text, timestamptz, numeric, uuid, integer
) to anon, authenticated;

-- Fixed-window counters are shared across server instances and contain only
-- salted hashes, never raw IP addresses or account identifiers.
create table private.rate_limit_buckets (
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null,
  expires_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (scope, key_hash),
  check (expires_at > window_started_at),
  check (char_length(scope) between 1 and 80),
  check (key_hash ~ '^[0-9a-f]{64}$')
);

alter table private.rate_limit_buckets enable row level security;
revoke all on table private.rate_limit_buckets
  from public, anon, authenticated, service_role;
grant select, insert, update, delete on table private.rate_limit_buckets
  to service_role;

create index rate_limit_buckets_expires_at_idx
  on private.rate_limit_buckets (expires_at);

create or replace function public.consume_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_count integer;
  v_expires_at timestamptz;
begin
  if p_scope is null
    or p_scope !~ '^[a-z0-9._:-]{1,80}$'
    or p_key_hash is null
    or p_key_hash !~ '^[0-9a-f]{64}$'
    or p_limit is null
    or p_limit not between 1 and 1000
    or p_window_seconds is null
    or p_window_seconds not between 1 and 86400
  then
    raise exception 'invalid rate-limit arguments' using errcode = '22023';
  end if;

  insert into private.rate_limit_buckets as bucket (
    scope,
    key_hash,
    window_started_at,
    expires_at,
    request_count
  ) values (
    p_scope,
    p_key_hash,
    v_now,
    v_now + make_interval(secs => p_window_seconds),
    1
  )
  on conflict (scope, key_hash) do update
  set window_started_at = case
        when bucket.expires_at <= v_now then v_now
        else bucket.window_started_at
      end,
      expires_at = case
        when bucket.expires_at <= v_now
          then v_now + make_interval(secs => p_window_seconds)
        else bucket.expires_at
      end,
      request_count = case
        when bucket.expires_at <= v_now then 1
        else least(bucket.request_count + 1, p_limit + 1)
      end
  returning request_count, expires_at
  into v_count, v_expires_at;

  if random() < 0.01 then
    delete from private.rate_limit_buckets
    where ctid in (
      select expired.ctid
      from private.rate_limit_buckets expired
      where expired.expires_at < v_now - interval '1 day'
      limit 100
    );
  end if;

  allowed := v_count <= p_limit;
  remaining := greatest(p_limit - v_count, 0);
  retry_after_seconds := greatest(
    ceil(extract(epoch from (v_expires_at - v_now)))::integer,
    1
  );
  return next;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer)
  to service_role;

comment on table private.rate_limit_buckets is
  'Hashed fixed-window counters for server-side abuse controls.';
comment on function public.consume_rate_limit(text, text, integer, integer) is
  'Atomic service-role-only rate-limit consumption for scaled server routes.';

-- Keep system notification payloads stable and Azerbaijani-first.
create or replace function public.admin_moderate_listing(
  p_actor_id uuid,
  p_listing_id uuid,
  p_action text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_name text := private.require_admin_actor(p_actor_id);
  v_reason text := private.require_admin_reason(p_reason);
  v_previous_status public.listing_status;
  v_new_status public.listing_status;
  v_seller_id uuid;
  v_notification_id uuid;
  v_event text;
  v_message text;
begin
  if p_action not in ('approve', 'reject') then
    raise exception 'unsupported listing moderation action' using errcode = '22023';
  end if;

  if p_action = 'approve' then
    v_new_status := 'active'::public.listing_status;
    v_event := 'listing.approved';
    v_message := 'Elanınız təsdiqləndi.';
  else
    v_new_status := 'draft'::public.listing_status;
    v_event := 'listing.rejected';
    v_message := 'Elanınız rədd edildi.';
  end if;

  select listing.status, listing.seller_id
  into v_previous_status, v_seller_id
  from public.listings listing
  where listing.id = p_listing_id
  for update;

  if not found then
    raise exception 'target listing not found' using errcode = 'P0002';
  end if;

  update public.listings set status = v_new_status where id = p_listing_id;

  insert into public.notifications (user_id, type, payload)
  values (
    v_seller_id,
    'SYSTEM',
    jsonb_build_object(
      'event', v_event,
      'listingId', p_listing_id::text,
      'message', v_message
    )
  )
  returning id into v_notification_id;

  insert into public.admin_audit_log (
    actor_id, actor_name, target_type, target_id, action, reason,
    before_state, after_state
  ) values (
    p_actor_id,
    v_actor_name,
    'listing',
    p_listing_id,
    v_event,
    v_reason,
    jsonb_build_object('status', v_previous_status::text),
    jsonb_build_object('status', v_new_status::text)
  );

  return jsonb_build_object(
    'listingId', p_listing_id,
    'sellerId', v_seller_id,
    'status', v_new_status::text,
    'notificationId', v_notification_id
  );
end;
$$;

revoke all on function public.admin_moderate_listing(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.admin_moderate_listing(uuid, uuid, text, text)
  to service_role;
