// The guest's replies and opened invites, kept in this browser only.
import type { Reply } from './types'

const replyKey = (slug: string) => `partypop.rsvp.${slug}`
const INVITES_KEY = 'partypop.invites'

export type StoredReply = Partial<Reply> & { token?: string }

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode or storage blocked: the reply still saves on the server.
  }
}

/** 32 random bytes, base64url: 43 characters. */
export function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const getStoredReply = (slug: string) => read<StoredReply>(replyKey(slug))
export const setStoredReply = (slug: string, reply: StoredReply | null) => write(replyKey(slug), reply)

export function rememberInvite(slug: string) {
  const list = read<string[]>(INVITES_KEY) ?? []
  if (!list.includes(slug)) write(INVITES_KEY, [slug, ...list].slice(0, 50))
}
export const listInvites = () => read<string[]>(INVITES_KEY) ?? []
export function forgetInvite(slug: string) {
  write(INVITES_KEY, listInvites().filter((s) => s !== slug))
  setStoredReply(slug, null)
}

/** Tokens for every reply made on this device that hasn't been moved into an account. */
export function deviceTokens(): string[] {
  return listInvites()
    .map((slug) => getStoredReply(slug)?.token)
    .filter((t): t is string => !!t)
}

/** After replies move into an account, the device tokens stop working, so drop them. */
export function retireTokens() {
  for (const slug of listInvites()) {
    const r = getStoredReply(slug)
    if (r?.token) setStoredReply(slug, { ...r, token: undefined, claimed: true })
  }
}
