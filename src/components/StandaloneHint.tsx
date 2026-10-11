'use client'
import { useSyncExternalStore } from 'react'

const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

/** In the installed app on iPhone, email links open Safari instead, so point people to the code. */
export function StandaloneHint() {
  const standalone = useSyncExternalStore(() => () => {}, isStandalone, () => false)
  if (!standalone) return null
  return <div className="note"><p>You’re using the installed app. Links in emails open in your browser instead, so type the code here.</p></div>
}
