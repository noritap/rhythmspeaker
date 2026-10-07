alter table public.workshop_sessions add column if not exists instructor_special_capacity integer not null default 5 check (instructor_special_capacity between 0 and 20);
alter table public.workshop_reservations add column if not exists reservation_kind text not null default 'public' check (reservation_kind in ('public','instructor_special'));
create index if not exists workshop_reservations_kind_idx on public.workshop_reservations(event_id,reservation_kind,status);

create or replace function public.workshop_remaining_seats(p_event_id uuid,p_session_id uuid) returns integer language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_targets uuid[];v_target uuid;v_capacity integer;v_used integer;v_min integer:=2147483647;
begin
 select case when cardinality(s.consumes)>0 then s.consumes else array[s.id] end into v_targets from public.workshop_sessions s where s.id=p_session_id and s.event_id=p_event_id and s.active=true;
 if v_targets is null or cardinality(v_targets)=0 then return 0;end if;
 foreach v_target in array v_targets loop
  select s.capacity into v_capacity from public.workshop_sessions s where s.id=v_target and s.event_id=p_event_id and s.active=true;
  if v_capacity is null then return 0;end if;
  select count(*)::integer into v_used from public.workshop_reservations r join public.workshop_sessions rs on rs.id=r.session_id
   where r.event_id=p_event_id and r.status<>'cancelled' and r.reservation_kind='public' and (rs.id=v_target or v_target=any(rs.consumes));
  v_min:=least(v_min,v_capacity-v_used);
 end loop;
 return greatest(v_min,0);
end$$;
revoke all on function public.workshop_remaining_seats(uuid,uuid) from public;
grant execute on function public.workshop_remaining_seats(uuid,uuid) to anon,authenticated;

create or replace function public.workshop_instructor_special_remaining(p_event_id uuid,p_session_id uuid) returns integer language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_targets uuid[];v_target uuid;v_capacity integer;v_used integer;v_min integer:=2147483647;
begin
 select case when cardinality(s.consumes)>0 then s.consumes else array[s.id] end into v_targets from public.workshop_sessions s where s.id=p_session_id and s.event_id=p_event_id and s.active=true;
 if v_targets is null or cardinality(v_targets)=0 then return 0;end if;
 foreach v_target in array v_targets loop
  select s.instructor_special_capacity into v_capacity from public.workshop_sessions s where s.id=v_target and s.event_id=p_event_id and s.active=true;
  if v_capacity is null then return 0;end if;
  select count(*)::integer into v_used from public.workshop_reservations r join public.workshop_sessions rs on rs.id=r.session_id
   where r.event_id=p_event_id and r.status<>'cancelled' and r.reservation_kind='instructor_special' and (rs.id=v_target or v_target=any(rs.consumes));
  v_min:=least(v_min,v_capacity-v_used);
 end loop;
 return greatest(v_min,0);
end$$;
revoke all on function public.workshop_instructor_special_remaining(uuid,uuid) from public,anon;
grant execute on function public.workshop_instructor_special_remaining(uuid,uuid) to authenticated;

create or replace function public.create_workshop_instructor_special_reservation(p_event_id uuid,p_session_id uuid,p_name text,p_email text default null,p_phone text default null,p_note text default null) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_session public.workshop_sessions%rowtype;v_targets uuid[];v_remaining integer;v_id text;
begin
 if not public.is_workshop_admin() then raise exception 'FORBIDDEN';end if;
 if length(trim(coalesce(p_name,'')))=0 then raise exception 'NAME_REQUIRED';end if;
 select * into v_session from public.workshop_sessions s where s.id=p_session_id and s.event_id=p_event_id and s.active=true;
 if not found then raise exception 'SESSION_NOT_AVAILABLE';end if;
 v_targets:=case when cardinality(v_session.consumes)>0 then v_session.consumes else array[v_session.id] end;
 perform 1 from public.workshop_sessions s where s.event_id=p_event_id and s.id=any(v_targets) order by s.id for update;
 v_remaining:=public.workshop_instructor_special_remaining(p_event_id,p_session_id);
 if v_remaining<=0 then raise exception 'INSTRUCTOR_SPECIAL_FULL';end if;
 v_id:='RS-I-'||to_char(clock_timestamp(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
 insert into public.workshop_reservations(id,event_id,session_id,name,email,phone,note,amount,payment_status,status,source,source_detail,reservation_kind)
 values(v_id,p_event_id,v_session.id,trim(p_name),nullif(lower(trim(coalesce(p_email,''))),''),nullif(trim(coalesce(p_phone,'')),''),p_note,v_session.price,'unpaid','reserved','other','イントラ特別枠','instructor_special');
 return jsonb_build_object('id',v_id,'eventId',p_event_id,'sessionId',v_session.id,'amount',v_session.price,'paymentStatus','unpaid','status','reserved','reservationKind','instructor_special','specialRemaining',v_remaining-1);
end$$;
revoke all on function public.create_workshop_instructor_special_reservation(uuid,uuid,text,text,text,text) from public,anon;
grant execute on function public.create_workshop_instructor_special_reservation(uuid,uuid,text,text,text,text) to authenticated;

create or replace function public.get_workshop_instructor_dashboard(p_token uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_event_id uuid;v_event jsonb;v_sessions jsonb;v_participants jsonb;v_active_count integer;v_booked_revenue bigint;v_paid_revenue bigint;v_unpaid_revenue bigint;v_checkin_count integer;
begin
 select a.event_id into v_event_id from public.workshop_instructor_access a where a.share_token=p_token and a.enabled=true;
 if v_event_id is null then raise exception 'invalid_or_disabled_link';end if;
 select jsonb_build_object('id',e.id,'slug',e.slug,'title',e.title,'instructor',e.instructor,'date',e.date,'venue',e.venue,'status',e.status) into v_event from public.workshop_events e where e.id=v_event_id;
 select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'start',s.start_time,'end',s.end_time,'price',s.price,'capacity',s.capacity,'consumes',s.consumes,'occupied',greatest(0,s.capacity-pub.remaining),'remaining',pub.remaining,'specialCapacity',s.instructor_special_capacity,'specialOccupied',greatest(0,s.instructor_special_capacity-sp.remaining),'specialRemaining',sp.remaining,'bookedRevenue',coalesce(r.booked_revenue,0),'paidRevenue',coalesce(r.paid_revenue,0)) order by s.sort_order,s.start_time),'[]'::jsonb) into v_sessions
 from public.workshop_sessions s
 cross join lateral(select public.workshop_remaining_seats(v_event_id,s.id)::integer remaining) pub
 cross join lateral(select public.workshop_instructor_special_remaining(v_event_id,s.id)::integer remaining) sp
 left join lateral(select coalesce(sum(wr.amount) filter(where wr.status<>'cancelled'),0)::bigint booked_revenue,coalesce(sum(wr.amount) filter(where wr.status<>'cancelled' and wr.payment_status='paid'),0)::bigint paid_revenue from public.workshop_reservations wr where wr.event_id=v_event_id and wr.session_id=s.id) r on true
 where s.event_id=v_event_id and s.active=true;
 select count(*) filter(where r.status<>'cancelled')::integer,coalesce(sum(r.amount) filter(where r.status<>'cancelled'),0)::bigint,coalesce(sum(r.amount) filter(where r.status<>'cancelled' and r.payment_status='paid'),0)::bigint,coalesce(sum(r.amount) filter(where r.status<>'cancelled' and r.payment_status<>'paid'),0)::bigint,count(*) filter(where r.status<>'cancelled' and r.checkin)::integer
 into v_active_count,v_booked_revenue,v_paid_revenue,v_unpaid_revenue,v_checkin_count from public.workshop_reservations r where r.event_id=v_event_id;
 select coalesce(jsonb_agg(jsonb_build_object('name',r.name,'sessionId',r.session_id,'sessionName',s.name,'consumes',s.consumes,'amount',r.amount,'paymentStatus',r.payment_status,'reservationKind',r.reservation_kind,'source',coalesce(r.source,'web'),'checkin',r.checkin,'createdAt',r.created_at) order by r.created_at),'[]'::jsonb) into v_participants
 from public.workshop_reservations r left join public.workshop_sessions s on s.id=r.session_id where r.event_id=v_event_id and r.status<>'cancelled';
 return jsonb_build_object('event',v_event,'totals',jsonb_build_object('reservations',coalesce(v_active_count,0),'bookedRevenue',coalesce(v_booked_revenue,0),'paidRevenue',coalesce(v_paid_revenue,0),'unpaidRevenue',coalesce(v_unpaid_revenue,0),'checkins',coalesce(v_checkin_count,0)),'sessions',v_sessions,'participants',v_participants,'generatedAt',now());
end$$;
revoke all on function public.get_workshop_instructor_dashboard(uuid) from public;
grant execute on function public.get_workshop_instructor_dashboard(uuid) to anon,authenticated;