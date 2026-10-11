'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useSyncExternalStore } from 'react'
import { createClient } from '@/lib/supabase/client'
import { deviceTokens, retireTokens } from '@/lib/guest-store'
import { useStatus } from './Status'

/** After sign-in: move replies made on this device into the account. */
export function ClaimReplies() {
  const router = useRouter()
  const [status, show] = useStatus()
  useEffect(() => {
    const tokens = deviceTokens()
    if (!tokens.length) return
    createClient().rpc('claim_rsvps', { p_tokens: tokens }).then(({ data, error }) => {
      if (error) return
      retireTokens()
      if ((data as number) > 0) {
        show((data as number) === 1 ? 'Your reply is now saved to your account.' : `Your ${data} replies are now saved to your account.`)
        router.refresh()
      }
    })
  }, [router, show])
  return status
}

const countDeviceReplies = () => deviceTokens().length

/** On sign-up: tell the guest their replies come with them. */
export function DeviceReplyNote() {
  const count = useSyncExternalStore(() => () => {}, countDeviceReplies, () => 0)
  if (!count) return null
  return (
    <div className="saved"><p style={{ fontWeight: 800 }}>
      {count === 1 ? 'Your reply' : `Your ${count} replies`} on this device will move into your account, so you can change {count === 1 ? 'it' : 'them'} from any device.
    </p></div>
  )
}
