'use server'
import { redirect } from 'next/navigation'
import { siteUrl } from '@/lib/env'
import { safeNext } from '@/lib/next-path'
import { createClient } from '@/lib/supabase/server'
import { emailSchema } from '@/lib/validation'

export type AuthState = { email?: string; errors?: Record<string, string>; error?: string; noAccount?: boolean }

export async function sendLink(_prev: AuthState, form: FormData): Promise<AuthState> {
  const signUp = form.get('mode') === 'sign-up'
  const raw = String(form.get('email') ?? '')
  const parsed = emailSchema.safeParse(raw)
  if (!parsed.success) return { email: raw, errors: { email: raw.trim() ? parsed.error.issues[0].message : 'Enter your email address.' } }
  if (signUp && form.get('terms') !== 'on') return { email: raw, errors: { terms: 'Tick the box to agree before creating your account.' } }

  const email = parsed.data
  const next = safeNext(form.get('next'))
  const from = String(form.get('from') ?? '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: signUp,
      emailRedirectTo: `${siteUrl()}/app/auth/confirm?next=${encodeURIComponent(next)}`,
      data: signUp ? { terms_accepted_at: new Date().toISOString(), signup_source: from ? `invite:${from}` : 'direct' } : undefined,
    },
  })
  if (error) {
    if (!signUp && (error.code === 'otp_disabled' || /signups? not allowed/i.test(error.message))) {
      return { email: raw, noAccount: true, errors: { email: 'There’s no account for this email yet.' } }
    }
    if (error.status === 429) return { email: raw, error: 'Too many emails sent. Wait a minute, then try again.' }
    return { email: raw, error: 'We couldn’t send the email. Try again in a moment.' }
  }
  redirect(`/app/sign-in/check-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`)
}

export async function verifyCode(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get('email') ?? '')
  const token = String(form.get('code') ?? '').replace(/\s/g, '')
  if (!/^\d{6}$/.test(token)) return { errors: { code: 'Enter the 6 digits from the email.' } }
  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (error) return { errors: { code: 'That code didn’t work. Check the latest email, or send a new one.' } }
  redirect(safeNext(form.get('next')))
}

/** Completes a magic link. Runs on a button press, not on page load, so email scanners can't use up the link. */
export async function confirmLink(form: FormData) {
  const tokenHash = String(form.get('token_hash') ?? '')
  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' })
  if (error) redirect('/app/sign-in?error=link')
  redirect(safeNext(form.get('next')))
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
