'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import { useTodoStore } from '@/stores';
import { useUserStore } from '@/stores/user-store';
import { useAuthStore } from '@/stores/auth-store';
import { alertError, alertWarning } from '@/lib/ui/alert-dialog';
import { CheckCircle, Clock, Calendar, ChevronDown, X, Star, Receipt, FileText, Users, DollarSign, UserPlus, AlertCircle, Trash2, Edit2} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { TodoExpandedView } from '@/components/todos/todo-expanded-view';
import { StarRating } from '@/components/ui/star-rating';
import { Todo } from '@/stores/types';
import { ConfirmDialog } from '@/components/dialog/confirm-dialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { TodoCard } from '@/components/todos/todo-card';
import { useRealtimeForTodos } from '@/hooks/use-realtime-hooks';

export const dynamic = 'force-dynamic';


const statusFilters = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待辦' },
  { value: 'in_progress', label: '進行中' },
  { value: 'completed', label: '完成' }
];

export default function TodosPage() {
  // ✅ Realtime 訂閱
  useRealtimeForTodos();

  const todoStore = useTodoStore();
  const todos = todoStore.items;
  const { create: addTodo, update: updateTodo, delete: deleteTodo, fetchAll } = todoStore;
  const { user } = useAuthStore(); // 取得當前登入用戶
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedTodo, setExpandedTodo] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, _setIsLoading] = useState(false); // 使用快取資料，不需要載入
  const [isSubmitting, setIsSubmitting] = useState(false); // 防止重複提交
  const [quickAddValue, setQuickAddValue] = useState(''); // 快速新增輸入框的值
  const { confirm, confirmDialogProps } = useConfirmDialog();

  // 載入待辦事項資料
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // 處理從其他頁面跳轉來的情況
  useEffect(() => {
    const expandId = searchParams.get('expand');
    if (expandId) {
      setExpandedTodo(expandId);
    }
  }, [searchParams]);

  // 篩選待辦 - 使用 useMemo 優化
  const filteredTodos = useMemo(() => {
    if (!todos || !Array.isArray(todos)) return [];
    const currentUserId = user?.id;

    return todos.filter(todo => {
      // ✅ 可見性篩選 - 只顯示當前用戶相關的待辦
      if (currentUserId) {
        const isCreator = todo.creator === currentUserId;
        const isAssignee = todo.assignee === currentUserId;
        const inVisibility = todo.visibility?.includes(currentUserId);

        // 必須是建立者、被指派者或在可見列表中
        if (!isCreator && !isAssignee && !inVisibility) {
          return false;
        }
      }

      // 狀態篩選
      if (statusFilter !== 'all' && todo.status !== statusFilter) return false;

      // 搜尋篩選
      if (searchTerm && !todo.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      return true;
    });
  }, [todos, statusFilter, searchTerm, user?.id]);

  // 狀態標籤 - 使用 useCallback 優化
  const getStatusLabel = useCallback((status: Todo['status']) => {
    const statusMap = {
      pending: '待辦',
      in_progress: '進行中',
      completed: '完成',
      cancelled: '取消'
    };
    return statusMap[status];
  }, []);

  // 狀態顏色 - 使用 useCallback 優化
  const getStatusColor = useCallback((status: Todo['status']) => {
    const colorMap = {
      pending: 'text-morandi-muted',
      in_progress: 'text-blue-600',
      completed: 'text-green-600',
      cancelled: 'text-morandi-red'
    };
    return colorMap[status];
  }, []);

  // 截止日期顏色 - 使用 useCallback 優化
  const getDeadlineColor = useCallback((deadline?: string) => {
    if (!deadline) return 'text-morandi-secondary';

    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-morandi-red'; // 逾期
    if (diffDays === 0) return 'text-orange-500'; // 今天
    if (diffDays <= 3) return 'text-yellow-600'; // 3天內
    return 'text-morandi-secondary'; // 充裕
  }, []);

  const columns = [
    {
      key: 'title',
      label: '任務標題',
      sortable: true,
      render: (value: string, todo: Todo) => (
        <div>
          <div className="text-sm font-medium text-morandi-primary">{value}</div>
          {todo.related_items && todo.related_items.length > 0 && (
            <div className="flex gap-1 mt-1">
              {todo.related_items.map((item, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    const basePath = {
                      'group': '/tours',
                      'quote': '/quotes',
                      'order': '/orders',
                      'invoice': '/finance/treasury/disbursement',
                      'receipt': '/finance/payments'
                    }[item.type];
                    if (basePath) {
                      window.location.href = `${basePath}?highlight=${item.id}`;
                    }
                  }}
                  className="text-xs bg-morandi-gold/20 text-morandi-primary px-2 py-0.5 rounded hover:bg-morandi-gold/30 transition-colors"
                >
                  {item.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'priority',
      label: '優先級',
      sortable: true,
      render: (value: number, todo: Todo) => (
        <StarRating value={todo.priority} readonly size="sm" />
      )
    },
    {
      key: 'status',
      label: '狀態',
      sortable: true,
      render: (value: Todo['status']) => (
        <span className={cn('text-sm font-medium', getStatusColor(value))}>
          {getStatusLabel(value)}
        </span>
      )
    },
    {
      key: 'deadline',
      label: '期限',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-morandi-secondary" />
          <span className={cn('text-sm', getDeadlineColor(value))}>
            {value ? new Date(value).toLocaleDateString() : '未設定'}
          </span>
        </div>
      )
    }
  ];

  const handleRowClick = useCallback((todo: Todo) => {
    setExpandedTodo(todo.id);
  }, []);

  const handleDeleteTodo = useCallback(async (todo: Todo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const confirmed = await confirm({
      type: 'danger',
      title: '刪除待辦事項',
      message: `確定要刪除待辦事項「${todo.title}」嗎？`,
      details: ['此操作無法復原'],
      confirmLabel: '確認刪除',
      cancelLabel: '取消'
    });

    if (!confirmed) {
      return;
    }

    try {
      deleteTodo(todo.id);
      // 如果正在顯示該待辦的詳細檢視，關閉它
      if (expandedTodo === todo.id) {
        setExpandedTodo(null);
      }
    } catch (err) {
      logger.error('刪除待辦事項失敗:', err);
      await alertError('刪除失敗，請稍後再試');
    }
  }, [deleteTodo, expandedTodo, confirm]);

  const handleAddTodo = useCallback(async (formData: any) => {
    if (!user?.id) {
      await alertWarning('請先登入');
      return;
    }

    try {
      // 計算 visibility - 包含建立者和被指派者
      const visibilityList = [user.id];
      if (formData.assignee && formData.assignee !== user.id) {
        visibilityList.push(formData.assignee);
      }

      const newTodoData = {
        title: formData.title,
        priority: formData.priority,
        deadline: formData.deadline,
        status: 'pending' as const,
        completed: false,
        creator: user.id, // ✅ 使用當前登入用戶
        assignee: formData.assignee || null,
        visibility: visibilityList, // ✅ 包含建立者和被指派者
        related_items: [],
        sub_tasks: [],
        notes: [],
        enabled_quick_actions: formData.enabled_quick_actions || ['receipt', 'quote']
      };

      await addTodo(newTodoData as unknown);
      setIsAddDialogOpen(false);
    } catch (error) {
      logger.error('新增待辦事項失敗:', error);
      await alertError('新增失敗，請稍後再試');
    }
  }, [addTodo, user?.id]);

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="待辦事項"
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋任務..."
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增任務"
        actions={
          <Input
            placeholder="快速新增... (Enter)"
            className="w-64"
            value={quickAddValue}
            onChange={(e) => setQuickAddValue(e.target.value)}
            onKeyDown={async (e) => {
              // 使用原生事件檢查輸入法狀態，避免 React 狀態更新時序問題
              if (e.key === 'Enter' && quickAddValue.trim() && !isSubmitting && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (!user?.id) {
                  await alertWarning('請先登入');
                  return;
                }
                const title = quickAddValue.trim();
                setQuickAddValue(''); // 清空受控組件的值
                setIsSubmitting(true);

                const newTodoData = {
                  title,
                  priority: 3 as 1 | 2 | 3 | 4 | 5,
                  deadline: '',
                  status: 'pending' as const,
                  completed: false,
                  creator: user.id,
                  assignee: null,
                  visibility: [user.id],
                  related_items: [],
                  sub_tasks: [],
                  notes: [],
                  enabled_quick_actions: ['receipt', 'quote'] as ('receipt' | 'quote')[]
                };

                try {
                  await addTodo(newTodoData as unknown);
                  logger.log('✅ 待辦事項新增成功');
                } catch (error) {
                  logger.error('快速新增失敗:', error);
                  setQuickAddValue(title); // 失敗時恢復輸入內容
                  await alertError('新增失敗，請稍後再試');
                } finally {
                  setIsSubmitting(false);
                }
              }
            }}
          />
        }
      >
        {/* 狀態篩選 */}
        <div className="flex gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                statusFilter === filter.value
                  ? 'bg-morandi-gold text-white'
                  : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </ResponsiveHeader>

      {/* 待辦事項列表 */}
      <div className="flex-1 overflow-auto">
        <EnhancedTable
          columns={columns}
          data={filteredTodos}
          onRowClick={handleRowClick}
          rowClassName={(todo: Todo) => {
            // 判斷是否為共享待辦
            const isShared = (todo.assignee && todo.assignee !== user?.id) ||
              (todo.visibility && todo.visibility.length > 1);

            return cn(
              // 移除所有預設邊框
              "!border-0",
              // 強制設置 margin bottom 為 2rem (32px)
              "!mb-8",
              // 卡片樣式：圓角、陰影、完整邊框
              "!rounded-lg !shadow-md !outline !outline-1 outline-gray-200/60 transition-all hover:!shadow-lg hover:!-translate-y-0.5",
              // 卡片內部上下 padding 加大
              "[&>td]:!py-5",
              // 確保每個 td 都有圓角（第一個左側圓角，最後一個右側圓角）
              "[&>td:first-child]:!rounded-l-lg [&>td:last-child]:!rounded-r-lg",
              // 移除 td 之間的邊框
              "[&>td]:!border-0",
              // 共享待辦使用藍色背景和輪廓
              isShared
                ? "!bg-blue-50 !outline-blue-200 hover:!bg-blue-100 hover:!outline-blue-300"
                : "!bg-white hover:!outline-morandi-gold/40",
              // 完成的待辦降低透明度
              todo.status === 'completed' && "opacity-60"
            );
          }}
          actions={(todo: Todo) => (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
                  updateTodo(todo.id, {
                    status: newStatus,
                    completed: newStatus === 'completed'
                  });
                }}
                className={cn(
                  "p-1 rounded transition-colors",
                  todo.status === 'completed'
                    ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                    : "text-morandi-secondary hover:text-green-600 hover:bg-green-50"
                )}
                title={todo.status === 'completed' ? '取消完成' : '標記完成'}
              >
                <CheckCircle size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedTodo(todo.id);
                }}
                className="p-1 hover:bg-morandi-gold/10 rounded transition-colors"
                title="編輯"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={(e) => handleDeleteTodo(todo, e)}
                className="p-1 text-morandi-red hover:bg-morandi-red/10 rounded transition-colors"
                title="刪除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
          searchableFields={['title']}
          searchTerm={searchTerm}
          showFilters={false}
          initialPageSize={15}
        />
      </div>

      {/* 展開的待辦事項視圖 */}
      {expandedTodo && (
        <TodoExpandedView
          todo={todos.find(t => t.id === expandedTodo)!}
          onUpdate={(updates) => updateTodo(expandedTodo, updates)}
          onClose={() => setExpandedTodo(null)}
        />
      )}

      {/* 新增待辦事項對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增待辦事項</DialogTitle>
            <DialogDescription>建立新的待辦任務，設定優先級和截止日期</DialogDescription>
          </DialogHeader>
          <AddTodoForm onSubmit={handleAddTodo} onCancel={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog {...confirmDialogProps} />
    </div>
  );
}

// 新增待辦事項表單組件
function AddTodoForm({ onSubmit, onCancel }: { onSubmit: (data) => void; onCancel: () => void }) {
  const { items: users, fetchAll: loadUsersFromDatabase } = useUserStore();
  const [isLoadingUsers, _setIsLoadingUsers] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    priority: 3 as 1 | 2 | 3 | 4 | 5,
    deadline: '',
    assignee: '',
    enabled_quick_actions: ['receipt', 'quote'] as ('receipt' | 'invoice' | 'group' | 'quote' | 'assign')[]
  });

  // 當點擊或聚焦指派選單時，才載入員工資料
  const handleAssigneeDropdownFocus = async () => {
    if (users.length === 0 && !isLoadingUsers) {
      _setIsLoadingUsers(true);
      try {
        await loadUsersFromDatabase();
      } catch (error) {
        logger.error('載入員工資料失敗:', error);
      } finally {
        _setIsLoadingUsers(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1">任務標題</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="輸入任務標題..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1">緊急度</label>
        <StarRating
          value={formData.priority}
          onChange={(value) => setFormData({ ...formData, priority: value as 1 | 2 | 3 | 4 | 5 })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1">期限</label>
        <Input
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1">指派給（可選）</label>
        <select
          value={formData.assignee}
          onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
          onFocus={handleAssigneeDropdownFocus}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-morandi-primary"
          disabled={isLoadingUsers}
        >
          <option value="">
            {isLoadingUsers ? '載入員工資料中...' : '不指派（個人任務）'}
          </option>
          {users && users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.display_name} ({user.employee_number})
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          建立任務
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
      </div>
    </form>
  );
}