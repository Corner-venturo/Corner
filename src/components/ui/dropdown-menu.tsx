'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const DropdownMenuItemContext = React.createContext<{ onOpenChange?: (open: boolean) => void }>({})

const DropdownMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children: React.ReactNode
  }
>(({ className, open, onOpenChange, children, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(open || false)

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <div ref={ref} className={cn('relative', className)} {...props}>
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ isOpen?: boolean; onOpenChange?: (open: boolean) => void }>, {
              isOpen,
              onOpenChange: handleOpenChange,
            })
          : child
      )}
    </div>
  )
})
DropdownMenu.displayName = 'DropdownMenu'

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
    asChild?: boolean
  }
>(({ className, children, isOpen, onOpenChange, asChild, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    type ChildProps = { onClick?: React.MouseEventHandler<HTMLElement> }
    const childElement = children as React.ReactElement<ChildProps>
    return React.cloneElement(childElement, {
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        onOpenChange?.(!isOpen)
        childElement.props.onClick?.(e)
      },
      ...props,
    } as ChildProps)
  }

  return (
    <button
      ref={ref}
      className={cn(
        'flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      onClick={() => onOpenChange?.(!isOpen)}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
    align?: 'start' | 'center' | 'end'
  }
>(({ className, children, isOpen, onOpenChange, align = 'start', ...props }, _ref) => {
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        onOpenChange?.(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onOpenChange])

  if (!isOpen) return null

  return (
    <DropdownMenuItemContext.Provider value={{ onOpenChange }}>
      <div
        ref={contentRef}
        className={cn(
          'absolute top-full z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-white p-1 shadow-md',
          'animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2',
          align === 'start' && 'left-0',
          align === 'center' && 'left-1/2 -translate-x-1/2',
          align === 'end' && 'right-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </DropdownMenuItemContext.Provider>
  )
})
DropdownMenuContent.displayName = 'DropdownMenuContent'

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onOpenChange?: (open: boolean) => void }
>(({ className, onClick, onOpenChange, ...props }, ref) => {
  const context = React.useContext(DropdownMenuItemContext)
  const closeMenu = onOpenChange || context.onOpenChange

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none',
        'hover:bg-morandi-container hover:text-morandi-primary',
        'focus:bg-morandi-container focus:text-morandi-primary',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      onClick={(e) => {
        onClick?.(e)
        closeMenu?.(false)
      }}
      {...props}
    />
  )
})
DropdownMenuItem.displayName = 'DropdownMenuItem'

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />
))
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('px-2 py-1.5 text-sm font-semibold text-morandi-primary', className)}
    {...props}
  />
))
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
  }
>(({ className, children, checked, onCheckedChange, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 pl-8 text-sm outline-none',
      'hover:bg-morandi-container hover:text-morandi-primary',
      'focus:bg-morandi-container focus:text-morandi-primary',
      className
    )}
    onClick={(e) => {
      e.stopPropagation()
      onCheckedChange?.(!checked)
    }}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {checked && (
        <svg
          className="h-4 w-4 text-morandi-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </span>
    {children}
  </div>
))
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem'

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
}
