import { useEffect } from 'react'
import type { Channel, Workspace } from '@/stores/workspace-store'
import { DEFAULT_CHANNEL_NAME } from '../constants'

/**
 * 管理頻道相關的副作用
 * 包括載入頻道、選擇預設頻道、載入頻道資料等
 */
export function useChannelEffects(
  currentWorkspace: Workspace | null,
  channels: Channel[],
  selectedChannel: Channel | null,
  loadChannels: (workspaceId: string) => Promise<void>,
  selectChannel: (channel: Channel | null) => void,
  loadMessages: (channelId: string) => Promise<void>,
  loadAdvanceLists: (channelId: string) => Promise<void>,
  loadSharedOrderLists: (channelId: string) => Promise<void>
) {
  // 載入頻道列表
  useEffect(() => {
    if (currentWorkspace?.id) {
      loadChannels(currentWorkspace.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id])

  // 選擇預設頻道
  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      const defaultChannel = channels.find(c => c.name === DEFAULT_CHANNEL_NAME) || channels[0]
      selectChannel(defaultChannel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels.length, selectedChannel?.id])

  // 載入頻道資料（訊息、代墊清單、訂單清單）
  useEffect(() => {
    if (!selectedChannel?.id) {
      return
    }

    Promise.all([
      loadMessages(selectedChannel.id),
      loadAdvanceLists(selectedChannel.id),
      loadSharedOrderLists(selectedChannel.id),
    ]).catch(error => {
      // Silent error handling
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel?.id])
}
