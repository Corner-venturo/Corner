/**
 * LoadingState - 統一的載入狀態組件
 */

'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  icon?: ReactNode;
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  spinner?: boolean;
}

const SIZE_STYLES = {
  sm: {
    container: 'py-8',
    icon: 32,
    text: 'text-sm',
  },
  md: {
    container: 'py-12',
    icon: 48,
    text: 'text-base',
  },
  lg: {
    container: 'py-16',
    icon: 64,
    text: 'text-lg',
  },
};

export function LoadingState({
  icon,
  message = '載入中...',
  className,
  size = 'md',
  spinner = true,
}: LoadingStateProps) {
  const sizeConfig = SIZE_STYLES[size];

  return (
    <div
      className={cn(
        'text-center text-morandi-secondary',
        sizeConfig.container,
        className
      )}
    >
      <div className="flex justify-center mb-4">
        {icon || (
          <Loader2
            size={sizeConfig.icon}
            className={cn('opacity-50', spinner && 'animate-spin')}
          />
        )}
      </div>

      {message && (
        <p className={cn('text-morandi-secondary', sizeConfig.text)}>
          {message}
        </p>
      )}
    </div>
  );
}

// 簡化版 - 用於小區塊
export function LoadingSpinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <Loader2
      size={size}
      className={cn('animate-spin text-morandi-secondary', className)}
    />
  );
}

// 全屏載入
export function LoadingOverlay({ message = '載入中...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-xl shadow-lg">
        <LoadingState message={message} size="lg" />
      </div>
    </div>
  );
}
