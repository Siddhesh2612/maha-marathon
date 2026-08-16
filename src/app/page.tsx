import Link from 'next/link'

export default function Home() {
  return (
    <main className="shell">
      <section className="hero panel">
        <p className="eyebrow">Government demo • 21 August 2026</p>
        <h1>MAHA Marathon</h1>
        <p className="lead">Save Water • Save Soil</p>
        <p>This starter connects registration and dashboard to the same Supabase database.</p>
        <div className="actions">
          <Link className="button" href="/register">Open Registration</Link>
          <Link className="button secondary" href="/dashboard">Open Dashboard</Link>
          <Link className="button secondary" href="/admin">Open Admin</Link>
        </div>
      </section>
    </main>
  )
}
