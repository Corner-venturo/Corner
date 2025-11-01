import { useState, useEffect } from 'react';
import type { Channel } from '@/stores/workspace-store';

/**
 * 管理頻道編輯狀態
 * 當設定對話框打開時，自動同步頻道名稱和描述
 */
export function useChannelEditState(
  showSettingsDialog: boolean,
  selectedChannel: Channel | null
) {
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelDescription, setEditChannelDescription] = useState('');

  // 當設定對話框打開時，同步頻道資料
  useEffect(() => {
    if (showSettingsDialog && selectedChannel) {
      setEditChannelName(selectedChannel.name);
      setEditChannelDescription(selectedChannel.description || '');
    }
  }, [showSettingsDialog, selectedChannel]);

  return {
    editChannelName,
    setEditChannelName,
    editChannelDescription,
    setEditChannelDescription,
  };
}
