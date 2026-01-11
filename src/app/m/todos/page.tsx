'use client'

import { formatDate } from '@/lib/utils/format-date'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { TodoCard } from '@/components/mobile/cards'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/utils/logger'

interface DbTodo {
  id: string
  title: string
  notes: unknown
  status: string
  priority: number
  deadline: string | null
  assignee: string | null
}

interface DisplayTodo {
  id: string
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string | null
  tour_code: string | null
  assigned_to_name: string | null
}

type FilterType = 'all' | 'today' | 'week' | 'overdue' | 'completed'

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'today', label: '今日' },
  { value: 'week', label: '本週' },
  { value: 'overdue', label: '過期' },
  { value: 'completed', label: '已完成' },
]

// 轉換 priority 數字為字串
function priorityNumberToString(priority: number): 'low' | 'medium' | 'high' | 'urgent' {
  switch (priority) {
    case 4: return 'urgent'
    case 3: return 'high'
    case 2: return 'medium'
    default: return 'low'
  }
}

// 轉換資料庫格式為顯示格式
function formatTodo(todo: DbTodo): DisplayTodo {
  return {
    id: todo.id,
    title: todo.title,
    description: typeof todo.notes === 'string' ? todo.notes : null,
    status: todo.status as DisplayTodo['status'],
    priority: priorityNumberToString(todo.priority),
    due_date: todo.deadline,
    tour_code: null,
    assigned_to_name: todo.assignee,
  }
}

export default function MobileTodosPage() {
  const [todos, setTodos] = useState<DisplayTodo[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadTodos() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const weekEnd = new Date(today)
      weekEnd.setDate(weekEnd.getDate() + 7)

      let query = supabase
        .from('todos')
        .select('id, title, notes, status, priority, deadline, assignee')
        .order('priority', { ascending: false })
        .order('deadline', { ascending: true })

      // 根據篩選條件調整查詢
      switch (filter) {
        case 'today':
          query = query
            .in('status', ['pending', 'in_progress'])
            .eq('deadline', formatDate(today))
          break
        case 'week':
          query = query
            .in('status', ['pending', 'in_progress'])
            .gte('deadline', formatDate(today))
            .lte('deadline', formatDate(weekEnd))
          break
        case 'overdue':
          query = query
            .in('status', ['pending', 'in_progress'])
            .lt('deadline', formatDate(today))
          break
        case 'completed':
          query = query.eq('status', 'completed')
          break
        default:
          query = query.in('status', ['pending', 'in_progress'])
      }

      const { data, error } = await query.limit(50)

      if (error) {
        logger.error('Failed to load todos:', error)
      } else {
        setTodos((data as DbTodo[] || []).map(formatTodo))
      }
      setIsLoading(false)
    }

    loadTodos()
  }, [filter])

  const handleToggle = async (todoId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'

    const { error } = await supabase
      .from('todos')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', todoId)

    if (error) {
      // 顯示錯誤訊息
      const { toast } = await import('sonner')
      toast.error('更新失敗，請稍後再試')
    } else {
      setTodos((prev) =>
        prev.map((t) => (t.id === todoId ? { ...t, status: newStatus as DisplayTodo['status'] } : t))
      )
    }
  }

  // 分組待辦
  const groupedTodos = {
    urgent: todos.filter((t) => t.priority === 'urgent' && t.status !== 'completed'),
    high: todos.filter((t) => t.priority === 'high' && t.status !== 'completed'),
    normal: todos.filter(
      (t) => (t.priority === 'medium' || t.priority === 'low') && t.status !== 'completed'
    ),
    completed: todos.filter((t) => t.status === 'completed'),
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/m"
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-morandi-container transition-colors -ml-2"
            >
              <ArrowLeft size={20} className="text-morandi-primary" />
            </Link>
            <h1 className="text-lg font-bold text-morandi-primary">待辦事項</h1>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-morandi-gold text-white">
            <Plus size={20} />
          </button>
        </div>

        {/* 篩選標籤 */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                filter === f.value
                  ? 'bg-morandi-gold text-white'
                  : 'bg-morandi-container text-morandi-secondary hover:bg-morandi-container/80'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 內容 */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-morandi-gold" />
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-12 text-morandi-secondary">
            沒有待辦事項
          </div>
        ) : (
          <div className="space-y-6">
            {/* 緊急 */}
            {groupedTodos.urgent.length > 0 && (
              <section>
                <h3 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                  🔴 緊急 ({groupedTodos.urgent.length})
                </h3>
                <div className="space-y-2">
                  {groupedTodos.urgent.map((todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      onToggle={() => handleToggle(todo.id, todo.status)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 高優先 */}
            {groupedTodos.high.length > 0 && (
              <section>
                <h3 className="text-sm font-medium text-orange-600 mb-2 flex items-center gap-2">
                  🟠 高優先 ({groupedTodos.high.length})
                </h3>
                <div className="space-y-2">
                  {groupedTodos.high.map((todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      onToggle={() => handleToggle(todo.id, todo.status)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 一般 */}
            {groupedTodos.normal.length > 0 && (
              <section>
                <h3 className="text-sm font-medium text-morandi-secondary mb-2">
                  一般 ({groupedTodos.normal.length})
                </h3>
                <div className="space-y-2">
                  {groupedTodos.normal.map((todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      onToggle={() => handleToggle(todo.id, todo.status)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 已完成 */}
            {filter === 'completed' && groupedTodos.completed.length > 0 && (
              <section>
                <h3 className="text-sm font-medium text-morandi-secondary mb-2">
                  已完成 ({groupedTodos.completed.length})
                </h3>
                <div className="space-y-2">
                  {groupedTodos.completed.map((todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      onToggle={() => handleToggle(todo.id, todo.status)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
