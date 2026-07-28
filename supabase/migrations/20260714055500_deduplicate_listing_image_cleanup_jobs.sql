-- Direct Data API callers may submit repeated image URLs. Queue each URL once per mutation.
create or replace function private.queue_obsolete_listing_images()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed_urls text[];
begin
  if tg_op = 'DELETE' then
    removed_urls := coalesce(old.images, '{}'::text[]);
  else
    select coalesce(array_agg(previous_url), '{}'::text[])
      into removed_urls
    from unnest(coalesce(old.images, '{}'::text[])) as previous_url
    where not (previous_url = any(coalesce(new.images, '{}'::text[])));
  end if;

  insert into public.listing_image_cleanup_jobs (
    user_id,
    listing_id,
    image_url
  )
  select distinct old.seller_id, old.id, image_url
  from unnest(removed_urls) as image_url
  where image_url is not null and image_url <> ''
  on conflict (user_id, image_url) do update
    set listing_id = excluded.listing_id,
        updated_at = now();

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.queue_obsolete_listing_images() from public;
