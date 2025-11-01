import { useState } from 'react';
import type { Channel } from '@/stores/workspace-store';
import { CHANNEL_SWITCH_DELAY, ALERT_MESSAGES } from '../constants';
import { UI_DELAYS } from '@/lib/constants/timeouts';

/**
 * 管理頻道切換、刪除、更新等操作
 */
export function useChannelOperations(
  selectedChannel: Channel | null,
  selectChannel: (channel: Channel | null) => void,
  updateChannel: (id: string, data: Partial<Channel>) => Promise<void>,
  deleteChannel: (id: string) => Promise<void>,
  setShowSettingsDialog: (show: boolean) => void
) {
  const [isSwitching, setIsSwitching] = useState(false);

  const handleChannelSwitch = (channel: Channel | null) => {
    if (selectedChannel?.id !== channel?.id) {
      setIsSwitching(true);

      setTimeout(() => {
        selectChannel(channel);

        setTimeout(() => setIsSwitching(false), UI_DELAYS.FAST_FEEDBACK);
      }, CHANNEL_SWITCH_DELAY);
    }
  };

  const handleUpdateChannel = async (
    editChannelName: string,
    editChannelDescription: string
  ) => {
    if (!selectedChannel) {
      return;
    }

    if (!editChannelName.trim()) {
      alert(ALERT_MESSAGES.CHANNEL_NAME_REQUIRED);
      return;
    }

    try {
      await updateChannel(selectedChannel.id, {
        name: editChannelName.toLowerCase().replace(/\s+/g, '-'),
        description: editChannelDescription.trim() || undefined
      });
      setShowSettingsDialog(false);
      alert(ALERT_MESSAGES.UPDATE_SUCCESS);
    } catch (error) {
      alert(ALERT_MESSAGES.UPDATE_FAILED);
    }
  };

  const handleDeleteChannel = async () => {
    if (!selectedChannel) {
      return;
    }

    const confirmed = confirm(`${ALERT_MESSAGES.DELETE_CHANNEL_CONFIRM.replace('頻道', `#${selectedChannel.name} 頻道`)}`);

    if (confirmed) {
      try {
        await deleteChannel(selectedChannel.id);
        selectChannel(null);
        setShowSettingsDialog(false);
        alert(ALERT_MESSAGES.CHANNEL_DELETED);
      } catch (error) {
        alert(ALERT_MESSAGES.DELETE_FAILED);
      }
    }
  };

  return {
    isSwitching,
    handleChannelSwitch,
    handleUpdateChannel,
    handleDeleteChannel,
  };
}
