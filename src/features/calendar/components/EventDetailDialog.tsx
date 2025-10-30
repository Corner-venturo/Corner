'use client'

import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FullCalendarEvent } from '../types'
import { ConfirmDialog } from '@/components/dialog/confirm-dialog'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'

interface EventDetailDialogProps {
  open: boolean
  event: FullCalendarEvent | null
  onClose: () => void
  onDelete: (eventId: string) => void
}

export function EventDetailDialog({ open, event, onClose, onDelete }: EventDetailDialogProps) {
  const { confirm, confirmDialogProps } = useConfirmDialog()

  if (!event) return null

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>事件詳情</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 標題 */}
          <div className="p-4 bg-morandi-container/20 rounded-lg">
            <h3 className="text-lg font-semibold text-morandi-primary">
              {event.title}
            </h3>
          </div>

          {/* 日期時間 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon size={16} className="text-morandi-secondary" />
              <span className="text-morandi-primary">
                {new Date(event.start).toLocaleDateString('zh-TW', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </span>
            </div>

            {event.end && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-morandi-secondary ml-6">至</span>
                <span className="text-morandi-primary">
                  {new Date(event.end).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* 建立者（僅公司事項） */}
          {event.extendedProps?.type === 'company' && event.extendedProps?.creator_name && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-morandi-secondary">建立者：</span>
              <span className="text-morandi-primary font-medium">
                {event.extendedProps.creator_name}
              </span>
            </div>
          )}

          {/* 說明 */}
          {event.extendedProps?.description && (
            <div className="p-3 bg-morandi-container/10 rounded-lg">
              <p className="text-sm text-morandi-secondary mb-1">說明</p>
              <p className="text-sm text-morandi-primary">
                {event.extendedProps.description}
              </p>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={async () => {
                const confirmed = await confirm({
                  type: 'danger',
                  title: '刪除事件',
                  message: '確定要刪除這個事件嗎？',
                  details: ['此操作無法復原'],
                  confirmLabel: '確認刪除',
                  cancelLabel: '取消'
                });
                if (confirmed) {
                  onDelete(event.id)
                }
              }}
              className="text-morandi-red hover:bg-morandi-red hover:text-white"
            >
              刪除
            </Button>
            <Button variant="outline" onClick={onClose}>
              關閉
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    <ConfirmDialog {...confirmDialogProps} />
    </>
  )
}
