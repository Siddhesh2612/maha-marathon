-- Protected officer/admin/volunteer access model.

update public.districts
set name = 'Ahilyanagar'
where code = 'AHM' and name = 'Ahmednagar';

grant select on public.profiles to authenticated;
grant select on public.volunteer_permissions to authenticated;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "volunteer_permissions_self_read" on public.volunteer_permissions;
create policy "volunteer_permissions_self_read"
on public.volunteer_permissions
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke execute on function public.get_dashboard_stats() from anon;
grant execute on function public.get_dashboard_stats() to authenticated;
