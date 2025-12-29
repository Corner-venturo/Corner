'use client'

import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FullCalendarEvent } from '../types'
import { ConfirmDialog } from '@/components/dialog/confirm-dialog'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { useAuthStore } from '@/stores/auth-store'

interface EventDetailDialogProps {
  open: boolean
  event: FullCalendarEvent | null
  onClose: () => void
  onEdit: (event: FullCalendarEvent) => void
  onDelete: (eventId: string) => void
}

export function EventDetailDialog({ open, event, onClose, onEdit, onDelete }: EventDetailDialogProps) {
  const { confirm, confirmDialogProps } = useConfirmDialog()
  const { user } = useAuthStore()

  if (!event) return null

  // 檢查是否可以編輯或刪除（只有建立者或管理員可以）
  const canEditOrDelete = () => {
    // 旅遊團、生日事件不能編輯或刪除
    if (event.extendedProps?.type === 'tour' || event.extendedProps?.type === 'birthday') {
      return false
    }

    // 個人事項：只有自己可以
    if (event.extendedProps?.type === 'personal') {
      return true // 已經過濾只顯示自己的
    }

    // 公司事項：只有建立者或管理員可以
    if (event.extendedProps?.type === 'company') {
      const isCreator = event.extendedProps?.created_by === user?.id
      const isAdmin = user?.permissions?.includes('admin')
      return isCreator || isAdmin
    }

    return false
  }

  return (
    <>
      <Dialog open={open} onOpenChange={open => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>事件詳情</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 標題 */}
            <div className="p-4 bg-morandi-container/20 rounded-lg">
              <h3 className="text-lg font-semibold text-morandi-primary">{event.title}</h3>
            </div>

            {/* 日期時間 */}
            <div className="space-y-2">
              {(() => {
                // 🔧 修正：明確使用台灣時區，避免時區轉換問題
                const startDate = event.start.includes('T') ? event.start : `${event.start}T00:00:00`
                const endDate = event.end
                  ? event.end.includes('T')
                    ? event.end
                    : `${event.end}T00:00:00`
                  : null

                const isAllDay = event.allDay ?? true // 預設為全天事件

                // 統一的時區設定
                const taipeiTZ = 'Asia/Taipei'

                if (isAllDay) {
                  // 全天事件：只顯示日期
                  const start = new Date(startDate)
                  const end = endDate ? new Date(endDate) : null

                  // FullCalendar 的全天事件 end 是隔天 00:00，所以要減一天
                  const actualEnd = end ? new Date(end.getTime() - 24 * 60 * 60 * 1000) : null

                  // 使用台灣時區比較日期
                  const startDateStr = start.toLocaleDateString('sv-SE', { timeZone: taipeiTZ })
                  const endDateStr = actualEnd?.toLocaleDateString('sv-SE', { timeZone: taipeiTZ })
                  const isSameDay = !endDateStr || startDateStr === endDateStr

                  return (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon size={16} className="text-morandi-secondary" />
                        <span className="text-morandi-primary">
                          {start.toLocaleDateString('zh-TW', {
                            timeZone: taipeiTZ,
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long',
                          })}
                        </span>
                      </div>
                      {!isSameDay && actualEnd && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-morandi-secondary ml-6">至</span>
                          <span className="text-morandi-primary">
                            {actualEnd.toLocaleDateString('zh-TW', {
                              timeZone: taipeiTZ,
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long',
                            })}
                          </span>
                        </div>
                      )}
                    </>
                  )
                } else {
                  // 指定時間事件：顯示日期 + 時間範圍
                  const start = new Date(startDate)
                  const end = endDate ? new Date(endDate) : null

                  return (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon size={16} className="text-morandi-secondary" />
                        <span className="text-morandi-primary">
                          {start.toLocaleDateString('zh-TW', {
                            timeZone: taipeiTZ,
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long',
                          })}
                        </span>
                      </div>
                      {end && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock size={16} className="text-morandi-secondary" />
                          <span className="text-morandi-primary">
                            {start.toLocaleTimeString('zh-TW', {
                              timeZone: taipeiTZ,
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })}
                            {' - '}
                            {end.toLocaleTimeString('zh-TW', {
                              timeZone: taipeiTZ,
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })}
                          </span>
                        </div>
                      )}
                    </>
                  )
                }
              })()}
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
                <p className="text-sm text-morandi-primary">{event.extendedProps.description}</p>
              </div>
            )}

            {/* 操作按鈕 */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              {canEditOrDelete() && (
                <>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const confirmed = await confirm({
                        type: 'danger',
                        title: '刪除事件',
                        message: '確定要刪除這個事件嗎？',
                        details: ['此操作無法復原'],
                        confirmLabel: '確認刪除',
                        cancelLabel: '取消',
                      })
                      if (confirmed) {
                        onDelete(event.id)
                      }
                    }}
                    className="text-morandi-red hover:bg-morandi-red hover:text-white"
                  >
                    刪除
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onEdit(event)}
                    className="text-morandi-gold hover:bg-morandi-gold hover:text-white"
                  >
                    編輯
                  </Button>
                </>
              )}
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
