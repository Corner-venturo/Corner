'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface CollapsibleContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null)

interface CollapsibleProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

function Collapsible({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
  className,
}: CollapsibleProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange]
  )

  return (
    <CollapsibleContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      <div className={className}>{children}</div>
    </CollapsibleContext.Provider>
  )
}

interface CollapsibleTriggerProps {
  children: React.ReactNode
  className?: string
  asChild?: boolean
}

function CollapsibleTrigger({ children, className, asChild }: CollapsibleTriggerProps) {
  const context = React.useContext(CollapsibleContext)
  if (!context) throw new Error('CollapsibleTrigger must be used within a Collapsible')

  const handleClick = () => {
    context.onOpenChange(!context.open)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void; className?: string }>, {
      onClick: handleClick,
      className: cn((children as React.ReactElement<{ className?: string }>).props.className, className),
    })
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  )
}

interface CollapsibleContentProps {
  children: React.ReactNode
  className?: string
}

function CollapsibleContent({ children, className }: CollapsibleContentProps) {
  const context = React.useContext(CollapsibleContext)
  if (!context) throw new Error('CollapsibleContent must be used within a Collapsible')

  if (!context.open) return null

  return <div className={className}>{children}</div>
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
