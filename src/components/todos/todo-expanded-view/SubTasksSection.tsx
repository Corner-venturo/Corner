'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'
import { Check, X, CheckCircle, Edit2 } from 'lucide-react'
import { generateUUID } from '@/lib/utils/uuid'
import { SubTasksSectionProps } from './types'

export function SubTasksSection({ todo, onUpdate }: SubTasksSectionProps) {
  const [newSubTask, setNewSubTask] = useState('')
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null)
  const [editingSubTaskContent, setEditingSubTaskContent] = useState('')

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
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="新增子任務... (Enter)"
          value={newSubTask}
          onChange={e => setNewSubTask(e.target.value)}
          onKeyDown={handleSubTaskKeyDown}
          {...subTaskCompositionProps}
          className="text-sm border-morandi-container/30 focus-visible:ring-morandi-gold"
        />
        <Button size="sm" onClick={addSubTask} className="bg-morandi-gold hover:bg-morandi-gold/90">
          新增
        </Button>
      </div>
    </div>
  )
}
