-- Phase 2: run after 001_schema_dedicated_backend.sql on a NEW DEDICATED instructor project only.
-- Do not run on rs-workshop-manager or kashima-house-os.
create table if not exists public.instructor_profile_audit (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.instructor_profiles(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  action text not null check (action in ('submit','request_changes','approve','mark_published')),
  occurred_at timestamptz not null default now()
);
alter table public.instructor_profile_audit enable row level security;
revoke all on public.instructor_profile_audit from anon, authenticated;
revoke all on public.instructor_admins from anon, authenticated;
-- Prevent instructors from altering status, feedback, approval or publication timestamps via generic UPDATE.
revoke insert, update on public.instructor_profiles from authenticated;
grant insert (owner_id, profile) on public.instructor_profiles to authenticated;
grant update (profile) on public.instructor_profiles to authenticated;
-- Disallow instructor edits to a profile after submission. Existing RLS policies remain in effect.
create or replace function public.instructor_submit()
returns uuid language plpgsql security definer set search_path = '' as $$
declare pid uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 update public.instructor_profiles
 set status='submitted', submitted_at=now(), admin_feedback=null, updated_at=now()
 where owner_id=auth.uid() and status in ('draft','changes_requested')
   and length(coalesce(profile->>'name',''))>0
   and length(coalesce(profile->>'email',''))>0
   and length(coalesce(profile->>'message',''))>0
 returning id into pid;
 if pid is null then raise exception 'Complete your profile before submitting'; end if;
 insert into public.instructor_profile_audit(profile_id,actor_id,action)
 values(pid,auth.uid(),'submit');
 return pid;
end $$;
create or replace function public.instructor_admin_review(p_profile_id uuid,p_decision text,p_feedback text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare old_status text;
begin
 if auth.uid() is null or not exists(select 1 from public.instructor_admins where user_id=auth.uid()) then
   raise exception 'Administrator permission required';
 end if;
 if p_decision not in ('approve','request_changes') then raise exception 'Invalid decision'; end if;
 if p_decision='request_changes' and length(trim(coalesce(p_feedback,'')))=0 then
   raise exception 'Feedback required';
 end if;
 select status into old_status from public.instructor_profiles where id=p_profile_id for update;
 if old_status is distinct from 'submitted' then raise exception 'Profile is not awaiting review'; end if;
 update public.instructor_profiles set
   status=case when p_decision='approve' then 'approved' else 'changes_requested' end,
   admin_feedback=case when p_decision='approve' then null else p_feedback end,
   approved_at=case when p_decision='approve' then now() else null end,
   updated_at=now()
 where id=p_profile_id;
 insert into public.instructor_profile_audit(profile_id,actor_id,action)
 values(p_profile_id,auth.uid(),p_decision);
end $$;
create or replace function public.instructor_admin_queue()
returns table(id uuid,owner_id uuid,status text,profile jsonb,submitted_at timestamptz,admin_feedback text)
language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.instructor_admins a where a.user_id=auth.uid()) then
   raise exception 'Administrator permission required';
 end if;
 return query select p.id,p.owner_id,p.status,p.profile,p.submitted_at,p.admin_feedback
 from public.instructor_profiles p where p.status in ('submitted','changes_requested','approved')
 order by p.submitted_at desc nulls last;
end $$;
revoke all on function public.instructor_submit() from public, anon;
revoke all on function public.instructor_admin_review(uuid,text,text) from public, anon;
revoke all on function public.instructor_admin_queue() from public, anon;
grant execute on function public.instructor_submit() to authenticated;
grant execute on function public.instructor_admin_review(uuid,text,text) to authenticated;
grant execute on function public.instructor_admin_queue() to authenticated;
-- Provision admin identity out-of-band by trusted operator; never ship admin user IDs in frontend.
-- Publication remains manual after approved content is reviewed in a PR and production QA passes.
