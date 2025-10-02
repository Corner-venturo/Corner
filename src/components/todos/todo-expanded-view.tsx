'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StarRating } from '@/components/ui/star-rating';
import { Todo } from '@/stores/types';
import { cn } from '@/lib/utils';
import { useEnterSubmit, useEnterSubmitWithShift } from '@/hooks/useEnterSubmit';
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
  X
} from 'lucide-react';

interface TodoExpandedViewProps {
  todo: Todo;
  onUpdate: (updates: Partial<Todo>) => void;
  onClose: () => void;
}

type QuickActionTab = 'receipt' | 'invoice' | 'group' | 'quote' | 'assign';

export function TodoExpandedView({ todo, onUpdate, onClose }: TodoExpandedViewProps) {
  const [activeTab, setActiveTab] = useState<QuickActionTab>('receipt');
  const [newSubTask, setNewSubTask] = useState('');
  const [newNote, setNewNote] = useState('');

  const quickActionTabs = [
    { key: 'receipt' as const, label: '收款', icon: Receipt },
    { key: 'invoice' as const, label: '請款', icon: FileText },
    { key: 'group' as const, label: '開團', icon: Users },
    { key: 'quote' as const, label: '報價', icon: DollarSign },
    { key: 'assign' as const, label: '指派', icon: UserPlus },
  ];

  const addSubTask = () => {
    if (!newSubTask.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      title: newSubTask,
      done: false,
    };

    onUpdate({
      subTasks: [...(todo.subTasks || []), newTask]
    });
    setNewSubTask('');
  };

  const addNote = () => {
    if (!newNote.trim()) return;

    const note = {
      timestamp: new Date().toISOString(),
      content: newNote
    };

    onUpdate({
      notes: [...(todo.notes || []), note]
    });
    setNewNote('');
  };

  const handleSubTaskKeyDown = useEnterSubmit(addSubTask);
  const handleNoteKeyDown = useEnterSubmitWithShift(addNote);

  const toggleSubTask = (taskId: string) => {
    const updatedSubTasks = (todo.subTasks || []).map(task =>
      task.id === taskId
        ? { ...task, done: !task.done, completedAt: !task.done ? new Date().toISOString() : undefined }
        : task
    );

    onUpdate({ subTasks: updatedSubTasks });
  };

  const getDeadlineColor = () => {
    if (!todo.deadline) return 'text-morandi-secondary';

    const deadline = new Date(todo.deadline);
    const today = new Date();
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-morandi-red'; // 逾期
    if (diffDays === 0) return 'text-orange-500'; // 今天
    if (diffDays <= 3) return 'text-yellow-600'; // 3天內
    return 'text-morandi-secondary'; // 充裕
  };

  const completedSubTasks = (todo.subTasks || []).filter(task => task.done).length;
  const progressPercentage = (todo.subTasks || []).length > 0 ? (completedSubTasks / (todo.subTasks || []).length) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-[1400px] h-[90vh] flex flex-col">
        {/* 頂部關閉按鈕 */}
        <div className="flex justify-end p-4">
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-morandi-container/30">
            <X size={20} />
          </Button>
        </div>

        {/* 主要內容區 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 左半部：詳情資料 */}
          <div className="w-1/2 px-8 pb-8 overflow-y-auto border-r border-morandi-container/30">
            {/* 標題與星級 */}
            <div className="mb-6">
              <Input
                value={todo.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                className="text-2xl font-bold border-none shadow-none p-0 h-auto mb-4 focus-visible:ring-0"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-morandi-secondary">優先級:</span>
                <StarRating
                  value={todo.priority}
                  onChange={(value) => onUpdate({ priority: value as 1 | 2 | 3 | 4 | 5 })}
                />
              </div>
            </div>

            {/* 基本資訊 */}
            <div className="bg-morandi-container/10 rounded-xl p-5 mb-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-morandi-secondary" />
                  <span className="text-sm text-morandi-secondary min-w-[60px]">期限:</span>
                  <span className={cn('text-sm font-medium', getDeadlineColor())}>
                    {todo.deadline ? new Date(todo.deadline).toLocaleDateString() : '未設定'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-morandi-secondary" />
                  <span className="text-sm text-morandi-secondary min-w-[60px]">狀態:</span>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => onUpdate({ status: 'pending' })}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-lg transition-colors font-medium',
                        todo.status === 'pending'
                          ? 'bg-morandi-muted text-white'
                          : 'bg-morandi-container/30 text-morandi-secondary hover:bg-morandi-container/50'
                      )}
                    >
                      待辦
                    </button>
                    <button
                      onClick={() => onUpdate({ status: 'in_progress' })}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-lg transition-colors font-medium',
                        todo.status === 'in_progress'
                          ? 'bg-morandi-gold text-white'
                          : 'bg-morandi-container/30 text-morandi-secondary hover:bg-morandi-container/50'
                      )}
                    >
                      進行中
                    </button>
                    <button
                      onClick={() => onUpdate({ status: 'completed' })}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-lg transition-colors font-medium',
                        todo.status === 'completed'
                          ? 'bg-green-600 text-white'
                          : 'bg-morandi-container/30 text-morandi-secondary hover:bg-morandi-container/50'
                      )}
                    >
                      完成
                    </button>
                    <button
                      onClick={() => onUpdate({ status: 'cancelled' })}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-lg transition-colors font-medium',
                        todo.status === 'cancelled'
                          ? 'bg-morandi-red text-white'
                          : 'bg-morandi-container/30 text-morandi-secondary hover:bg-morandi-container/50'
                      )}
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>

              {todo.relatedItems && todo.relatedItems.length > 0 && (
                <div className="pt-4 border-t border-morandi-container/40">
                  <span className="text-sm text-morandi-secondary">關聯項目:</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {todo.relatedItems.map((item, index) => (
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
                        className="bg-morandi-gold/20 text-morandi-primary text-xs px-3 py-1.5 rounded-lg hover:bg-morandi-gold/30 transition-colors"
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 子任務清單 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-morandi-primary">子任務清單</h4>
                <span className="text-xs text-morandi-secondary bg-morandi-container/30 px-2 py-1 rounded">
                  {completedSubTasks}/{(todo.subTasks || []).length} 完成
                </span>
              </div>

              {(todo.subTasks || []).length > 0 && (
                <div className="mb-4">
                  <div className="w-full bg-morandi-container/20 rounded-full h-2">
                    <div
                      className="bg-morandi-gold h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 mb-4">
                {(todo.subTasks || []).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-morandi-container/10 transition-colors">
                    <button
                      onClick={() => toggleSubTask(task.id)}
                      className={cn(
                        'w-5 h-5 rounded border-2 transition-all flex items-center justify-center',
                        task.done
                          ? 'bg-morandi-gold border-morandi-gold'
                          : 'border-morandi-muted hover:border-morandi-gold'
                      )}
                    >
                      {task.done && <Check size={14} className="text-white" />}
                    </button>
                    <span className={cn(
                      'text-sm flex-1',
                      task.done
                        ? 'line-through text-morandi-muted'
                        : 'text-morandi-primary'
                    )}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="新增子任務..."
                  value={newSubTask}
                  onChange={(e) => setNewSubTask(e.target.value)}
                  onKeyDown={handleSubTaskKeyDown}
                  className="text-sm border-morandi-container/30 focus-visible:ring-morandi-gold"
                />
                <Button size="sm" onClick={addSubTask} className="bg-morandi-gold hover:bg-morandi-gold/90">
                  新增
                </Button>
              </div>
            </div>

            {/* 備註區 */}
            <div>
              <h4 className="text-base font-semibold text-morandi-primary mb-4">備註</h4>
              <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                {todo.notes.map((note, index) => (
                  <div key={index} className="bg-morandi-container/10 rounded-lg p-3">
                    <span className="text-xs text-morandi-muted">
                      {new Date(note.timestamp).toLocaleString()}
                    </span>
                    <div className="text-sm text-morandi-primary mt-1">{note.content}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="新增備註... (Enter 送出，Shift+Enter 換行)"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={handleNoteKeyDown}
                  className="text-sm resize-none border-morandi-container/30 focus-visible:ring-morandi-gold"
                  rows={3}
                />
                <Button size="sm" onClick={addNote} className="bg-morandi-gold hover:bg-morandi-gold/90">
                  新增
                </Button>
              </div>
            </div>
          </div>

          {/* 右半部：快速功能 */}
          <div className="w-1/2 px-8 pb-8 flex flex-col">
            {/* 快速功能分頁 */}
            <div className="flex gap-2 mb-6">
              {quickActionTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                      activeTab === tab.key
                        ? 'bg-morandi-gold text-white shadow-sm'
                        : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/20'
                    )}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* 分頁內容 */}
            <div className="flex-1 bg-morandi-container/5 rounded-xl p-6 overflow-y-auto">
              <QuickActionContent activeTab={activeTab} todo={todo} />
            </div>

            {/* 快速操作按鈕 */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => onUpdate({ status: 'completed' })}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                標記完成
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const newDeadline = new Date();
                  newDeadline.setDate(newDeadline.getDate() + 7);
                  onUpdate({ deadline: newDeadline.toISOString().split('T')[0] });
                }}
                className="flex-1 border-morandi-container/40 hover:bg-morandi-container/20"
              >
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
function QuickActionContent({ activeTab, todo }: { activeTab: QuickActionTab; todo: Todo }) {
  switch (activeTab) {
    case 'receipt':
      return (
        <div className="space-y-4">
          <h5 className="font-medium text-morandi-primary">快速收款</h5>
          <div className="space-y-3">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="選擇訂單" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order1">東京5日遊 - 王小明</SelectItem>
                <SelectItem value="order2">沖繩度假 - 李小華</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="收款金額" type="number" />
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="付款方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">現金</SelectItem>
                <SelectItem value="transfer">轉帳</SelectItem>
                <SelectItem value="card">信用卡</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="收款日期" type="date" />
            <Textarea placeholder="備註" rows={2} />
            <Button className="w-full">建立收款單</Button>
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

    case 'assign':
      return (
        <div className="space-y-4">
          <h5 className="font-medium text-morandi-primary">指派任務</h5>
          <div className="space-y-3">
            <Input placeholder="新任務標題" />
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="指派給" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emp1">李助理</SelectItem>
                <SelectItem value="emp2">王業務</SelectItem>
                <SelectItem value="emp3">張經理</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="期限" type="date" />
            <StarRating value={3} onChange={() => {}} />
            <Textarea placeholder="任務說明" rows={3} />
            <Button className="w-full">建立並指派任務</Button>
          </div>
        </div>
      );

    default:
      return null;
  }
}