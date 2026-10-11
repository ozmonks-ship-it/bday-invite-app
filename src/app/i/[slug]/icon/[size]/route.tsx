import { ImageResponse } from 'next/og'
import { getPublicInvite } from '@/lib/data'
import { kidsIcon } from '@/lib/og'

const SIZES = new Set([180, 192, 512])

/** Home-screen icon for one invite, made from the children's photos. */
export async function GET(_req: Request, ctx: RouteContext<'/i/[slug]/icon/[size]'>) {
  const { slug, size: raw } = await ctx.params
  const size = Number(raw)
  if (!SIZES.has(size)) return new Response('Unsupported icon size', { status: 404 })
  const invite = await getPublicInvite(slug)
  if (!invite) return new Response('Not found', { status: 404 })
  return new ImageResponse(kidsIcon(invite.children, size), { width: size, height: size })
}
