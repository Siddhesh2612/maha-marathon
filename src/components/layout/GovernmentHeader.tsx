import Link from 'next/link'

type Props = {
  portal?: 'register' | 'dashboard' | 'admin' | 'volunteer'
  signedInName?: string
}

export function GovernmentHeader({ portal = 'register', signedInName }: Props) {
  const isSecure = portal !== 'register'

  return (
    <>
      <div className="tricolorBar"><span /><span /><span /></div>
      <header className="govHeader">
        <div className="govHeaderInner">
          <div className="emblemPlaceholder" aria-label="Government emblem placeholder">
            <span>भारत</span>
            <strong>MH</strong>
          </div>
          <div className="govTitle">
            <strong>Maharashtra Government</strong>
            <span>Soil and Water Conservation Department</span>
          </div>
          <div className="brandMark" aria-label="MAHA Marathon mark">
            <span className="dropMark">💧</span>
            <strong>MAHA</strong>
          </div>
          {isSecure && signedInName ? (
            <div className="accountBlock">
              <span>{signedInName}</span>
              <form action="/auth/signout" method="post">
                <button className="logoutButton" type="submit">Logout</button>
              </form>
            </div>
          ) : null}
        </div>
      </header>
      <nav className="portalNav">
        <div className="portalNavInner">
          {portal === 'register' ? (
            <>
              <Link href="/register">Home</Link>
              <Link className="active" href="/register">MAHA Marathon Registration</Link>
            </>
          ) : null}
          {portal === 'dashboard' ? (
            <>
              <Link className="active" href="/dashboard">Live Dashboard</Link>
              <Link href="/dashboard#districts">Districts</Link>
              <Link href="/dashboard#categories">Participation</Link>
            </>
          ) : null}
          {portal === 'admin' ? (
            <>
              <Link className="active" href="/admin">Admin Home</Link>
              <Link href="/admin#volunteers">Volunteers</Link>
              <Link href="/dashboard">State Dashboard</Link>
            </>
          ) : null}
          {portal === 'volunteer' ? (
            <>
              <Link className="active" href="/volunteer">Volunteer Console</Link>
              <Link href="/volunteer#permissions">My Access</Link>
            </>
          ) : null}
        </div>
      </nav>
    </>
  )
}
