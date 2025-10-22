'use client';

import { useEffect, useState } from 'react';
import { checkPendingCount, isOnline } from '@/lib/sync/sync-status-service';
import { Cloud, CloudOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncStatusBadgeProps {
  tableName: string;
  label?: string; // 例如：「旅遊團」「訂單」
}

/**
 * 頁面級別的同步狀態徽章
 * 顯示當前頁面相關表的同步狀態
 */
export function SyncStatusBadge({ tableName, label }: SyncStatusBadgeProps) {
  const [pendingCount, setPendingCount] = useState(0);
  const [online, setOnline] = useState(true);
  const [mounted, setMounted] = useState(false);

  const updateStatus = async () => {
    const count = await checkPendingCount(tableName);
    setPendingCount(count);
    setOnline(isOnline());
  };

  useEffect(() => {
    setMounted(true);
    updateStatus();

    // 監聽網路狀態變化
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [tableName]);

  // SSR 期間不渲染
  if (!mounted) {
    return null;
  }

  // 決定狀態
  const getStatus = () => {
    if (!online) {
      return {
        color: 'text-morandi-red',
        bgColor: 'bg-morandi-red/10',
        icon: CloudOff,
        text: '離線模式'
      };
    }

    if (pendingCount > 0) {
      return {
        color: 'text-morandi-gold',
        bgColor: 'bg-morandi-gold/10',
        icon: AlertCircle,
        text: `${pendingCount} 筆待同步`
      };
    }

    return {
      color: 'text-morandi-green',
      bgColor: 'bg-morandi-green/10',
      icon: Cloud,
      text: '已同步'
    };
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
      status.bgColor
    )}>
      <Icon size={16} className={status.color} />
      <span className={cn('font-medium', status.color)}>
        {label && `${label}：`}{status.text}
      </span>
    </div>
  );
}
