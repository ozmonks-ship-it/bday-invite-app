import Link from 'next/link'
import { AppBar } from '@/components/AppBar'
import { Photos } from '@/components/ChildPhoto'

export default function Landing() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <AppBar right={<Link className="badge" href="/app/sign-in">Sign in</Link>} />
      <main id="main" className="landing stack">
        <div className="hero">
          <span className="pow">POP!</span>
          <Photos kids={[{ name: 'Maya', age: 6, photo_path: null, photo_alt: null }, { name: 'Leo', age: 4, photo_path: null, photo_alt: null }]} />
          <h1>Throw a party!</h1>
          <p className="bubble">Make a comic-style invite, share one link in your class chat, and watch the replies roll in.</p>
        </div>
        <div className="btns">
          <Link className="btn primary" href="/app/start">Make my first invite</Link>
          <Link className="btn" href="/app/sign-in">Sign in</Link>
        </div>
        <div className="card">
          <h2>Got an invite?</h2>
          <p className="muted" style={{ margin: 0 }}>You don’t need an account to reply. Open the link from your chat. Invites you’ve opened on this device are in <Link href="/me">My invites</Link>.</p>
        </div>
      </main>
    </>
  )
}
