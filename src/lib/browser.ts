/** Chat apps that open links in their own built-in browser, detected from the user agent. */
export type InAppBrowser = 'facebook' | 'instagram' | null

export function detectInAppBrowser(ua: string): InAppBrowser {
  if (/Instagram/i.test(ua)) return 'instagram'
  if (/FBAN|FBAV|FB_IAB|FBIOS|MessengerForiOS|FB4A/i.test(ua)) return 'facebook'
  return null
}

export const isIOS = (ua: string) => /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua))
export const isAndroid = (ua: string) => /Android/i.test(ua)

/** Android: hands the page to the phone's default browser. */
export function androidIntentUrl(url: string): string {
  const u = new URL(url)
  return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(':', '')};end`
}

/** iPhone: asks iOS to open Safari. Honoured by some Facebook/Messenger versions, blocked by Instagram. */
export const safariUrl = (url: string) => url.replace(/^https:\/\//, 'x-safari-https://')
