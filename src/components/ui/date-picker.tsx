'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, placeholder = '選擇日期', className, disabled }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 格式化顯示日期
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 格式化 value 為 YYYY-MM-DD
  const formatValueDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // 處理日期選擇
  const handleDateSelect = (date: Date) => {
    const formattedDate = formatValueDate(date);
    onChange(formattedDate);
    setIsOpen(false);
  };

  // 處理月份切換
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  // 生成日曆日期
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // 本月第一天
    const firstDay = new Date(year, month, 1);
    // 本月最後一天
    const lastDay = new Date(year, month + 1, 0);

    // 計算第一週需要顯示的上個月日期
    const start_date = new Date(firstDay);
    start_date.setDate(firstDay.getDate() - firstDay.getDay());

    // 計算最後一週需要顯示的下個月日期
    const end_date = new Date(lastDay);
    end_date.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const days = [];
    const currentDate = new Date(start_date);

    while (currentDate <= end_date) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  // 判斷是否為今日
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 判斷是否為選中日期
  const isSelected = (date: Date) => {
    if (!value) return false;
    const selectedDate = new Date(value);
    return date.toDateString() === selectedDate.toDateString();
  };

  // 判斷是否為本月日期
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  // 點擊外部關閉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const days = generateCalendarDays();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div ref={containerRef} className="relative">
      <div
        ref={inputRef}
        onClick={() => !disabled && setIsOpen(true)}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer',
          'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          'hover:border-morandi-gold/20 focus:border-morandi-gold/20 transition-colors',
          className
        )}
      >
        <div className="flex items-center justify-between w-full">
          <span className={cn(
            value ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
          <Calendar size={16} className="text-muted-foreground" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 p-4 w-80">
          {/* 月份導航 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-morandi-container/20 rounded transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="font-semibold text-morandi-primary">
              {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
            </div>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-morandi-container/20 rounded transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 星期標題 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-morandi-secondary p-2">
                {day}
              </div>
            ))}
          </div>

          {/* 日期網格 */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => (
              <button
                key={index}
                onClick={() => handleDateSelect(date)}
                className={cn(
                  'p-2 text-sm rounded hover:bg-morandi-container/20 transition-colors',
                  isCurrentMonth(date)
                    ? 'text-foreground'
                    : 'text-muted-foreground',
                  isToday(date) && 'bg-morandi-blue/10 text-morandi-blue font-semibold',
                  isSelected(date) && 'bg-morandi-gold text-white hover:bg-morandi-gold/90'
                )}
              >
                {date.getDate()}
              </button>
            ))}
          </div>

          {/* 今日按鈕 */}
          <div className="mt-4 pt-3 border-t border-border">
            <button
              onClick={() => handleDateSelect(new Date())}
              className="w-full text-sm text-morandi-gold hover:text-morandi-gold/80 transition-colors"
            >
              今日
            </button>
          </div>
        </div>
      )}
    </div>
  );
}