import { AdminClient } from '@/components/admin/AdminClient'
import { requireAdmin } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const access = await requireAdmin()
  return <AdminClient signedInName={access.profile.full_name} />
}
