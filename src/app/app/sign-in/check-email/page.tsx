import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { CodeForm } from '@/components/CodeForm'
import { StandaloneHint } from '@/components/StandaloneHint'
import { safeNext } from '@/lib/next-path'

export const metadata: Metadata = { title: 'Check your email' }

export default async function CheckEmail({ searchParams }: PageProps<'/app/sign-in/check-email'>) {
  const sp = await searchParams
  const email = typeof sp.email === 'string' ? sp.email : ''
  const next = safeNext(sp.next)
  return (
    <>
      <Breadcrumbs items={[{ label: 'Sign in', href: '/app/sign-in' }, { label: 'Check your email' }]} />
      <main id="main" className="stack">
        <div>
          <h1>Check your email</h1>
          <p className="lede">We sent a sign-in link and a 6-digit code to <b>{email || 'your inbox'}</b>. They expire in 1 hour.</p>
        </div>
        <StandaloneHint />
        <CodeForm email={email} next={next} lead />
        <p><Link href="/app/sign-in">Use a different email</Link> or <Link href={`/app/sign-in?next=${encodeURIComponent(next)}`}>send a new link</Link>.</p>
      </main>
    </>
  )
}
