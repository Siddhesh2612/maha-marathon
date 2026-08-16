-- This migration mirrors the schema already applied to the connected Supabase project.
-- Keep it in Git so the database design is reproducible.

create extension if not exists pgcrypto;

create table if not exists public.districts (
  code text primary key,
  name text not null unique,
  name_mr text,
  created_at timestamptz not null default now()
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  bib_number text not null unique,
  full_name text not null check (char_length(full_name) between 2 and 120),
  mobile text not null unique check (mobile ~ '^[6-9][0-9]{9}$'),
  age integer not null check (age between 5 and 100),
  gender text not null check (gender in ('Male','Female','Other','Prefer not to say')),
  district_code text not null references public.districts(code),
  taluka text not null,
  city_village text not null,
  category text not null check (category in ('Student','Citizen','Officer/Employee','NCC','NSS','Other')),
  checked_in boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin','volunteer')),
  district_code text references public.districts(code),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.volunteer_permissions (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  can_search_participants boolean not null default true,
  can_check_in boolean not null default true,
  can_view_dashboard boolean not null default false,
  can_manage_volunteers boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.districts enable row level security;
alter table public.registrations enable row level security;
alter table public.profiles enable row level security;
alter table public.volunteer_permissions enable row level security;

create policy "districts_are_public" on public.districts for select to anon, authenticated using (true);

-- Public demo RPCs are intentionally SECURITY DEFINER because anonymous users are not
-- granted direct access to participant rows. Harden further with rate limiting before production.
create or replace function public.register_participant(
  p_full_name text, p_mobile text, p_age integer, p_gender text,
  p_district_code text, p_taluka text, p_city_village text, p_category text
) returns table (registration_id uuid, bib_number text)
language plpgsql security definer set search_path = public as $$
declare v_next integer; v_id uuid; v_bib text;
begin
  if p_mobile !~ '^[6-9][0-9]{9}$' then raise exception 'Invalid mobile number'; end if;
  if not exists (select 1 from districts where code = p_district_code) then raise exception 'Invalid district'; end if;
  perform pg_advisory_xact_lock(hashtext('bib:' || p_district_code));
  select coalesce(max(substring(r.bib_number from '[0-9]+$')::integer), 0) + 1
    into v_next from registrations r where r.district_code = p_district_code;
  v_bib := p_district_code || '-' || lpad(v_next::text, 6, '0');
  insert into registrations (bib_number, full_name, mobile, age, gender, district_code, taluka, city_village, category)
  values (v_bib, trim(p_full_name), p_mobile, p_age, p_gender, p_district_code, trim(p_taluka), trim(p_city_village), p_category)
  returning id into v_id;
  return query select v_id, v_bib;
end; $$;

revoke all on function public.register_participant(text,text,integer,text,text,text,text,text) from public;
grant execute on function public.register_participant(text,text,integer,text,text,text,text,text) to anon, authenticated;

create or replace function public.get_dashboard_stats()
returns jsonb language sql security definer set search_path = public stable as $$
  select jsonb_build_object(
    'total_registrations', count(*),
    'youth_15_30', count(*) filter (where age between 15 and 30),
    'female_participants', count(*) filter (where gender = 'Female'),
    'student_participants', count(*) filter (where category = 'Student'),
    'ncc_nss_participants', count(*) filter (where category in ('NCC','NSS')),
    'officer_employee_participants', count(*) filter (where category = 'Officer/Employee'),
    'checked_in', count(*) filter (where checked_in = true),
    'districts', coalesce((select jsonb_agg(jsonb_build_object('code', d.code, 'name', d.name, 'count', d.count) order by d.count desc, d.name)
      from (select di.code, di.name, count(r.id) as count from districts di left join registrations r on r.district_code = di.code group by di.code, di.name) d), '[]'::jsonb)
  ) from registrations;
$$;

revoke all on function public.get_dashboard_stats() from public;
grant execute on function public.get_dashboard_stats() to anon, authenticated;
