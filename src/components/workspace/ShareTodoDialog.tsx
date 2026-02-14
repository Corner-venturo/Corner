'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTodos, updateTodo, useEmployeesSlim } from '@/data'
import { useWorkspaceChat } from '@/stores/workspace-store'
import { useAuthStore } from '@/stores/auth-store'
import { Send, CheckCircle2, AlertCircle, Search, X, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { DateCell } from '@/components/table-cells'
import { formatDateTW } from '@/lib/utils/format-date'
import type { Todo } from '@/stores/types'
import { alert } from '@/lib/ui/alert-dialog'
import { COMP_WORKSPACE_LABELS } from './constants/labels'

interface ShareTodoDialogProps {
  channelId: string
  onClose: () => void
  onSuccess: () => void
}

export function ShareTodoDialog({ channelId, onClose, onSuccess }: ShareTodoDialogProps) {
  const { items: todos } = useTodos()
  const { items: employees } = useEmployeesSlim()
  const { sendMessage } = useWorkspaceChat()
  const { user } = useAuthStore()

  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null)
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedTodo = todos.find(t => t.id === selectedTodoId)

  // 過濾未完成的代辦事項
  const pendingTodos = todos.filter(
    t =>
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      (!searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleShare = async () => {
    if (!selectedTodo || !user) {
      return
    }

    setIsSubmitting(true)

    try {
      // 1. 如果選擇了指派對象，先更新代辦事項
      if (selectedAssignee && selectedAssignee !== selectedTodo.assignee) {
        await updateTodo(selectedTodo.id, { assignee: selectedAssignee })
      }

      // 2. 建立訊息內容
      const assigneeInfo = selectedAssignee ? employees.find(e => e.id === selectedAssignee) : null

      const message =
        `📋 **共享代辦事項**\n\n` +
        `**標題：** ${selectedTodo.title}\n` +
        `**優先級：** ${'⭐'.repeat(selectedTodo.priority)}\n` +
        `**截止日期：** ${selectedTodo.deadline ? formatDateTW(new Date(selectedTodo.deadline)) : COMP_WORKSPACE_LABELS.無}\n` +
        `**狀態：** ${getStatusLabel(selectedTodo.status)}\n` +
        (assigneeInfo ? `**指派給：** ${assigneeInfo.display_name}\n` : '') +
        `\n👉 [查看詳細](#/todos/${selectedTodo.id})`

      await sendMessage({
        channel_id: channelId,
        author_id: user.id,
        content: message,
      } as Parameters<typeof sendMessage>[0])

      onSuccess()
    } catch (error) {
      void alert(COMP_WORKSPACE_LABELS.分享失敗_請稍後再試, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusLabel = (status: Todo['status']) => {
    const labels = {
      pending: COMP_WORKSPACE_LABELS.待處理,
      in_progress: COMP_WORKSPACE_LABELS.進行中,
      completed: COMP_WORKSPACE_LABELS.已完成,
      cancelled: COMP_WORKSPACE_LABELS.已取消,
    }
    return labels[status]
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-status-danger'
    if (priority === 3) return 'text-status-warning'
    return 'text-morandi-secondary'
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent level={1} className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{COMP_WORKSPACE_LABELS.LABEL_1307}</DialogTitle>
          <DialogDescription>{COMP_WORKSPACE_LABELS.SELECT_8547}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4 py-4">
          {/* 搜尋 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-morandi-secondary" />
            <Input
              placeholder={COMP_WORKSPACE_LABELS.搜尋代辦事項}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 代辦事項列表 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-morandi-primary">
              選擇代辦事項 ({pendingTodos.length})
            </label>
            <div className="border border-morandi-gold/20 rounded-lg max-h-64 overflow-y-auto">
              {pendingTodos.length === 0 ? (
                <div className="p-4 text-center text-morandi-secondary text-sm">
                  {searchQuery ? COMP_WORKSPACE_LABELS.沒有符合的代辦事項 : COMP_WORKSPACE_LABELS.沒有待處理的代辦事項}
                </div>
              ) : (
                <div className="divide-y divide-morandi-gold/10">
                  {pendingTodos.map(todo => (
                    <button
                      key={todo.id}
                      onClick={() => setSelectedTodoId(todo.id)}
                      className={cn(
                        'w-full p-3 text-left transition-colors hover:bg-morandi-container/30',
                        selectedTodoId === todo.id &&
                          'bg-morandi-gold/10 border-l-2 border-morandi-gold'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {selectedTodoId === todo.id ? (
                          <CheckCircle2 className="w-4 h-4 text-morandi-gold flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-4 h-4 rounded border border-morandi-gold/30 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-morandi-primary truncate">
                            {todo.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn('text-xs', getPriorityColor(todo.priority))}>
                              {'⭐'.repeat(todo.priority)}
                            </span>
                            {todo.deadline && (
                              <span className="text-xs text-morandi-secondary flex items-center gap-1">
                                <DateCell date={todo.deadline} showIcon={false} className="text-xs text-morandi-secondary" />
                              </span>
                            )}
                            {todo.assignee && (
                              <span className="text-xs text-morandi-secondary">
                                👤{' '}
                                {employees.find(e => e.id === todo.assignee)?.display_name ||
                                  COMP_WORKSPACE_LABELS.未知}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 指派對象（可選） */}
          {selectedTodo && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">{COMP_WORKSPACE_LABELS.LABEL_2777}</label>
              <div className="border border-morandi-gold/20 rounded-lg max-h-48 overflow-y-auto">
                {employees.length === 0 ? (
                  <div className="p-4 text-center text-morandi-secondary text-sm">
                    {COMP_WORKSPACE_LABELS.LOADING_1730}
                  </div>
                ) : (
                  <div className="divide-y divide-morandi-gold/10">
                    <button
                      onClick={() => setSelectedAssignee(null)}
                      className={cn(
                        'w-full p-2 text-left transition-colors hover:bg-morandi-container/30',
                        !selectedAssignee && 'bg-morandi-gold/10'
                      )}
                    >
                      <span className="text-sm text-morandi-secondary">{COMP_WORKSPACE_LABELS.LABEL_802}</span>
                    </button>
                    {employees.map(employee => (
                      <button
                        key={employee.id}
                        onClick={() => setSelectedAssignee(employee.id)}
                        className={cn(
                          'w-full p-2 text-left transition-colors hover:bg-morandi-container/30',
                          selectedAssignee === employee.id &&
                            'bg-morandi-gold/10 border-l-2 border-morandi-gold'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {selectedAssignee === employee.id ? (
                            <CheckCircle2 className="w-4 h-4 text-morandi-gold" />
                          ) : (
                            <div className="w-4 h-4 rounded border border-morandi-gold/30" />
                          )}
                          <span className="text-sm text-morandi-primary">
                            {employee.display_name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 預覽 */}
          {selectedTodo && (
            <div className="bg-morandi-gold/5 border border-morandi-gold/20 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-morandi-secondary uppercase">{COMP_WORKSPACE_LABELS.PREVIEW}</p>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-morandi-primary">{selectedTodo.title}</p>
                <p className="text-morandi-secondary">
                  優先級：{' '}
                  <span className={getPriorityColor(selectedTodo.priority)}>
                    {'⭐'.repeat(selectedTodo.priority)}
                  </span>
                </p>
                {selectedTodo.deadline && (
                  <div className="text-morandi-secondary flex items-center gap-1">
                    <span>{COMP_WORKSPACE_LABELS.LABEL_2566}</span>
                    <DateCell date={selectedTodo.deadline} showIcon={false} className="text-morandi-secondary" />
                  </div>
                )}
                {selectedAssignee && (
                  <p className="text-morandi-secondary">
                    指派給：{employees.find(e => e.id === selectedAssignee)?.display_name}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="gap-1">
            <X size={16} />
            {COMP_WORKSPACE_LABELS.CANCEL}
          </Button>
          <Button onClick={handleShare} disabled={!selectedTodo || isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {COMP_WORKSPACE_LABELS.LABEL_2105}
              </>
            ) : (
              <>
                <Share2 size={16} />
                {COMP_WORKSPACE_LABELS.LABEL_903}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
