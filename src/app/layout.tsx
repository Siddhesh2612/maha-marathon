import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MAHA Marathon 2026',
  description: 'State-level MAHA Marathon registration and dashboard demo',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
