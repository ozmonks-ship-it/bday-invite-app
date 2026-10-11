import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { EmailForm } from '@/components/EmailForm'
import { safeNext } from '@/lib/next-path'

export const metadata: Metadata = { title: 'Sign in' }

export default async function SignIn({ searchParams }: PageProps<'/app/sign-in'>) {
  const sp = await searchParams
  const next = safeNext(sp.next)
  return (
    <>
      <Breadcrumbs items={[{ label: 'Sign in' }]} />
      <main id="main" className="stack">
        <div>
          <h1>Welcome back</h1>
          <p className="lede">Sign in to see your parties and the invites you’ve received.</p>
        </div>
        {sp.error === 'link' && <p className="err" role="alert">That sign-in link has expired or was already used. Send a new one below.</p>}
        <EmailForm mode="sign-in" next={next} />
        <div className="card" style={{ background: 'var(--sun-soft)' }}>
          <h2>Just got an invite?</h2>
          <p className="muted" style={{ margin: 0 }}>You don’t need to sign in to reply. Open the link from your chat.</p>
        </div>
        <p>New to Party Pop? <Link href="/app/start">Create a free account</Link></p>
      </main>
    </>
  )
}
