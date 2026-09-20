'use client'

import { useRef, useState } from 'react'
import { createPendingAction } from './pendingAction'

export function usePendingActions() {
  const guards = useRef(new Map<string, ReturnType<typeof createPendingAction>>())
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set())

  const run = (key: string, action: () => Promise<unknown> | unknown) => {
    let guard = guards.current.get(key)
    if (!guard) {
      guard = createPendingAction()
      guards.current.set(key, guard)
    }
    return guard(async () => {
      setPending(previous => new Set(previous).add(key))
      try { await action() }
      finally {
        setPending(previous => {
          const next = new Set(previous)
          next.delete(key)
          return next
        })
      }
    })
  }

  return { run, isPending: (key: string) => pending.has(key) }
}
