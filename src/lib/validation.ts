import { z } from 'zod'
import { MAX_CHILDREN } from './invite'

const trimmed = (max: number) => z.string().trim().max(max)
const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => (v ? v : null))

export const replySchema = z
  .object({
    name: trimmed(80).min(1, 'Enter your name so the host knows who’s coming.'),
    attending: z.boolean(),
    children: z.coerce.number().int().min(0).max(15),
    adults: z.coerce.number().int().min(0).max(10),
    note: optionalText(500),
  })
  .transform((r) => (r.attending ? r : { ...r, children: 0, adults: 0 }))
  .refine((r) => !r.attending || r.children + r.adults >= 1, {
    message: 'Add at least one child or adult, or choose “Sorry, can’t come”.',
    path: ['children'],
  })
export type ReplyInput = z.infer<typeof replySchema>
/** What a form sends, before validation. */
export type ReplyFormInput = z.input<typeof replySchema>

const time = z.string().regex(/^\d{2}:\d{2}$/, 'Use the time picker, for example 14:00.')
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date.')

export const childSchema = z.object({
  name: trimmed(60).min(1, 'Add a name for each birthday star.'),
  age: z
    .union([z.literal(''), z.coerce.number().int().min(1).max(18)])
    .transform((v) => (v === '' ? null : v)),
  photo_path: z
    .string()
    .regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/, 'Photo upload failed. Try choosing it again.')
    .nullable(),
  photo_alt: optionalText(200),
})

export const eventSchema = z
  .object({
    children: z.array(childSchema).min(1).max(MAX_CHILDREN),
    party_date: date,
    start_time: time,
    end_time: z.union([z.literal(''), time]).transform((v) => v || null),
    venue_name: trimmed(120).min(1, 'Add the venue name.'),
    venue_address: trimmed(200).min(1, 'Add the venue address.'),
    venue_maps_url: z
      .union([z.literal(''), z.string().trim().url().startsWith('https://', 'Paste a link that starts with https://')])
      .optional()
      .transform((v) => v || null),
    parking_notes: optionalText(500),
    parking_location: optionalText(200),
    directions: optionalText(500),
    message: optionalText(1000),
    rsvp_by: z.union([z.literal(''), date]).optional().transform((v) => v || null),
  })
  .refine((e) => !e.end_time || e.end_time > e.start_time, {
    message: 'The end time must be after the start time.',
    path: ['end_time'],
  })
export type EventInput = z.infer<typeof eventSchema>

/** First message per field, for showing next to inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    if (!(key in out)) out[key] = issue.message
  }
  return out
}

export const emailSchema = z.string().trim().email('Check the email address, it looks incomplete.')
