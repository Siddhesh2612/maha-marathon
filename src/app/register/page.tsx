'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GovernmentHeader } from '@/components/layout/GovernmentHeader'
import { LandscapeHero } from '@/components/layout/LandscapeHero'
import { Footer } from '@/components/layout/Footer'

type District = { code: string; name: string; name_mr: string | null }
type RegistrationResult = { registration_id: string; bib_number: string }

export default function RegisterPage() {
  const supabase = useMemo(() => createClient(), [])
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
  }, [supabase])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)

    setLoading(true)
    setError(null)
    setBib(null)

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

    const { data, error: rpcError } = await supabase.rpc('register_participant', payload)
    setLoading(false)

    if (rpcError) {
      setError(
        rpcError.message.toLowerCase().includes('duplicate')
          ? 'This mobile number is already registered.'
          : rpcError.message
      )
      return
    }

    const result = (data?.[0] ?? null) as RegistrationResult | null
    if (!result) {
      setError('Registration completed but no Bib number was returned.')
      return
    }

    setBib(result.bib_number)
    formElement.reset()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="sitePage">
      <GovernmentHeader portal="register" />
      <LandscapeHero
        eyebrow="SOIL AND WATER CONSERVATION DEPARTMENT"
        title="MAHA MARATHON"
        subtitle="Save Water • Save Soil • Secure Tomorrow"
        rightSlot={<span className="dateBadge">21 August 2026</span>}
      />

      <main className="pageBody registrationBody">
        {bib ? (
          <section className="registrationSuccess">
            <div className="successSeal">✓</div>
            <p className="sectionKicker">Registration successful</p>
            <h2>Welcome to MAHA Marathon</h2>
            <p className="mutedText">Your unique Bib / Registration ID is</p>
            <div className="bibNumber">{bib}</div>
            <p className="mutedText">Save this number. It will be used for event-day check-in and certificate eligibility.</p>
            <button className="primaryButton" onClick={() => setBib(null)}>Register another participant</button>
          </section>
        ) : (
          <>
            <section className="noticeCard">
              <div className="noticeIcon">📣</div>
              <div>
                <div className="noticeBadges"><span>NOTICE</span><span>21 AUGUST 2026</span></div>
                <strong>MAHA Marathon — State-Level Registration</strong>
                <p>Use one mobile number only once. Select your own district so all 36 districts feed the same state dashboard.</p>
              </div>
            </section>

            <p className="registrationRule">One mobile number can be registered only once.</p>

            <section className="registrationCard">
              <form onSubmit={submit} className="registerForm">
                <label className="field full">Full name<input name="full_name" required minLength={2} maxLength={120} /></label>
                <label className="field full">Mobile number
                  <span className="fieldHelp">Enter a valid 10-digit mobile number. This will be used for event check-in.</span>
                  <input name="mobile" required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="98XXXXXXXX" />
                </label>
                <div className="twoCol">
                  <label className="field">Age<input name="age" required type="number" min={5} max={100} /></label>
                  <label className="field">Gender<select name="gender" required defaultValue=""><option value="" disabled>Select</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select></label>
                </div>
                <label className="field full">District<select name="district_code" required defaultValue=""><option value="" disabled>Select district</option>{districts.map((district) => <option key={district.code} value={district.code}>{district.name}{district.name_mr ? ` / ${district.name_mr}` : ''}</option>)}</select></label>
                <label className="field full">Taluka<input name="taluka" required /></label>
                <label className="field full">Village / City<input name="city_village" required maxLength={120} /></label>
                <label className="field full">Participant category<select name="category" required defaultValue=""><option value="" disabled>Select category</option><option>Student</option><option>Citizen</option><option>Officer/Employee</option><option>NCC</option><option>NSS</option><option>Other</option></select></label>
                <label className="consentRow"><input type="checkbox" required /> <span>I confirm that the information above is correct and I agree to the registration terms.</span></label>
                {error ? <div className="errorBox">{error}</div> : null}
                <button className="primaryButton full" disabled={loading} type="submit">{loading ? 'Registering…' : 'Complete registration'}</button>
              </form>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
