-- Defense in depth: authenticated does not automatically mean dashboard-authorized.

create or replace function public.get_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_allowed boolean := false;
  v_result jsonb;
begin
  select exists (
    select 1
    from public.profiles p
    left join public.volunteer_permissions vp on vp.user_id = p.user_id
    where p.user_id = (select auth.uid())
      and p.active = true
      and (p.role = 'admin' or coalesce(vp.can_view_dashboard, false) = true)
  ) into v_allowed;

  if not v_allowed then
    raise exception 'Dashboard access required';
  end if;

  select jsonb_build_object(
    'total_registrations', count(*),
    'registrations_today', count(*) filter (where created_at::date = current_date),
    'youth_15_30', count(*) filter (where age between 15 and 30),
    'female_participants', count(*) filter (where gender = 'Female'),
    'student_participants', count(*) filter (where category = 'Student'),
    'citizen_participants', count(*) filter (where category = 'Citizen'),
    'ncc_participants', count(*) filter (where category = 'NCC'),
    'nss_participants', count(*) filter (where category = 'NSS'),
    'ncc_nss_participants', count(*) filter (where category in ('NCC','NSS')),
    'officer_employee_participants', count(*) filter (where category = 'Officer/Employee'),
    'other_participants', count(*) filter (where category = 'Other'),
    'checked_in', count(*) filter (where checked_in = true),
    'certificates_generated', 0,
    'districts', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'code', d.code,
          'name', d.name,
          'count', d.registrations,
          'checkins', d.checkins
        ) order by d.registrations desc, d.name
      )
      from (
        select
          di.code,
          di.name,
          count(r.id) as registrations,
          count(r.id) filter (where r.checked_in = true) as checkins
        from public.districts di
        left join public.registrations r on r.district_code = di.code
        group by di.code, di.name
      ) d
    ), '[]'::jsonb)
  ) into v_result
  from public.registrations;

  return v_result;
end;
$$;

revoke all on function public.get_dashboard_stats() from public;
grant execute on function public.get_dashboard_stats() to authenticated;
