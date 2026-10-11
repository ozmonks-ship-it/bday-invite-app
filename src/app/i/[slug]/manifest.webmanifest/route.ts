import { getPublicInvite } from '@/lib/data'
import { childNames, partyName } from '@/lib/invite'

/** Each invite installs as its own app, named after the party. */
export async function GET(_req: Request, ctx: RouteContext<'/i/[slug]/manifest.webmanifest'>) {
  const { slug } = await ctx.params
  const invite = await getPublicInvite(slug)
  if (!invite) return new Response('Not found', { status: 404 })
  const v = encodeURIComponent(invite.updated_at)
  const manifest = {
    id: `/i/${slug}`,
    name: partyName(invite.children),
    short_name: childNames(invite.children).slice(0, 24),
    description: 'Party details and your reply',
    start_url: `/i/${slug}?source=pwa`,
    scope: `/i/${slug}`,
    display: 'standalone',
    background_color: '#D6EAFF',
    theme_color: '#FFD23F',
    icons: [
      { src: `/i/${slug}/icon/192?v=${v}`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `/i/${slug}/icon/512?v=${v}`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `/i/${slug}/icon/512?v=${v}`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
  return Response.json(manifest, { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=300' } })
}
