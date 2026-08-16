'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type DistrictStat = { code: string; name: string; count: number }
type Stats = {
  total_registrations: number
  youth_15_30: number
  female_participants: number
  student_participants: number
  ncc_nss_participants: number
  officer_employee_participants: number
  checked_in: number
  districts: DistrictStat[]
}

const empty: Stats = {
  total_registrations: 0, youth_15_30: 0, female_participants: 0,
  student_participants: 0, ncc_nss_participants: 0,
  officer_employee_participants: 0, checked_in: 0, districts: []
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>(empty)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const loadStats = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_dashboard_stats')
    if (!error && data) {
      setStats(data as Stats)
      setUpdatedAt(new Date())
    }
  }, [])

  useEffect(() => {
    loadStats()
    const id = window.setInterval(loadStats, 3000)
    return () => window.clearInterval(id)
  }, [loadStats])

  const cards = [
    ['Total registrations', stats.total_registrations],
    ['Youth age 15–30', stats.youth_15_30],
    ['Female participants', stats.female_participants],
    ['Student participants', stats.student_participants],
    ['NCC / NSS', stats.ncc_nss_participants],
    ['Officers / Employees', stats.officer_employee_participants],
    ['Checked in', stats.checked_in],
  ]

  return (
    <main className="shell dashboardShell">
      <header className="dashboardHeader">
        <div><p className="eyebrow">State-level live dashboard</p><h1>MAHA Marathon 2026</h1></div>
        <div className="headerActions"><Link className="button" href="/register">+ Registration</Link></div>
      </header>
      <p className="statusDot">● Auto-refresh every 3 seconds {updatedAt ? `• updated ${updatedAt.toLocaleTimeString()}` : ''}</p>
      <section className="statsGrid">{cards.map(([label, value]) => <article className="statCard" key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}</section>
      <section className="panel tablePanel">
        <h2>District-wise registrations</h2>
        <div className="tableWrap"><table><thead><tr><th>District</th><th>Code</th><th>Registrations</th></tr></thead><tbody>{stats.districts.filter(d => Number(d.count) > 0).map(d => <tr key={d.code}><td>{d.name}</td><td>{d.code}</td><td>{d.count}</td></tr>)}</tbody></table></div>
      </section>
    </main>
  )
}
