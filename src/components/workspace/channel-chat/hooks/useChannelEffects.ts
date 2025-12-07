import { useEffect, useMemo } from 'react'
import type { Channel, Workspace } from '@/stores/workspace-store'
import { useChannelMemberStore } from '@/stores/workspace/channel-member-store'
import { useAuthStore } from '@/stores/auth-store'
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
  const { user } = useAuthStore()
  const allChannelMembers = useChannelMemberStore(state => state.items)

  // 取得已加入的頻道
  const joinedChannels = useMemo(() => {
    if (!user?.id) return []
    return channels.filter(ch => {
      // 檢查是否為頻道成員
      const isMember = allChannelMembers.some(
        m => m.channel_id === ch.id && m.employee_id === user.id
      )
      return isMember && !ch.is_archived
    })
  }, [channels, allChannelMembers, user?.id])

  // 載入頻道列表
  useEffect(() => {
    if (currentWorkspace?.id) {
      loadChannels(currentWorkspace.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id])

  // 選擇預設頻道（只從已加入的頻道中選擇）
  useEffect(() => {
    if (joinedChannels.length > 0 && !selectedChannel) {
      // 優先選擇「一般討論」，否則選第一個已加入的頻道
      const defaultChannel = joinedChannels.find(c => c.name === DEFAULT_CHANNEL_NAME) || joinedChannels[0]
      selectChannel(defaultChannel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinedChannels.length, selectedChannel?.id])

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
