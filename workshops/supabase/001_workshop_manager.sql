-- Rhythm Speaker Workshop Manager v1
-- Supabase schema / RLS / atomic reservation capacity control

create extension if not exists pgcrypto;

create table if not exists public.workshop_admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into public.workshop_admin_emails(email)
values ('rhythmspeaker296@gmail.com')
on conflict do nothing;

create table if not exists public.workshop_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  instructor text,
  date date not null,
  venue text,
  address text,
  summary text,
  description text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  cover text,
  payment_note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workshop_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.workshop_events(id) on delete cascade,
  name text not null,
  start_time time,
  end_time time,
  minutes integer not null default 0 check (minutes >= 0),
  price integer not null default 0 check (price >= 0),
  capacity integer not null default 10 check (capacity > 0),
  level text,
  payment_url text,
  consumes uuid[] not null default '{}'::uuid[],
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workshop_sessions_event_idx on public.workshop_sessions(event_id, active, sort_order);

create table if not exists public.workshop_reservations (
  id text primary key,
  event_id uuid not null references public.workshop_events(id) on delete restrict,
  session_id uuid not null references public.workshop_sessions(id) on delete restrict,
  name text not null,
  email text not null,
  phone text not null,
  experience text,
  shoes text,
  shoe_size text,
  note text,
  amount integer not null check (amount >= 0),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded','partial')),
  status text not null default 'reserved' check (status in ('reserved','cancelled')),
  checkin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workshop_reservations_event_idx on public.workshop_reservations(event_id, created_at desc);
create index if not exists workshop_reservations_session_idx on public.workshop_reservations(session_id, status);

create or replace function public.set_workshop_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_workshop_events_updated on public.workshop_events;
create trigger trg_workshop_events_updated before update on public.workshop_events
for each row execute function public.set_workshop_updated_at();

drop trigger if exists trg_workshop_sessions_updated on public.workshop_sessions;
create trigger trg_workshop_sessions_updated before update on public.workshop_sessions
for each row execute function public.set_workshop_updated_at();

drop trigger if exists trg_workshop_reservations_updated on public.workshop_reservations;
create trigger trg_workshop_reservations_updated before update on public.workshop_reservations
for each row execute function public.set_workshop_updated_at();

create or replace function public.is_workshop_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workshop_admin_emails a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email',''))
  );
$$;

revoke all on function public.is_workshop_admin() from public;
grant execute on function public.is_workshop_admin() to authenticated;

alter table public.workshop_admin_emails enable row level security;
alter table public.workshop_events enable row level security;
alter table public.workshop_sessions enable row level security;
alter table public.workshop_reservations enable row level security;

drop policy if exists workshop_admin_emails_admin_all on public.workshop_admin_emails;
create policy workshop_admin_emails_admin_all on public.workshop_admin_emails
for all to authenticated
using (public.is_workshop_admin())
with check (public.is_workshop_admin());

drop policy if exists workshop_events_public_read on public.workshop_events;
create policy workshop_events_public_read on public.workshop_events
for select to anon, authenticated
using (status = 'published' or public.is_workshop_admin());

drop policy if exists workshop_events_admin_write on public.workshop_events;
create policy workshop_events_admin_write on public.workshop_events
for all to authenticated
using (public.is_workshop_admin())
with check (public.is_workshop_admin());

drop policy if exists workshop_sessions_public_read on public.workshop_sessions;
create policy workshop_sessions_public_read on public.workshop_sessions
for select to anon, authenticated
using (
  (active = true and exists (
    select 1 from public.workshop_events e
    where e.id = event_id and e.status = 'published'
  )) or public.is_workshop_admin()
);

drop policy if exists workshop_sessions_admin_write on public.workshop_sessions;
create policy workshop_sessions_admin_write on public.workshop_sessions
for all to authenticated
using (public.is_workshop_admin())
with check (public.is_workshop_admin());

drop policy if exists workshop_reservations_admin_all on public.workshop_reservations;
create policy workshop_reservations_admin_all on public.workshop_reservations
for all to authenticated
using (public.is_workshop_admin())
with check (public.is_workshop_admin());

create or replace function public.workshop_remaining_seats(p_event_id uuid, p_session_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_targets uuid[];
  v_target uuid;
  v_capacity integer;
  v_used integer;
  v_min integer := 2147483647;
begin
  select case when cardinality(s.consumes) > 0 then s.consumes else array[s.id] end
    into v_targets
  from public.workshop_sessions s
  where s.id = p_session_id and s.event_id = p_event_id and s.active = true;

  if v_targets is null or cardinality(v_targets) = 0 then
    return 0;
  end if;

  foreach v_target in array v_targets loop
    select s.capacity into v_capacity
    from public.workshop_sessions s
    where s.id = v_target and s.event_id = p_event_id and s.active = true;

    if v_capacity is null then return 0; end if;

    select count(*)::integer into v_used
    from public.workshop_reservations r
    join public.workshop_sessions rs on rs.id = r.session_id
    where r.event_id = p_event_id
      and r.status <> 'cancelled'
      and (rs.id = v_target or v_target = any(rs.consumes));

    v_min := least(v_min, v_capacity - v_used);
  end loop;

  return greatest(v_min, 0);
end;
$$;

revoke all on function public.workshop_remaining_seats(uuid,uuid) from public;
grant execute on function public.workshop_remaining_seats(uuid,uuid) to anon, authenticated;

create or replace function public.create_workshop_reservation(
  p_event_slug text,
  p_session_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_experience text default null,
  p_shoes text default null,
  p_shoe_size text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_session public.workshop_sessions%rowtype;
  v_targets uuid[];
  v_remaining integer;
  v_id text;
begin
  if length(trim(coalesce(p_name,''))) = 0
     or length(trim(coalesce(p_email,''))) = 0
     or length(trim(coalesce(p_phone,''))) = 0 then
    raise exception 'NAME_EMAIL_PHONE_REQUIRED';
  end if;

  select e.id into v_event_id
  from public.workshop_events e
  where e.slug = p_event_slug and e.status = 'published';
  if v_event_id is null then raise exception 'EVENT_NOT_AVAILABLE'; end if;

  select * into v_session
  from public.workshop_sessions s
  where s.id = p_session_id and s.event_id = v_event_id and s.active = true;
  if not found then raise exception 'SESSION_NOT_AVAILABLE'; end if;

  v_targets := case when cardinality(v_session.consumes) > 0 then v_session.consumes else array[v_session.id] end;

  perform 1
  from public.workshop_sessions s
  where s.event_id = v_event_id and s.id = any(v_targets)
  order by s.id
  for update;

  v_remaining := public.workshop_remaining_seats(v_event_id, p_session_id);
  if v_remaining <= 0 then raise exception 'FULL'; end if;

  v_id := 'RS-' || to_char(clock_timestamp(),'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));

  insert into public.workshop_reservations(
    id,event_id,session_id,name,email,phone,experience,shoes,shoe_size,note,amount
  ) values (
    v_id,v_event_id,v_session.id,trim(p_name),lower(trim(p_email)),trim(p_phone),p_experience,p_shoes,p_shoe_size,p_note,v_session.price
  );

  return jsonb_build_object(
    'id',v_id,
    'eventId',v_event_id,
    'sessionId',v_session.id,
    'amount',v_session.price,
    'paymentStatus','unpaid',
    'status','reserved'
  );
end;
$$;

revoke all on function public.create_workshop_reservation(text,uuid,text,text,text,text,text,text,text) from public;
grant execute on function public.create_workshop_reservation(text,uuid,text,text,text,text,text,text,text) to anon, authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('workshop-media','workshop-media',true,10485760,array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do update set public = excluded.public;

drop policy if exists workshop_media_admin_insert on storage.objects;
create policy workshop_media_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'workshop-media' and public.is_workshop_admin());

drop policy if exists workshop_media_admin_update on storage.objects;
create policy workshop_media_admin_update on storage.objects
for update to authenticated
using (bucket_id = 'workshop-media' and public.is_workshop_admin())
with check (bucket_id = 'workshop-media' and public.is_workshop_admin());

drop policy if exists workshop_media_admin_delete on storage.objects;
create policy workshop_media_admin_delete on storage.objects
for delete to authenticated
using (bucket_id = 'workshop-media' and public.is_workshop_admin());
