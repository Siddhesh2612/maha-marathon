import Link from 'next/link'

export default function AdminPage() {
  return (
    <main className="shell dashboardShell">
      <header className="dashboardHeader"><div><p className="eyebrow">Administration</p><h1>MAHA Marathon Admin</h1></div><Link className="button secondary" href="/dashboard">Dashboard</Link></header>
      <section className="statsGrid">
        <article className="statCard"><span>Participants</span><strong>Live DB</strong></article>
        <article className="statCard"><span>Volunteers</span><strong>Next</strong></article>
        <article className="statCard"><span>Check-ins</span><strong>Phase 2</strong></article>
        <article className="statCard"><span>Certificates</span><strong>Phase 2</strong></article>
      </section>
      <section className="panel">
        <h2>Volunteer access control — next coding milestone</h2>
        <p>The database already contains <code>profiles</code> and <code>volunteer_permissions</code>. The next step is Supabase Auth + admin-only volunteer invitation and district-scoped permissions.</p>
        <div className="mockTable">
          <div><strong>Rahul Patil</strong><span>Pune • Volunteer</span><span className="pill">Participant search</span><span className="pill">Check-in</span></div>
          <div><strong>Priya Deshmukh</strong><span>Nagpur • Volunteer</span><span className="pill">Participant search</span></div>
        </div>
      </section>
    </main>
  )
}
