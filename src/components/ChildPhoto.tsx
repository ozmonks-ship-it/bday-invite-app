/* eslint-disable @next/next/no-img-element -- photos are already resized JPEGs from storage, and placeholders are inline SVG */
import { kidSvgDataUri } from '@/lib/art'
import { photoUrl } from '@/lib/invite'
import type { Child } from '@/lib/types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

export function childPhotoSrc(child: Pick<Child, 'photo_path'>, index: number): string {
  return photoUrl(SUPABASE_URL, child.photo_path) ?? kidSvgDataUri(index)
}

export function Photos({ kids }: { kids: Child[] }) {
  return (
    <div className={`photos n${kids.length}`}>
      {kids.map((k, i) => (
        <div className="photo" key={i}>
          <img src={childPhotoSrc(k, i)} alt={k.photo_path ? k.photo_alt || `Photo of ${k.name}` : `Illustration standing in for ${k.name}`} />
        </div>
      ))}
    </div>
  )
}

export function Avatars({ kids, size = 48 }: { kids: Pick<Child, 'photo_path'>[]; size?: number }) {
  return (
    <span className="avatars" aria-hidden="true">
      {kids.map((k, i) => (
        <img key={i} src={childPhotoSrc(k, i)} alt="" width={size} height={size} style={{ width: size, height: size }} />
      ))}
    </span>
  )
}
