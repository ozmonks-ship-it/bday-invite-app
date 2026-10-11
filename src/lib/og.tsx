// Shared drawing for link-preview images and app icons (rendered by next/og).
import { kidSvgDataUri } from '@/lib/art'
import { photoUrl } from '@/lib/invite'
import type { Child } from '@/lib/types'

export function childImageSources(children: Child[]): string[] {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return children.map((c, i) => photoUrl(base, c.photo_path) ?? kidSvgDataUri(i))
}

/** Called as a plain function: next/og doesn't pass a React children list through. */
export function kidsIcon(kids: Child[], size: number) {
  const srcs = childImageSources(kids).slice(0, 2)
  return (
    <div style={{ width: size, height: size, display: 'flex', background: '#FFD23F' }}>
      {srcs.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={src} alt="" width={size / srcs.length} height={size} style={{ objectFit: 'cover', width: size / srcs.length, height: size }} />
      ))}
    </div>
  )
}
