create table if not exists public.workshop_waitlist (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.workshop_events(id),
 session_id uuid not null references public.workshop_sessions(id),
 name text not null check(length(trim(name))>0),
 email text,
 phone text,
 status text not null default 'waiting' check(status in ('waiting','contacted','responding','declined','converted','expired')),
 notes text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 contacted_at timestamptz,
 deadline_at timestamptz
);
create index if not exists workshop_waitlist_queue_idx on public.workshop_waitlist(event_id,session_id,status,created_at);
alter table public.workshop_waitlist enable row level security;
revoke all on public.workshop_waitlist from public,anon,authenticated;
grant select,insert,update on public.workshop_waitlist to authenticated;
create policy "workshop admins manage waitlist" on public.workshop_waitlist for all to authenticated using(public.is_workshop_admin()) with check(public.is_workshop_admin());

create table if not exists public.workshop_operation_audit (
 id bigint generated always as identity primary key,
 reservation_id text not null,
 event_id uuid not null,
 actor_uid uuid,
 operation text not null,
 before_data jsonb,
 after_data jsonb,
 occurred_at timestamptz not null default now()
);
create index if not exists workshop_operation_audit_event_idx on public.workshop_operation_audit(event_id,occurred_at desc);
alter table public.workshop_operation_audit enable row level security;
revoke all on public.workshop_operation_audit from public,anon,authenticated;
grant select on public.workshop_operation_audit to authenticated;
create policy "workshop admins view audit" on public.workshop_operation_audit for select to authenticated using(public.is_workshop_admin());
create or replace function public.audit_workshop_reservation_update() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if (old.payment_status,old.checkin,old.status) is distinct from (new.payment_status,new.checkin,new.status) then
  insert into public.workshop_operation_audit(reservation_id,event_id,actor_uid,operation,before_data,after_data)
  values(new.id,new.event_id,auth.uid(),'reservation_state_changed',
    jsonb_build_object('paymentStatus',old.payment_status,'checkin',old.checkin,'status',old.status),
    jsonb_build_object('paymentStatus',new.payment_status,'checkin',new.checkin,'status',new.status));
 end if;
 return new;
end$$;
drop trigger if exists workshop_reservation_audit_trigger on public.workshop_reservations;
create trigger workshop_reservation_audit_trigger after update on public.workshop_reservations for each row execute function public.audit_workshop_reservation_update();
