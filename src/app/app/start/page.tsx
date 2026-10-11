import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { DeviceReplyNote } from '@/components/ClaimReplies'
import { EmailForm } from '@/components/EmailForm'

export const metadata: Metadata = { title: 'Make your own invite' }

export default async function Start({ searchParams }: PageProps<'/app/start'>) {
  const sp = await searchParams
  const from = typeof sp.from === 'string' ? sp.from : undefined
  return (
    <>
      <Breadcrumbs items={[{ label: 'My invites', href: '/me' }, { label: 'Make your own invite' }]} />
      <main id="main" className="stack">
        <div>
          <h1>Make your own invite</h1>
          <p className="lede">Free, and ready in about 3 minutes. Hosting needs an account so only you can see your guests’ replies.</p>
        </div>
        <DeviceReplyNote />
        <EmailForm mode="sign-up" next="/app" from={from} />
        <p>Already have an account? <Link href="/app/sign-in">Sign in</Link></p>
      </main>
    </>
  )
}
