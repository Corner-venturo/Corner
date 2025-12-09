import { useState } from 'react'
import type { Channel } from '@/stores/workspace-store'
import { CHANNEL_SWITCH_DELAY, ALERT_MESSAGES } from '../constants'
import { UI_DELAYS } from '@/lib/constants/timeouts'
import { confirm, alert } from '@/lib/ui/alert-dialog'

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
  const [isSwitching, setIsSwitching] = useState(false)

  const handleChannelSwitch = (channel: Channel | null) => {
    if (selectedChannel?.id !== channel?.id) {
      setIsSwitching(true)

      setTimeout(() => {
        selectChannel(channel)

        setTimeout(() => setIsSwitching(false), UI_DELAYS.FAST_FEEDBACK)
      }, CHANNEL_SWITCH_DELAY)
    }
  }

  const handleUpdateChannel = async (editChannelName: string, editChannelDescription: string) => {
    if (!selectedChannel) {
      return
    }

    if (!editChannelName.trim()) {
      await alert(ALERT_MESSAGES.CHANNEL_NAME_REQUIRED, 'warning')
      return
    }

    try {
      await updateChannel(selectedChannel.id, {
        name: editChannelName.toLowerCase().replace(/\s+/g, '-'),
        description: editChannelDescription.trim() || undefined,
      })
      setShowSettingsDialog(false)
      await alert(ALERT_MESSAGES.UPDATE_SUCCESS, 'success')
    } catch (error) {
      await alert(ALERT_MESSAGES.UPDATE_FAILED, 'error')
    }
  }

  const handleDeleteChannel = async () => {
    if (!selectedChannel) {
      return
    }

    const confirmed = await confirm(
      `${ALERT_MESSAGES.DELETE_CHANNEL_CONFIRM.replace('頻道', `#${selectedChannel.name} 頻道`)}`,
      {
        title: '刪除頻道',
        type: 'warning',
      }
    )

    if (confirmed) {
      try {
        await deleteChannel(selectedChannel.id)
        selectChannel(null)
        setShowSettingsDialog(false)
        await alert(ALERT_MESSAGES.CHANNEL_DELETED, 'success')
      } catch (error) {
        await alert(ALERT_MESSAGES.DELETE_FAILED, 'error')
      }
    }
  }

  return {
    isSwitching,
    handleChannelSwitch,
    handleUpdateChannel,
    handleDeleteChannel,
  }
}
