'use client'
/* eslint-disable @next/next/no-img-element -- app icons are generated PNG routes */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { androidIntentUrl, detectInAppBrowser, isAndroid, isIOS, safariUrl } from '@/lib/browser'
import { ShareIcon } from './Icons'

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
type Env = 'standalone' | 'iab-ios' | 'iab-instagram-ios' | 'iab-android' | 'iab-other' | 'ios' | 'other'

let cachedEnv: Env | null = null
function getEnv(): Env {
  if (cachedEnv) return cachedEnv
  const ua = navigator.userAgent
  const nav = navigator as Navigator & { standalone?: boolean }
  const iab = detectInAppBrowser(ua)
  cachedEnv = matchMedia('(display-mode: standalone)').matches || nav.standalone === true ? 'standalone'
    : iab && isAndroid(ua) ? 'iab-android'
    : iab === 'instagram' && isIOS(ua) ? 'iab-instagram-ios'
    : iab && isIOS(ua) ? 'iab-ios'
    : iab ? 'iab-other'
    : isIOS(ua) ? 'ios'
    : 'other'
  return cachedEnv
}
const noSubscribe = () => () => {}

export type InstallableApp = { kind: 'invite' | 'pp'; name: string; iconSrc: string }

/**
 * Fixed bottom banner. Offers the app that fits this page, or a way out of a
 * chat app's built-in browser. Never shown inside an installed app.
 */
export function InstallBanner({ app, leaveChatApps = false }: { app: InstallableApp; leaveChatApps?: boolean }) {
  const env = useSyncExternalStore(noSubscribe, getEnv, () => null)
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (env !== 'other') return
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as BeforeInstallPromptEvent) }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [env])

  // Android chat apps: hand the page to the default browser straight away
  useEffect(() => {
    if (env === 'iab-android' && leaveChatApps) window.location.href = androidIntentUrl(window.location.href)
  }, [env, leaveChatApps])

  // Reserve space so the banner never covers content or the focused field
  useEffect(() => {
    const el = ref.current
    const root = document.documentElement
    if (!el) return
    const ro = new ResizeObserver(() => root.style.setProperty('--banner-h', `${el.offsetHeight}px`))
    ro.observe(el)
    return () => { ro.disconnect(); root.style.setProperty('--banner-h', '0px') }
  }, [env])

  if (!env || env === 'standalone') return null

  const icon = <span className="appicon" aria-hidden="true"><img src={app.iconSrc} alt="" /></span>
  const pitch = app.kind === 'invite' ? `Add ${app.name} to your home screen` : 'Get the Party Pop app'
  const sub = app.kind === 'invite' ? 'Its own app: time, place and your reply in one tap.' : 'Your parties and invites in one place.'
  const here = () => window.location.href

  let label = 'Add to home screen'
  let body: React.ReactNode
  if (env === 'iab-ios' || env === 'iab-instagram-ios' || env === 'iab-android' || env === 'iab-other') {
    label = 'Open in your browser'
    const browser = env === 'iab-android' ? 'Chrome' : 'Safari'
    body = (
      <>
        {icon}
        <p><b>Open in {env === 'iab-other' ? 'your browser' : browser} to keep your reply</b>
          Tap ••• at the top, then “Open in external browser”.</p>
        {env === 'iab-ios' && <button className="btn" type="button" onClick={() => { window.location.href = safariUrl(here()) }}>Open in Safari</button>}
        {env === 'iab-android' && <button className="btn" type="button" onClick={() => { window.location.href = androidIntentUrl(here()) }}>Open in Chrome</button>}
        {env === 'iab-instagram-ios' && <button className="btn" type="button" onClick={() => navigator.clipboard?.writeText(here()).catch(() => {})}>Copy link</button>}
      </>
    )
  } else if (installed) {
    body = <>{icon}<p><b>{app.name} is on your home screen</b>Open it from there for one-tap access.</p></>
  } else if (env === 'ios') {
    body = <>{icon}<p><b>{pitch}</b>Tap <ShareIcon /><span className="sr-only">Share</span> then “Add to Home Screen”.</p></>
  } else if (prompt) {
    body = (
      <>
        {icon}
        <p><b>{pitch}</b>{sub}</p>
        <button className="btn" type="button" onClick={async () => {
          await prompt.prompt()
          const choice = await prompt.userChoice
          if (choice.outcome === 'accepted') setInstalled(true)
          setPrompt(null)
        }}>Add</button>
      </>
    )
  } else {
    body = <>{icon}<p><b>{pitch}</b>Use your browser menu and choose “Install app” or “Add to Home screen”.</p></>
  }

  return (
    <aside className="install" aria-label={label} ref={ref}>
      <div className="install-inner">{body}</div>
    </aside>
  )
}
