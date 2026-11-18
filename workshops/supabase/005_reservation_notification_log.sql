-- Workshop reservation operator notification v1.0
-- PREVIEW ONLY: do not apply until production change is explicitly approved.
-- New log table only. Existing reservations, RPC, RLS, pricing, and payment untouched.
create table if not exists public.workshop_notification_log (
  reservation_id text primary key references public.workshop_reservations(id) on delete restrict,
  status text not null default 'processing' check (status in ('processing','sent','failed')),
  attempts integer not null default 1 check (attempts between 1 and 3),
  provider_message_id text,
  sent_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);
alter table public.workshop_notification_log enable row level security;
revoke all on public.workshop_notification_log from anon, authenticated;
-- No public/authenticated RLS policies. Server-side secret key only.
