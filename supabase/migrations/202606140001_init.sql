create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

create type public.listing_status as enum ('draft', 'active', 'sold', 'locked');
create type public.notification_type as enum ('MESSAGE', 'SYSTEM');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  city text,
  banned boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null default '',
  description text not null,
  isbn text,
  price numeric(10,2) not null check (price > 0),
  original_price numeric(10,2),
  images text[] not null default '{}',
  category text not null,
  condition text not null,
  city text not null,
  status public.listing_status not null default 'draft',
  seller_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  search tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(author, '') || ' ' || coalesce(description, '') || ' ' || coalesce(isbn, ''))
  ) stored
);

create index listings_search_idx on public.listings using gin(search);
create index listings_title_trgm_idx on public.listings using gin(title gin_trgm_ops);
create index listings_filters_idx on public.listings(status, category, city, price);

create table public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.users(id) on delete cascade,
  seller_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(listing_id, buyer_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null,
  author_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(listing_id, author_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type public.notification_type not null,
  payload jsonb not null default '{}',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.favorites (
  user_id uuid not null references public.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, name, email, city)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email, new.raw_user_meta_data->>'city')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;
alter table public.listings enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.favorites enable row level security;
alter table public.reports enable row level security;

create policy "Public profiles are visible" on public.users for select using (not banned or id = auth.uid());
create policy "Users update themselves" on public.users for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Active listings are public" on public.listings for select using (status in ('active', 'sold') or seller_id = auth.uid());
create policy "Sellers create listings" on public.listings for insert with check (seller_id = auth.uid());
create policy "Sellers update listings" on public.listings for update using (seller_id = auth.uid()) with check (seller_id = auth.uid());
create policy "Sellers delete listings" on public.listings for delete using (seller_id = auth.uid());

create policy "Room members can view rooms" on public.chat_rooms for select using (buyer_id = auth.uid() or seller_id = auth.uid());
create policy "Buyers open rooms" on public.chat_rooms for insert with check (buyer_id = auth.uid());
create policy "Room members view messages" on public.messages for select using (
  exists(select 1 from public.chat_rooms room where room.id = room_id and auth.uid() in (room.buyer_id, room.seller_id))
);
create policy "Room members send messages" on public.messages for insert with check (
  sender_id = auth.uid() and exists(select 1 from public.chat_rooms room where room.id = room_id and auth.uid() in (room.buyer_id, room.seller_id))
);

create policy "Reviews are public" on public.reviews for select using (true);
create policy "Buyer reviews sold listing once" on public.reviews for insert with check (
  author_id = auth.uid() and exists(
    select 1 from public.chat_rooms room join public.listings listing on listing.id = room.listing_id
    where room.listing_id = reviews.listing_id and room.buyer_id = auth.uid() and listing.status = 'sold'
  )
);
create policy "Users view notifications" on public.notifications for select using (user_id = auth.uid());
create policy "Users mark notifications read" on public.notifications for update using (user_id = auth.uid());
create policy "Users view own favorites" on public.favorites for select using (user_id = auth.uid());
create policy "Users add own favorites" on public.favorites for insert with check (user_id = auth.uid());
create policy "Users remove own favorites" on public.favorites for delete using (user_id = auth.uid());
create policy "Users submit reports" on public.reports for insert with check (reporter_id = auth.uid());
create policy "Users view own reports" on public.reports for select using (reporter_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "Listing images are public" on storage.objects for select using (bucket_id = 'listing-images');
create policy "Users upload listing images" on storage.objects for insert with check (
  bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users remove own listing images" on storage.objects for delete using (
  bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]
);

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
