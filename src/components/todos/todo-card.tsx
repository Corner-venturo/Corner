/**
 * TodoCard - 卡片式待辦事項組件
 * 支援共享待辦的顏色區分
 */

'use client';

import React from 'react';
import { Star, Calendar, Users, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Todo } from '@/stores/types';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface TodoCardProps {
  todo: Todo;
  currentUserId?: string;
  onClick?: () => void;
  onToggleComplete?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
}

export function TodoCard({
  todo,
  currentUserId,
  onClick,
  onToggleComplete,
  onDelete,
  onEdit
}: TodoCardProps) {
  // 判斷是否為共享待辦（有指派給別人或有多個可見人員）
  const isShared = (todo.assignee && todo.assignee !== currentUserId) ||
    (todo.visibility && todo.visibility.length > 1);

  // 判斷是否完成
  const isCompleted = todo.status === 'completed';

  // 優先級顏色
  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-500';
    if (priority === 3) return 'text-orange-500';
    return 'text-gray-400';
  };

  // 狀態標籤
  const statusConfig = {
    pending: { label: '待辦', color: 'bg-gray-100 text-gray-600' },
    in_progress: { label: '進行中', color: 'bg-blue-100 text-blue-600' },
    completed: { label: '完成', color: 'bg-green-100 text-green-600' },
    cancelled: { label: '取消', color: 'bg-red-100 text-red-600' }
  };

  const status = statusConfig[todo.status];

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative p-4 rounded-lg border transition-all cursor-pointer',
        'hover:shadow-md hover:-translate-y-0.5',
        // 共享待辦使用淺藍色背景
        isShared
          ? 'bg-blue-50/50 border-blue-200/50 hover:bg-blue-50 hover:border-blue-300'
          : 'bg-white border-morandi-gold/20 hover:border-morandi-gold/40',
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
            isCompleted
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-green-400'
          )}
        >
          {isCompleted && (
            <CheckCircle className="w-full h-full text-white" strokeWidth={3} />
          )}
        </button>

        {/* 標題 */}
        <h3
          className={cn(
            'flex-1 font-medium text-morandi-primary',
            isCompleted && 'line-through text-gray-400'
          )}
        >
          {todo.title}
        </h3>

        {/* 優先級星星 */}
        <div className="flex gap-0.5 flex-shrink-0">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={14}
              className={cn(
                star <= (todo.priority || 3)
                  ? `fill-current ${getPriorityColor(todo.priority || 3)}`
                  : 'text-gray-300'
              )}
            />
          ))}
        </div>
      </div>

      {/* 中間：狀態 + 標籤 */}
      <div className="flex items-center gap-2 mb-3">
        {/* 狀態標籤 */}
        <span
          className={cn(
            'px-2 py-0.5 rounded text-xs font-medium',
            status.color
          )}
        >
          {status.label}
        </span>

        {/* 共享標籤 */}
        {isShared && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-600 flex items-center gap-1">
            <Users size={12} />
            共享
          </span>
        )}
      </div>

      {/* 底部：截止日期 */}
      {todo.deadline && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar size={14} />
          <span>
            {format(new Date(todo.deadline), 'yyyy/MM/dd', { locale: zhTW })}
          </span>
        </div>
      )}

      {/* 懸浮顯示的操作按鈕（可選） */}
      {/* 如果需要快捷操作，可以在這裡添加 */}
    </div>
  );
}
