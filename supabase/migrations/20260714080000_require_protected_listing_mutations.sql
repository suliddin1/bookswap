-- Listing publication is moderated by protected server routes. Direct Data API
-- mutations would bypass that contract, so browser roles remain read-only.

revoke insert, update, delete on table public.listings from authenticated;

-- Keep the intended server boundary explicit for projects that no longer
-- auto-expose new tables or functions through default privileges.
grant select, insert, update, delete on table public.listings to service_role;
