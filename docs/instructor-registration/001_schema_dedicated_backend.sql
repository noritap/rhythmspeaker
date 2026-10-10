-- Instructor intake v1: apply only to a dedicated Rhythm Speaker instructor backend.
-- Never apply to the workshop or guest-house Supabase projects.
create table if not exists public.instructor_profiles (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'draft' check(status in ('draft','submitted','changes_requested','approved','published')),
 profile jsonb not null default '{}'::jsonb,
 admin_feedback text,
 submitted_at timestamptz,
 approved_at timestamptz,
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(owner_id)
);
create table if not exists public.instructor_admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.instructor_profiles enable row level security;
alter table public.instructor_admins enable row level security;
create policy "owners read own profile" on public.instructor_profiles for select to authenticated using (owner_id=auth.uid());
create policy "owners insert draft" on public.instructor_profiles for insert to authenticated with check (owner_id=auth.uid() and status='draft');
create policy "owners edit draft" on public.instructor_profiles for update to authenticated using (owner_id=auth.uid() and status in ('draft','changes_requested')) with check (owner_id=auth.uid() and status in ('draft','changes_requested'));
-- No client policy grants approval, publication, or admin access.
-- Approval/publication must use a separately reviewed authenticated server-side endpoint,
-- with explicit administrator role checks, immutable audit trail, and no direct client bypass.
