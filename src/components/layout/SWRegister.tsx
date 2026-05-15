'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { Serwist } from '@serwist/window'

export function SWRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const sw = new Serwist('/sw.js', { scope: '/' })

    // New SW is waiting to activate — prompt the user to update
    sw.addEventListener('waiting', () => {
      toast.info('Update available', {
        description: 'A new version of Nova is ready.',
        action: {
          label: 'Update now',
          onClick: () => sw.messageSkipWaiting(),
        },
        duration: Infinity,
      })
    })

    // New SW took control (after skipWaiting) — reload to load fresh assets
    sw.addEventListener('controlling', () => {
      window.location.reload()
    })

    sw.register()
  }, [])

  return null
}
