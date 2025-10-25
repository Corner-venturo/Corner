'use client'

import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EventDetailDialogState } from '../types'

interface EventDetailDialogProps {
  dialog: EventDetailDialogState
  onClose: () => void
  onDelete: (eventId: string) => void
}

export function EventDetailDialog({ dialog, onClose, onDelete }: EventDetailDialogProps) {
  if (!dialog.event) return null

  return (
    <Dialog open={dialog.open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>事件詳情</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 標題 */}
          <div className="p-4 bg-morandi-container/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {dialog.event.type === 'meeting' && <span className="text-2xl">📅</span>}
              {dialog.event.type === 'deadline' && <span className="text-2xl">⏰</span>}
              {dialog.event.type === 'task' && <span className="text-2xl">✓</span>}
              <span className="text-sm text-morandi-secondary">
                {dialog.event.type === 'meeting'
                  ? '會議'
                  : dialog.event.type === 'deadline'
                    ? '截止日期'
                    : '待辦事項'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-morandi-primary">
              {dialog.event.title}
            </h3>
          </div>

          {/* 日期時間 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon size={16} className="text-morandi-secondary" />
              <span className="text-morandi-primary">
                {new Date(dialog.event.date).toLocaleDateString('zh-TW', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </span>
            </div>

            {dialog.event.end_date && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-morandi-secondary ml-6">至</span>
                <span className="text-morandi-primary">
                  {new Date(dialog.event.end_date).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                  })}
                </span>
              </div>
            )}

            {dialog.event.time && (
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-morandi-secondary" />
                <span className="text-morandi-primary">{dialog.event.time}</span>
              </div>
            )}
          </div>

          {/* 說明 */}
          {dialog.event.description && (
            <div className="p-3 bg-morandi-container/10 rounded-lg">
              <p className="text-sm text-morandi-secondary mb-1">說明</p>
              <p className="text-sm text-morandi-primary">
                {dialog.event.description}
              </p>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('確定要刪除這個事件嗎？')) {
                  onDelete(dialog.event!.id)
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
  )
}
