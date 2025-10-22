'use client';

import React, { useState } from 'react';
import { Todo } from '@/stores/types';
import { useTodoStore } from '@/stores';
import { Calendar, Clock, AlertTriangle, CheckCircle2, Star, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TodoCardGroupsProps {
  todos: Todo[];
  groupBy: 'date' | 'priority' | 'status';
  onTodoClick?: (todo: Todo) => void;
  onEdit?: (todo: Todo) => void;
}

export function TodoCardGroups({ todos, groupBy, onTodoClick, onEdit }: TodoCardGroupsProps) {
  const todoStore = useTodoStore();
  const updateTodo = todoStore.update;
  const deleteTodo = todoStore.delete;
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // 按日期分組：今天、本週、稍後
  const groupByDate = (todos: Todo[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);

    const groups: Record<string, Todo[]> = {
      '今天': [],
      '本週': [],
      '稍後': [],
      '已完成': []
    };

    todos.forEach(todo => {
      if (todo.status === 'completed') {
        groups['已完成'].push(todo);
      } else if (todo.deadline) {
        const deadline = new Date(todo.deadline);
        deadline.setHours(0, 0, 0, 0);

        if (deadline <= todayEnd) {
          groups['今天'].push(todo);
        } else if (deadline <= weekEnd) {
          groups['本週'].push(todo);
        } else {
          groups['稍後'].push(todo);
        }
      } else {
        groups['稍後'].push(todo);
      }
    });

    return groups;
  };

  // 按優先級分組：緊急、重要、一般
  const groupByPriority = (todos: Todo[]) => {
    const groups: Record<string, Todo[]> = {
      '緊急': [],
      '重要': [],
      '一般': [],
      '已完成': []
    };

    todos.forEach(todo => {
      if (todo.status === 'completed') {
        groups['已完成'].push(todo);
      } else if (todo.priority >= 4) {
        groups['緊急'].push(todo);
      } else if (todo.priority >= 2) {
        groups['重要'].push(todo);
      } else {
        groups['一般'].push(todo);
      }
    });

    return groups;
  };

  // 按狀態分組：待辦、進行中、已完成
  const groupByStatus = (todos: Todo[]) => {
    const groups: Record<string, Todo[]> = {
      '待辦': [],
      '進行中': [],
      '已完成': []
    };

    todos.forEach(todo => {
      if (todo.status === 'pending') {
        groups['待辦'].push(todo);
      } else if (todo.status === 'in_progress') {
        groups['進行中'].push(todo);
      } else if (todo.status === 'completed') {
        groups['已完成'].push(todo);
      }
    });

    return groups;
  };

  const groups =
    groupBy === 'date' ? groupByDate(todos) :
    groupBy === 'priority' ? groupByPriority(todos) :
    groupByStatus(todos);

  const getGroupColor = (groupName: string) => {
    const colors: Record<string, string> = {
      '今天': 'border-morandi-red',
      '本週': 'border-morandi-gold',
      '稍後': 'border-morandi-secondary',
      '緊急': 'border-morandi-red',
      '重要': 'border-morandi-gold',
      '一般': 'border-morandi-secondary',
      '待辦': 'border-morandi-blue',
      '進行中': 'border-morandi-gold',
      '已完成': 'border-morandi-green'
    };
    return colors[groupName] || 'border-border';
  };

  const getGroupIcon = (groupName: string) => {
    const icons: Record<string, React.ElementType> = {
      '今天': AlertTriangle,
      '本週': Calendar,
      '稍後': Clock,
      '緊急': AlertTriangle,
      '重要': Star,
      '一般': Calendar,
      '待辦': Clock,
      '進行中': Calendar,
      '已完成': CheckCircle2
    };
    return icons[groupName] || Calendar;
  };

  const toggleCollapse = (groupName: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const handleToggleComplete = (todo: Todo, e: React.MouseEvent) => {
    e.stopPropagation();
    updateTodo(todo.id, {
      status: todo.status === 'completed' ? 'pending' : 'completed'
    });
  };

  const getDeadlineInfo = (deadline?: string) => {
    if (!deadline) return null;

    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `逾期 ${Math.abs(diffDays)} 天`, color: 'text-morandi-red' };
    } else if (diffDays === 0) {
      return { text: '今天到期', color: 'text-orange-500' };
    } else if (diffDays === 1) {
      return { text: '明天到期', color: 'text-yellow-600' };
    } else if (diffDays <= 3) {
      return { text: `${diffDays} 天內`, color: 'text-yellow-600' };
    } else {
      return { text: new Date(deadline).toLocaleDateString('zh-TW'), color: 'text-morandi-secondary' };
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([groupName, groupTodos]) => {
        if (groupTodos.length === 0) return null;

        const Icon = getGroupIcon(groupName);
        const isCollapsed = collapsedGroups.has(groupName);

        return (
          <div key={groupName} className="space-y-3">
            {/* 分組標題 */}
            <div
              className={cn(
                'flex items-center justify-between px-4 py-2 rounded-lg border-l-4 bg-morandi-container/20 cursor-pointer',
                getGroupColor(groupName)
              )}
              onClick={() => toggleCollapse(groupName)}
            >
              <div className="flex items-center space-x-3">
                <Icon size={20} className="text-morandi-primary" />
                <h3 className="font-semibold text-morandi-primary">{groupName}</h3>
                <span className="px-2 py-0.5 bg-morandi-container rounded-full text-xs text-morandi-secondary">
                  {groupTodos.length}
                </span>
              </div>
              {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </div>

            {/* 待辦卡片列表 */}
            {!isCollapsed && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupTodos.map((todo) => {
                  const deadlineInfo = getDeadlineInfo(todo.deadline);
                  const isOverdue = deadlineInfo?.color === 'text-morandi-red';

                  return (
                    <div
                      key={todo.id}
                      onClick={() => onTodoClick?.(todo)}
                      className={cn(
                        'group bg-card border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md',
                        'hover:border-morandi-gold',
                        isOverdue && 'border-morandi-red border-2',
                        todo.status === 'completed' && 'opacity-60'
                      )}
                    >
                      {/* 頭部：勾選框和優先級 */}
                      <div className="flex items-start justify-between mb-3">
                        <button
                          onClick={(e) => handleToggleComplete(todo, e)}
                          className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                            todo.status === 'completed'
                              ? 'bg-morandi-green border-morandi-green'
                              : 'border-morandi-secondary hover:border-morandi-gold'
                          )}
                        >
                          {todo.status === 'completed' && (
                            <CheckCircle2 size={14} className="text-white" />
                          )}
                        </button>

                        {/* 優先級星星 */}
                        <div className="flex space-x-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={cn(
                                i < todo.priority ? 'fill-morandi-gold text-morandi-gold' : 'text-morandi-container'
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      {/* 標題 */}
                      <h4 className={cn(
                        'font-medium text-morandi-primary mb-2 line-clamp-2',
                        todo.status === 'completed' && 'line-through'
                      )}>
                        {todo.title}
                      </h4>

                      {/* 備註（使用第一條 note） */}
                      {todo.notes && todo.notes.length > 0 && (
                        <p className="text-sm text-morandi-secondary line-clamp-2 mb-3">
                          {todo.notes[0].content}
                        </p>
                      )}

                      {/* 截止日期 */}
                      {deadlineInfo && (
                        <div className={cn('flex items-center space-x-1 text-xs mb-3', deadlineInfo.color)}>
                          <Calendar size={12} />
                          <span>{deadlineInfo.text}</span>
                        </div>
                      )}

                      {/* 關聯項目標籤 */}
                      {todo.related_items && todo.related_items.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {todo.related_items.slice(0, 2).map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-morandi-container rounded text-xs text-morandi-secondary"
                            >
                              {item.type === 'group' && '🎫'}
                              {item.type === 'order' && '📋'}
                              {item.type === 'quote' && '💰'}
                              {item.type === 'invoice' && '🧾'}
                              {item.type === 'receipt' && '🧾'}
                            </span>
                          ))}
                          {todo.related_items.length > 2 && (
                            <span className="px-2 py-0.5 bg-morandi-container rounded text-xs text-morandi-secondary">
                              +{todo.related_items.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 操作按鈕 */}
                      <div className="flex items-center justify-between pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-xs text-morandi-secondary">
                          {todo.assignee || '未指派'}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit?.(todo);
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('確定要刪除這個待辦事項嗎？')) {
                                deleteTodo(todo.id);
                              }
                            }}
                            className="h-7 w-7 p-0 text-morandi-red"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* 空狀態 */}
      {Object.values(groups).every(g => g.length === 0) && (
        <div className="text-center py-16 text-morandi-secondary">
          <CheckCircle2 size={64} className="mx-auto mb-6 opacity-30" />
          <p className="text-xl font-medium text-morandi-primary mb-3">
            沒有待辦事項
          </p>
          <p className="text-morandi-secondary">
            點擊右上角「新增待辦」開始建立
          </p>
        </div>
      )}
    </div>
  );
}
