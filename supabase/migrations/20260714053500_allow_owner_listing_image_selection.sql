-- Supabase Storage remove requires both SELECT and DELETE permissions.
-- Public delivery does not require this policy, so keep metadata selection owner-folder scoped.
drop policy if exists "Users select own listing images" on storage.objects;
create policy "Users select own listing images" on storage.objects for select
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
