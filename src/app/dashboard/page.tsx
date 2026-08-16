import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { requireDashboardAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const access = await requireDashboardAccess()
  return <DashboardClient signedInName={access.profile.full_name} />
}
