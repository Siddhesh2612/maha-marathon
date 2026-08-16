import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function verifyAdmin() {
  const supabase = await createServerClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return { ok: false as const, status: 401, message: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role,active')
    .eq('user_id', userId)
    .maybeSingle()

  if (!profile?.active || profile.role !== 'admin') {
    return { ok: false as const, status: 403, message: 'Admin access required' }
  }

  return { ok: true as const, userId }
}

export async function GET() {
  const auth = await verifyAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  try {
    const admin = createAdminClient()
    const [{ data: profiles, error: profileError }, { data: permissions, error: permissionError }, usersResult] = await Promise.all([
      admin.from('profiles').select('user_id,full_name,role,district_code,active,created_at').order('created_at', { ascending: false }),
      admin.from('volunteer_permissions').select('user_id,can_search_participants,can_check_in,can_view_dashboard,can_manage_volunteers'),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ])

    if (profileError) throw profileError
    if (permissionError) throw permissionError
    if (usersResult.error) throw usersResult.error

    const emailById = new Map(usersResult.data.users.map((user) => [user.id, user.email ?? '']))
    const permissionById = new Map((permissions ?? []).map((item) => [item.user_id, item]))

    const rows = (profiles ?? [])
      .filter((profile) => profile.role === 'volunteer')
      .map((profile) => ({
        ...profile,
        email: emailById.get(profile.user_id) ?? '',
        permissions: permissionById.get(profile.user_id) ?? null,
      }))

    return NextResponse.json({ volunteers: rows })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load volunteers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  let body: {
    full_name?: string
    email?: string
    password?: string
    district_code?: string
    can_search_participants?: boolean
    can_check_in?: boolean
    can_view_dashboard?: boolean
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const fullName = String(body.full_name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const districtCode = String(body.district_code ?? '').trim()

  if (fullName.length < 2 || !email.includes('@') || password.length < 8 || !districtCode) {
    return NextResponse.json({ error: 'Name, email, district and a temporary password of at least 8 characters are required.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'volunteer' },
  })

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? 'Unable to create volunteer login' }, { status: 400 })
  }

  const userId = created.user.id

  const { error: profileError } = await admin.from('profiles').insert({
    user_id: userId,
    full_name: fullName,
    role: 'volunteer',
    district_code: districtCode,
    active: true,
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  const { error: permissionError } = await admin.from('volunteer_permissions').insert({
    user_id: userId,
    can_search_participants: body.can_search_participants !== false,
    can_check_in: body.can_check_in !== false,
    can_view_dashboard: body.can_view_dashboard === true,
    can_manage_volunteers: false,
  })

  if (permissionError) {
    await admin.from('profiles').delete().eq('user_id', userId)
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: permissionError.message }, { status: 500 })
  }

  return NextResponse.json({
    volunteer: {
      user_id: userId,
      full_name: fullName,
      email,
      district_code: districtCode,
    },
  }, { status: 201 })
}
