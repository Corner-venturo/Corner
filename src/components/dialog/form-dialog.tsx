/**
 * FormDialog - 通用表單對話框組件
 *
 * 統一管理所有表單對話框的外層結構：
 * - Dialog 容器
 * - Header (標題 + 副標題)
 * - 表單內容區域（由使用者提供 children）
 * - Footer 按鈕組（取消 + 提交）
 *
 * 使用範例：
 * ```tsx
 * <FormDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="新增報價單"
 *   subtitle="請填寫基本資料"
 *   onSubmit={handleSubmit}
 *   submitLabel="確定新增"
 *   loading={isSubmitting}
 * >
 *   <Input label="團名" value={name} onChange={setName} />
 *   <Input label="價格" value={price} onChange={setPrice} />
 * </FormDialog>
 * ```
 */

'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ReactNode } from 'react'

export interface FormDialogProps {
  /** 對話框開啟狀態 */
  open: boolean
  /** 對話框狀態變更回調 */
  onOpenChange: (open: boolean) => void
  /** 對話框標題 */
  title: string
  /** 對話框副標題（可選） */
  subtitle?: string
  /** 表單內容 */
  children: ReactNode
  /** 提交處理函數 */
  onSubmit: () => void | Promise<void>
  /** 取消處理函數（可選，預設為關閉對話框） */
  onCancel?: () => void
  /** 提交按鈕文字（預設：確定） */
  submitLabel?: string
  /** 取消按鈕文字（預設：取消） */
  cancelLabel?: string
  /** 提交中狀態 */
  loading?: boolean
  /** 是否禁用提交按鈕 */
  submitDisabled?: boolean
  /** 最大寬度 */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'
  /** 自定義內容樣式類名 */
  contentClassName?: string
  /** 是否顯示 Footer（預設：true） */
  showFooter?: boolean
  /** 自定義 Footer 內容 */
  footer?: ReactNode
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  onSubmit,
  onCancel,
  submitLabel = '確定',
  cancelLabel = '取消',
  loading = false,
  submitDisabled = false,
  maxWidth = '2xl',
  contentClassName = '',
  showFooter = true,
  footer,
}: FormDialogProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${maxWidthClasses[maxWidth]} ${contentClassName}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <p className="text-sm text-morandi-secondary mt-1">{subtitle}</p>}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 表單內容區域 */}
          <div className="space-y-4">{children}</div>

          {/* Footer 按鈕組 */}
          {showFooter && (
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              {footer || (
                <>
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                    {cancelLabel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || submitDisabled}
                    className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                  >
                    {loading ? '處理中...' : submitLabel}
                  </Button>
                </>
              )}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
