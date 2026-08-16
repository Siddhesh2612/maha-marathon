'use client'

import { FormEvent, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GovernmentHeader } from '@/components/layout/GovernmentHeader'
import { LandscapeHero } from '@/components/layout/LandscapeHero'
import { Footer } from '@/components/layout/Footer'
import type { UserProfile, VolunteerPermissions } from '@/lib/auth/guards'

type SearchRow = {
  registration_id: string
  bib_number: string
  full_name: string
  mobile_masked: string
  district_code: string
  district_name: string
  city_village: string
  category: string
  checked_in: boolean
}

export function VolunteerConsole({ profile, permissions }: { profile: UserProfile; permissions: VolunteerPermissions | null }) {
  const supabase = useMemo(() => createClient(), [])
  const [rows, setRows] = useState<SearchRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const query = String(form.get('query') ?? '').trim()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { data, error: rpcError } = await supabase.rpc('search_participants', { p_query: query })
    setLoading(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setRows((data ?? []) as SearchRow[])
  }

  async function checkIn(row: SearchRow) {
    setError(null)
    setMessage(null)
    const { error: rpcError } = await supabase.rpc('check_in_participant', { p_registration_id: row.registration_id })
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setRows((current) => current.map((item) => item.registration_id === row.registration_id ? { ...item, checked_in: true } : item))
    setMessage(`${row.bib_number} checked in successfully.`)
  }

  return (
    <div className="sitePage volunteerPage">
      <GovernmentHeader portal="volunteer" signedInName={profile.full_name} />
      <LandscapeHero compact eyebrow="DISTRICT VOLUNTEER CONSOLE" title="Participant Check-in" subtitle={`Assigned district: ${profile.district_code ?? 'State-level'}`} />
      <main className="pageBody volunteerBody">
        <section className="permissionSummary" id="permissions">
          <div><span>🔎</span><strong>Participant search</strong><small>{permissions?.can_search_participants ? 'Allowed' : 'Not allowed'}</small></div>
          <div><span>✅</span><strong>Event check-in</strong><small>{permissions?.can_check_in ? 'Allowed' : 'Not allowed'}</small></div>
          <div><span>📊</span><strong>State dashboard</strong><small>{permissions?.can_view_dashboard ? 'Allowed' : 'Not allowed'}</small></div>
        </section>

        <section className="dashboardPanel searchPanel">
          <div className="panelHeading"><div><p className="sectionKicker">DISTRICT-SCOPED SEARCH</p><h2>Find participant</h2><p>Search by Bib number, exact mobile number, or participant name. Volunteers only receive results from their assigned district.</p></div></div>
          <form onSubmit={search} className="participantSearchForm">
            <input name="query" placeholder="PUN-000001 / mobile / participant name" required minLength={2} />
            <button className="primaryButton" disabled={loading || !permissions?.can_search_participants} type="submit">{loading ? 'Searching…' : 'Search'}</button>
          </form>
          {error ? <div className="errorBox">{error}</div> : null}
          {message ? <div className="successBox">{message}</div> : null}

          <div className="searchResults">
            {rows.map((row) => (
              <article className="participantResult" key={row.registration_id}>
                <div><span className="bibPill">{row.bib_number}</span><strong>{row.full_name}</strong><small>{row.mobile_masked} · {row.district_name} · {row.city_village} · {row.category}</small></div>
                <div className="resultAction">
                  {row.checked_in ? <span className="checkedBadge">Checked in ✓</span> : <button className="checkinButton" disabled={!permissions?.can_check_in} onClick={() => checkIn(row)} type="button">Mark check-in</button>}
                </div>
              </article>
            ))}
            {!loading && rows.length === 0 ? <p className="emptyState">Search results will appear here.</p> : null}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
