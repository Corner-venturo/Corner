'use client';

import React, { useEffect, useState } from 'react';
import { useOfflineSync, useOfflineStore, syncManager } from '@/lib/offline/sync-manager';
import {
  Wifi, WifiOff, Cloud, CloudOff,
  RefreshCw, AlertCircle, Clock,
  ChevronDown, ChevronUp, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// ===== 主要同步狀態指示器 =====
export function SyncStatusIndicator() {
  const { isOnline, hasPendingChanges, pendingCount, lastSyncTime } = useOfflineSync();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncManager.syncAll();
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (error) {
      console.error('手動同步失敗:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (isSyncing) return 'text-yellow-500';
    if (hasPendingChanges) return 'text-orange-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!isMounted) return <Cloud className="w-4 h-4" />; // 預設顯示 Cloud 避免 hydration 錯誤
    if (!isOnline) return <CloudOff className="w-4 h-4" />;
    if (isSyncing) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (hasPendingChanges) return <Cloud className="w-4 h-4" />;
    return <Cloud className="w-4 h-4" />; // 已同步也顯示 Cloud
  };

  const getStatusText = () => {
    if (!isOnline) return '離線模式';
    if (isSyncing) return '同步中...';
    if (hasPendingChanges) return `${pendingCount} 個待同步`;
    return '已同步';
  };

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return '尚未同步';

    try {
      return formatDistanceToNow(new Date(lastSyncTime), {
        addSuffix: true,
        locale: zhTW
      });
    } catch {
      return '尚未同步';
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <div className={cn(
          "bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300",
          isExpanded ? "w-80" : "w-auto"
        )}>
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className={cn("transition-colors", getStatusColor())}>
                {getStatusIcon()}
              </div>
              <div className="text-sm">
                <div className={cn("font-medium", getStatusColor())}>
                  {getStatusText()}
                </div>
                {!isExpanded && (
                  <div className="text-xs text-gray-500">
                    {formatLastSyncTime()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOnline && !isSyncing && hasPendingChanges && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleManualSync();
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                  title="立即同步"
                >
                  <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              )}
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </div>

          {isExpanded && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">網路連線</span>
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-500" />
                      <span className="text-green-500">已連線</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-500" />
                      <span className="text-red-500">離線</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">最後同步</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {formatLastSyncTime()}
                  </span>
                </div>
              </div>

              {hasPendingChanges && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-2">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-orange-700 dark:text-orange-400">
                      {pendingCount} 個變更待同步
                    </span>
                  </div>
                  <PendingChangesList />
                </div>
              )}

              {isOnline && (
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing || !hasPendingChanges}
                  className={cn(
                    "w-full py-2 px-3 rounded text-sm font-medium transition-colors",
                    isSyncing || !hasPendingChanges
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  )}
                >
                  {isSyncing ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      同步中...
                    </span>
                  ) : hasPendingChanges ? (
                    '立即同步'
                  ) : (
                    '已是最新'
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showNotification && (
        <SyncNotification
          isOnline={isOnline}
          onClose={() => setShowNotification(false)}
        />
      )}
    </>
  );
}

function PendingChangesList() {
  const pendingChanges = useOfflineStore(state => state.pendingChanges);

  if (pendingChanges.length === 0) return null;

  const groupedChanges = pendingChanges.reduce((acc, change) => {
    if (!acc[change.table]) {
      acc[change.table] = [];
    }
    acc[change.table].push(change);
    return acc;
  }, {} as Record<string, typeof pendingChanges>);

  return (
    <div className="mt-2 space-y-1">
      {Object.entries(groupedChanges).map(([table, changes]) => (
        <div key={table} className="text-xs text-gray-600 dark:text-gray-400">
          <span className="capitalize">{table}</span>:
          {' '}{changes.map(c => c.type).join(', ')} ({changes.length})
        </div>
      ))}
    </div>
  );
}

function SyncNotification({
  isOnline,
  onClose
}: {
  isOnline: boolean;
  onClose: () => void;
}) {
  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border animate-slide-in-right",
      isOnline
        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
        : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
    )}>
      <div className="flex items-center gap-3">
        {isOnline ? (
          <>
            <Wifi className="w-5 h-5 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                已恢復連線
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                系統將自動同步您的資料
              </p>
            </div>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                離線模式
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                您的變更將在恢復連線後同步
              </p>
            </div>
          </>
        )}
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
}

export function ConflictResolutionDialog({
  conflicts,
  onResolve
}: {
  conflicts: any[];
  onResolve: (conflictId: string, resolution: 'local' | 'remote') => void;
}) {
  if (conflicts.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            同步衝突
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            偵測到 {conflicts.length} 個衝突，請選擇保留的版本
          </p>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {conflicts.map((conflict) => (
            <div key={conflict.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {conflict.table} - {conflict.id}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-600">本地版本</span>
                    <button
                      onClick={() => onResolve(conflict.id, 'local')}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      使用此版本
                    </button>
                  </div>
                  <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto max-h-48">
                    {JSON.stringify(conflict.localData, null, 2)}
                  </pre>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-green-600">遠端版本</span>
                    <button
                      onClick={() => onResolve(conflict.id, 'remote')}
                      className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      使用此版本
                    </button>
                  </div>
                  <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto max-h-48">
                    {JSON.stringify(conflict.remoteData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
