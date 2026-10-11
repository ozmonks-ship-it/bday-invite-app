'use client'
import { useActionState } from 'react'
import { verifyCode, type AuthState } from '@/app/app/auth-actions'

export function CodeForm({ email, next, lead }: { email: string; next: string; lead: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(verifyCode, {})
  const err = state.errors?.code
  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="code">{lead ? '6-digit code' : 'Or type the 6-digit code'}</label>
        <input id="code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456"
          aria-invalid={err ? true : undefined} aria-describedby={err ? 'code-err' : undefined} />
        {err && <span className="err" id="code-err">{err}</span>}
      </div>
      <button className={`btn block${lead ? ' primary' : ''}`} type="submit" disabled={pending}>{pending ? 'Checking…' : 'Sign in with code'}</button>
    </form>
  )
}
