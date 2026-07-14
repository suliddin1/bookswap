-- Durable participant unread state and atomic in-app message notifications.

alter table public.chat_rooms
  add column if not exists last_message_at timestamptz;

update public.chat_rooms room
set last_message_at = coalesce(
  (select max(message.created_at) from public.messages message where message.room_id = room.id),
  room.created_at
)
where room.last_message_at is null;

alter table public.chat_rooms
  alter column last_message_at set default now(),
  alter column last_message_at set not null;

create table if not exists public.chat_room_reads (
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  unread_count integer not null default 0 check (unread_count >= 0),
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

alter table public.chat_room_reads enable row level security;
revoke all on table public.chat_room_reads from anon, authenticated;
grant select on table public.chat_room_reads to authenticated;
grant select, insert, update, delete on table public.chat_room_reads to service_role;

create policy "Participants view own chat read state"
  on public.chat_room_reads for select
  to authenticated
  using (
    chat_room_reads.user_id = (select auth.uid())
    and exists (
      select 1
      from public.chat_rooms room
      where room.id = chat_room_reads.room_id
        and (select auth.uid()) in (room.buyer_id, room.seller_id)
    )
  );

insert into public.chat_room_reads (
  room_id,
  user_id,
  unread_count,
  last_read_at,
  created_at,
  updated_at
)
select room.id, participant.user_id, 0, room.last_message_at, room.created_at, now()
from public.chat_rooms room
cross join lateral (values (room.buyer_id), (room.seller_id)) participant(user_id)
on conflict (room_id, user_id) do nothing;

alter table public.notifications
  add column if not exists message_id uuid references public.messages(id) on delete cascade;

create unique index if not exists notifications_message_id_unique_idx
  on public.notifications (message_id)
  where message_id is not null;

create index if not exists chat_room_reads_user_unread_idx
  on public.chat_room_reads (user_id, room_id)
  where unread_count > 0;

create index if not exists chat_rooms_buyer_last_message_idx
  on public.chat_rooms (buyer_id, last_message_at desc);

create index if not exists chat_rooms_seller_last_message_idx
  on public.chat_rooms (seller_id, last_message_at desc);

create or replace function private.initialize_chat_room_reads()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.chat_room_reads (
    room_id,
    user_id,
    unread_count,
    last_read_at,
    created_at,
    updated_at
  )
  values
    (new.id, new.buyer_id, 0, new.created_at, new.created_at, new.created_at),
    (new.id, new.seller_id, 0, new.created_at, new.created_at, new.created_at)
  on conflict (room_id, user_id) do nothing;
  return new;
end;
$$;

revoke all on function private.initialize_chat_room_reads() from public, anon, authenticated;

drop trigger if exists initialize_chat_room_reads on public.chat_rooms;
create trigger initialize_chat_room_reads
after insert on public.chat_rooms
for each row execute function private.initialize_chat_room_reads();

create or replace function private.deliver_chat_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  room_buyer uuid;
  room_seller uuid;
  recipient_id uuid;
begin
  select room.buyer_id, room.seller_id
  into room_buyer, room_seller
  from public.chat_rooms room
  where room.id = new.room_id;

  if room_buyer is null or new.sender_id not in (room_buyer, room_seller) then
    raise exception 'message sender is not a room participant' using errcode = '23514';
  end if;

  recipient_id := case
    when new.sender_id = room_buyer then room_seller
    else room_buyer
  end;

  update public.chat_rooms
  set last_message_at = greatest(last_message_at, new.created_at)
  where id = new.room_id;

  insert into public.chat_room_reads (
    room_id,
    user_id,
    unread_count,
    last_read_at,
    created_at,
    updated_at
  )
  values (new.room_id, recipient_id, 1, null, new.created_at, new.created_at)
  on conflict (room_id, user_id) do update
  set unread_count = public.chat_room_reads.unread_count + 1,
      updated_at = greatest(public.chat_room_reads.updated_at, excluded.updated_at);

  insert into public.notifications (user_id, type, payload, message_id)
  values (
    recipient_id,
    'MESSAGE',
    jsonb_build_object(
      'roomId', new.room_id::text,
      'messageId', new.id::text,
      'preview', left(new.text, 120)
    ),
    new.id
  );

  return new;
end;
$$;

revoke all on function private.deliver_chat_message() from public, anon, authenticated;

drop trigger if exists deliver_chat_message on public.messages;
create trigger deliver_chat_message
after insert on public.messages
for each row execute function private.deliver_chat_message();

create or replace function private.mark_room_notifications_read()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.unread_count = 0 then
    new.last_read_at := now();
    update public.notifications
    set read = true
    where user_id = new.user_id
      and type = 'MESSAGE'
      and not read
      and payload @> jsonb_build_object('roomId', new.room_id::text);
  end if;
  return new;
end;
$$;

revoke all on function private.mark_room_notifications_read() from public, anon, authenticated;

drop trigger if exists mark_room_notifications_read on public.chat_room_reads;
create trigger mark_room_notifications_read
before update of unread_count on public.chat_room_reads
for each row execute function private.mark_room_notifications_read();

alter publication supabase_realtime add table public.chat_room_reads;
