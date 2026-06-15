insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'leyla@example.com', crypt('demo-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Leyla Mammadova"}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'murad@example.com', crypt('demo-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Murad Aliyev"}', now(), now())
on conflict (id) do nothing;

insert into public.users (id, name, email, city)
values
  ('11111111-1111-1111-1111-111111111111', 'Leyla Mammadova', 'leyla@example.com', 'Baku'),
  ('22222222-2222-2222-2222-222222222222', 'Murad Aliyev', 'murad@example.com', 'Ganja')
on conflict (id) do nothing;

insert into public.listings (id, title, author, description, isbn, price, original_price, category, condition, city, status, seller_id)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Atomic Habits', 'James Clear', 'Light pencil notes, otherwise excellent.', '9780735211292', 12, 27, 'Business', 'Like new', 'Baku', 'active', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'The Midnight Library', 'Matt Haig', 'Read once, clean pages.', '9780525559474', 9, 18, 'Fiction', 'Very good', 'Ganja', 'active', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Sapiens', 'Yuval Noah Harari', 'Dust jacket shows light wear.', '9780062316097', 11, 22, 'History', 'Very good', 'Baku', 'active', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Clean Code', 'Robert C. Martin', 'A few useful sticky notes.', '9780132350884', 20, 35, 'Academic', 'Good', 'Ganja', 'active', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'The Alchemist', 'Paulo Coelho', 'Lovingly read and ready for a new shelf.', '9780061122415', 7, 14, 'Fiction', 'Good', 'Baku', 'sold', '11111111-1111-1111-1111-111111111111')
on conflict (id) do nothing;

insert into public.reviews (listing_id, rating, comment, author_id)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 5, 'Exactly as described and beautifully packed.', '22222222-2222-2222-2222-222222222222')
on conflict do nothing;
