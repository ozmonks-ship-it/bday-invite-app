import Link from 'next/link'
import { formatDate, formatTimeRange, groupText, headline } from '@/lib/invite'
import type { Invite, Reply } from '@/lib/types'
import { Avatars } from './ChildPhoto'
import { CheckIcon, CrossIcon } from './Icons'

export function ReplyTag({ reply }: { reply: Pick<Reply, 'attending' | 'children' | 'adults'> | null | undefined }) {
  if (!reply) return <span className="tag sun">Not replied yet</span>
  return reply.attending
    ? <span className="tag yes"><CheckIcon /> Going · {groupText(reply.children, reply.adults)}</span>
    : <span className="tag no"><CrossIcon /> Not going</span>
}

export function InviteCard({ invite, reply, href }: { invite: Invite; reply: Pick<Reply, 'attending' | 'children' | 'adults'> | null | undefined; href: string }) {
  const title = headline(invite.children)
  return (
    <li className="card">
      <div className="row">
        <Avatars kids={invite.children} />
        <div style={{ minWidth: 0 }}>
          <h2>{title}</h2>
          <p className="muted" style={{ margin: 0 }}>{formatDate(invite.party_date, 'short')}, {formatTimeRange(invite.start_time, invite.end_time)} · {invite.venue_name}</p>
        </div>
      </div>
      <p style={{ margin: '10px 0' }}><ReplyTag reply={reply} /></p>
      <Link className="btn small sun" href={href}>Open invite<span className="sr-only">: {title}</span></Link>
    </li>
  )
}
