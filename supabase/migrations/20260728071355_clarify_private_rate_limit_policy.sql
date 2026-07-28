-- The table is in a non-exposed schema and has explicit service-role-only
-- grants. RLS adds no restriction for the bypass-RLS service role and causes
-- a misleading "no policy" advisor notice, so rely on schema/table ACLs.
alter table private.rate_limit_buckets disable row level security;
