'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'
import { Plus, Trash2, Calendar, CalendarCheck } from 'lucide-react'
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
  const totalSubTasks = (todo.sub_tasks || []).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-serif font-bold text-[#333333]">子任務</h3>
        <span className="text-xs text-[#8C8C8C]">{completedSubTasks} / {totalSubTasks} 已完成</span>
      </div>

      <div className="space-y-3">
        {(todo.sub_tasks || []).map(task => (
          <div key={task.id} className="flex items-start gap-3 group">
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleSubTask(task.id)}
              disabled={readOnly}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-[#C9D4C5] focus:ring-[#C9D4C5] cursor-pointer"
            />

            {/* Content */}
            <div className="flex-1">
              {editingSubTaskId === task.id ? (
                <input
                  type="text"
                  value={editingSubTaskContent}
                  onChange={e => setEditingSubTaskContent(e.target.value)}
                  onBlur={() => {
                    const updatedSubTasks = (todo.sub_tasks || []).map(t =>
                      t.id === task.id ? { ...t, title: editingSubTaskContent } : t
                    )
                    onUpdate({ sub_tasks: updatedSubTasks })
                    setEditingSubTaskId(null)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const updatedSubTasks = (todo.sub_tasks || []).map(t =>
                        t.id === task.id ? { ...t, title: editingSubTaskContent } : t
                      )
                      onUpdate({ sub_tasks: updatedSubTasks })
                      setEditingSubTaskId(null)
                    }
                  }}
                  className="w-full bg-transparent border-0 border-b border-[#B8A99A] focus:ring-0 p-0 text-sm text-[#333333]"
                  autoFocus
                />
              ) : (
                <span
                  className={cn(
                    'text-sm transition-colors cursor-pointer',
                    task.done ? 'text-[#8C8C8C] line-through' : 'text-[#333333]'
                  )}
                  onClick={() => {
                    if (!readOnly) {
                      setEditingSubTaskId(task.id)
                      setEditingSubTaskContent(task.title)
                    }
                  }}
                >
                  {task.title}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* 行事曆按鈕 */}
              {task.calendar_event_id ? (
                <span className="p-1 text-emerald-600" title="已加入行事曆">
                  <CalendarCheck size={14} />
                </span>
              ) : !readOnly && (
                <button
                  onClick={() => setCalendarDialog({
                    open: true,
                    subTaskId: task.id,
                    subTaskTitle: task.title,
                  })}
                  className="p-1 text-[#8C8C8C] hover:text-[#8FA9C2] transition-colors"
                  title="加入行事曆"
                >
                  <Calendar size={14} />
                </button>
              )}
              {!readOnly && (
                <button
                  onClick={() => {
                    const updatedSubTasks = (todo.sub_tasks || []).filter(t => t.id !== task.id)
                    onUpdate({ sub_tasks: updatedSubTasks })
                  }}
                  className="p-1 text-[#8C8C8C] hover:text-[#C77D7D] transition-colors"
                  title="刪除"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* 新增子任務 */}
        {!readOnly && (
          <button
            onClick={() => {
              const inputElement = document.getElementById('new-subtask-input')
              if (inputElement) inputElement.focus()
            }}
            className="flex items-center gap-2 text-sm text-[#B8A99A] font-semibold hover:text-[#9E8C7A] mt-2 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            新增子任務
          </button>
        )}

        {!readOnly && (
          <div className="flex items-center gap-2 mt-2">
            <input
              id="new-subtask-input"
              type="text"
              placeholder="輸入子任務內容..."
              value={newSubTask}
              onChange={e => setNewSubTask(e.target.value)}
              onKeyDown={handleSubTaskKeyDown}
              {...subTaskCompositionProps}
              className="flex-1 bg-transparent border-0 border-b border-transparent focus:border-[#B8A99A] focus:ring-0 p-0 text-sm text-[#333333] placeholder-gray-400"
            />
          </div>
        )}
      </div>

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
              <Calendar size={16} className="text-[#B8A99A]" />
              加入行事曆
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#8C8C8C] mb-1 block">任務名稱</label>
              <div className="text-sm font-medium text-[#333333] bg-[#F9F8F6] px-3 py-2 rounded-lg">
                {calendarDialog.subTaskTitle}
              </div>
            </div>
            <div>
              <label className="text-xs text-[#8C8C8C] mb-1 block">日期 *</label>
              <Input
                type="date"
                value={calendarDate}
                onChange={e => setCalendarDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#8C8C8C] mb-1 block">時間（可選）</label>
              <Input
                type="time"
                value={calendarTime}
                onChange={e => setCalendarTime(e.target.value)}
                className="h-9 text-sm"
                placeholder="不填則為全天"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                className="flex-1 h-9 px-4 rounded-lg border border-[#E8E4E0] text-[#333333] bg-white hover:bg-[#F9F8F6] transition-colors text-sm font-medium"
                onClick={() => {
                  setCalendarDialog({ open: false, subTaskId: '', subTaskTitle: '' })
                  setCalendarDate('')
                  setCalendarTime('')
                }}
              >
                取消
              </button>
              <button
                className="flex-1 h-9 px-4 rounded-lg bg-[#B8A99A] hover:bg-[#9E8C7A] text-white text-sm font-medium disabled:opacity-50"
                onClick={handleAddToCalendar}
                disabled={!calendarDate}
              >
                建立
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
