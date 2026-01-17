import { useEffect, useMemo, useRef } from 'react'
import type { Channel, Workspace } from '@/stores/workspace-store'
import { useChannelMemberStore } from '@/stores/workspace/channel-member-store'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { BOT_CHANNEL_NAME, LAST_CHANNEL_STORAGE_KEY } from '../constants'

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
     
  }, [currentWorkspace?.id])

  // 選擇預設頻道（只從已加入的頻道中選擇）
  useEffect(() => {
    if (joinedChannels.length > 0 && !selectedChannel) {
      // 優先順序：1. 上次使用的頻道 2. 機器人助手 3. 第一個已加入的頻道
      let defaultChannel: Channel | undefined

      // 1. 嘗試從 localStorage 讀取上次使用的頻道（僅在客戶端）
      if (typeof window !== 'undefined') {
        try {
          const lastChannelId = localStorage.getItem(LAST_CHANNEL_STORAGE_KEY)
          if (lastChannelId) {
            defaultChannel = joinedChannels.find(c => c.id === lastChannelId)
          }
        } catch {
          // localStorage 不可用時忽略
        }
      }

      // 2. 如果沒有上次頻道，選擇機器人助手
      if (!defaultChannel) {
        defaultChannel = joinedChannels.find(c => c.name === BOT_CHANNEL_NAME)
      }

      // 3. 最後選第一個已加入的頻道
      if (!defaultChannel) {
        defaultChannel = joinedChannels[0]
      }

      if (defaultChannel) {
        selectChannel(defaultChannel)
      }
    }
  }, [joinedChannels.length, selectedChannel?.id])

  // 記住最後使用的頻道（僅在客戶端）
  useEffect(() => {
    if (selectedChannel?.id && typeof window !== 'undefined') {
      try {
        localStorage.setItem(LAST_CHANNEL_STORAGE_KEY, selectedChannel.id)
      } catch {
        // localStorage 不可用時忽略
      }
    }
  }, [selectedChannel?.id])

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
     
  }, [selectedChannel?.id])

  // Realtime 訂閱：當前頻道的訊息變更時即時更新
  const channelSubscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!selectedChannel?.id) return

    // 取消舊的訂閱
    if (channelSubscriptionRef.current) {
      supabase.removeChannel(channelSubscriptionRef.current)
    }

    // 建立新的訂閱
    const channel = supabase
      .channel(`messages_channel_${selectedChannel.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${selectedChannel.id}`,
        },
        (payload) => {
          logger.log('[Workspace] Realtime 訊息更新:', payload.eventType)
          // 重新載入訊息
          loadMessages(selectedChannel.id)
        }
      )
      .subscribe()

    channelSubscriptionRef.current = channel

    return () => {
      if (channelSubscriptionRef.current) {
        supabase.removeChannel(channelSubscriptionRef.current)
        channelSubscriptionRef.current = null
      }
    }
     
  }, [selectedChannel?.id])
}
