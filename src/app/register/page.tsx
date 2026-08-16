'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type District = { code: string; name: string; name_mr: string | null }

type RegistrationResult = { registration_id: string; bib_number: string }

export default function RegisterPage() {
  const [districts, setDistricts] = useState<District[]>([])
  const [loading, setLoading] = useState(false)
  const [bib, setBib] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('districts')
      .select('code,name,name_mr')
      .order('name')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setDistricts((data ?? []) as District[])
      })
  }, [])

async function submit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault()

  const formElement = e.currentTarget

  setLoading(true)
  setError(null)
  setBib(null)

  const form = new FormData(formElement)

  const payload = {
    p_full_name: String(form.get('full_name') ?? '').trim(),
    p_mobile: String(form.get('mobile') ?? '').trim(),
    p_age: Number(form.get('age')),
    p_gender: String(form.get('gender') ?? ''),
    p_district_code: String(form.get('district_code') ?? ''),
    p_taluka: String(form.get('taluka') ?? '').trim(),
    p_city_village: String(form.get('city_village') ?? '').trim(),
    p_category: String(form.get('category') ?? ''),
  }

  const { data, error } = await supabase.rpc(
    'register_participant',
    payload
  )

  setLoading(false)

  if (error) {
    if (error.message.toLowerCase().includes('duplicate')) {
      setError('This mobile number is already registered.')
    } else {
      setError(error.message)
    }
    return
  }

  const result = (data?.[0] ?? null) as RegistrationResult | null

  if (!result) {
    setError('Registration completed but no Bib number was returned.')
    return
  }

  setBib(result.bib_number)
  formElement.reset()
}  


  return (
    <main className="shell narrow">
      <section className="panel">
        <p className="eyebrow">State-level registration</p>
        <h1>MAHA Marathon</h1>
        <p className="lead">Save Water • Save Soil</p>

        <form onSubmit={submit} className="formGrid">
          <label className="field full">Full name<input name="full_name" required minLength={2} maxLength={120} /></label>
          <label className="field">Mobile number<input name="mobile" required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="10-digit mobile" /></label>
          <label className="field">Age<input name="age" required type="number" min={5} max={100} /></label>
          <label className="field">Gender<select name="gender" required defaultValue=""><option value="" disabled>Select</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select></label>
          <label className="field">District<select name="district_code" required defaultValue=""><option value="" disabled>Select district</option>{districts.map(d => <option key={d.code} value={d.code}>{d.name}{d.name_mr ? ` / ${d.name_mr}` : ''}</option>)}</select></label>
          <label className="field">Taluka<input name="taluka" required /></label>
          <label className="field">City / Village<input name="city_village" required /></label>
          <label className="field full">Participant category<select name="category" required defaultValue=""><option value="" disabled>Select category</option><option>Student</option><option>Citizen</option><option>Officer/Employee</option><option>NCC</option><option>NSS</option><option>Other</option></select></label>
          {error && <div className="error full">{error}</div>}
          <button disabled={loading} className="button full" type="submit">{loading ? 'Registering…' : 'Register Now'}</button>
        </form>
        <p className="finePrint">Demo note: OTP verification is intentionally deferred to the production phase.</p>
      </section>
    </main>
  )
}
