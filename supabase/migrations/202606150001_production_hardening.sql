-- Production hardening discovered by Supabase advisors.

alter extension pg_trgm set schema extensions;

drop policy if exists "Listing images are public" on storage.objects;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create index if not exists chat_rooms_buyer_id_idx on public.chat_rooms (buyer_id);
create index if not exists chat_rooms_seller_id_idx on public.chat_rooms (seller_id);
create index if not exists favorites_listing_id_idx on public.favorites (listing_id);
create index if not exists listings_seller_id_idx on public.listings (seller_id);
create index if not exists messages_room_id_idx on public.messages (room_id);
create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists reports_listing_id_idx on public.reports (listing_id);
create index if not exists reports_reporter_id_idx on public.reports (reporter_id);
create index if not exists reviews_author_id_idx on public.reviews (author_id);
