import Link from 'next/link'

export function AppBar({ home = '/', right }: { home?: string; right?: React.ReactNode }) {
  return (
    <header className="appbar">
      <div className="appbar-inner">
        <Link href={home} className="logo">Party Pop!</Link>
        {right}
      </div>
    </header>
  )
}
