'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

/** Brief confirmation that is shown and announced to screen readers. */
export function useStatus() {
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const show = useCallback((text: string, error = false) => {
    setMsg({ text, error })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(null), error ? 6000 : 3000)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  const node = (
    <div role="status" aria-live="polite">
      {msg && <div className={`status${msg.error ? ' error' : ''}`}>{msg.text}</div>}
    </div>
  )
  return [node, show] as const
}
