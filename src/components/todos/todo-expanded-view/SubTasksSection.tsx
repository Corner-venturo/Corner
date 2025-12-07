'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'
import { Check, X, CheckCircle, Edit2, Calendar, CalendarCheck } from 'lucide-react'
import { generateUUID } from '@/lib/utils/uuid'
import { SubTasksSectionProps } from './types'
import { useCalendarEventStore } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { logger } from '@/lib/utils/logger'

export function SubTasksSection({ todo, onUpdate, readOnly = false }: SubTasksSectionProps) {
  const [newSubTask, setNewSubTask] = useState('')
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null)
  const [editingSubTaskContent, setEditingSubTaskContent] = useState('')

  // 行事曆相關
  const [calendarDialog, setCalendarDialog] = useState<{
    open: boolean
    subTaskId: string
    subTaskTitle: string
  }>({ open: false, subTaskId: '', subTaskTitle: '' })
  const [calendarDate, setCalendarDate] = useState('')
  const [calendarTime, setCalendarTime] = useState('')
  const { create: createCalendarEvent } = useCalendarEventStore()
  const { user } = useAuthStore()

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
        title: calendarDialog.subTaskTitle,
        description: `來自待辦事項：${todo.title}`,
        start: startDateTime,
        end: endDateTime,
        all_day: !calendarTime,
        type: 'task',
        visibility: 'company',
        owner_id: user.id,
        created_by: user.id,
      })

      // 更新子任務的 calendar_event_id
      if (newEvent?.id) {
        const updatedSubTasks = (todo.sub_tasks || []).map(task =>
          task.id === calendarDialog.subTaskId
            ? { ...task, calendar_event_id: newEvent.id }
            : task
        )
        onUpdate({ sub_tasks: updatedSubTasks })
      }

      logger.log('[SubTask] 已新增行事曆事件:', newEvent?.id)
      setCalendarDialog({ open: false, subTaskId: '', subTaskTitle: '' })
      setCalendarDate('')
      setCalendarTime('')
    } catch (error) {
      logger.error('[SubTask] 新增行事曆失敗:', error)
    }
  }

  const addSubTask = () => {
    if (!newSubTask.trim()) return

    const newTask = {
      id: generateUUID(),
      title: newSubTask,
      done: false,
    }

    // 如果目前狀態是「待辦」，自動切換到「進行中」
    const updates: Partial<typeof todo> = {
      sub_tasks: [...(todo.sub_tasks || []), newTask],
    }

    if (todo.status === 'pending') {
      updates.status = 'in_progress'
    }

    onUpdate(updates)
    setNewSubTask('')
  }

  const { handleKeyDown: handleSubTaskKeyDown, compositionProps: subTaskCompositionProps } =
    useEnterSubmit(addSubTask)

  const toggleSubTask = (taskId: string) => {
    const updatedSubTasks = (todo.sub_tasks || []).map(task =>
      task.id === taskId
        ? {
            ...task,
            done: !task.done,
            completed_at: !task.done ? new Date().toISOString() : undefined,
          }
        : task
    )

    onUpdate({ sub_tasks: updatedSubTasks })
  }

  const completedSubTasks = (todo.sub_tasks || []).filter(task => task.done).length

  return (
    <div className="mb-4 bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-morandi-primary flex items-center gap-1.5">
          <CheckCircle size={14} className="text-morandi-gold" />
          子任務清單
        </h4>
        <span className="text-xs text-morandi-primary bg-morandi-gold/10 border border-morandi-gold/20 px-2 py-1 rounded-lg font-medium">
          {completedSubTasks}/{(todo.sub_tasks || []).length}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        {(todo.sub_tasks || []).map(task => (
          <div
            key={task.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-morandi-container/10 hover:bg-morandi-container/20 transition-colors border border-transparent hover:border-morandi-gold/20 group relative"
          >
            {editingSubTaskId === task.id ? (
              // 編輯模式
              <>
                <button
                  onClick={() => toggleSubTask(task.id)}
                  className={cn(
                    'w-4 h-4 rounded border-2 transition-all flex items-center justify-center shadow-sm flex-shrink-0',
                    task.done
                      ? 'bg-morandi-gold border-morandi-gold scale-110'
                      : 'border-morandi-muted hover:border-morandi-gold bg-white'
                  )}
                >
                  {task.done && <Check size={12} className="text-white" />}
                </button>
                <Input
                  value={editingSubTaskContent}
                  onChange={e => setEditingSubTaskContent(e.target.value)}
                  className="text-xs h-7 flex-1"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const updatedSubTasks = (todo.sub_tasks || []).map(t =>
                      t.id === task.id ? { ...t, title: editingSubTaskContent } : t
                    )
                    onUpdate({ sub_tasks: updatedSubTasks })
                    setEditingSubTaskId(null)
                  }}
                  className="bg-morandi-gold hover:bg-morandi-gold/90 h-7 text-xs px-2"
                >
                  儲存
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingSubTaskId(null)}
                  className="h-7 text-xs px-2"
                >
                  取消
                </Button>
              </>
            ) : (
              // 顯示模式
              <>
                <button
                  onClick={() => toggleSubTask(task.id)}
                  className={cn(
                    'w-4 h-4 rounded border-2 transition-all flex items-center justify-center shadow-sm flex-shrink-0',
                    task.done
                      ? 'bg-morandi-gold border-morandi-gold scale-110'
                      : 'border-morandi-muted hover:border-morandi-gold bg-white'
                  )}
                >
                  {task.done && <Check size={12} className="text-white" />}
                </button>
                <span
                  className={cn(
                    'text-xs flex-1 font-medium',
                    task.done ? 'line-through text-morandi-muted' : 'text-morandi-primary'
                  )}
                >
                  {task.title}
                </span>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {/* 行事曆按鈕 */}
                  {task.calendar_event_id ? (
                    <span
                      className="p-1 text-emerald-600"
                      title="已加入行事曆"
                    >
                      <CalendarCheck size={12} />
                    </span>
                  ) : !readOnly && (
                    <button
                      onClick={() => setCalendarDialog({
                        open: true,
                        subTaskId: task.id,
                        subTaskTitle: task.title,
                      })}
                      className="p-1 hover:bg-blue-100 rounded text-morandi-secondary hover:text-blue-600"
                      title="加入行事曆"
                    >
                      <Calendar size={12} />
                    </button>
                  )}
                  {!readOnly && (
                    <>
                      <button
                        onClick={() => {
                          setEditingSubTaskId(task.id)
                          setEditingSubTaskContent(task.title)
                        }}
                        className="p-1 hover:bg-morandi-gold/10 rounded text-morandi-secondary hover:text-morandi-gold"
                        title="編輯子任務"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => {
                          const updatedSubTasks = (todo.sub_tasks || []).filter(t => t.id !== task.id)
                          onUpdate({ sub_tasks: updatedSubTasks })
                        }}
                        className="p-1 hover:bg-morandi-red/10 rounded text-morandi-red"
                        title="刪除子任務"
                      >
                        <X size={12} />
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 新增子任務區域 - 唯讀模式隱藏 */}
      {!readOnly && (
        <div className="flex gap-1.5">
          <Input
            placeholder="新增子任務..."
            value={newSubTask}
            onChange={e => setNewSubTask(e.target.value)}
            onKeyDown={handleSubTaskKeyDown}
            {...subTaskCompositionProps}
            className="text-xs h-8 border-morandi-container/30 focus-visible:ring-morandi-gold"
          />
          <Button size="sm" onClick={addSubTask} className="bg-morandi-gold hover:bg-morandi-gold/90 h-8 px-2.5 text-xs">
            新增
          </Button>
        </div>
      )}

      {/* 行事曆 Dialog */}
      <Dialog open={calendarDialog.open} onOpenChange={(open) => {
        if (!open) {
          setCalendarDialog({ open: false, subTaskId: '', subTaskTitle: '' })
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
                {calendarDialog.subTaskTitle}
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
                  setCalendarDialog({ open: false, subTaskId: '', subTaskTitle: '' })
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
  )
}
