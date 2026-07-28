-- The queue is serviced only by trusted server code. Keep client denial explicit as well as grant-based.
drop policy if exists "Cleanup jobs are service only" on public.listing_image_cleanup_jobs;
create policy "Cleanup jobs are service only"
  on public.listing_image_cleanup_jobs
  for all
  to anon, authenticated
  using (false)
  with check (false);
