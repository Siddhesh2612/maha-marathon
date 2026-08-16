'use client'

import { FormEvent, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GovernmentHeader } from '@/components/layout/GovernmentHeader'
import { LandscapeHero } from '@/components/layout/LandscapeHero'
import { Footer } from '@/components/layout/Footer'

function destinationFor(host: string, role: string, canViewDashboard: boolean) {
  if (host.startsWith('dashboard.')) {
    return canViewDashboard || role === 'admin' ? '/' : 'https://admin.mahamarathon.co.in/volunteer'
  }
  if (host.startsWith('admin.')) {
    return role === 'admin' ? '/' : '/volunteer'
  }
  if (role === 'admin') return '/admin'
  if (canViewDashboard) return '/dashboard'
  return '/volunteer'
}

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !data.user) {
      setLoading(false)
      setError(authError?.message ?? 'Unable to sign in.')
      return
    }

    const [{ data: profile }, { data: permissions }] = await Promise.all([
      supabase
        .from('profiles')
        .select('role,active')
        .eq('user_id', data.user.id)
        .maybeSingle(),
      supabase
        .from('volunteer_permissions')
        .select('can_view_dashboard')
        .eq('user_id', data.user.id)
        .maybeSingle(),
    ])

    if (!profile || profile.active !== true) {
      await supabase.auth.signOut()
      setLoading(false)
      setError('Your account is not active. Contact the system administrator.')
      return
    }

    const destination = destinationFor(
      window.location.hostname,
      profile.role,
      permissions?.can_view_dashboard === true
    )

    window.location.assign(destination)
  }

  return (
    <div className="sitePage">
      <GovernmentHeader portal="register" />
      <LandscapeHero
        compact
        eyebrow="OFFICER ACCESS"
        title="Secure Portal Login"
        subtitle="Dashboard, administration and volunteer access are restricted to authorised users."
      />
      <main className="pageBody loginBody">
        <section className="loginCard">
          <div className="loginIcon">🔐</div>
          <p className="sectionKicker">MAHA Marathon 2026</p>
          <h2>Officer / Volunteer Login</h2>
          <p className="mutedText">Use the credentials issued by the state administrator.</p>
          <form onSubmit={submit} className="stackForm">
            <label className="field">Email address<input name="email" type="email" autoComplete="username" required /></label>
            <label className="field">Password<input name="password" type="password" autoComplete="current-password" required /></label>
            {error ? <div className="errorBox">{error}</div> : null}
            <button className="primaryButton" disabled={loading} type="submit">
              {loading ? 'Signing in…' : 'Secure Login'}
            </button>
          </form>
          <p className="loginNote">Public participant registration does not require login.</p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
