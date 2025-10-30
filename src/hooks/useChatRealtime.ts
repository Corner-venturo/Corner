/**
 * Chat Realtime 訂閱 Hook
 * 自動管理 messages 的 Realtime 訂閱生命週期
 */

'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/stores/workspace/chat-store';

/**
 * 使用 Chat Realtime 訂閱
 *
 * 會自動：
 * 1. 在 channelId 變更時訂閱新的 channel 的 messages
 * 2. 在組件卸載時取消訂閱
 * 3. 即時同步所有 message 變更（新增/修改/刪除）
 *
 * @param channelId - 頻道 ID
 *
 * @example
 * ```tsx
 * function ChannelChat({ channelId }) {
 *   useChatRealtime(channelId);
 *
 *   const messages = useChatStore(state => state.channelMessages[channelId]);
 *   // messages 會自動即時更新
 * }
 * ```
 */
export function useChatRealtime(channelId: string | null | undefined) {
  const subscribeToMessages = useChatStore(state => state.subscribeToMessages);
  const unsubscribeFromMessages = useChatStore(state => state.unsubscribeFromMessages);

  useEffect(() => {
    if (!channelId) {
      return;
    }

    // 訂閱當前 channel 的 messages
    subscribeToMessages(channelId);

    // 清理函數：取消訂閱
    return () => {
      unsubscribeFromMessages();
    };
  }, [channelId, subscribeToMessages, unsubscribeFromMessages]);
}
