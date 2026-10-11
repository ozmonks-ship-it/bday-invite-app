'use client'
import { useSyncExternalStore } from 'react'
import { ExternalIcon, NewTab } from './Icons'
import { useStatus } from './Status'

const canShare = () => typeof navigator.share === 'function'

export function ShareActions({ link, text }: { link: string; text: string }) {
  const [status, show] = useStatus()
  const webShare = useSyncExternalStore(() => () => {}, canShare, () => false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      show('Link copied')
    } catch {
      const input = document.getElementById('share-link') as HTMLInputElement | null
      input?.select()
      show('Link selected. Use your keyboard or menu to copy it.')
    }
  }

  return (
    <div className="stack">
      {status}
      <div className="field">
        <label htmlFor="share-link">Invite link</label>
        <div className="linkbox">
          <input id="share-link" className="input" type="text" readOnly value={link} onFocus={(e) => e.target.select()} />
          <button className="btn sun small" type="button" onClick={copy}>Copy</button>
        </div>
      </div>
      <div className="btns">
        {webShare && (
          <button className="btn primary" type="button" onClick={() => navigator.share({ text, url: link }).catch(() => {})}>Share…</button>
        )}
        <a className="btn go" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">WhatsApp <ExternalIcon /><NewTab /></a>
        <a className="btn blue" href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(link)}&redirect_uri=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer">Messenger <ExternalIcon /><NewTab /></a>
      </div>
    </div>
  )
}
