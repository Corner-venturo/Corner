'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useTodoStore } from '@/stores/todo-store';
import { useUserStore } from '@/stores/user-store';
import { CheckCircle, Clock, Calendar, ChevronDown, X, Star, Receipt, FileText, Users, DollarSign, UserPlus, AlertCircle, Trash2, Edit2, Grid3x3, List, Search, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { TodoExpandedView } from '@/components/todos/todo-expanded-view';
import { TodoCardGroups } from '@/components/todos/todo-card-groups';
import { StarRating } from '@/components/ui/star-rating';
import { Todo } from '@/stores/types';
import { useOfflineSync } from '@/lib/offline/sync-manager';

export const dynamic = 'force-dynamic';


const statusFilters = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待辦' },
  { value: 'in_progress', label: '進行中' },
  { value: 'completed', label: '完成' }
];

export default function TodosPage() {
  const { todos, addTodo, updateTodo, deleteTodo, clearAllTodos, loadTodos } = useTodoStore();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedTodo, setExpandedTodo] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const [groupBy, setGroupBy] = useState<'date' | 'priority' | 'status'>('date');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isOnline, hasPendingChanges, pendingCount, syncStatus } = useOfflineSync();

  // 初次載入時只載入待辦事項
  useEffect(() => {
    const syncData = async () => {
      try {
        await loadTodos();
      } catch (error) {
        console.error('載入資料失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };
    syncData();
  }, [loadTodos]);

  // 處理從其他頁面跳轉來的情況
  useEffect(() => {
    const expandId = searchParams.get('expand');
    if (expandId) {
      setExpandedTodo(expandId);
    }
  }, [searchParams]);

  // 篩選待辦 - 使用 useMemo 優化
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      // 狀態篩選
      if (statusFilter !== 'all' && todo.status !== statusFilter) return false;

      // 搜尋篩選
      if (searchTerm && !todo.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      return true;
    });
  }, [todos, statusFilter, searchTerm]);

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
        <div className="flex items-center gap-3">
          <StarRating value={todo.priority} readonly size="sm" />
          <div>
            <div className="text-sm font-medium text-morandi-primary">{value}</div>
            {todo.relatedItems && todo.relatedItems.length > 0 && (
              <div className="flex gap-1 mt-1">
                {todo.relatedItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation(); // 避免觸發行點擊
                      // 根據類型跳轉到相應頁面
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
        </div>
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
      key: 'progress',
      label: '進度',
      render: (value: any, todo: Todo) => {
        const subTasks = todo.subTasks || [];
        const completed = subTasks.filter(task => task.done).length;
        const total = subTasks.length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;

        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-morandi-container/30 rounded-full h-2">
              <div
                className="bg-morandi-gold h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm text-morandi-secondary">
              {completed}/{total}
            </span>
          </div>
        );
      }
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

  const handleDeleteTodo = useCallback((todo: Todo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const confirmMessage = `確定要刪除待辦事項「${todo.title}」嗎？\n\n此操作無法復原。`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      deleteTodo(todo.id);
      // 如果正在顯示該待辦的詳細檢視，關閉它
      if (expandedTodo === todo.id) {
        setExpandedTodo(null);
      }
    } catch (err) {
      console.error('刪除待辦事項失敗:', err);
      alert('刪除失敗，請稍後再試');
    }
  }, [deleteTodo, expandedTodo]);

  const handleAddTodo = useCallback((formData: any) => {
    const newTodoData = {
      title: formData.title,
      priority: formData.priority,
      deadline: formData.deadline,
      status: 'pending' as const,
      completed: false,
      creator: '1', // 暂時使用固定值
      assignee: formData.assignee || null,
      visibility: ['1'],
      relatedItems: [],
      subTasks: [],
      notes: [],
      enabledQuickActions: formData.enabledQuickActions || ['receipt', 'quote']
    };

    addTodo(newTodoData);
    setIsAddDialogOpen(false);
  }, [addTodo]);

  return (
    <div className="space-y-6">
      <ResponsiveHeader
        title="待辦事項"
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋任務..."
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增任務"
      >
        {/* 狀態篩選和清除按鈕 */}
        <div className="flex gap-2 items-center">

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
          
          {todos.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm(`確定要清除所有 ${todos.length} 個待辦事項嗎？\n\n此操作無法復原。`)) {
                  clearAllTodos();
                }
              }}
              className="ml-4 text-morandi-red hover:text-morandi-red border-morandi-red/30 hover:border-morandi-red"
            >
              <Trash2 size={14} className="mr-1" />
              清除全部
            </Button>
          )}
        </div>
      </ResponsiveHeader>

      {/* 待辦事項列表 */}
      <div>
        <EnhancedTable
            columns={columns}
            data={filteredTodos}
            onRowClick={handleRowClick}
            actions={(todo: Todo) => (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
                  updateTodo(todo.id, {
                    status: newStatus,
                    completed: newStatus === 'completed'
                  });
                }}
                className={cn(
                  "h-8 w-8 p-0",
                  todo.status === 'completed'
                    ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                    : "text-morandi-secondary hover:text-green-600 hover:bg-green-50"
                )}
                title={todo.status === 'completed' ? '取消完成' : '標記完成'}
              >
                <CheckCircle size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedTodo(todo.id);
                }}
                className="h-8 w-8 p-0"
                title="編輯"
              >
                <Edit2 size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDeleteTodo(todo, e)}
                className="h-8 w-8 p-0 text-morandi-red hover:text-morandi-red hover:bg-morandi-red/10"
                title="刪除"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          )}
          searchableFields={['title']}
          searchTerm={searchTerm}
          showFilters={false}
          initialPageSize={15}
          emptyState={
            <div className="text-center py-8 text-morandi-secondary">
              <Clock size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-morandi-primary mb-2">
                {statusFilter === 'all' ? '還沒有任何待辦事項' : `沒有「${statusFilters.find(f => f.value === statusFilter)?.label}」的任務`}
              </p>
              <p className="text-sm text-morandi-secondary mb-6">
                點擊右上角「新增任務」開始建立待辦事項
              </p>
              <div className="text-sm text-morandi-secondary space-y-1">
                <p>• 待辦事項將顯示標題、類型、優先級、狀態和建立時間</p>
                <p>• 可以按狀態篩選（待辦、進行中、完成）和搜尋任務</p>
                <p>• 點擊任務可查看詳細資訊和編輯內容</p>
              </div>
            </div>
          }
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
    </div>
  );
}

// 新增待辦事項表單組件
function AddTodoForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const { users, loadUsersFromDatabase } = useUserStore();
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    priority: 3 as 1 | 2 | 3 | 4 | 5,
    deadline: '',
    assignee: '',
    enabledQuickActions: ['receipt', 'quote'] as ('receipt' | 'invoice' | 'group' | 'quote' | 'assign')[]
  });

  // 當點擊或聚焦指派選單時，才載入員工資料
  const handleAssigneeDropdownFocus = async () => {
    if (users.length === 0 && !isLoadingUsers) {
      setIsLoadingUsers(true);
      try {
        await loadUsersFromDatabase();
      } catch (error) {
        console.error('載入員工資料失敗:', error);
      } finally {
        setIsLoadingUsers(false);
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
              {user.chineseName} ({user.employeeNumber})
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