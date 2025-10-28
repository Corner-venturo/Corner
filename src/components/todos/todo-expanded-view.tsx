'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StarRating } from '@/components/ui/star-rating';
import { Todo } from '@/stores/types';
import { cn } from '@/lib/utils';
import { useEnterSubmit, useEnterSubmitWithShift } from '@/hooks/useEnterSubmit';
import { useUserStore } from '@/stores/user-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  Receipt,
  FileText,
  Users,
  DollarSign,
  UserPlus,
  Calendar,
  Clock,
  MessageSquare,
  Check,
  X,
  CheckCircle,
  Edit2
} from 'lucide-react';
import { generateUUID } from '@/lib/utils/uuid';

interface TodoExpandedViewProps {
  todo: Todo;
  onUpdate: (updates: Partial<Todo>) => void;
  onClose: () => void;
}

type QuickActionTab = 'receipt' | 'invoice' | 'group' | 'quote' | 'share';

export function TodoExpandedView({ todo, onUpdate, onClose }: TodoExpandedViewProps) {
  const [activeTab, setActiveTab] = useState<QuickActionTab>('receipt');
  const [newSubTask, setNewSubTask] = useState('');
  const [newNote, setNewNote] = useState('');
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
  const [editingSubTaskContent, setEditingSubTaskContent] = useState('');

  const quickActionTabs = [
    { key: 'receipt' as const, label: '收款', icon: Receipt },
    { key: 'invoice' as const, label: '請款', icon: FileText },
    { key: 'group' as const, label: '開團', icon: Users },
    { key: 'quote' as const, label: '報價', icon: DollarSign },
    { key: 'share' as const, label: '共享', icon: UserPlus },
  ];

  const addSubTask = () => {
    if (!newSubTask.trim()) return;

    const newTask = {
      id: generateUUID(),
      title: newSubTask,
      done: false,
    };

    // 如果目前狀態是「待辦」，自動切換到「進行中」
    const updates: Partial<Todo> = {
      sub_tasks: [...(todo.sub_tasks || []), newTask]
    };

    if (todo.status === 'pending') {
      updates.status = 'in_progress';
    }

    onUpdate(updates);
    setNewSubTask('');
  };

  const addNote = () => {
    if (!newNote.trim()) return;

    const note = {
      timestamp: new Date().toISOString(),
      content: newNote
    };

    // 如果目前狀態是「待辦」，自動切換到「進行中」
    const updates: Partial<Todo> = {
      notes: [...(todo.notes || []), note]
    };

    if (todo.status === 'pending') {
      updates.status = 'in_progress';
    }

    onUpdate(updates);
    setNewNote('');
  };

  const { handleKeyDown: handleSubTaskKeyDown, compositionProps: subTaskCompositionProps } = useEnterSubmit(addSubTask);
  const { handleKeyDown: handleNoteKeyDown, compositionProps: noteCompositionProps } = useEnterSubmitWithShift(addNote);

  const toggleSubTask = (taskId: string) => {
    const updatedSubTasks = (todo.sub_tasks || []).map(task =>
      task.id === taskId
        ? { ...task, done: !task.done, completed_at: !task.done ? new Date().toISOString() : undefined }
        : task
    );

    onUpdate({ sub_tasks: updatedSubTasks });
  };

  const getDeadlineColor = () => {
    if (!todo.deadline) return 'text-morandi-secondary';

    const deadline = new Date(todo.deadline);
    const today = new Date();
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-morandi-red'; // 逾期
    if (diffDays === 0) return 'text-morandi-gold'; // 今天
    if (diffDays <= 3) return 'text-morandi-gold'; // 3天內
    return 'text-morandi-secondary'; // 充裕
  };

  const completedSubTasks = (todo.sub_tasks || []).filter(task => task.done).length;
  const _progressPercentage = (todo.sub_tasks || []).length > 0 ? (completedSubTasks / (todo.sub_tasks || []).length) * 100 : 0;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-[1400px] h-[90vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 右上角關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1 hover:bg-morandi-red/10 hover:text-morandi-red transition-colors rounded-lg text-morandi-secondary"
        >
          <X size={14} />
        </button>

        {/* 主要內容區 */}
        <div className="flex flex-1 overflow-hidden pt-4">
          {/* 左半部：詳情資料 */}
          <div className="w-1/2 px-6 py-4 border-r border-border flex flex-col">
            {/* 標題與星級 */}
            <div className="mb-4 bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                {/* 左邊：標題 */}
                <div className="flex-1">
                  <Input
                    value={todo.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    className="text-lg font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                    placeholder="輸入任務標題..."
                  />
                </div>

                {/* 右邊：優先級 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-morandi-secondary">優先級:</span>
                  <StarRating
                    value={todo.priority}
                    onChange={(value) => onUpdate({ priority: value as 1 | 2 | 3 | 4 | 5 })}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {/* 基本資訊 */}
            <div className="bg-card border border-border rounded-xl p-4 mb-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-morandi-secondary" />
                  <span className="text-sm text-morandi-secondary min-w-[60px]">期限:</span>
                  <Input
                    type="date"
                    value={todo.deadline || ''}
                    onChange={(e) => onUpdate({ deadline: e.target.value })}
                    className={cn('text-sm font-medium h-8 w-auto', getDeadlineColor())}
                  />
                  {todo.deadline && (
                    <button
                      onClick={() => onUpdate({ deadline: '' })}
                      className="p-1 hover:bg-morandi-red/10 rounded text-morandi-secondary hover:text-morandi-red"
                      title="清除期限"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-morandi-secondary" />
                  <span className="text-xs text-morandi-secondary min-w-[50px]">狀態:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => onUpdate({ status: 'pending' })}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-lg transition-all font-medium',
                        todo.status === 'pending'
                          ? 'bg-morandi-muted text-white shadow-sm'
                          : 'bg-white/60 border border-morandi-container/30 text-morandi-secondary hover:bg-white hover:border-morandi-muted/50'
                      )}
                    >
                      待辦
                    </button>
                    <button
                      onClick={() => onUpdate({ status: 'in_progress' })}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-lg transition-all font-medium',
                        todo.status === 'in_progress'
                          ? 'bg-morandi-gold text-white shadow-sm'
                          : 'bg-white/60 border border-morandi-container/30 text-morandi-secondary hover:bg-white hover:border-morandi-gold/20'
                      )}
                    >
                      進行中
                    </button>
                    <button
                      onClick={() => onUpdate({ status: 'completed' })}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-lg transition-all font-medium',
                        todo.status === 'completed'
                          ? 'bg-morandi-green text-white shadow-sm'
                          : 'bg-white/60 border border-morandi-container/30 text-morandi-secondary hover:bg-white hover:border-morandi-green/50'
                      )}
                    >
                      完成
                    </button>
                    <button
                      onClick={() => onUpdate({ status: 'cancelled' })}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-lg transition-all font-medium',
                        todo.status === 'cancelled'
                          ? 'bg-morandi-red text-white shadow-sm'
                          : 'bg-white/60 border border-morandi-container/30 text-morandi-secondary hover:bg-white hover:border-morandi-red/50'
                      )}
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>

              {todo.related_items && todo.related_items.length > 0 && (
                <div className="pt-3 mt-3 border-t border-border">
                  <span className="text-xs font-medium text-morandi-primary flex items-center gap-1.5 mb-2">
                    <FileText size={12} className="text-morandi-gold" />
                    關聯項目
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {todo.related_items.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
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
                        className="bg-white/60 border border-morandi-gold/20 text-morandi-primary text-xs px-2 py-1 rounded-lg hover:bg-morandi-gold/10 hover:border-morandi-gold/20 transition-all font-medium"
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 子任務清單 */}
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
                {(todo.sub_tasks || []).map((task) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-morandi-container/10 hover:bg-morandi-container/20 transition-colors border border-transparent hover:border-morandi-gold/20 group relative">
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
                          onChange={(e) => setEditingSubTaskContent(e.target.value)}
                          className="text-xs h-7 flex-1"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const updatedSubTasks = (todo.sub_tasks || []).map(t =>
                              t.id === task.id ? { ...t, title: editingSubTaskContent } : t
                            );
                            onUpdate({ sub_tasks: updatedSubTasks });
                            setEditingSubTaskId(null);
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
                        <span className={cn(
                          'text-xs flex-1 font-medium',
                          task.done
                            ? 'line-through text-morandi-muted'
                            : 'text-morandi-primary'
                        )}>
                          {task.title}
                        </span>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={() => {
                              setEditingSubTaskId(task.id);
                              setEditingSubTaskContent(task.title);
                            }}
                            className="p-1 hover:bg-morandi-gold/10 rounded text-morandi-secondary hover:text-morandi-gold"
                            title="編輯子任務"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => {
                              const updatedSubTasks = (todo.sub_tasks || []).filter(t => t.id !== task.id);
                              onUpdate({ sub_tasks: updatedSubTasks });
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
                  onChange={(e) => setNewSubTask(e.target.value)}
                  onKeyDown={handleSubTaskKeyDown}
                  {...subTaskCompositionProps}
                  className="text-sm border-morandi-container/30 focus-visible:ring-morandi-gold"
                />
                <Button size="sm" onClick={addSubTask} className="bg-morandi-gold hover:bg-morandi-gold/90">
                  新增
                </Button>
              </div>
            </div>

            {/* 備註區 */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex-1 flex flex-col min-h-0">
              <h4 className="text-sm font-semibold text-morandi-primary mb-3 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-morandi-gold" />
                備註
              </h4>
              <div className="space-y-2 mb-3 flex-1 overflow-y-auto">
                {todo.notes.map((note, index) => (
                  <div key={index} className="bg-gradient-to-br from-morandi-container/20 to-morandi-container/10 border border-morandi-container/30 rounded-lg p-3 hover:shadow-sm transition-shadow group relative">
                    {editingNoteIndex === index ? (
                      // 編輯模式
                      <div>
                        <span className="text-xs text-morandi-muted font-medium">
                          {new Date(note.timestamp).toLocaleString()}
                        </span>
                        <Textarea
                          value={editingNoteContent}
                          onChange={(e) => setEditingNoteContent(e.target.value)}
                          className="text-xs mt-2 resize-none border-morandi-gold/20 focus-visible:ring-morandi-gold"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const newNotes = [...todo.notes];
                              newNotes[index] = { ...note, content: editingNoteContent };
                              onUpdate({ notes: newNotes });
                              setEditingNoteIndex(null);
                            }}
                            className="bg-morandi-gold hover:bg-morandi-gold/90 h-7 text-xs"
                          >
                            儲存
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingNoteIndex(null)}
                            className="h-7 text-xs"
                          >
                            取消
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // 顯示模式
                      <>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={() => {
                              setEditingNoteIndex(index);
                              setEditingNoteContent(note.content);
                            }}
                            className="p-1 hover:bg-morandi-gold/10 rounded text-morandi-secondary hover:text-morandi-gold"
                            title="編輯備註"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => {
                              const newNotes = todo.notes.filter((_, i) => i !== index);
                              onUpdate({ notes: newNotes });
                            }}
                            className="p-1 hover:bg-morandi-red/10 rounded text-morandi-red"
                            title="刪除備註"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <span className="text-xs text-morandi-muted font-medium">
                          {new Date(note.timestamp).toLocaleString()}
                        </span>
                        <div className="text-xs text-morandi-primary mt-1.5 leading-relaxed whitespace-pre-wrap">{note.content}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="新增備註... (Enter 送出，Shift+Enter 換行)"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={handleNoteKeyDown}
                  {...noteCompositionProps}
                  className="text-sm resize-none border-morandi-container/40 focus-visible:ring-morandi-gold focus-visible:border-morandi-gold shadow-sm"
                  rows={3}
                />
                <Button size="sm" onClick={addNote} className="bg-morandi-gold hover:bg-morandi-gold/90 shadow-sm">
                  新增
                </Button>
              </div>
            </div>
          </div>

          {/* 右半部：快速功能 */}
          <div className="w-1/2 px-6 py-4 flex flex-col">
            {/* 快速功能分頁 */}
            <div className="mb-4 bg-card border border-border rounded-xl p-2 shadow-sm">
              <div className="flex gap-2">
                {quickActionTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all flex-1 rounded-lg',
                        activeTab === tab.key
                          ? 'bg-morandi-container/30 text-morandi-primary'
                          : 'bg-transparent text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/10'
                      )}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 分頁內容 */}
            <div className="flex-1 bg-card border border-border rounded-xl p-4 overflow-y-auto shadow-sm">
              <QuickActionContent activeTab={activeTab} todo={todo} />
            </div>

            {/* 快速操作按鈕 */}
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => {
                  onUpdate({ status: 'completed', completed: true });
                  onClose();
                }}
                className="flex-1 bg-gradient-to-r from-morandi-gold to-yellow-400 hover:from-morandi-gold/90 hover:to-yellow-400/90 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Check size={16} className="mr-1" />
                標記完成
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const newDeadline = new Date();
                  newDeadline.setDate(newDeadline.getDate() + 7);
                  onUpdate({ deadline: newDeadline.toISOString().split('T')[0] });
                }}
                className="flex-1 border-morandi-container/50 hover:bg-morandi-container/20 hover:border-morandi-gold/20 shadow-sm transition-all"
              >
                <Calendar size={16} className="mr-1" />
                延期一週
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 快速功能內容組件
function QuickActionContent({ activeTab }: { activeTab: QuickActionTab; todo: Todo }) {
  const { items: employees, fetchAll } = useUserStore();
  const { user: currentUser } = useAuthStore();

  // 使用 ref 建立穩定的函數參考
  const fetchAllRef = useRef(fetchAll);

  // 更新 ref 當 fetchAll 改變時
  useEffect(() => {
    fetchAllRef.current = fetchAll;
  }, [fetchAll]);

  // 只在共享分頁時載入員工資料
  useEffect(() => {
    if (activeTab === 'share' && employees.length === 0) {
      fetchAllRef.current();
    }
  }, [activeTab, employees.length]);

  // 過濾掉自己
  const otherEmployees = employees.filter(emp => emp.id !== currentUser?.id);

  switch (activeTab) {
    case 'receipt':
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-morandi-container/20">
            <div className="p-1.5 bg-morandi-gold/10 rounded-lg">
              <Receipt size={16} className="text-morandi-gold" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-morandi-primary">快速收款</h5>
              <p className="text-xs text-morandi-secondary">建立新的收款記錄</p>
            </div>
          </div>
          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">選擇訂單</label>
              <Select>
                <SelectTrigger className="shadow-sm h-9 text-xs">
                  <SelectValue placeholder="選擇訂單" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order1">東京5日遊 - 王小明</SelectItem>
                  <SelectItem value="order2">沖繩度假 - 李小華</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">收款金額</label>
              <Input placeholder="輸入金額" type="number" className="shadow-sm h-9 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">付款方式</label>
              <Select>
                <SelectTrigger className="shadow-sm h-9 text-xs">
                  <SelectValue placeholder="選擇付款方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">現金</SelectItem>
                  <SelectItem value="transfer">轉帳</SelectItem>
                  <SelectItem value="card">信用卡</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">收款日期</label>
              <Input placeholder="選擇日期" type="date" className="shadow-sm h-9 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">備註</label>
              <Textarea placeholder="補充說明（選填）" rows={2} className="shadow-sm text-xs" />
            </div>
            <Button className="w-full bg-morandi-gold hover:bg-morandi-gold/90 shadow-md mt-1 h-9 text-xs">
              <Receipt size={14} className="mr-1.5" />
              建立收款單
            </Button>
          </div>
        </div>
      );

    case 'invoice':
      return (
        <div className="space-y-4">
          <h5 className="font-medium text-morandi-primary">快速請款</h5>
          <div className="space-y-3">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="選擇供應商" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hotel1">清邁假日酒店</SelectItem>
                <SelectItem value="transport1">清邁包車服務</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="請款項目" />
            <Input placeholder="金額" type="number" />
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="類別" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accommodation">住宿</SelectItem>
                <SelectItem value="transport">交通</SelectItem>
                <SelectItem value="meals">餐食</SelectItem>
                <SelectItem value="tickets">門票</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full">建立請款單</Button>
          </div>
        </div>
      );

    case 'group':
      return (
        <div className="space-y-4">
          <h5 className="font-medium text-morandi-primary">快速開團</h5>
          <div className="space-y-3">
            <Input placeholder="團名" />
            <Input placeholder="預計人數" type="number" />
            <Input placeholder="出發日期" type="date" />
            <Input placeholder="返回日期" type="date" />
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="團體狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">籌備中</SelectItem>
                <SelectItem value="confirmed">確認成團</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full">建立旅遊團</Button>
          </div>
        </div>
      );

    case 'quote':
      return (
        <div className="space-y-4">
          <h5 className="font-medium text-morandi-primary">快速報價</h5>
          <div className="space-y-3">
            <Input placeholder="客戶名稱" />
            <Input placeholder="聯絡人" />
            <Input placeholder="聯絡電話" />
            <Input placeholder="Email" type="email" />
            <Input placeholder="人數" type="number" />
            <Textarea placeholder="需求說明" rows={3} />
            <Input placeholder="預算範圍" />
            <Input placeholder="報價有效期" type="date" />
            <Button className="w-full">建立報價單</Button>
          </div>
        </div>
      );

    case 'share':
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-morandi-container/20">
            <div className="p-1.5 bg-morandi-gold/10 rounded-lg">
              <UserPlus size={16} className="text-morandi-gold" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-morandi-primary">共享待辦</h5>
              <p className="text-xs text-morandi-secondary">分享這個任務給團隊成員</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">共享給</label>
              <Select>
                <SelectTrigger className="shadow-sm h-9 text-xs">
                  <SelectValue placeholder="選擇成員" />
                </SelectTrigger>
                <SelectContent>
                  {otherEmployees.length > 0 ? (
                    otherEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.display_name || emp.english_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      尚無其他員工
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">權限</label>
              <Select>
                <SelectTrigger className="shadow-sm h-9 text-xs">
                  <SelectValue placeholder="選擇權限" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">僅檢視</SelectItem>
                  <SelectItem value="edit">可編輯</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">訊息（選填）</label>
              <Textarea placeholder="給成員的訊息..." rows={2} className="shadow-sm text-xs" />
            </div>
            <Button className="w-full bg-morandi-gold hover:bg-morandi-gold/90 shadow-md h-9 text-xs">
              <UserPlus size={14} className="mr-1.5" />
              共享待辦
            </Button>
          </div>
        </div>
      );

    default:
      return null;
  }
}