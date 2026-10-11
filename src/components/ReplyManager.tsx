'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { addReply, deleteReply, setRepliesOpen, updateReply } from '@/app/app/events/actions'
import { groupText, plural } from '@/lib/invite'
import { totals, type HostReply } from '@/lib/host'
import { CheckIcon, CrossIcon } from './Icons'
import { emptyReply, ReplyFields, type ReplyDraft } from './ReplyFields'
import { useStatus } from './Status'

type Filter = 'all' | 'yes' | 'no'
const ago = (iso: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(iso))

export function ReplyManager({ slug, replies, open }: { slug: string; replies: HostReply[]; open: boolean }) {
  const router = useRouter()
  const [status, show] = useStatus()
  const [filter, setFilter] = useState<Filter>('all')
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [draft, setDraft] = useState<ReplyDraft>(emptyReply)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, start] = useTransition()
  const t = totals(replies)
  const shown = replies.filter((r) => filter === 'all' || (filter === 'yes' ? r.attending : !r.attending))

  function beginEdit(r?: HostReply) {
    setErrors({})
    setConfirming(null)
    setDraft(r ? { name: r.name, attending: r.attending, children: r.children, adults: r.adults, note: r.note ?? '' } : emptyReply)
    setEditing(r ? r.id : 'new')
    requestAnimationFrame(() => document.getElementById(`r-${r ? r.id : 'new'}-name`)?.focus())
  }

  function save(id: string | 'new') {
    start(async () => {
      const input = draft
      const res = id === 'new' ? await addReply(slug, input) : await updateReply(slug, id, input)
      if (res.errors) {
        setErrors(res.errors)
        document.getElementById(`r-${id}-${res.errors.name ? 'name' : 'children'}`)?.focus()
        return
      }
      if (res.error) return show(res.error, true)
      setEditing(null)
      show(id === 'new' ? 'Reply added' : 'Reply updated')
      router.refresh()
    })
  }

  function remove(r: HostReply) {
    start(async () => {
      const res = await deleteReply(slug, r.id)
      if (res.error) return show(res.error, true)
      setConfirming(null)
      show(`Deleted ${r.name}’s reply`)
      router.refresh()
      document.getElementById('replies-h')?.focus()
    })
  }

  const form = (id: string | 'new', title: string) => (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); save(id) }} noValidate>
      <h3 style={{ margin: 0, fontWeight: 900 }}>{title}</h3>
      <ReplyFields idPrefix={`r-${id}`} value={draft} onChange={setDraft} errors={errors} nameHint="As the guest would like it to appear." />
      <div className="btns">
        <button className="btn primary small" type="submit" disabled={pending}>{pending ? 'Saving…' : id === 'new' ? 'Add reply' : 'Save'}</button>
        <button className="btn small" type="button" onClick={() => setEditing(null)}>Cancel</button>
      </div>
    </form>
  )

  return (
    <>
      {status}
      <div className="stats">
        <div className="stat hl"><b>{t.kids}</b><span>children coming</span></div>
        <div className="stat hl"><b>{t.adults}</b><span>adults coming</span></div>
        <div className="stat"><b>{t.people}</b><span>total people</span></div>
        <div className="stat"><b>{t.yes}</b><span>said yes</span></div>
        <div className="stat"><b>{t.no}</b><span>said no</span></div>
        <div className="stat"><b>{t.replies}</b><span>replies</span></div>
      </div>

      <div className="btns" style={{ margin: '14px 0' }}>
        <span className="tag" style={{ background: open ? 'var(--go-soft)' : 'var(--pow-soft)' }}>{open ? 'Replies open' : 'Replies closed'}</span>
        <button className="linkbtn" type="button" disabled={pending} onClick={() => start(async () => {
          const res = await setRepliesOpen(slug, !open)
          if (res.error) return show(res.error, true)
          show(open ? 'Replies closed. Guests can still see the invite.' : 'Replies are open again.')
          router.refresh()
        })}>{open ? 'Close replies' : 'Reopen replies'}</button>
      </div>

      <h2 className="section" id="replies-h" tabIndex={-1}>Replies</h2>
      <fieldset className="choice" style={{ border: 0, padding: 0, margin: '0 0 14px' }}>
        <legend className="sr-only">Show replies</legend>
        {([['all', 'All'], ['yes', 'Coming'], ['no', 'Not coming']] as const).map(([v, l]) => (
          <label key={v} style={{ minWidth: 0, justifyContent: 'center' }}>
            <input type="radio" name="filter" value={v} checked={filter === v} onChange={() => setFilter(v)} /> {l}
          </label>
        ))}
      </fieldset>

      {editing === 'new'
        ? <div className="card" style={{ marginBottom: 12, background: 'var(--sun-soft)' }}>{form('new', 'Add a reply')}</div>
        : <button className="btn sun block" type="button" style={{ marginBottom: 12 }} onClick={() => beginEdit()}>+ Add a reply someone told you</button>}

      {shown.length ? (
        <ul className="list">
          {shown.map((r) => (
            <li className="reply" key={r.id} style={editing === r.id ? { background: 'var(--sun-soft)' } : undefined}>
              {editing === r.id ? form(r.id, `Edit ${r.name}’s reply`) : (
                <>
                  <div className="top">
                    <span style={{ fontWeight: 900 }}>{r.name}</span>
                    {r.attending ? <span className="tag yes"><CheckIcon /> Coming</span> : <span className="tag no"><CrossIcon /> Can’t come</span>}
                  </div>
                  {r.attending && <p style={{ fontWeight: 800 }}>{groupText(r.children, r.adults)}</p>}
                  {r.note && <p className="muted">“{r.note}”</p>}
                  <p className="hint">{r.last_edited_by === 'host' ? 'Edited by you' : 'Replied'} {ago(r.updated_at)}</p>
                  {confirming === r.id ? (
                    <div className="confirm" role="group" aria-label="Confirm delete">
                      <span>Delete {r.name}’s reply? This can’t be undone.</span>
                      <div className="btns">
                        <button className="btn primary small" type="button" disabled={pending} onClick={() => remove(r)}>Delete</button>
                        <button className="btn small" type="button" autoFocus onClick={() => setConfirming(null)}>Keep</button>
                      </div>
                    </div>
                  ) : (
                    <div className="btns">
                      <button className="btn small" type="button" onClick={() => beginEdit(r)}>Edit<span className="sr-only"> {r.name}</span></button>
                      <button className="linkbtn danger" type="button" onClick={() => setConfirming(r.id)}>Delete<span className="sr-only"> {r.name}</span></button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="card">{replies.length ? 'No replies match this filter.' : 'No replies yet. Share the link to get the first one.'}</p>
      )}
      <p className="sr-only" aria-live="polite">{plural(shown.length, 'reply', 'replies')} shown</p>
    </>
  )
}
