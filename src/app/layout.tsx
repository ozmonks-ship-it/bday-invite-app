import type { Metadata, Viewport } from 'next'
import { Bangers, Nunito } from 'next/font/google'
import { siteUrl } from '@/lib/env'
import './globals.css'

const display = Bangers({ weight: '400', subsets: ['latin'], variable: '--font-display', display: 'swap' })
const body = Nunito({ subsets: ['latin'], variable: '--font-body', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'Party Pop', template: '%s · Party Pop' },
  description: 'Comic-style party invites with one-tap replies.',
  applicationName: 'Party Pop',
}

export const viewport: Viewport = {
  themeColor: '#FFD23F',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  )
}
