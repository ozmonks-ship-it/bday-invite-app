'use client'
/* eslint-disable @next/next/no-img-element -- local previews and already-resized uploads */
import { useActionState, useEffect, useRef, useState } from 'react'
import { saveEvent, type SaveState } from '@/app/app/events/actions'
import { kidSvgDataUri } from '@/lib/art'
import { resizePhoto } from '@/lib/image'
import { MAX_CHILDREN, photoUrl } from '@/lib/invite'
import { createClient } from '@/lib/supabase/client'

type Kid = { name: string; age: string; photo_path: string | null; photo_alt: string; preview?: string; uploading?: boolean; error?: string }
export type EventDraft = {
  party_date: string; start_time: string; end_time: string; venue_name: string; venue_address: string; venue_maps_url: string
  parking_notes: string; parking_location: string; directions: string; message: string; rsvp_by: string
}
export const blankEvent: EventDraft = {
  party_date: '', start_time: '', end_time: '', venue_name: '', venue_address: '', venue_maps_url: '',
  parking_notes: '', parking_location: '', directions: '', message: '', rsvp_by: '',
}
const newKid = (): Kid => ({ name: '', age: '', photo_path: null, photo_alt: '' })

export function EventForm({ userId, slug, initialEvent = blankEvent, initialKids }: {
  userId: string; slug?: string; initialEvent?: EventDraft; initialKids?: Kid[]
}) {
  const [event, setEvent] = useState(initialEvent)
  const [kids, setKids] = useState<Kid[]>(initialKids?.length ? initialKids : [newKid()])
  const [state, action, pending] = useActionState<SaveState, FormData>(saveEvent, {})
  const addRef = useRef<HTMLButtonElement>(null)
  const errors = state.errors ?? {}
  const uploading = kids.some((k) => k.uploading)

  // Move focus to the first problem after a failed save
  useEffect(() => {
    const first = Object.keys(state.errors ?? {})[0]
    if (first) document.getElementById('f-' + first.replace(/\./g, '-'))?.focus()
  }, [state])

  const setKid = (i: number, patch: Partial<Kid>) => setKids((ks) => ks.map((k, j) => (j === i ? { ...k, ...patch } : k)))

  async function pickPhoto(i: number, file: File | undefined) {
    if (!file) return
    setKid(i, { uploading: true, error: undefined })
    try {
      const blob = await resizePhoto(file)
      const path = `${userId}/${crypto.randomUUID()}.jpg`
      const { error } = await createClient().storage.from('invite-photos').upload(path, blob, { contentType: 'image/jpeg' })
      if (error) throw new Error('The photo didn’t upload. Check your connection and try again.')
      setKid(i, { photo_path: path, preview: URL.createObjectURL(blob), uploading: false })
    } catch (e) {
      setKid(i, { uploading: false, error: (e as Error).message })
    }
  }

  const payload = JSON.stringify({
    ...event,
    children: kids.map((k) => ({ name: k.name, age: k.age, photo_path: k.photo_path, photo_alt: k.photo_alt || (k.name ? `Photo of ${k.name}` : '') })),
  })

  const field = (key: keyof EventDraft, label: string, type = 'text', extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="field">
      <label htmlFor={`f-${key}`}>{label}</label>
      <input id={`f-${key}`} type={type} value={event[key]} onChange={(e) => setEvent({ ...event, [key]: e.target.value })}
        aria-invalid={errors[key] ? true : undefined} aria-describedby={errors[key] ? `f-${key}-err` : undefined} {...extra} />
      {errors[key] && <span className="err" id={`f-${key}-err`}>{errors[key]}</span>}
    </div>
  )
  const area = (key: keyof EventDraft, label: string, max: number) => (
    <div className="field">
      <label htmlFor={`f-${key}`}>{label}</label>
      <textarea id={`f-${key}`} maxLength={max} value={event[key]} onChange={(e) => setEvent({ ...event, [key]: e.target.value })} />
    </div>
  )

  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="payload" value={payload} />
      {slug && <input type="hidden" name="slug" value={slug} />}

      {kids.map((k, i) => {
        const who = k.name || `birthday star ${i + 1}`
        const src = k.preview ?? photoUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', k.photo_path) ?? kidSvgDataUri(i)
        const err = (f: string) => errors[`children.${i}.${f}`]
        return (
          <fieldset className="kid" key={i}>
            <legend>{kids.length > 1 ? `Birthday star ${i + 1}` : 'Birthday star'}</legend>
            <div className="photo-pick">
              <div className="thumb"><img src={src} alt="" /></div>
              <div className="stack" style={{ gap: 6 }}>
                <span className="btn small sun filebtn">
                  {k.uploading ? 'Uploading…' : k.photo_path ? 'Change photo' : 'Choose photo'}
                  <input type="file" accept="image/*" aria-label={`Choose photo of ${who}`} disabled={k.uploading}
                    onChange={(e) => pickPhoto(i, e.target.files?.[0])} />
                </span>
                {k.error ? <span className="err" role="alert">{k.error}</span> : <span className="hint">Location data is removed before upload.</span>}
              </div>
            </div>
            <div className="row2">
              <div className="field">
                <label htmlFor={`f-children-${i}-name`}>Name</label>
                <input id={`f-children-${i}-name`} type="text" autoComplete="off" maxLength={60} value={k.name}
                  onChange={(e) => setKid(i, { name: e.target.value })}
                  aria-invalid={err('name') ? true : undefined} aria-describedby={err('name') ? `f-children-${i}-name-err` : undefined} />
                {err('name') && <span className="err" id={`f-children-${i}-name-err`}>{err('name')}</span>}
              </div>
              <div className="field">
                <label htmlFor={`f-children-${i}-age`}>Turning</label>
                <input id={`f-children-${i}-age`} type="number" inputMode="numeric" min={1} max={18} value={k.age}
                  onChange={(e) => setKid(i, { age: e.target.value })}
                  aria-invalid={err('age') ? true : undefined} aria-describedby={err('age') ? `f-children-${i}-age-err` : undefined} />
                {err('age') && <span className="err" id={`f-children-${i}-age-err`}>Enter an age from 1 to 18, or leave it blank.</span>}
              </div>
            </div>
            <div className="field">
              <label htmlFor={`f-children-${i}-alt`}>Photo description (for screen readers)</label>
              <input id={`f-children-${i}-alt`} type="text" maxLength={200} value={k.photo_alt} placeholder={k.name ? `Photo of ${k.name}` : ''}
                onChange={(e) => setKid(i, { photo_alt: e.target.value })} />
            </div>
            {kids.length > 1 && (
              <div><button className="btn small" type="button" onClick={() => { setKids(kids.filter((_, j) => j !== i)); addRef.current?.focus() }}>Remove {who}</button></div>
            )}
          </fieldset>
        )
      })}
      {kids.length < MAX_CHILDREN
        ? <button ref={addRef} className="btn sun" type="button" onClick={() => setKids([...kids, newKid()])}>+ Add a brother or sister</button>
        : <p className="hint">Up to {MAX_CHILDREN} children per invite.</p>}

      {field('party_date', 'Date', 'date', { required: true })}
      <div className="row2">
        {field('start_time', 'Starts', 'time', { required: true })}
        {field('end_time', 'Ends', 'time')}
      </div>
      {field('venue_name', 'Venue name', 'text', { required: true, maxLength: 120 })}
      {field('venue_address', 'Venue address', 'text', { required: true, maxLength: 200, autoComplete: 'street-address' })}
      {field('venue_maps_url', 'Google Maps link (optional)', 'url', { placeholder: 'https://maps.app.goo.gl/…' })}
      {area('parking_notes', 'Parking', 500)}
      {field('parking_location', 'Parking location (for the map link)', 'text', { maxLength: 200 })}
      {area('directions', 'How to get there', 500)}
      {area('message', 'Message to guests', 1000)}
      {field('rsvp_by', 'Please reply by', 'date')}

      {state.error && <p className="err" role="alert">{state.error}</p>}
      <div className="btns">
        <button className="btn primary" type="submit" disabled={pending || uploading}>
          {pending ? 'Saving…' : uploading ? 'Waiting for photo…' : slug ? 'Save invite' : 'Create invite'}
        </button>
      </div>
    </form>
  )
}
