import Link from 'next/link'

export default function Home() {
  return (
    <main style={{maxWidth:760,margin:'60px auto',padding:20,fontFamily:'Arial'}}>
      <h1>MAHA Marathon Development Gateway</h1>
      <p>Use the production subdomains for the client-facing portals. These links remain useful on localhost.</p>
      <div style={{display:'grid',gap:10}}>
        <Link href="/register">Registration portal</Link>
        <Link href="/dashboard">Protected dashboard</Link>
        <Link href="/admin">Protected admin</Link>
        <Link href="/volunteer">Volunteer console</Link>
        <Link href="/login">Login</Link>
      </div>
    </main>
  )
}
