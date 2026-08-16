-- Explicitly prevent anonymous callers from invoking protected officer/volunteer RPCs.
-- register_participant remains public by design.

revoke execute on function public.search_participants(text) from anon;
revoke execute on function public.check_in_participant(uuid) from anon;
revoke execute on function public.get_dashboard_stats() from anon;

grant execute on function public.search_participants(text) to authenticated;
grant execute on function public.check_in_participant(uuid) to authenticated;
grant execute on function public.get_dashboard_stats() to authenticated;
