'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTodoStore } from '@/stores';
import { useUserStore } from '@/stores/user-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { Send, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import type { Todo } from '@/stores/types';

interface ShareTodoDialogProps {
  channelId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ShareTodoDialog({ channelId, onClose, onSuccess }: ShareTodoDialogProps) {
  const { items: todos, updateItem } = useTodoStore();
  const { items: employees, loadItems } = useUserStore();
  const { sendMessage } = useWorkspaceStore();
  const { user } = useAuthStore();

  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 載入員工資料
  useEffect(() => {
    if (employees.length === 0) {
      void loadItems();
    }
  }, [employees.length, loadItems]);

  const selectedTodo = todos.find(t => t.id === selectedTodoId);

  // 過濾未完成的代辦事項
  const pendingTodos = todos.filter(t =>
    t.status !== 'completed' &&
    t.status !== 'cancelled' &&
    (!searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleShare = async () => {
    if (!selectedTodo || !user) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. 如果選擇了指派對象，先更新代辦事項
      if (selectedAssignee && selectedAssignee !== selectedTodo.assignee) {
        await updateItem(selectedTodo.id, { assignee: selectedAssignee });
      }

      // 2. 建立訊息內容
      const assigneeInfo = selectedAssignee
        ? employees.find(e => e.id === selectedAssignee)
        : null;

      const message = `📋 **共享代辦事項**\n\n` +
        `**標題：** ${selectedTodo.title}\n` +
        `**優先級：** ${'⭐'.repeat(selectedTodo.priority)}\n` +
        `**截止日期：** ${selectedTodo.deadline ? new Date(selectedTodo.deadline).toLocaleDateString('zh-TW') : '無'}\n` +
        `**狀態：** ${getStatusLabel(selectedTodo.status)}\n` +
        (assigneeInfo ? `**指派給：** ${assigneeInfo.display_name}\n` : '') +
        `\n👉 [查看詳細](#/todos/${selectedTodo.id})`;

      // 3. 分享到聊天室
      await sendMessage(channelId, user.id, message);

      onSuccess();
    } catch (error) {
      alert('分享失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusLabel = (status: Todo['status']) => {
    const labels = {
      pending: '待處理',
      in_progress: '進行中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return labels[status];
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-600';
    if (priority === 3) return 'text-orange-600';
    return 'text-morandi-secondary';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>共享代辦事項到頻道</DialogTitle>
          <DialogDescription>
            選擇要分享的代辦事項，可選擇指派對象
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4 py-4">
          {/* 搜尋 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-morandi-secondary" />
            <Input
              placeholder="搜尋代辦事項..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
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
                  {searchQuery ? '沒有符合的代辦事項' : '沒有待處理的代辦事項'}
                </div>
              ) : (
                <div className="divide-y divide-morandi-gold/10">
                  {pendingTodos.map((todo) => (
                    <button
                      key={todo.id}
                      onClick={() => setSelectedTodoId(todo.id)}
                      className={cn(
                        'w-full p-3 text-left transition-colors hover:bg-morandi-container/30',
                        selectedTodoId === todo.id && 'bg-morandi-gold/10 border-l-2 border-morandi-gold'
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
                              <span className="text-xs text-morandi-secondary">
                                📅 {new Date(todo.deadline).toLocaleDateString('zh-TW')}
                              </span>
                            )}
                            {todo.assignee && (
                              <span className="text-xs text-morandi-secondary">
                                👤 {employees.find(e => e.id === todo.assignee)?.display_name || '未知'}
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
              <label className="text-sm font-medium text-morandi-primary">
                指派給（選填）
              </label>
              <div className="border border-morandi-gold/20 rounded-lg max-h-48 overflow-y-auto">
                {employees.length === 0 ? (
                  <div className="p-4 text-center text-morandi-secondary text-sm">
                    載入員工資料中...
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
                      <span className="text-sm text-morandi-secondary">不指派</span>
                    </button>
                    {employees.map((employee) => (
                      <button
                        key={employee.id}
                        onClick={() => setSelectedAssignee(employee.id)}
                        className={cn(
                          'w-full p-2 text-left transition-colors hover:bg-morandi-container/30',
                          selectedAssignee === employee.id && 'bg-morandi-gold/10 border-l-2 border-morandi-gold'
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
              <p className="text-xs font-semibold text-morandi-secondary uppercase">預覽</p>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-morandi-primary">{selectedTodo.title}</p>
                <p className="text-morandi-secondary">
                  優先級： <span className={getPriorityColor(selectedTodo.priority)}>
                    {'⭐'.repeat(selectedTodo.priority)}
                  </span>
                </p>
                {selectedTodo.deadline && (
                  <p className="text-morandi-secondary">
                    截止日期：{new Date(selectedTodo.deadline).toLocaleDateString('zh-TW')}
                  </p>
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
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button
            onClick={handleShare}
            disabled={!selectedTodo || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                分享中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                分享到頻道
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
