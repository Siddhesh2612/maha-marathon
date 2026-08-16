import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type UserProfile = {
  user_id: string
  full_name: string
  role: 'admin' | 'volunteer'
  district_code: string | null
  active: boolean
}

export type VolunteerPermissions = {
  user_id: string
  can_search_participants: boolean
  can_check_in: boolean
  can_view_dashboard: boolean
  can_manage_volunteers: boolean
}

export async function getCurrentAccess() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (!userId) return null

  const [{ data: profile }, { data: permissions }] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id,full_name,role,district_code,active')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('volunteer_permissions')
      .select('user_id,can_search_participants,can_check_in,can_view_dashboard,can_manage_volunteers')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (!profile) return null

  return {
    userId,
    profile: profile as UserProfile,
    permissions: (permissions ?? null) as VolunteerPermissions | null,
  }
}

export async function requireSignedIn() {
  const access = await getCurrentAccess()
  if (!access || !access.profile.active) redirect('/login')
  return access
}

export async function requireAdmin() {
  const access = await requireSignedIn()
  if (access.profile.role !== 'admin') redirect('/volunteer')
  return access
}

export async function requireDashboardAccess() {
  const access = await requireSignedIn()
  const allowed =
    access.profile.role === 'admin' || access.permissions?.can_view_dashboard === true
  if (!allowed) redirect('/volunteer')
  return access
}

export async function requireVolunteerAccess() {
  return requireSignedIn()
}
