/**
 * React Hook for Supabase Realtime Subscription
 * 自動管理訂閱的生命週期
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { realtimeManager } from '../realtime-manager';
import type { RealtimeSubscriptionConfig, RealtimeStatus } from '../types';

interface UseRealtimeSubscriptionOptions<T> extends RealtimeSubscriptionConfig<T> {
  /** 是否啟用訂閱 (預設: true) */
  enabled?: boolean;
}

interface UseRealtimeSubscriptionReturn {
  /** 訂閱狀態 */
  status: RealtimeStatus;
  /** 錯誤訊息 */
  error: Error | null;
  /** 是否已連線 */
  isConnected: boolean;
  /** 重試次數 */
  retryCount: number;
}

/**
 * 使用 Realtime 訂閱
 *
 * @example
 * ```tsx
 * function ChannelList() {
 *   const { isConnected } = useRealtimeSubscription({
 *     table: 'channels',
 *     handlers: {
 *       onInsert: (channel) => {
 *         console.log('New channel:', channel);
 *       },
 *       onDelete: (oldChannel) => {
 *         console.log('Deleted channel:', oldChannel);
 *       },
 *     },
 *   });
 *
 *   return <div>Connected: {isConnected ? 'Yes' : 'No'}</div>;
 * }
 * ```
 */
export function useRealtimeSubscription<T = unknown>(
  options: UseRealtimeSubscriptionOptions<T>
): UseRealtimeSubscriptionReturn {
  const { enabled = true, ...config } = options;
  const subscriptionIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // 如果未啟用，不訂閱
    if (!enabled) {
      return;
    }

    // 創建訂閱
    const subscriptionId = realtimeManager.subscribe<T>(config);
    subscriptionIdRef.current = subscriptionId;

    // 定期檢查訂閱狀態
    const statusInterval = setInterval(() => {
      if (!subscriptionIdRef.current) return;

      const state = realtimeManager.getSubscriptionState(
        subscriptionIdRef.current
      );

      if (state) {
        setStatus(state.status);
        setError(state.error);
        setRetryCount(state.retryCount);
      }
    }, 1000);

    // 清理函數
    return () => {
      clearInterval(statusInterval);

      if (subscriptionIdRef.current) {
        realtimeManager.unsubscribe(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
    };
  }, [
    enabled,
    config.table,
    config.event,
    config.schema,
    config.filter,
    // 注意：handlers 不應該作為依賴，因為它們是物件引用
    // 如果 handlers 變更，需要重新訂閱
  ]);

  return {
    status,
    error,
    isConnected: status === 'connected',
    retryCount,
  };
}

/**
 * 使用多個 Realtime 訂閱
 *
 * @example
 * ```tsx
 * function Workspace() {
 *   useMultipleRealtimeSubscriptions([
 *     {
 *       table: 'channels',
 *       handlers: { onInsert: handleChannelInsert },
 *     },
 *     {
 *       table: 'messages',
 *       handlers: { onInsert: handleMessageInsert },
 *     },
 *   ]);
 * }
 * ```
 */
export function useMultipleRealtimeSubscriptions<T = unknown>(
  subscriptions: UseRealtimeSubscriptionOptions<T>[]
): UseRealtimeSubscriptionReturn[] {
  const results = subscriptions.map((config) =>
    useRealtimeSubscription(config)
  );

  return results;
}

/**
 * 取得所有訂閱狀態（不創建新訂閱）
 */
export function useRealtimeStatus() {
  const [subscriptions, setSubscriptions] = useState(
    realtimeManager.getAllSubscriptions()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSubscriptions(realtimeManager.getAllSubscriptions());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    subscriptions,
    totalCount: subscriptions.length,
    connectedCount: subscriptions.filter((s) => s.status === 'connected')
      .length,
  };
}
