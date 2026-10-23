-- Review before applying to production. Scoped instructor self-edit; no reservation/payment fields.
create or replace function public.get_workshop_instructor_edit_by_token(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_event public.workshop_events%rowtype;
begin
 select e.* into v_event from public.workshop_events e
 join public.workshop_instructor_access a on a.event_id=e.id
 where a.share_token=p_token and a.enabled=true;
 if not found then raise exception 'invalid_or_disabled_link'; end if;
 return jsonb_build_object('slug',v_event.slug,'title',v_event.title,
 'instructor_profile',v_event.instructor_profile,'description',v_event.description,
 'target_audience',v_event.target_audience,'highlights',v_event.highlights);
end $$;
create or replace function public.update_workshop_instructor_content_by_token(
 p_token uuid,p_profile text,p_description text,p_audience text,p_highlights text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_event_id uuid; v_slug text;
begin
 select a.event_id into v_event_id from public.workshop_instructor_access a
 where a.share_token=p_token and a.enabled=true;
 if v_event_id is null then raise exception 'invalid_or_disabled_link'; end if;
 if length(coalesce(p_profile,''))>2000 or length(coalesce(p_description,''))>3000
 or length(coalesce(p_audience,''))>300 or length(coalesce(p_highlights,''))>1500
 then raise exception 'content_too_long'; end if;
 update public.workshop_events set instructor_profile=coalesce(p_profile,''),
 description=coalesce(p_description,''),target_audience=coalesce(p_audience,''),
 highlights=coalesce(p_highlights,''),updated_at=now()
 where id=v_event_id returning slug into v_slug;
 if v_slug is null then raise exception 'event_not_found'; end if;
 return jsonb_build_object('slug',v_slug,'saved',true);
end $$;
revoke all on function public.get_workshop_instructor_edit_by_token(uuid) from public;
revoke all on function public.update_workshop_instructor_content_by_token(uuid,text,text,text,text) from public;
grant execute on function public.get_workshop_instructor_edit_by_token(uuid) to anon,authenticated;
grant execute on function public.update_workshop_instructor_content_by_token(uuid,text,text,text,text) to anon,authenticated;
