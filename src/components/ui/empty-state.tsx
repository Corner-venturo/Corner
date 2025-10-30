/**
 * EmptyState - 統一的空狀態提示組件
 */

'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { FileQuestion, Search, Inbox } from 'lucide-react';

export type EmptyStateVariant = 'default' | 'search' | 'inbox';

export interface EmptyStateProps {
  icon?: ReactNode;
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const DEFAULT_ICONS = {
  default: FileQuestion,
  search: Search,
  inbox: Inbox,
};

const SIZE_STYLES = {
  sm: {
    container: 'py-8',
    icon: 32,
    title: 'text-sm',
    description: 'text-xs',
  },
  md: {
    container: 'py-12',
    icon: 48,
    title: 'text-base',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16',
    icon: 64,
    title: 'text-lg',
    description: 'text-base',
  },
};

export function EmptyState({
  icon,
  variant = 'default',
  title = '沒有找到資料',
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizeConfig = SIZE_STYLES[size];
  const DefaultIcon = DEFAULT_ICONS[variant];

  return (
    <div
      className={cn(
        'text-center text-morandi-secondary',
        sizeConfig.container,
        className
      )}
    >
      <div className="flex justify-center mb-4">
        {icon || <DefaultIcon size={sizeConfig.icon} className="opacity-50" />}
      </div>

      <p className={cn('font-medium text-morandi-primary mb-2', sizeConfig.title)}>
        {title}
      </p>

      {description && (
        <p className={cn('text-morandi-secondary', sizeConfig.description)}>
          {description}
        </p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
