import { ImageResponse } from 'next/og'
import { getPublicInvite } from '@/lib/data'
import { formatDate, formatTimeRange, headline } from '@/lib/invite'
import { childImageSources } from '@/lib/og'

export const alt = 'Party invitation'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const invite = await getPublicInvite(slug)
  if (!invite) {
    return new ImageResponse(<div style={{ display: 'flex', width: '100%', height: '100%', background: '#FFD23F', alignItems: 'center', justifyContent: 'center', fontSize: 72, fontWeight: 800 }}>Party Pop!</div>, size)
  }
  const photos = childImageSources(invite.children).slice(0, 3)
  const photoSize = photos.length === 1 ? 380 : photos.length === 2 ? 300 : 240
  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#FFD23F', padding: 48, alignItems: 'center', gap: 40,
        backgroundImage: 'radial-gradient(rgba(199,15,55,0.22) 4px, transparent 4.5px)', backgroundSize: '24px 24px' }}>
        <div style={{ display: 'flex' }}>
          {photos.map((src, i) => (
            <img key={i} src={src} alt="" width={photoSize} height={photoSize}
              style={{ width: photoSize, height: photoSize, borderRadius: photoSize, border: '10px solid #17131F', objectFit: 'cover', marginLeft: i ? -photoSize * 0.18 : 0, background: '#FFFFFF' }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 24 }}>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, background: '#FFFFFF', border: '5px solid #17131F', borderRadius: 14, padding: '4px 18px', alignSelf: 'flex-start' }}>YOU’RE INVITED!</div>
          <div style={{ display: 'flex', fontSize: photos.length > 1 ? 64 : 76, fontWeight: 900, color: '#C70F37', lineHeight: 1.05 }}>{headline(invite.children)}</div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, color: '#17131F', background: '#FFFFFF', border: '5px solid #17131F', borderRadius: 14, padding: '8px 18px', alignSelf: 'flex-start' }}>
            {formatDate(invite.party_date, 'short')} · {formatTimeRange(invite.start_time, invite.end_time)}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
