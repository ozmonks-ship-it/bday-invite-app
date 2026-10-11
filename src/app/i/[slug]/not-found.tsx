import Link from 'next/link'
import { AppBar } from '@/components/AppBar'

export default function InviteNotFound() {
  return (
    <>
      <AppBar />
      <main id="main" className="stack">
        <h1>This party isn’t here</h1>
        <p className="lede">It may have been cancelled or removed by the host, or the link is incomplete. Check the link in your chat, or ask the host to send it again.</p>
        <p><Link className="btn sun" href="/me">See my invites</Link></p>
      </main>
    </>
  )
}
