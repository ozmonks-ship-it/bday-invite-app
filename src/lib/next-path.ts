/** Only allow redirects back into this app, never to another site. */
export function safeNext(value: unknown, fallback = '/app'): string {
  if (typeof value !== 'string') return fallback
  if (!/^\/(app|i)(\/|$|\?)/.test(value) || value.startsWith('//') || value.includes('\\')) return fallback
  return value
}
