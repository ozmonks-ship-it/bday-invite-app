import type { Metadata } from 'next'
import { AppBar } from '@/components/AppBar'
import { getUser } from '@/lib/supabase/server'
import { signOut } from './auth-actions'

export const metadata: Metadata = {
  manifest: '/app/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Party Pop', statusBarStyle: 'default' },
  icons: { apple: '/app/icon/180' },
  robots: { index: false },
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getUser()
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <AppBar
        home={user ? '/app' : '/'}
        right={user ? <form action={signOut}><button className="badge" type="submit" style={{ cursor: 'pointer', font: 'inherit', fontWeight: 800 }}>Sign out</button></form> : null}
      />
      {children}
    </>
  )
}
