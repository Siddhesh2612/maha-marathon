-- Volunteers can search/check in only inside their assigned district.
-- Admins can search/check in statewide. Enforcement happens in Postgres.

create or replace function public.search_participants(p_query text)
returns table (
  registration_id uuid,
  bib_number text,
  full_name text,
  mobile_masked text,
  district_code text,
  district_name text,
  city_village text,
  category text,
  checked_in boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_district text;
  v_can_search boolean := false;
  v_query text := trim(coalesce(p_query, ''));
begin
  select p.role, p.district_code, coalesce(vp.can_search_participants, false)
    into v_role, v_district, v_can_search
  from public.profiles p
  left join public.volunteer_permissions vp on vp.user_id = p.user_id
  where p.user_id = (select auth.uid()) and p.active = true;

  if v_role is null then
    raise exception 'Not authorised';
  end if;

  if v_role <> 'admin' and not v_can_search then
    raise exception 'Participant search permission required';
  end if;

  if char_length(v_query) < 2 then
    raise exception 'Enter at least 2 characters';
  end if;

  return query
  select
    r.id,
    r.bib_number,
    r.full_name,
    left(r.mobile, 2) || '*****' || right(r.mobile, 3),
    r.district_code,
    d.name,
    r.city_village,
    r.category,
    r.checked_in
  from public.registrations r
  join public.districts d on d.code = r.district_code
  where (v_role = 'admin' or r.district_code = v_district)
    and (
      r.bib_number ilike '%' || v_query || '%'
      or r.mobile = v_query
      or r.full_name ilike '%' || v_query || '%'
    )
  order by r.created_at desc
  limit 20;
end;
$$;

revoke all on function public.search_participants(text) from public;
grant execute on function public.search_participants(text) to authenticated;

create or replace function public.check_in_participant(p_registration_id uuid)
returns table (bib_number text, checked_in boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_district text;
  v_can_check_in boolean := false;
  v_bib text;
  v_checked boolean;
begin
  select p.role, p.district_code, coalesce(vp.can_check_in, false)
    into v_role, v_district, v_can_check_in
  from public.profiles p
  left join public.volunteer_permissions vp on vp.user_id = p.user_id
  where p.user_id = (select auth.uid()) and p.active = true;

  if v_role is null then
    raise exception 'Not authorised';
  end if;

  if v_role <> 'admin' and not v_can_check_in then
    raise exception 'Check-in permission required';
  end if;

  update public.registrations r
  set checked_in = true
  where r.id = p_registration_id
    and (v_role = 'admin' or r.district_code = v_district)
  returning r.bib_number, r.checked_in into v_bib, v_checked;

  if v_bib is null then
    raise exception 'Participant not found in your assigned district';
  end if;

  return query select v_bib, v_checked;
end;
$$;

revoke all on function public.check_in_participant(uuid) from public;
grant execute on function public.check_in_participant(uuid) to authenticated;
