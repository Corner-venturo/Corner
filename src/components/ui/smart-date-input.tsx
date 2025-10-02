'use client';

import React, { useRef, useEffect } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface SmartDateInputProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export function SmartDateInput({
  value,
  onChange,
  min,
  className,
  placeholder = 'YYYY-MM-DD',
  required = false
}: SmartDateInputProps) {
  const yearRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);

  // 分解日期字串
  const parts = value ? value.split('-') : [];
  const year = parts[0] || '';
  const month = parts[1] || '';
  const day = parts[2] || '';

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // 只允許數字

    // 直接更新，不補0
    onChange(val ? `${val}${month ? '-' + month : ''}${day ? '-' + day : ''}` : '');

    // 當輸入4位數時，自動跳到月份
    if (val.length === 4) {
      setTimeout(() => monthRef.current?.focus(), 0);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');

    // 超過12時，直接設為12
    if (parseInt(val) > 12) val = '12';
    if (parseInt(val) === 0) val = '';

    // 直接更新，不補0
    onChange(`${year}${val ? '-' + val : ''}${day ? '-' + day : ''}`);

    // 當輸入2位數時，自動跳到日期
    if (val.length === 2) {
      setTimeout(() => dayRef.current?.focus(), 0);
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (parseInt(val) > 31) val = '31';
    if (parseInt(val) === 0) val = '';

    // 直接更新，不補0
    onChange(`${year}${month ? '-' + month : ''}${val ? '-' + val : ''}`);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: 'year' | 'month' | 'day'
  ) => {
    // 按下 Backspace 時，如果當前欄位是空的，跳到前一個欄位
    if (e.key === 'Backspace') {
      const input = e.currentTarget;
      if (input.value.length === 0 || input.selectionStart === 0) {
        if (type === 'day') monthRef.current?.focus();
        if (type === 'month') yearRef.current?.focus();
      }
    }

    // 按下 / 或 - 時，跳到下一個欄位
    if (e.key === '/' || e.key === '-') {
      e.preventDefault();
      if (type === 'year') monthRef.current?.focus();
      if (type === 'month') dayRef.current?.focus();
    }
  };

  return (
    <div className={cn("flex items-center gap-1 p-2 border rounded-md bg-background", className)}>
      <input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        value={year}
        onChange={handleYearChange}
        onKeyDown={(e) => handleKeyDown(e, 'year')}
        placeholder="YYYY"
        className="w-14 bg-transparent outline-none text-center"
        maxLength={4}
        required={required}
      />
      <span className="text-morandi-secondary">/</span>
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        value={month}
        onChange={handleMonthChange}
        onKeyDown={(e) => handleKeyDown(e, 'month')}
        placeholder="MM"
        className="w-10 bg-transparent outline-none text-center"
        maxLength={2}
        required={required}
      />
      <span className="text-morandi-secondary">/</span>
      <input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        value={day}
        onChange={handleDayChange}
        onKeyDown={(e) => handleKeyDown(e, 'day')}
        placeholder="DD"
        className="w-10 bg-transparent outline-none text-center"
        maxLength={2}
        required={required}
      />
    </div>
  );
}
