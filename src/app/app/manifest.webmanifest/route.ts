export function GET() {
  return Response.json(
    {
      id: '/app',
      name: 'Party Pop',
      short_name: 'Party Pop',
      description: 'Your parties and the invites you’ve received',
      start_url: '/app?source=pwa',
      scope: '/app',
      display: 'standalone',
      background_color: '#D6EAFF',
      theme_color: '#FFD23F',
      icons: [
        { src: '/app/icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/app/icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/app/icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  )
}
