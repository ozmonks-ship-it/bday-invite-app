'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { eventSchema, fieldErrors, replySchema, type ReplyFormInput, type ReplyInput } from '@/lib/validation'

export type SaveState = { errors?: Record<string, string>; error?: string }

/** Create (no slug) or update a party, with its children, in one database call. */
export async function saveEvent(_prev: SaveState, form: FormData): Promise<SaveState> {
  const { supabase, user } = await getUser()
  if (!user) redirect('/app/sign-in')

  let payload: unknown
  try {
    payload = JSON.parse(String(form.get('payload') ?? ''))
  } catch {
    return { error: 'Something went wrong reading the form. Reload the page and try again.' }
  }
  const parsed = eventSchema.safeParse(payload)
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  const { children, ...event } = parsed.data
  if (children.some((c) => c.photo_path && !c.photo_path.startsWith(`${user.id}/`))) {
    return { error: 'One of the photos didn’t upload properly. Choose it again.' }
  }

  const slug = String(form.get('slug') ?? '') || null
  let eventId: string | null = null
  let oldPhotos: string[] = []
  if (slug) {
    const { data } = await supabase.from('events').select('id, event_children(photo_path)').eq('slug', slug).maybeSingle()
    if (!data) return { error: 'This party no longer exists.' }
    eventId = data.id
    oldPhotos = data.event_children.map((c: { photo_path: string | null }) => c.photo_path).filter((p): p is string => !!p)
  }

  const { data, error } = await supabase.rpc('save_event', { p_event_id: eventId, p_event: event, p_children: children })
  if (error) return { error: 'Your invite didn’t save. Check your connection and try again.' }
  const saved = data as { id: string; slug: string }

  const kept = new Set(children.map((c) => c.photo_path))
  const removed = oldPhotos.filter((p) => !kept.has(p))
  if (removed.length) await supabase.storage.from('invite-photos').remove(removed)

  revalidatePath(`/i/${saved.slug}`)
  revalidatePath('/app')
  redirect(slug ? `/app/events/${saved.slug}?saved=1` : `/app/events/${saved.slug}/share?created=1`)
}

export async function deleteEvent(form: FormData) {
  const { supabase } = await getUser()
  const slug = String(form.get('slug') ?? '')
  const { data } = await supabase.from('events').select('id, event_children(photo_path)').eq('slug', slug).maybeSingle()
  if (data) {
    const photos = data.event_children.map((c: { photo_path: string | null }) => c.photo_path).filter((p): p is string => !!p)
    await supabase.from('events').delete().eq('id', data.id)
    if (photos.length) await supabase.storage.from('invite-photos').remove(photos)
    revalidatePath(`/i/${slug}`)
  }
  redirect('/app?deleted=1')
}

export async function setRepliesOpen(slug: string, open: boolean): Promise<{ error?: string }> {
  const { supabase } = await getUser()
  const { error } = await supabase.from('events').update({ rsvps_open: open }).eq('slug', slug)
  if (error) return { error: 'That didn’t save. Try again.' }
  revalidatePath(`/app/events/${slug}`)
  revalidatePath(`/i/${slug}`)
  return {}
}

type ReplyResult = { error?: string; errors?: Record<string, string> }

function checkReply(input: ReplyFormInput): { ok: true; value: ReplyInput } | { ok: false; result: ReplyResult } {
  const parsed = replySchema.safeParse(input)
  return parsed.success ? { ok: true, value: parsed.data } : { ok: false, result: { errors: fieldErrors(parsed.error) } }
}

export async function updateReply(slug: string, id: string, input: ReplyFormInput): Promise<ReplyResult> {
  const check = checkReply(input)
  if (!check.ok) return check.result
  const { supabase } = await getUser()
  const { error } = await supabase.from('rsvps').update({ ...check.value, last_edited_by: 'host' }).eq('id', id)
  if (error) return { error: 'That change didn’t save. Try again.' }
  revalidatePath(`/app/events/${slug}`)
  return {}
}

export async function addReply(slug: string, input: ReplyFormInput): Promise<ReplyResult> {
  const check = checkReply(input)
  if (!check.ok) return check.result
  const { supabase } = await getUser()
  const { data: ev } = await supabase.from('events').select('id').eq('slug', slug).maybeSingle()
  if (!ev) return { error: 'This party no longer exists.' }
  const { error } = await supabase.from('rsvps').insert({ ...check.value, event_id: ev.id, last_edited_by: 'host' })
  if (error) return { error: 'That reply didn’t save. Try again.' }
  revalidatePath(`/app/events/${slug}`)
  return {}
}

export async function deleteReply(slug: string, id: string): Promise<ReplyResult> {
  const { supabase } = await getUser()
  const { error } = await supabase.from('rsvps').delete().eq('id', id)
  if (error) return { error: 'That reply wasn’t deleted. Try again.' }
  revalidatePath(`/app/events/${slug}`)
  return {}
}
