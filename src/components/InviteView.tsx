import { childNames, formatDate, formatTimeRange, headline, mapsUrl, venueMapsUrl } from '@/lib/invite'
import type { Invite } from '@/lib/types'
import { Photos } from './ChildPhoto'
import { BusIcon, CalendarIcon, CarIcon, ExternalIcon, NewTab, PinIcon } from './Icons'

/** The invite itself: photos, headline, when, where, parking, getting there. */
export function InviteView({ invite }: { invite: Invite }) {
  return (
    <>
      <div className="hero">
        <span className="pow">YOU’RE INVITED!</span>
        <Photos kids={invite.children} />
        <h1 tabIndex={-1}>{headline(invite.children)}</h1>
        {invite.message && <p className="bubble">{invite.message}</p>}
      </div>
      <div className="details">
        <div className="detail">
          <span className="ic"><CalendarIcon /></span>
          <div><p className="k">When</p><p className="v">{formatDate(invite.party_date)}</p><p className="muted">{formatTimeRange(invite.start_time, invite.end_time)}</p></div>
        </div>
        <div className="detail">
          <span className="ic"><PinIcon /></span>
          <div>
            <p className="k">Where</p><p className="v">{invite.venue_name}</p><p className="muted">{invite.venue_address}</p>
            <p style={{ marginTop: 8 }}>
              <a className="btn blue small" href={venueMapsUrl(invite)} target="_blank" rel="noopener noreferrer">Open venue in Google Maps <ExternalIcon /><NewTab /></a>
            </p>
          </div>
        </div>
        {(invite.parking_notes || invite.parking_location) && (
          <div className="detail">
            <span className="ic"><CarIcon /></span>
            <div>
              <p className="k">Parking</p>
              {invite.parking_notes && <p>{invite.parking_notes}</p>}
              {invite.parking_location && (
                <p style={{ marginTop: 8 }}>
                  <a className="btn small" href={mapsUrl(invite.parking_location)} target="_blank" rel="noopener noreferrer">Parking in Google Maps <ExternalIcon /><NewTab /></a>
                </p>
              )}
            </div>
          </div>
        )}
        {invite.directions && (
          <div className="detail">
            <span className="ic"><BusIcon /></span>
            <div><p className="k">Getting there</p><p>{invite.directions}</p></div>
          </div>
        )}
      </div>
    </>
  )
}

export function PartyOver({ invite, signedIn }: { invite: Invite; signedIn: boolean }) {
  const n = invite.children.length
  return (
    <>
      <div className="hero">
        <span className="pow">THANKS FOR COMING!</span>
        <Photos kids={invite.children} />
        <h1 tabIndex={-1}>{childNames(invite.children)}’s party is over</h1>
        <p className="bubble">{n > 1 ? 'They' : invite.children[0]?.name} had a brilliant time. Thank you for being part of it!</p>
      </div>
      <div className="stack" style={{ marginTop: 16 }}>
        {!signedIn && (
          <div className="card flywheel">
            <h2>Your turn next?</h2>
            <p>Make an invite like this in about 3 minutes. It’s free.</p>
            <div><a className="btn primary" href={`/app/start?from=${invite.slug}`}>Make my own invite</a></div>
          </div>
        )}
        <div className="note">
          <p>Party details are deleted 60 days after the party. Added this invite to your home screen? Press and hold its icon, then choose Remove.</p>
        </div>
      </div>
    </>
  )
}
