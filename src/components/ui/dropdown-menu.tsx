"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

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
    <div
      ref={ref}
      className={cn("relative", className)}
      {...props}
    >
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, {
              isOpen,
              onOpenChange: handleOpenChange
            })
          : child
      )}
    </div>
  )
})
DropdownMenu.displayName = "DropdownMenu"

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(({ className, children, isOpen, onOpenChange, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    onClick={() => onOpenChange?.(!isOpen)}
    {...props}
  >
    {children}
  </button>
))
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(({ className, children, isOpen, onOpenChange, ...props }, ref) => {
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
    <div
      ref={contentRef}
      className={cn(
        "absolute top-full left-0 z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-white p-1 shadow-md",
        "animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
      "hover:bg-morandi-container hover:text-morandi-primary",
      "focus:bg-morandi-container focus:text-morandi-primary",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}