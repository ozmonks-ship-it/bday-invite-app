import type { Metadata } from 'next'
import { confirmLink } from '@/app/app/auth-actions'
import { safeNext } from '@/lib/next-path'

export const metadata: Metadata = { title: 'Finish signing in' }

export default async function Confirm({ searchParams }: PageProps<'/app/auth/confirm'>) {
  const sp = await searchParams
  const tokenHash = typeof sp.token_hash === 'string' ? sp.token_hash : ''
  return (
    <main id="main" className="stack">
      <h1>One more tap</h1>
      <p className="lede">Press the button to finish signing in to Party Pop.</p>
      <form action={confirmLink}>
        <input type="hidden" name="token_hash" value={tokenHash} />
        <input type="hidden" name="next" value={safeNext(sp.next)} />
        <button className="btn primary block" type="submit">Sign in</button>
      </form>
    </main>
  )
}
