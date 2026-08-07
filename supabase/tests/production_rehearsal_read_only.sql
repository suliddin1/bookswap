-- Run only with a privileged read-only production connection and psql:
--   psql "$PRODUCTION_DB_URL" -v ON_ERROR_STOP=1 \
--     -f supabase/tests/production_rehearsal_read_only.sql
-- The script emits aggregate/catalog evidence only. It never emits row content.

begin;
set transaction read only;
set local lock_timeout = '3s';
set local statement_timeout = '30s';

select
  current_setting('server_version') as postgres_version,
  pg_database_size(current_database()) as database_bytes;

select
  migration.version,
  migration.name,
  char_length(
    regexp_replace(
      regexp_replace(
        regexp_replace(array_to_string(migration.statements, E'\n'), '/\*.*?\*/', '', 'gs'),
        '--[^\n\r]*',
        '',
        'g'
      ),
      '\s+',
      '',
      'g'
    )
  ) as normalized_length,
  encode(
    extensions.digest(
      regexp_replace(
        regexp_replace(
          regexp_replace(array_to_string(migration.statements, E'\n'), '/\*.*?\*/', '', 'gs'),
          '--[^\n\r]*',
          '',
          'g'
        ),
        '\s+',
        '',
        'g'
      ),
      'sha256'
    ),
    'hex'
  ) as normalized_sha256
from supabase_migrations.schema_migrations migration
order by migration.version;

select 'auth.users' as relation, count(*)::bigint as row_count from auth.users
union all select 'public.users', count(*) from public.users
union all select 'public.listings', count(*) from public.listings
union all select 'public.chat_rooms', count(*) from public.chat_rooms
union all select 'public.messages', count(*) from public.messages
union all select 'public.reviews', count(*) from public.reviews
union all select 'public.notifications', count(*) from public.notifications
union all select 'public.favorites', count(*) from public.favorites
union all select 'public.reports', count(*) from public.reports
union all select 'storage.objects', count(*) from storage.objects
order by relation;

select
  bucket.id as bucket,
  bucket.public,
  bucket.file_size_limit,
  bucket.allowed_mime_types,
  count(object.id)::bigint as object_count,
  coalesce(sum((object.metadata ->> 'size')::bigint), 0)::bigint as object_bytes
from storage.buckets bucket
left join storage.objects object on object.bucket_id = bucket.id
group by bucket.id, bucket.public, bucket.file_size_limit, bucket.allowed_mime_types
order by bucket.id;

select
  namespace.nspname as schema_name,
  relation.relname as table_name,
  relation.relrowsecurity as rls_enabled
from pg_class relation
join pg_namespace namespace on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relkind in ('r', 'p')
order by relation.relname;

select
  policy.schemaname,
  policy.tablename,
  policy.policyname,
  policy.roles,
  policy.cmd
from pg_policies policy
where policy.schemaname in ('public', 'storage')
order by policy.schemaname, policy.tablename, policy.policyname;

select
  publication.pubname,
  publication_table.schemaname,
  publication_table.tablename
from pg_publication publication
left join pg_publication_tables publication_table
  on publication_table.pubname = publication.pubname
order by publication.pubname, publication_table.schemaname, publication_table.tablename;

select 'auth_profile_id_mismatch' as check_name, count(*)::bigint as violations
from (
  select coalesce(auth_user.id, profile.id)
  from auth.users auth_user
  full join public.users profile on profile.id = auth_user.id
  where auth_user.id is null or profile.id is null
) mismatch
union all
select 'user_name_length', count(*)
from public.users
where char_length(name) not between 2 and 80
union all
select 'user_email_length', count(*)
from public.users
where char_length(btrim(email)) not between 3 and 320
union all
select 'user_phone_length', count(*)
from public.users
where phone is not null and char_length(btrim(phone)) > 30
union all
select 'user_city_length', count(*)
from public.users
where city is not null and char_length(btrim(city)) not between 2 and 80
union all
select 'listing_launch_constraints', count(*)
from public.listings
where char_length(btrim(title)) not between 2 and 140
  or char_length(btrim(author)) not between 2 and 100
  or char_length(btrim(description)) not between 10 and 2000
  or (isbn is not null and char_length(btrim(isbn)) > 20)
  or price > 10000
  or (original_price is not null and original_price not between 0.01 and 10000)
  or cardinality(images) > 5
  or category not in (
    'Textbooks', 'Fiction', 'Exam Prep', 'Notes', 'Rare Finds', 'Business',
    'Design', 'Science', 'History', 'Children', 'Academic'
  )
  or condition not in ('Like new', 'Very good', 'Good', 'Well read')
  or city not in (
    'Baku', 'Ganja', 'Sumqayit', 'Khirdalan', 'Mingachevir', 'Lankaran',
    'Shaki', 'Shirvan', 'Nakhchivan', 'Other'
  )
union all
select 'chat_room_self_participant', count(*)
from public.chat_rooms
where buyer_id = seller_id
union all
select 'chat_room_seller_mismatch', count(*)
from public.chat_rooms room
join public.listings listing on listing.id = room.listing_id
where room.seller_id <> listing.seller_id
union all
select 'favorite_hidden_listing', count(*)
from public.favorites favorite
left join public.listings listing on listing.id = favorite.listing_id
left join public.users seller on seller.id = listing.seller_id
where listing.id is null
  or listing.status not in ('active', 'sold')
  or seller.id is null
  or seller.banned
union all
select 'report_reason_length', count(*)
from public.reports
where char_length(reason) not between 10 and 500
union all
select 'report_invalid_target', count(*)
from public.reports report
left join public.listings listing on listing.id = report.listing_id
where listing.id is null
  or listing.seller_id = report.reporter_id
  or listing.status not in ('active', 'sold')
union all
select 'report_duplicate_open_groups', count(*)
from (
  select reporter_id, listing_id
  from public.reports
  where status = 'open'
  group by reporter_id, listing_id
  having count(*) > 1
) duplicate_report
union all
select 'review_comment_length', count(*)
from public.reviews
where char_length(btrim(comment)) not between 3 and 1000
order by check_name;

rollback;
