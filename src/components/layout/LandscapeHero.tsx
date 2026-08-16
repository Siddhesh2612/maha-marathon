import type { ReactNode } from 'react'
type Props = {
  eyebrow: string
  title: string
  subtitle: string
  compact?: boolean
  rightSlot?: ReactNode
}

export function LandscapeHero({ eyebrow, title, subtitle, compact = false, rightSlot }: Props) {
  return (
    <section className={`landscapeHero ${compact ? 'compact' : ''}`}>
      <div className="landscapeContent">
        <div>
          <p className="heroEyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {rightSlot ? <div className="heroRight">{rightSlot}</div> : null}
      </div>
      <div className="landscapeStrip" aria-hidden="true">
        <span className="hill hillOne" />
        <span className="hill hillTwo" />
        <span className="tree treeOne" />
        <span className="tree treeTwo" />
        <span className="waterStrip" />
      </div>
    </section>
  )
}
