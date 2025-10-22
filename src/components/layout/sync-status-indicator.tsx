'use client';

import { useEffect, useState } from 'react';
import { useSyncStatus } from '@/lib/sync/sync-status-service';
import { Cloud, CloudOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

interface SyncStatusIndicatorProps {
  isDropdownHovered?: boolean;
}

export function SyncStatusIndicator({ isDropdownHovered = false }: SyncStatusIndicatorProps = {}) {
  const { pendingCount, isOnline, lastSyncTime, updateStatus } = useSyncStatus();
  const { sidebarCollapsed } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    updateStatus();

    // 初始檢查
    const interval = setInterval(updateStatus, 30000);
    return () => clearInterval(interval);
  }, [updateStatus]);

  // 在客戶端掛載前不渲染動態內容
  if (!mounted) {
    return (
      <div className={cn(
        'w-full relative h-10 text-sm text-morandi-secondary hover:bg-morandi-container hover:text-morandi-primary transition-colors cursor-pointer'
      )}>
        <Cloud size={20} className={cn(
          'text-morandi-green',
          "absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2"
        )} />
        <span className={cn(
          "ml-[58px] block text-left leading-10 transition-opacity duration-300",
          'text-morandi-green',
          sidebarCollapsed ? (isDropdownHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100") : "opacity-100"
        )}>
          載入中...
        </span>
      </div>
    );
  }

  // 決定燈號顏色和圖示
  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        color: 'text-morandi-red',
        icon: CloudOff,
        text: '離線模式'
      };
    }

    if (pendingCount > 0) {
      return {
        color: 'text-morandi-gold',
        icon: AlertCircle,
        text: `${pendingCount} 筆待同步`
      };
    }

    return {
      color: 'text-morandi-green',
      icon: Cloud,
      text: '已同步'
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn(
      'w-full relative h-10 text-sm text-morandi-secondary hover:bg-morandi-container hover:text-morandi-primary transition-colors cursor-pointer'
    )}>
      <Icon size={20} className={cn(
        config.color,
        "absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2"
      )} />
      {pendingCount > 0 && isOnline && (
        <span className="absolute left-10 top-3 w-2 h-2 bg-morandi-gold rounded-full animate-pulse" />
      )}
      <span className={cn(
        "ml-[58px] block text-left leading-10 transition-opacity duration-300",
        config.color,
        sidebarCollapsed ? (isDropdownHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100") : "opacity-100"
      )}>
        {config.text}
      </span>
    </div>
  );
}
