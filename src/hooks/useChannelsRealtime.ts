/**
 * Channel Realtime 訂閱 Hook
 * 自動管理 channels 的 Realtime 訂閱生命週期
 */

'use client';

import { useEffect } from 'react';
import { useChannelsStore } from '@/stores/workspace/channels-store';

/**
 * 使用 Channels Realtime 訂閱
 *
 * 會自動：
 * 1. 在 workspace 變更時訂閱新的 workspace 的 channels
 * 2. 在組件卸載時取消訂閱
 * 3. 即時同步所有 channel 變更（新增/修改/刪除）
 *
 * @example
 * ```tsx
 * function Workspace() {
 *   useChannelsRealtime();
 *
 *   const channels = useChannelsStore(state => state.channels);
 *   // channels 會自動即時更新
 * }
 * ```
 */
export function useChannelsRealtime() {
  const currentWorkspace = useChannelsStore(state => state.currentWorkspace);
  const subscribeToChannels = useChannelsStore(state => state.subscribeToChannels);
  const unsubscribeFromChannels = useChannelsStore(state => state.unsubscribeFromChannels);

  useEffect(() => {
    if (!currentWorkspace?.id) {
      return;
    }

    // 訂閱當前 workspace 的 channels
    subscribeToChannels(currentWorkspace.id);

    // 清理函數：取消訂閱
    return () => {
      unsubscribeFromChannels();
    };
  }, [currentWorkspace?.id, subscribeToChannels, unsubscribeFromChannels]);
}
