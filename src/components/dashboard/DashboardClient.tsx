'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GovernmentHeader } from '@/components/layout/GovernmentHeader'
import { LandscapeHero } from '@/components/layout/LandscapeHero'
import { Footer } from '@/components/layout/Footer'
import { MaharashtraDistrictMap, type DistrictStat } from './MaharashtraDistrictMap'

type Stats = {
  total_registrations: number
  registrations_today: number
  youth_15_30: number
  female_participants: number
  student_participants: number
  citizen_participants: number
  ncc_participants: number
  nss_participants: number
  ncc_nss_participants: number
  officer_employee_participants: number
  other_participants: number
  checked_in: number
  certificates_generated: number
  districts: DistrictStat[]
}

const emptyStats: Stats = {
  total_registrations: 0,
  registrations_today: 0,
  youth_15_30: 0,
  female_participants: 0,
  student_participants: 0,
  citizen_participants: 0,
  ncc_participants: 0,
  nss_participants: 0,
  ncc_nss_participants: 0,
  officer_employee_participants: 0,
  other_participants: 0,
  checked_in: 0,
  certificates_generated: 0,
  districts: [],
}

function pct(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

export function DashboardClient({ signedInName }: { signedInName: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [stats, setStats] = useState<Stats>(emptyStats)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc('get_dashboard_stats')
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setError(null)
    setStats((data ?? emptyStats) as Stats)
    setUpdatedAt(new Date())
  }, [supabase])

  useEffect(() => {
    loadStats()
    const interval = window.setInterval(loadStats, 5000)
    return () => window.clearInterval(interval)
  }, [loadStats])

  const ranked = [...stats.districts].sort((a, b) => Number(b.count) - Number(a.count))
  const topFive = ranked.slice(0, 5)
  const districtsWithEntries = stats.districts.filter((district) => Number(district.count) > 0).length
  const total = stats.total_registrations

  const categorySegments = [
    { label: 'Students', value: stats.student_participants, token: 'catBlue' },
    { label: 'Citizens', value: stats.citizen_participants, token: 'catGreen' },
    { label: 'Employees', value: stats.officer_employee_participants, token: 'catOrange' },
    { label: 'NCC / NSS', value: stats.ncc_nss_participants, token: 'catPurple' },
    { label: 'Other', value: stats.other_participants, token: 'catRed' },
  ]

  return (
    <div className="sitePage dashboardPage">
      <GovernmentHeader portal="dashboard" signedInName={signedInName} />
      <LandscapeHero
        compact
        eyebrow="SOIL AND WATER CONSERVATION DEPARTMENT"
        title="State Dashboard"
        subtitle="Real-time MAHA Marathon participation across all 36 districts of Maharashtra"
        rightSlot={<div className="liveBlock"><span>● Live</span><small>{updatedAt ? `Updated ${updatedAt.toLocaleTimeString()}` : 'Connecting…'}</small></div>}
      />

      <main className="pageBody dashboardBody">
        {error ? <div className="errorBox">Dashboard error: {error}</div> : null}

        <section className="officialChannels">
          <div><p className="sectionKicker">OFFICIAL CHANNELS</p><strong>Follow for latest updates</strong><span>Venue, kit and event updates can be linked here once official handles are confirmed.</span></div>
          <div className="channelButtons"><button type="button">Instagram ↗</button><button type="button">Facebook ↗</button><button type="button">X (Twitter) ↗</button></div>
        </section>

        <section className="primaryMetrics">
          <article className="metricCard metricBlue"><span>Total registrations</span><strong>{stats.total_registrations.toLocaleString('en-IN')}</strong><small>{stats.registrations_today.toLocaleString('en-IN')} new today · {districtsWithEntries}/36 districts with entries</small></article>
          <article className="metricCard metricGreen"><span>Total check-ins</span><strong>{stats.checked_in.toLocaleString('en-IN')}</strong><small>{pct(stats.checked_in, total)}% check-in rate · {Math.max(0, total - stats.checked_in).toLocaleString('en-IN')} yet to check in</small></article>
          <article className="metricCard metricOrange"><span>Certificates generated</span><strong>{stats.certificates_generated.toLocaleString('en-IN')}</strong><small>Certificate module follows check-in phase</small></article>
        </section>

        <section className="miniMetrics">
          <article><span>🏢</span><strong>36</strong><small>Districts</small></article>
          <article><span>👥</span><strong>{stats.youth_15_30.toLocaleString('en-IN')}</strong><small>Youth (15–30)</small></article>
          <article><span>👩</span><strong>{stats.female_participants.toLocaleString('en-IN')}</strong><small>Women</small></article>
          <article><span>🎓</span><strong>{stats.student_participants.toLocaleString('en-IN')}</strong><small>Students</small></article>
          <article><span>🛡️</span><strong>{stats.ncc_nss_participants.toLocaleString('en-IN')}</strong><small>NCC / NSS</small></article>
          <article><span>🏛️</span><strong>{stats.officer_employee_participants.toLocaleString('en-IN')}</strong><small>Employees</small></article>
        </section>

        <section className="dashboardPanel mapPanel">
          <div className="panelHeading"><div><h2>Maharashtra — registrations by district</h2><p>Hover a district for live registrations and check-ins. Colour indicates relative participation.</p></div></div>
          <MaharashtraDistrictMap districts={stats.districts} />
        </section>

        <section className="twoPanelGrid" id="categories">
          <article className="dashboardPanel rankingPanel">
            <h3>District-wise registrations (Top 5)</h3>
            <div className="rankList">
              {topFive.map((district, index) => {
                const max = Math.max(1, Number(topFive[0]?.count ?? 1))
                return (
                  <div className="rankItem" key={district.code}>
                    <div><span>{index + 1}. {district.name}</span><strong>{Number(district.count).toLocaleString('en-IN')}</strong></div>
                    <div className="rankTrack"><span style={{ width: `${Math.max(3, (Number(district.count) / max) * 100)}%` }} /></div>
                  </div>
                )
              })}
            </div>
          </article>

          <article className="dashboardPanel categoryPanel">
            <h3>Category-wise participation</h3>
            <div className="categoryLayout">
              <div className="donut" style={{ '--student': `${pct(stats.student_participants, total)}%`, '--citizen': `${pct(stats.student_participants + stats.citizen_participants, total)}%`, '--employee': `${pct(stats.student_participants + stats.citizen_participants + stats.officer_employee_participants, total)}%`, '--ncc': `${pct(stats.student_participants + stats.citizen_participants + stats.officer_employee_participants + stats.ncc_nss_participants, total)}%` } as CSSProperties}><span><small>Total</small>{total.toLocaleString('en-IN')}</span></div>
              <div className="categoryLegend">
                {categorySegments.map((segment) => <div key={segment.label}><i className={segment.token} /><span>{segment.label}</span><strong>{segment.value.toLocaleString('en-IN')} · {pct(segment.value, total)}%</strong></div>)}
              </div>
            </div>
          </article>
        </section>

        <section className="todayMetrics">
          <article><strong>{stats.registrations_today.toLocaleString('en-IN')}</strong><span>Registrations today</span></article>
          <article><strong>{stats.checked_in.toLocaleString('en-IN')}</strong><span>Total live check-ins</span></article>
          <article><strong>{stats.certificates_generated.toLocaleString('en-IN')}</strong><span>E-certificates</span></article>
        </section>

        <section className="dashboardPanel" id="districts">
          <div className="panelHeading"><div><h2>All districts</h2><p>State-level totals from the central Supabase database.</p></div><span>36 Districts</span></div>
          <div className="tableWrap">
            <table className="districtTable">
              <thead><tr><th>#</th><th>District</th><th>Registrations</th><th>Total check-ins</th><th>Check-in rate</th><th>Participation</th></tr></thead>
              <tbody>{ranked.map((district, index) => <tr key={district.code}><td>{index + 1}</td><td>{district.name}</td><td><strong>{Number(district.count).toLocaleString('en-IN')}</strong></td><td>{Number(district.checkins).toLocaleString('en-IN')}</td><td>{pct(Number(district.checkins), Number(district.count))}%</td><td><div className="tinyTrack"><span style={{ width: `${total > 0 ? Math.max(0, (Number(district.count) / Math.max(1, ranked[0]?.count ?? 1)) * 100) : 0}%` }} /></div></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
