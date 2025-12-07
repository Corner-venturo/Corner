'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputIME } from '@/components/ui/input-ime'
import { StarRating } from '@/components/ui/star-rating'
import { Check, Calendar, CalendarCheck, X, Eye } from 'lucide-react'
import { TodoExpandedViewProps } from './types'
import { useTodoExpandedView } from './useTodoExpandedView'
import { SubTasksSection } from './SubTasksSection'
import { NotesSection } from './NotesSection'
import { AssignmentSection } from './AssignmentSection'
import { QuickActionsSection, QuickActionContent } from './QuickActionsSection'
import { useAuthStore } from '@/stores/auth-store'
import { useCalendarEventStore } from '@/stores'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { logger } from '@/lib/utils/logger'

export function TodoExpandedView({ todo, onUpdate, onClose }: TodoExpandedViewProps) {
  const { activeTab, setActiveTab } = useTodoExpandedView()
  const { user } = useAuthStore()
  const { create: createCalendarEvent } = useCalendarEventStore()

  // 行事曆 Dialog 狀態
  const [calendarDialog, setCalendarDialog] = useState(false)
  const [calendarDate, setCalendarDate] = useState('')
  const [calendarTime, setCalendarTime] = useState('')

  // 新增行事曆事件
  const handleAddToCalendar = async () => {
    if (!calendarDate || !user?.id) return

    try {
      const tzOffset = '+08:00'
      const startDateTime = calendarTime
        ? `${calendarDate}T${calendarTime}:00${tzOffset}`
        : `${calendarDate}T09:00:00${tzOffset}`

      // 結束時間預設 1 小時後
      const endHour = calendarTime ? parseInt(calendarTime.split(':')[0]) + 1 : 10
      const endTime = `${String(endHour).padStart(2, '0')}:${calendarTime?.split(':')[1] || '00'}`
      const endDateTime = `${calendarDate}T${endTime}:00${tzOffset}`

      const newEvent = await createCalendarEvent({
        title: todo.title,
        description: `待辦事項：${todo.title}`,
        start: startDateTime,
        end: endDateTime,
        all_day: !calendarTime,
        type: 'task',
        visibility: 'company',
        owner_id: user.id,
        created_by: user.id,
      })

      // 更新待辦事項的 calendar_event_id
      if (newEvent?.id) {
        onUpdate({ calendar_event_id: newEvent.id })
      }

      logger.log('[Todo] 已新增行事曆事件:', newEvent?.id)
      setCalendarDialog(false)
      setCalendarDate('')
      setCalendarTime('')
    } catch (error) {
      logger.error('[Todo] 新增行事曆失敗:', error)
    }
  }

  if (!todo) {
    return null
  }

  // 判斷是否可編輯：建立者或在 visibility 列表中
  const currentUserId = user?.id
  const isCreator = todo.creator === currentUserId
  const isInVisibility = todo.visibility?.includes(currentUserId || '')
  const canEdit = isCreator || isInVisibility

  // 唯讀模式的 onUpdate（什麼都不做）
  const readOnlyUpdate = () => {}

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-[900px] lg:max-w-[1200px] max-h-[95vh] sm:max-h-[85vh] flex flex-col relative border border-border"
        onClick={e => e.stopPropagation()}
      >
        {/* 右上角關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-1 right-1 z-10 p-1 hover:bg-morandi-red/10 hover:text-morandi-red transition-colors rounded-lg text-morandi-secondary"
          title="關閉"
        >
          <X size={16} />
        </button>

        {/* 唯讀提示 */}
        {!canEdit && (
          <div className="absolute top-1 left-1 z-10 flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-xs">
            <Eye size={12} />
            <span>唯讀模式</span>
          </div>
        )}

        {/* 主要內容區 */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden pt-2">
          {/* 左半部：詳情資料 */}
          <div className="w-full lg:w-1/2 px-4 sm:px-6 py-3 sm:py-4 border-b lg:border-b-0 lg:border-r border-border flex flex-col overflow-y-auto">
            {/* 標題與星級 */}
            <div className="mb-4 bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                {/* 左邊：標題 + 行事曆按鈕 */}
                <div className="flex-1 flex items-center gap-2">
                  {canEdit ? (
                    <InputIME
                      value={todo.title}
                      onChange={value => onUpdate({ title: value })}
                      className="text-lg font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent flex-1"
                      placeholder="輸入任務標題..."
                    />
                  ) : (
                    <div className="text-lg font-bold text-morandi-primary flex-1">{todo.title}</div>
                  )}
                  {/* 行事曆按鈕 */}
                  {todo.calendar_event_id ? (
                    <span className="p-1.5 text-emerald-600" title="已加入行事曆">
                      <CalendarCheck size={18} />
                    </span>
                  ) : canEdit && (
                    <button
                      onClick={() => setCalendarDialog(true)}
                      className="p-1.5 hover:bg-blue-100 rounded-lg text-morandi-secondary hover:text-blue-600 transition-colors"
                      title="加入行事曆"
                    >
                      <Calendar size={18} />
                    </button>
                  )}
                </div>

                {/* 右邊：優先級 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-morandi-secondary">優先級:</span>
                  <StarRating
                    value={todo.priority}
                    onChange={canEdit ? (value => onUpdate({ priority: value as 1 | 2 | 3 | 4 | 5 })) : undefined}
                    size="sm"
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>

            {/* 基本資訊 */}
            <AssignmentSection todo={todo} onUpdate={canEdit ? onUpdate : readOnlyUpdate} readOnly={!canEdit} />

            {/* 子任務清單 */}
            <SubTasksSection todo={todo} onUpdate={canEdit ? onUpdate : readOnlyUpdate} readOnly={!canEdit} />

            {/* 備註區 - 即使唯讀也可以留言 */}
            <NotesSection todo={todo} onUpdate={onUpdate} />
          </div>

          {/* 右半部：快速功能 */}
          <div className="w-full lg:w-1/2 px-4 sm:px-6 py-3 sm:py-4 flex flex-col overflow-y-auto">
            {/* 快速功能分頁 - 唯讀模式隱藏 */}
            {canEdit && (
              <>
                <QuickActionsSection activeTab={activeTab} onTabChange={setActiveTab} />

                {/* 分頁內容 */}
                <div className="flex-1 bg-card border border-border rounded-xl p-4 overflow-y-auto shadow-sm">
                  <QuickActionContent activeTab={activeTab} todo={todo} onUpdate={onUpdate} />
                </div>

                {/* 快速操作按鈕 */}
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => {
                      onUpdate({ status: 'completed', completed: true })
                      onClose()
                    }}
                    className="flex-1 bg-gradient-to-r from-morandi-gold to-yellow-400 hover:from-morandi-gold/90 hover:to-yellow-400/90 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <Check size={16} className="mr-1" />
                    標記完成
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newDeadline = new Date()
                      newDeadline.setDate(newDeadline.getDate() + 7)
                      onUpdate({ deadline: newDeadline.toISOString().split('T')[0] })
                    }}
                    className="flex-1 border-morandi-container/50 hover:bg-morandi-container/20 hover:border-morandi-gold/20 shadow-sm transition-all"
                  >
                    <Calendar size={16} className="mr-1" />
                    延期一週
                  </Button>
                </div>
              </>
            )}

            {/* 唯讀模式顯示提示 */}
            {!canEdit && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-morandi-secondary">
                  <Eye size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">這是公開的待辦事項</p>
                  <p className="text-xs mt-1">只有建立者和共享者可以編輯</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 行事曆 Dialog */}
        <Dialog open={calendarDialog} onOpenChange={(open) => {
          if (!open) {
            setCalendarDialog(false)
            setCalendarDate('')
            setCalendarTime('')
          }
        }}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-blue-600" />
                加入行事曆
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-morandi-secondary mb-1 block">任務名稱</label>
                <div className="text-sm font-medium text-morandi-primary bg-morandi-container/10 px-3 py-2 rounded-lg">
                  {todo.title}
                </div>
              </div>
              <div>
                <label className="text-xs text-morandi-secondary mb-1 block">日期 *</label>
                <Input
                  type="date"
                  value={calendarDate}
                  onChange={e => setCalendarDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-morandi-secondary mb-1 block">時間（可選）</label>
                <Input
                  type="time"
                  value={calendarTime}
                  onChange={e => setCalendarTime(e.target.value)}
                  className="h-9 text-sm"
                  placeholder="不填則為全天"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => {
                    setCalendarDialog(false)
                    setCalendarDate('')
                    setCalendarTime('')
                  }}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-8 bg-blue-600 hover:bg-blue-700"
                  onClick={handleAddToCalendar}
                  disabled={!calendarDate}
                >
                  建立
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
}
