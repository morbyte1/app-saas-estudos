'use client'

import { useRef, useState, type ComponentProps, type MouseEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { createPendingAction } from '@/lib/pendingAction'

type Props = Omit<ComponentProps<'button'>, 'onClick'> & {
  onClick: (event: MouseEvent<HTMLButtonElement>) => Promise<unknown> | unknown
  pendingText?: string
  iconOnly?: boolean
}

export default function AsyncButton({ onClick, pendingText = 'Aguarde...', iconOnly = false, children, disabled, className = '', ...props }: Props) {
  const [pending, setPending] = useState(false)
  const run = useRef(createPendingAction())

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => run.current(async () => {
    setPending(true)
    try { await onClick(event) }
    finally { setPending(false) }
  })

  return <button {...props} onClick={handleClick} disabled={disabled || pending} aria-busy={pending}
    aria-label={pending && iconOnly ? pendingText : props['aria-label']}
    className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}>
    {pending ? iconOnly ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : pendingText : children}
  </button>
}
