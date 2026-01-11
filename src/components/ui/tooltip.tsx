'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextValue>({
  open: false,
  setOpen: () => {},
})

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </TooltipContext.Provider>
  )
}

export function TooltipTrigger({
  children,
  asChild = false,
}: {
  children: React.ReactNode
  asChild?: boolean
}) {
  const { setOpen } = React.useContext(TooltipContext)

  const handleMouseEnter = () => setOpen(true)
  const handleMouseLeave = () => setOpen(false)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{
        onMouseEnter?: () => void
        onMouseLeave?: () => void
      }>,
      {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      }
    )
  }

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
    </div>
  )
}

export function TooltipContent({
  children,
  className,
  ...props
}: {
  children: React.ReactNode
  className?: string
}) {
  const { open } = React.useContext(TooltipContext)

  if (!open) return null

  return (
    <div
      className={cn(
        'absolute z-50 overflow-hidden rounded-md border bg-card px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95',
        'bottom-full left-1/2 -translate-x-1/2 mb-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
