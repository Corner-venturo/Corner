'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Calendar, Clock, FileText, X } from 'lucide-react';
import { AssignmentSectionProps } from './types';

export function AssignmentSection({ todo, onUpdate }: AssignmentSectionProps) {
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

  return (
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
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onUpdate({ status: 'pending' })}
              className={cn(
                'px-3.5 py-2 text-xs rounded-lg transition-all font-medium',
                todo.status === 'pending'
                  ? 'bg-morandi-muted text-white shadow-md'
                  : 'bg-morandi-container/30 border border-morandi-muted/20 text-morandi-secondary hover:bg-morandi-muted/10 hover:border-morandi-muted/40 hover:text-morandi-muted'
              )}
            >
              待辦
            </button>
            <button
              onClick={() => onUpdate({ status: 'in_progress' })}
              className={cn(
                'px-3.5 py-2 text-xs rounded-lg transition-all font-medium',
                todo.status === 'in_progress'
                  ? 'bg-morandi-gold text-white shadow-md'
                  : 'bg-morandi-container/30 border border-morandi-gold/20 text-morandi-secondary hover:bg-morandi-gold/10 hover:border-morandi-gold/40 hover:text-morandi-gold'
              )}
            >
              進行中
            </button>
            <button
              onClick={() => onUpdate({ status: 'completed' })}
              className={cn(
                'px-3.5 py-2 text-xs rounded-lg transition-all font-medium',
                todo.status === 'completed'
                  ? 'bg-morandi-green text-white shadow-md'
                  : 'bg-morandi-container/30 border border-morandi-green/20 text-morandi-secondary hover:bg-morandi-green/10 hover:border-morandi-green/40 hover:text-morandi-green'
              )}
            >
              完成
            </button>
            <button
              onClick={() => onUpdate({ status: 'cancelled' })}
              className={cn(
                'px-3.5 py-2 text-xs rounded-lg transition-all font-medium',
                todo.status === 'cancelled'
                  ? 'bg-morandi-red text-white shadow-md'
                  : 'bg-morandi-container/30 border border-morandi-red/20 text-morandi-secondary hover:bg-morandi-red/10 hover:border-morandi-red/40 hover:text-morandi-red'
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
  );
}
