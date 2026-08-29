create table if not exists public.workshop_instructor_access (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.workshop_events(id) on delete cascade,
  share_token uuid not null unique default gen_random_uuid(),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workshop_instructor_access enable row level security;
revoke all on table public.workshop_instructor_access from anon, authenticated;

drop function if exists public.get_or_create_workshop_instructor_link(uuid);
create function public.get_or_create_workshop_instructor_link(p_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_token uuid;
begin
  if not public.is_workshop_admin() then
    raise exception 'forbidden';
  end if;

  if not exists (select 1 from public.workshop_events where id = p_event_id) then
    raise exception 'event_not_found';
  end if;

  insert into public.workshop_instructor_access(event_id, enabled)
  values (p_event_id, true)
  on conflict (event_id) do update
    set enabled = true,
        updated_at = now()
  returning share_token into v_token;

  return v_token;
end;
$$;

revoke all on function public.get_or_create_workshop_instructor_link(uuid) from public, anon;
grant execute on function public.get_or_create_workshop_instructor_link(uuid) to authenticated;

drop function if exists public.rotate_workshop_instructor_link(uuid);
create function public.rotate_workshop_instructor_link(p_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_token uuid := gen_random_uuid();
begin
  if not public.is_workshop_admin() then
    raise exception 'forbidden';
  end if;

  insert into public.workshop_instructor_access(event_id, share_token, enabled)
  values (p_event_id, v_token, true)
  on conflict (event_id) do update
    set share_token = excluded.share_token,
        enabled = true,
        updated_at = now()
  returning share_token into v_token;

  return v_token;
end;
$$;

revoke all on function public.rotate_workshop_instructor_link(uuid) from public, anon;
grant execute on function public.rotate_workshop_instructor_link(uuid) to authenticated;

drop function if exists public.get_workshop_instructor_dashboard(uuid);
create function public.get_workshop_instructor_dashboard(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event_id uuid;
  v_event jsonb;
  v_sessions jsonb;
  v_participants jsonb;
  v_active_count integer;
  v_booked_revenue bigint;
  v_paid_revenue bigint;
  v_unpaid_revenue bigint;
  v_checkin_count integer;
begin
  select a.event_id
    into v_event_id
  from public.workshop_instructor_access a
  where a.share_token = p_token
    and a.enabled = true;

  if v_event_id is null then
    raise exception 'invalid_or_disabled_link';
  end if;

  select jsonb_build_object(
    'id', e.id,
    'slug', e.slug,
    'title', e.title,
    'instructor', e.instructor,
    'date', e.date,
    'venue', e.venue,
    'status', e.status
  ) into v_event
  from public.workshop_events e
  where e.id = v_event_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'start', s.start_time,
      'end', s.end_time,
      'price', s.price,
      'capacity', s.capacity,
      'occupied', greatest(0, s.capacity - x.remaining),
      'remaining', x.remaining,
      'bookedRevenue', coalesce(r.booked_revenue, 0),
      'paidRevenue', coalesce(r.paid_revenue, 0)
    ) order by s.sort_order, s.start_time
  ), '[]'::jsonb)
  into v_sessions
  from public.workshop_sessions s
  cross join lateral (
    select public.workshop_remaining_seats(v_event_id, s.id)::integer as remaining
  ) x
  left join lateral (
    select
      coalesce(sum(wr.amount) filter (where wr.status <> 'cancelled'), 0)::bigint as booked_revenue,
      coalesce(sum(wr.amount) filter (where wr.status <> 'cancelled' and wr.payment_status = 'paid'), 0)::bigint as paid_revenue
    from public.workshop_reservations wr
    where wr.event_id = v_event_id
      and wr.session_id = s.id
  ) r on true
  where s.event_id = v_event_id
    and s.active = true;

  select
    count(*) filter (where r.status <> 'cancelled')::integer,
    coalesce(sum(r.amount) filter (where r.status <> 'cancelled'), 0)::bigint,
    coalesce(sum(r.amount) filter (where r.status <> 'cancelled' and r.payment_status = 'paid'), 0)::bigint,
    coalesce(sum(r.amount) filter (where r.status <> 'cancelled' and r.payment_status <> 'paid'), 0)::bigint,
    count(*) filter (where r.status <> 'cancelled' and r.checkin)::integer
  into v_active_count, v_booked_revenue, v_paid_revenue, v_unpaid_revenue, v_checkin_count
  from public.workshop_reservations r
  where r.event_id = v_event_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'name', r.name,
      'sessionName', s.name,
      'amount', r.amount,
      'paymentStatus', r.payment_status,
      'source', coalesce(r.source, 'web'),
      'checkin', r.checkin,
      'createdAt', r.created_at
    ) order by r.created_at
  ), '[]'::jsonb)
  into v_participants
  from public.workshop_reservations r
  left join public.workshop_sessions s on s.id = r.session_id
  where r.event_id = v_event_id
    and r.status <> 'cancelled';

  return jsonb_build_object(
    'event', v_event,
    'totals', jsonb_build_object(
      'reservations', coalesce(v_active_count, 0),
      'bookedRevenue', coalesce(v_booked_revenue, 0),
      'paidRevenue', coalesce(v_paid_revenue, 0),
      'unpaidRevenue', coalesce(v_unpaid_revenue, 0),
      'checkins', coalesce(v_checkin_count, 0)
    ),
    'sessions', v_sessions,
    'participants', v_participants,
    'generatedAt', now()
  );
end;
$$;

revoke all on function public.get_workshop_instructor_dashboard(uuid) from public;
grant execute on function public.get_workshop_instructor_dashboard(uuid) to anon, authenticated;
