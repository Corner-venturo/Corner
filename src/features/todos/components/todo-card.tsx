'use client'
/**
 * TodoCard - 卡片式待辦事項組件
 * 支援共享待辦的顏色區分
 */


import React from 'react'
import { Star, Calendar, Users, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Todo } from '@/stores/types'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { TODO_STATUS_LABELS, COMMON_LABELS } from '@/features/todos/constants/labels'

interface TodoCardProps {
  todo: Todo
  currentUserId?: string
  onClick?: () => void
  onToggleComplete?: (e: React.MouseEvent) => void
  onDelete?: (e: React.MouseEvent) => void
  onEdit?: (e: React.MouseEvent) => void
}

export function TodoCard({
  todo,
  currentUserId,
  onClick,
  onToggleComplete,
  onDelete,
  onEdit,
}: TodoCardProps) {
  // 判斷是否為共享待辦（有指派給別人或有多個可見人員）
  const isShared =
    (todo.assignee && todo.assignee !== currentUserId) ||
    (todo.visibility && todo.visibility.length > 1)

  // 判斷是否完成
  const isCompleted = todo.status === 'completed'

  // 優先級顏色
  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-status-danger'
    if (priority === 3) return 'text-status-warning'
    return 'text-morandi-muted'
  }

  // 狀態標籤 - 使用 Morandi 配色
  const statusConfig = {
    pending: { label: TODO_STATUS_LABELS.pending, color: 'bg-morandi-container/30 text-morandi-secondary' },
    in_progress: { label: TODO_STATUS_LABELS.in_progress, color: 'bg-morandi-gold/20 text-morandi-gold' },
    completed: { label: TODO_STATUS_LABELS.completed, color: 'bg-morandi-green/20 text-morandi-green' },
    cancelled: { label: TODO_STATUS_LABELS.cancelled, color: 'bg-morandi-red/20 text-morandi-red' },
  }

  const status = statusConfig[todo.status]

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative p-4 rounded-lg border transition-all cursor-pointer',
        'hover:shadow-md hover:-translate-y-0.5',
        // 共享待辦使用淺藍色背景
        isShared
          ? 'bg-status-info-bg border-status-info/30 hover:bg-status-info-bg hover:border-status-info'
          : 'bg-card border-morandi-gold/20 hover:border-morandi-gold/40',
        // 已完成的待辦透明度降低
        isCompleted && 'opacity-60'
      )}
    >
      {/* 頂部：標題 + 優先級 */}
      <div className="flex items-start gap-3 mb-2">
        {/* 完成按鈕 */}
        <button
          onClick={onToggleComplete}
          className={cn(
            'mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all',
            isCompleted ? 'bg-status-success border-status-success' : 'border-border hover:border-status-success'
          )}
        >
          {isCompleted && <CheckCircle className="w-full h-full text-white" strokeWidth={3} />}
        </button>

        {/* 標題 */}
        <h3
          className={cn(
            'flex-1 font-medium text-morandi-primary',
            isCompleted && 'line-through text-morandi-muted'
          )}
        >
          {todo.title}
        </h3>

        {/* 優先級星星 */}
        <div className="flex gap-0.5 flex-shrink-0">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              size={14}
              className={cn(
                star <= (todo.priority || 3)
                  ? `fill-current ${getPriorityColor(todo.priority || 3)}`
                  : 'text-morandi-muted/60'
              )}
            />
          ))}
        </div>
      </div>

      {/* 中間：狀態 + 標籤 */}
      <div className="flex items-center gap-2 mb-3">
        {/* 狀態標籤 */}
        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', status.color)}>
          {status.label}
        </span>

        {/* 共享標籤 */}
        {isShared && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-status-info-bg text-status-info flex items-center gap-1">
            <Users size={12} />
            {COMMON_LABELS.shared}
          </span>
        )}
      </div>

      {/* 底部：截止日期 */}
      {todo.deadline && (
        <div className="flex items-center gap-1.5 text-xs text-morandi-secondary">
          <Calendar size={14} />
          <span>{format(new Date(todo.deadline), 'yyyy/MM/dd', { locale: zhTW })}</span>
        </div>
      )}

      {/* 懸浮顯示的操作按鈕（可選） */}
      {/* 如果需要快捷操作，可以在這裡添加 */}
    </div>
  )
}
