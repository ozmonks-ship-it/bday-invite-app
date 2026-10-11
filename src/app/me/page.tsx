import type { Metadata } from 'next'
import Link from 'next/link'
import { AppBar } from '@/components/AppBar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { MyInvitesList } from '@/components/MyInvitesList'

export const metadata: Metadata = { title: 'My invites', robots: { index: false } }

export default function MyInvites() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <AppBar right={<Link className="badge" href="/app/sign-in">Sign in</Link>} />
      <Breadcrumbs items={[{ label: 'My invites' }]} />
      <main id="main" className="stack">
        <div>
          <h1>My invites</h1>
          <p className="lede">Party invites you’ve opened on this device.</p>
        </div>
        <MyInvitesList />
        <div className="note"><p>Only invites sent to you appear here. Party details disappear 60 days after each party.</p></div>
        <div className="card flywheel">
          <h2>Throw a party of your own</h2>
          <p>Make an invite like this in about 3 minutes, share one link and watch the replies come in. It’s free.</p>
          <div><Link className="btn primary" href="/app/start">Make my own invite</Link></div>
        </div>
        <p>Already have an account? <Link href="/app/sign-in">Sign in</Link></p>
      </main>
    </>
  )
}
