'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { sendLink, type AuthState } from '@/app/app/auth-actions'

export function EmailForm({ mode, next, from }: { mode: 'sign-in' | 'sign-up'; next: string; from?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(sendLink, {})
  const e = state.errors ?? {}
  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="next" value={next} />
      {from && <input type="hidden" name="from" value={from} />}
      <div className="field">
        <label htmlFor="email">Your email</label>
        <input id="email" name="email" type="email" autoComplete="email" defaultValue={state.email} required
          aria-invalid={e.email ? true : undefined} aria-describedby={e.email ? 'email-err' : 'email-hint'} />
        {e.email
          ? <span className="err" id="email-err">{e.email}{state.noAccount && <> <Link href="/app/start">Create a free account</Link></>}</span>
          : <span className="hint" id="email-hint">We’ll email you a sign-in link and a 6-digit code. No password needed.</span>}
      </div>
      {mode === 'sign-up' && (
        <div className="field">
          <label className="check"><input type="checkbox" name="terms" id="terms" aria-invalid={e.terms ? true : undefined} aria-describedby={e.terms ? 'terms-err' : undefined} />
            <span>I agree to the terms of use and the privacy notice</span></label>
          {e.terms && <span className="err" id="terms-err">{e.terms}</span>}
        </div>
      )}
      {state.error && <p className="err" role="alert">{state.error}</p>}
      <button className="btn primary block" type="submit" disabled={pending}>
        {pending ? 'Sending…' : mode === 'sign-up' ? 'Create my free account' : 'Email me a sign-in link'}
      </button>
    </form>
  )
}
