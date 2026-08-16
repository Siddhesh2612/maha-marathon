# MAHA Marathon 2026

Demo-ready Maharashtra state registration, officer dashboard, administration and district volunteer console.

## Portals

- `register.mahamarathon.co.in` → public registration
- `dashboard.mahamarathon.co.in` → login-gated state dashboard
- `admin.mahamarathon.co.in` → admin login; volunteers use `/volunteer`

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required public environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Admin-created volunteer accounts additionally require a **server-only** key:

```env
SUPABASE_SECRET_KEY=sb_secret_...
```

Never prefix the secret key with `NEXT_PUBLIC_`, never commit `.env.local`, and never place the key in browser code.

## First admin bootstrap

1. Supabase Dashboard → Authentication → Users → create the first administrator email/password and auto-confirm it.
2. Copy only that user's UUID from Auth.
3. Run in Supabase SQL Editor:

```sql
insert into public.profiles (user_id, full_name, role, district_code, active)
values ('PASTE_AUTH_USER_UUID', 'State Administrator', 'admin', null, true)
on conflict (user_id) do update
set full_name = excluded.full_name,
    role = 'admin',
    district_code = null,
    active = true;

insert into public.volunteer_permissions (
  user_id,
  can_search_participants,
  can_check_in,
  can_view_dashboard,
  can_manage_volunteers
)
values ('PASTE_AUTH_USER_UUID', true, true, true, true)
on conflict (user_id) do update
set can_search_participants = true,
    can_check_in = true,
    can_view_dashboard = true,
    can_manage_volunteers = true,
    updated_at = now();
```

Do not share the administrator password in chat or source control.

## Vercel production variables

Add the existing public variables plus the server-only secret:

```bash
npx vercel env add SUPABASE_SECRET_KEY production
```

Choose **Sensitive = yes** and paste the `sb_secret_...` key directly in your terminal prompt. Then redeploy:

```bash
npx vercel --prod
```

## Map

The dashboard renders an interactive SVG in the browser from a pinned open Maharashtra district TopoJSON dataset. It maps legacy labels to current display names and aggregates the map's single Mumbai shape while keeping Mumbai City and Mumbai Suburban separate in the central database/table.

For a Government production release, replace/validate this geometry against an approved official boundary source.
