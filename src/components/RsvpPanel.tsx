'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getStoredReply, newToken, rememberInvite, setStoredReply, type StoredReply } from '@/lib/guest-store'
import { formatDate, groupText } from '@/lib/invite'
import type { Reply } from '@/lib/types'
import { fieldErrors, replySchema } from '@/lib/validation'
import { CheckIcon, CrossIcon } from './Icons'
import { emptyReply, ReplyFields, type ReplyDraft } from './ReplyFields'
import { useStatus } from './Status'

const ERRORS: Record<string, string> = {
  rsvps_closed: 'The host has closed replies for this party.',
  too_many_replies: 'This party has reached its reply limit. Message the host directly.',
  invite_not_found: 'This party has been cancelled or removed.',
}

type Shown = Pick<Reply, 'name' | 'attending' | 'children' | 'adults' | 'note'> & { claimed?: boolean }

export function RsvpPanel({ slug, signedIn, rsvpsOpen, rsvpBy }: { slug: string; signedIn: boolean; rsvpsOpen: boolean; rsvpBy: string | null }) {
  const [loaded, setLoaded] = useState(false)
  const [reply, setReply] = useState<Shown | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<ReplyDraft>(emptyReply)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [status, show] = useStatus()
  const savedRef = useRef<HTMLHeadingElement>(null)

  // Load this guest's reply: the server copy wins, so host edits show up
  useEffect(() => {
    let cancelled = false
    const stored = getStoredReply(slug)
    rememberInvite(slug)
    const supabase = createClient()
    const fetchServer = signedIn || stored?.token
      ? supabase.rpc('get_my_rsvp', { p_slug: slug, p_token: stored?.token ?? null })
      : Promise.resolve({ data: null, error: null })
    fetchServer.then(({ data, error }) => {
      if (cancelled) return
      const server = data as Reply | null
      if (server) setStoredReply(slug, { ...server, token: stored?.token })
      setReply(server ?? (error && stored?.name ? (stored as Shown) : null))
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [slug, signedIn])

  function startEditing() {
    setDraft(reply ? { name: reply.name, attending: reply.attending, children: reply.children, adults: reply.adults, note: reply.note ?? '' } : emptyReply)
    setErrors({})
    setEditing(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = replySchema.safeParse(draft)
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error)
      setErrors(errs)
      document.getElementById(errs.name ? 'g-name' : 'g-children')?.focus()
      return
    }
    setBusy(true)
    const stored: StoredReply | null = getStoredReply(slug)
    const token = signedIn ? stored?.token ?? null : stored?.token ?? newToken()
    const r = parsed.data
    const { data, error } = await createClient().rpc('submit_rsvp', {
      p_slug: slug, p_token: token, p_name: r.name, p_attending: r.attending,
      p_children: r.children, p_adults: r.adults, p_note: r.note,
    })
    setBusy(false)
    if (error) {
      const key = Object.keys(ERRORS).find((k) => error.message.includes(k))
      show(key ? ERRORS[key] : 'Your reply didn’t save. Check your connection and try again.', true)
      return
    }
    const saved = data as Reply
    setStoredReply(slug, { ...saved, token: signedIn ? undefined : token ?? undefined })
    const wasNew = !reply
    setReply(saved)
    setEditing(false)
    show(wasNew ? (saved.attending ? 'Reply sent. See you there!' : 'Reply sent. Thanks for letting them know.') : 'Reply updated. Thanks!')
    requestAnimationFrame(() => savedRef.current?.focus())
  }

  const showForm = rsvpsOpen && (editing || (loaded && !reply))
  const lockedToAccount = reply?.claimed && !signedIn

  return (
    <section aria-labelledby="rsvp-h" style={{ marginTop: 24 }}>
      {status}
      <h2 className="section" id="rsvp-h">Can you make it?</h2>
      {rsvpBy && <p className="lede">Please reply by {formatDate(rsvpBy).replace(/ \d{4}$/, '')}.</p>}
      {!loaded && <p className="muted">Checking for your reply…</p>}

      {loaded && reply && !showForm && (
        <div className={`saved${reply.attending ? '' : ' no'}`}>
          <h3 ref={savedRef} tabIndex={-1} style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>
            {reply.attending ? <><CheckIcon /> You replied: coming with {groupText(reply.children, reply.adults)}</> : <><CrossIcon /> You replied: can’t come</>}
          </h3>
          <p style={{ fontWeight: 600 }}>As “{reply.name}”{reply.note ? ` · “${reply.note}”` : ''}</p>
          <p className="hint">
            {lockedToAccount ? 'This reply is saved to an account.' : reply.claimed || signedIn ? 'Saved to your account. Change it from any device where you’re signed in.' : 'Saved on this device. Open this link again any time to change it.'}
          </p>
          {rsvpsOpen && (lockedToAccount
            ? <p><Link className="btn sun small" href={`/app/sign-in?next=${encodeURIComponent(`/i/${slug}`)}`}>Sign in to change it</Link></p>
            : <div><button className="btn sun small" type="button" onClick={startEditing}>Change my reply</button></div>)}
        </div>
      )}

      {loaded && !rsvpsOpen && !reply && <p className="note"><span>The host has closed replies. Message them directly if your plans change.</span></p>}

      {showForm && (
        <form className="stack" onSubmit={submit} noValidate>
          <ReplyFields idPrefix="g" value={draft} onChange={setDraft} errors={errors} />
          {!signedIn && <p className="hint" style={{ margin: 0 }}>Only the host sees your reply.</p>}
          <div className="btns">
            <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Saving…' : reply ? 'Update my reply' : 'Send my reply'}</button>
            {reply && <button className="btn" type="button" onClick={() => setEditing(false)}>Cancel</button>}
          </div>
        </form>
      )}

      {loaded && reply && !editing && !signedIn && (
        <div className="card flywheel" style={{ marginTop: 16 }}>
          <h3>Planning a party too?</h3>
          <p>Make an invite like this in about 3 minutes, share one link and watch the replies come in. It’s free.</p>
          <div className="btns">
            <Link className="btn primary" href={`/app/start?from=${slug}`}>Make my own invite</Link>
          </div>
          {!reply.claimed && <p className="hint">Creating an account also keeps your reply safe if this browser’s data is cleared.</p>}
        </div>
      )}
    </section>
  )
}
