import React from 'react';
import { morandiColors } from '@/lib/constants/morandi-colors';

export interface DateSubtitleProps {
  date: string;
  variant?: 'default' | 'elegant';
  className?: string;
}

/**
 * 日期副標題組件
 * 顯示優雅的日期格式
 */
export function DateSubtitle({
  date,
  variant = 'default',
  className = ''
}: DateSubtitleProps) {
  if (variant === 'elegant') {
    return (
      <div
        className={`text-center font-serif italic ${className}`}
        style={{ color: morandiColors.text.secondary }}
      >
        {date}
      </div>
    );
  }

  return (
    <div
      className={`text-sm ${className}`}
      style={{ color: morandiColors.text.light }}
    >
      {date}
    </div>
  );
}
