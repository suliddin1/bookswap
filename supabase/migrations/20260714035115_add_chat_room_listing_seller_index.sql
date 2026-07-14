-- Support the composite chat room ownership foreign key for listing updates
-- and deletes without forcing a scan of chat_rooms.
create index if not exists chat_rooms_listing_seller_idx
  on public.chat_rooms (listing_id, seller_id);
