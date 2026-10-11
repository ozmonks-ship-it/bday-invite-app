import { ImageResponse } from 'next/og'

const SIZES = new Set([180, 192, 512])

export async function GET(_req: Request, ctx: RouteContext<'/app/icon/[size]'>) {
  const size = Number((await ctx.params).size)
  if (!SIZES.has(size)) return new Response('Unsupported icon size', { status: 404 })
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFD23F' }}>
        <div style={{ display: 'flex', fontSize: size * 0.42, fontWeight: 900, color: '#C70F37', letterSpacing: -size * 0.01 }}>P!</div>
      </div>
    ),
    { width: size, height: size },
  )
}
