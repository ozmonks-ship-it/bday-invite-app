import Link from 'next/link'

export type Crumb = { label: string; href?: string }

/** Trail under the app bar. The last item is the current page. */
export function Breadcrumbs({ items, rootClass }: { items: Crumb[]; rootClass?: string }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((c, i) => (
          <li key={i} className={i === 0 ? rootClass : undefined}>
            {i > 0 && <span className="sep" aria-hidden="true">›</span>}
            {c.href && i < items.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
