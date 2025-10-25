'use client';

import { useState } from 'react';

import { Clock, User, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/ui/star-rating';
import { useTodoStore } from '@/stores';

import { cn } from '@/lib/utils';

interface WorkspaceTaskListProps {
  channelId: string;
  tour_id: string;
}

const employees = [
  { id: '1', name: '威廉', role: '管理者' },
  { id: '2', name: '李助理', role: 'OP' },
  { id: '3', name: '王財務', role: '財務' },
  { id: '4', name: '陳業務', role: '業務' },
];

export function WorkspaceTaskList({ tour_id }: WorkspaceTaskListProps) {
  const { items: todos, update: updateTodo } = useTodoStore();
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  
  // 獲取該旅遊團的任務
  const tourTasks = (todos || []).filter(todo =>
    todo.related_items?.some((item) => (item.type === 'quote' || item.type === 'order') && item.id === tour_id)
  ).sort((a, b) => {
    // 未完成的排在前面
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // 按優先級排序
    return (b.priority || 0) - (a.priority || 0);
  });
  
  const getEmployeeName = (employee_id?: string) => {
    if (!employee_id) return '未指派';
    return employees.find(emp => emp.id === employee_id)?.name || '未知';
  };
  
  const getProgressInfo = (todo: any) => {
    const completed = (todo.sub_tasks || []).filter((task: any) => task.done).length;
    const total = (todo.sub_tasks || []).length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未設定';
    return new Date(dateString).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}分鐘前`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小時前`;
    } else {
      return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
    }
  };
  
  const handleToggleComplete = (taskId: string) => {
    const task = todos.find(t => t.id === taskId);
    if (!task) return;
    
    updateTodo(taskId, {
      completed: !task.completed,
      status: !task.completed ? 'completed' : 'pending',
      completed_at: !task.completed ? new Date().toISOString() : undefined,
    } as unknown);
  };
  
  const handleToggleSubTask = (taskId: string, subTaskId: string) => {
    const task = todos.find(t => t.id === taskId);
    if (!task) return;
    
    const updatedSubTasks = (task.sub_tasks || []).map(st =>
      st.id === subTaskId
        ? { ...st, done: !st.done, completed_at: !st.done ? new Date().toISOString() : undefined }
        : st
    );
    
    updateTodo(taskId, { sub_tasks: updatedSubTasks });
  };
  
  const handleAddReply = (taskId: string) => {
    const content = replyInputs[taskId];
    if (!content?.trim()) return;
    
    const task = todos.find(t => t.id === taskId);
    if (!task) return;
    
    const newNote = {
      timestamp: new Date().toISOString(),
      content: content.trim(),
      user_id: '1', // 從 auth store 獲取
    };
    
    updateTodo(taskId, {
      notes: [...(task.notes || []), newNote],
    });
    
    setReplyInputs(prev => ({ ...prev, [taskId]: '' }));
  };
  
  const toggleExpand = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };
  
  return (
    <div className="space-y-0 border border-border rounded-lg overflow-hidden bg-white">
      {tourTasks.length === 0 ? (
        <div className="text-center py-12 text-morandi-secondary">
          <Clock size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm">此頻道尚無任務</p>
          <p className="text-xs mt-1">前往旅遊團管理 &gt; 指派任務建立任務</p>
        </div>
      ) : (
        tourTasks.map((task, _index) => {
          const progress = getProgressInfo(task);
          const isExpanded = expandedTaskId === task.id;
          const hasSubTasks = (task.sub_tasks || []).length > 0;
          const _hasNotes = (task.notes || []).length > 0;
          
          return (
            <div key={task.id}>
              {/* 任務列表項 */}
              <div
                className={cn(
                  'flex items-center gap-3 p-3 hover:bg-morandi-container/10 transition-colors',
                  'border-b border-border last:border-b-0',
                  task.completed && 'opacity-60'
                )}
              >
                {/* 勾選框 */}
                <input
                  type="checkbox"
                  checked={task.completed || false}
                  onChange={() => handleToggleComplete(task.id)}
                  className="w-4 h-4 cursor-pointer"
                />
                
                {/* 星級 */}
                <div className="flex-shrink-0">
                  <StarRating value={task.priority || 3} readonly size="sm" />
                </div>
                
                {/* 標題 */}
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      'font-medium text-sm',
                      task.completed && 'line-through text-morandi-secondary'
                    )}
                  >
                    {task.title}
                  </span>
                </div>
                
                {/* 負責人 */}
                <div className="flex items-center gap-1 text-sm text-morandi-secondary flex-shrink-0">
                  <User size={14} />
                  <span>@{getEmployeeName(task.assignee)}</span>
                </div>
                
                {/* 期限 */}
                <div className="flex items-center gap-1 text-sm text-morandi-secondary flex-shrink-0">
                  <Calendar size={14} />
                  <span>{formatDate(task.deadline)}</span>
                </div>
                
                {/* 進度 */}
                {hasSubTasks && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-16 bg-morandi-container/30 rounded-full h-2">
                      <div
                        className="bg-morandi-gold h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-morandi-secondary">
                      {progress.completed}/{progress.total}
                    </span>
                  </div>
                )}
                
                {/* 展開按鈕 */}
                <button
                  onClick={() => toggleExpand(task.id)}
                  className="text-morandi-secondary hover:text-morandi-primary transition-colors flex-shrink-0"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              
              {/* 展開內容（子任務 + 討論） */}
              {isExpanded && (
                <div className="bg-morandi-container/5 p-4 border-b border-border">
                  {/* 子任務 */}
                  {hasSubTasks && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-morandi-primary mb-2">子任務：</div>
                      <div className="space-y-1">
                        {(task.sub_tasks || []).map(subTask => (
                          <div key={subTask.id} className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              checked={subTask.done}
                              onChange={() => handleToggleSubTask(task.id, subTask.id)}
                              className="w-3 h-3 cursor-pointer"
                            />
                            <span
                              className={cn(
                                'text-sm',
                                subTask.done && 'line-through opacity-60'
                              )}
                            >
                              {subTask.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 討論區 */}
                  <div>
                    <div className="text-sm font-medium text-morandi-primary mb-2">
                      討論 ({(task.notes || []).length})：
                    </div>
                    <div className="space-y-3">
                      {(task.notes || []).map((note, i) => (
                        <div key={i} className="flex gap-2">
                          {/* 頭像 */}
                          <div className="w-6 h-6 rounded-full bg-morandi-gold/20 flex items-center justify-center text-xs font-medium text-morandi-primary flex-shrink-0">
                            {getEmployeeName((note as unknown).user_id)[0]}
                          </div>

                          {/* 訊息內容 */}
                          <div className="flex-1 bg-white rounded p-2 text-sm border border-border">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-morandi-primary">
                                {getEmployeeName((note as unknown).user_id)}
                              </span>
                              <span className="text-xs text-morandi-secondary">
                                {formatTimestamp(note.timestamp)}
                              </span>
                            </div>
                            <div className="text-morandi-primary whitespace-pre-wrap">
                              {note.content}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* 回覆輸入框 */}
                      <div className="flex gap-2">
                        <Input
                          value={replyInputs[task.id] || ''}
                          onChange={(e) =>
                            setReplyInputs(prev => ({ ...prev, [task.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddReply(task.id);
                            }
                          }}
                          placeholder="💬 回覆... (Enter 送出)"
                          className="text-sm"
                        />
                        <Button
                          onClick={() => handleAddReply(task.id)}
                          disabled={!replyInputs[task.id]?.trim()}
                          size="sm"
                          className="bg-morandi-gold hover:bg-morandi-gold-hover"
                        >
                          送出
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
