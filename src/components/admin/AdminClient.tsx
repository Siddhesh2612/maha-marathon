'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GovernmentHeader } from '@/components/layout/GovernmentHeader'
import { LandscapeHero } from '@/components/layout/LandscapeHero'
import { Footer } from '@/components/layout/Footer'

type District = { code: string; name: string }
type Volunteer = {
  user_id: string
  full_name: string
  email: string
  district_code: string | null
  active: boolean
  permissions: {
    can_search_participants: boolean
    can_check_in: boolean
    can_view_dashboard: boolean
    can_manage_volunteers: boolean
  } | null
}

export function AdminClient({ signedInName }: { signedInName: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [districts, setDistricts] = useState<District[]>([])
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadVolunteers = useCallback(async () => {
    const response = await fetch('/api/admin/volunteers', { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok) {
      setError(payload.error ?? 'Unable to load volunteers')
      return
    }
    setError(null)
    setVolunteers(payload.volunteers ?? [])
  }, [])

useEffect(() => {
  let cancelled = false

  async function loadDistricts() {
    const { data, error } = await supabase
      .from('districts')
      .select('code,name')
      .order('name')

    if (cancelled) return

    if (error) {
      console.error('Failed to load districts:', error.message)
      return
    }

    setDistricts((data ?? []) as District[])
  }

  void loadDistricts()

  return () => {
    cancelled = true
  }
}, [supabase])

  async function createVolunteer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setLoading(true)
    setError(null)
    setMessage(null)

    const response = await fetch('/api/admin/volunteers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.get('full_name'),
        email: form.get('email'),
        password: form.get('password'),
        district_code: form.get('district_code'),
        can_search_participants: form.get('can_search_participants') === 'on',
        can_check_in: form.get('can_check_in') === 'on',
        can_view_dashboard: form.get('can_view_dashboard') === 'on',
      }),
    })

    const payload = await response.json()
    setLoading(false)

    if (!response.ok) {
      setError(payload.error ?? 'Unable to create volunteer')
      return
    }

    setMessage(`Volunteer ${payload.volunteer.full_name} created. Share the email and temporary password securely.`)
    formElement.reset()
    await loadVolunteers()
  }

  return (
    <div className="sitePage adminPage">
      <GovernmentHeader portal="admin" signedInName={signedInName} />
      <LandscapeHero compact eyebrow="SYSTEM ADMINISTRATION" title="MAHA Marathon Admin" subtitle="Manage authorised volunteers and district-scoped access." />
      <main className="pageBody adminBody">
        <section className="adminMetricGrid">
          <article><span>👥</span><strong>{volunteers.length}</strong><small>Volunteers</small></article>
          <article><span>🟢</span><strong>{volunteers.filter((item) => item.active).length}</strong><small>Active accounts</small></article>
          <article><span>🗺️</span><strong>{new Set(volunteers.map((item) => item.district_code).filter(Boolean)).size}</strong><small>Districts assigned</small></article>
          <article><span>📊</span><strong>{volunteers.filter((item) => item.permissions?.can_view_dashboard).length}</strong><small>Dashboard access</small></article>
        </section>

        <section className="adminGrid" id="volunteers">
          <article className="dashboardPanel createVolunteerPanel">
            <p className="sectionKicker">ACCESS CONTROL</p>
            <h2>Add volunteer</h2>
            <p className="mutedText">Creates a Supabase Auth user and assigns district permissions. Use a temporary password and share it privately.</p>
            <form className="stackForm" onSubmit={createVolunteer}>
              <label className="field">Full name<input name="full_name" required /></label>
              <label className="field">Email<input name="email" type="email" required /></label>
              <label className="field">Temporary password<input name="password" type="password" minLength={8} required /></label>
              <label className="field">Assigned district<select name="district_code" required defaultValue=""><option disabled value="">Select district</option>{districts.map((district) => <option key={district.code} value={district.code}>{district.name}</option>)}</select></label>
              <div className="permissionBox">
                <strong>Permissions</strong>
                <label><input name="can_search_participants" type="checkbox" defaultChecked /> Participant search</label>
                <label><input name="can_check_in" type="checkbox" defaultChecked /> Event check-in</label>
                <label><input name="can_view_dashboard" type="checkbox" /> State dashboard</label>
              </div>
              {error ? <div className="errorBox">{error}</div> : null}
              {message ? <div className="successBox">{message}</div> : null}
              <button className="primaryButton" disabled={loading} type="submit">{loading ? 'Creating…' : 'Create volunteer access'}</button>
            </form>
          </article>

          <article className="dashboardPanel volunteerListPanel">
            <div className="panelHeading"><div><p className="sectionKicker">LIVE ACCESS LIST</p><h2>Volunteers</h2></div><span>{volunteers.length} accounts</span></div>
            <div className="volunteerList">
              {volunteers.length === 0 ? <p className="emptyState">No volunteer accounts yet.</p> : volunteers.map((volunteer) => (
                <div className="volunteerRow" key={volunteer.user_id}>
                  <div className="volunteerAvatar">{volunteer.full_name.slice(0, 1).toUpperCase()}</div>
                  <div className="volunteerMain"><strong>{volunteer.full_name}</strong><span>{volunteer.email}</span><small>{volunteer.district_code ?? 'State'} · {volunteer.active ? 'Active' : 'Disabled'}</small></div>
                  <div className="permissionPills">
                    {volunteer.permissions?.can_search_participants ? <span>Search</span> : null}
                    {volunteer.permissions?.can_check_in ? <span>Check-in</span> : null}
                    {volunteer.permissions?.can_view_dashboard ? <span>Dashboard</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  )
}
