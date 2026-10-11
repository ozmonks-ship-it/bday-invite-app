import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { EventForm } from '@/components/EventForm'
import { getUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'New party invite' }

export default async function NewEvent() {
  const { user } = await getUser()
  return (
    <>
      <Breadcrumbs items={[{ label: 'My parties', href: '/app' }, { label: 'New invite' }]} />
      <main id="main">
        <h1>New party invite</h1>
        <p className="lede">Fill in the details, then share one link with your guests.</p>
        <EventForm userId={user!.id} />
      </main>
    </>
  )
}
