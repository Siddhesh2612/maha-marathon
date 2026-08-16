import { VolunteerConsole } from '@/components/admin/VolunteerConsole'
import { requireVolunteerAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export default async function VolunteerPage() {
  const access = await requireVolunteerAccess()
  return <VolunteerConsole profile={access.profile} permissions={access.permissions} />
}
