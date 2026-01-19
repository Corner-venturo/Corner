'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Dialog 標準寬度規格
 *
 * 使用指南：
 * - sm:   確認對話框、簡單選擇（max-w-sm, ~384px）
 * - md:   簡單表單，3-5 個欄位（max-w-md, ~448px）
 * - lg:   中等表單，5-10 個欄位（max-w-lg, ~512px）
 * - xl:   複雜表單，多區塊配置（max-w-xl, ~576px）
 * - 2xl:  含預覽的表單、雙欄佈局（max-w-2xl, ~672px）
 * - 4xl:  分頁式複雜表單、多功能面板（max-w-4xl, ~896px）
 * - full: 編輯器類型、全螢幕操作（max-w-[95vw]）
 */
export const DIALOG_SIZES = {
  sm: 'max-w-sm',       // 小型確認框
  md: 'max-w-md',       // 標準表單
  lg: 'max-w-lg',       // 大型表單
  xl: 'max-w-xl',       // 複雜表單
  '2xl': 'max-w-2xl',   // 多欄表單
  '4xl': 'max-w-4xl',   // 全螢幕表單
  full: 'max-w-[95vw]', // 幾乎全螢幕
} as const

export type DialogSize = keyof typeof DIALOG_SIZES

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    onDragOver={(e) => e.preventDefault()}
    onDrop={(e) => e.preventDefault()}
    className={cn(
      'fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /**
   * Dialog 寬度大小
   * @default 'lg'
   *
   * 使用指南：
   * - sm:   確認對話框、簡單選擇
   * - md:   簡單表單（3-5 個欄位）
   * - lg:   中等表單（5-10 個欄位）- 預設值
   * - xl:   複雜表單（多區塊）
   * - 2xl:  含預覽的表單
   * - 4xl:  分頁式複雜表單
   * - full: 編輯器類型
   */
  size?: DialogSize
  /**
   * 巢狀 Dialog（用於從其他 Dialog 中打開時，使用更高的 z-index 層級）
   * @default false
   */
  nested?: boolean
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, size = 'lg', nested = false, ...props }, ref) => (
  <DialogPortal>
    {/*
      巢狀 Dialog 遮罩設計：
      - 普通 Dialog: bg-black/60 (60% 黑色) + 背景模糊
      - 巢狀 Dialog: 透明背景，只有 z-index 更高（避免雙重遮罩）
    */}
    {!nested && (
      <DialogPrimitive.Overlay
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />
    )}
    <DialogPrimitive.Content
      ref={ref}
      aria-describedby={undefined}
      onOpenAutoFocus={(e) => e.preventDefault()}
      onInteractOutside={(e) => e.preventDefault()}
      onPointerDownOutside={(e) => e.preventDefault()}
      aria-labelledby={undefined}
      className={cn(
        'fixed left-[50%] top-[50%] grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-8 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-xl',
        nested ? 'z-[10002]' : 'z-[9999]',
        DIALOG_SIZES[size],
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className={cn(
        'absolute right-4 top-4 rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground cursor-pointer',
        nested ? 'z-[10003]' : 'z-[10000]'
      )}>
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  // Types
  type DialogContentProps,
}
