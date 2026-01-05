'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/utils/logger'
import { useAuthStore } from '@/stores/auth-store'
import { removeChannelMember } from '@/services/workspace-members'
import { useWorkspaceChannels, useWorkspaceMembers } from '@/stores/workspace-store'
import { useChannelMemberStore } from '@/stores/workspace/channel-member-store'
import { useChannelStore } from '@/stores/workspace/channel-store'
import type { Channel } from '@/stores/workspace/types'
import { getWorkspaceMembers, getOrCreateDmChannel } from '@/lib/actions'
import { alert, confirm } from '@/lib/ui/alert-dialog'

/**
 * 頻道側邊欄狀態管理 Hook
 * 整合所有 stores、成員管理、頻道操作
 */
export function useChannelSidebarState() {
  const channelStoreItems = useChannelStore(state => state.items)
  const [dmMembers, setDmMembers] = useState<Awaited<ReturnType<typeof getWorkspaceMembers>>>([])
  const [isCreatingDm, setIsCreatingDm] = useState(false)

  const {
    channelGroups,
    currentWorkspace,
    searchQuery,
    channelFilter,
    setSearchQuery,
    setChannelFilter,
    createChannelGroup,
    toggleGroupCollapse,
    updateChannelOrder,
    updateChannel,
    deleteChannel,
    deleteChannelGroup,
    createChannel,
    loadChannels,
    loading,
  } = useWorkspaceChannels()

  const channels = channelStoreItems as Channel[]
  const { channelMembers, loadChannelMembers } = useWorkspaceMembers()
  const { user } = useAuthStore()
  const allChannelMembers = useChannelMemberStore(state => state.items)

  // 載入所有頻道成員資料
  useEffect(() => {
    if (!currentWorkspace) return
    useChannelMemberStore.getState().fetchAll()
  }, [currentWorkspace?.id])

  // 載入 workspace 成員用於 DM
  useEffect(() => {
    async function fetchMembers() {
      try {
        const members = await getWorkspaceMembers()
        setDmMembers(members)
      } catch (error) {
        logger.error('Failed to fetch workspace members for DMs:', error)
      }
    }
    fetchMembers()
  }, [])

  // 選擇成員建立 DM
  const handleSelectMember = async (memberId: string) => {
    setIsCreatingDm(true)
    try {
      const dmChannel = await getOrCreateDmChannel(memberId)
      return dmChannel as Channel | null
    } catch (error) {
      logger.error('Failed to create or get DM channel:', error)
      void alert('開啟私訊失敗', 'error')
      return null
    } finally {
      setIsCreatingDm(false)
    }
  }

  // 檢查是否已加入頻道
  const checkIsMember = (channelId: string): boolean => {
    if (allChannelMembers.length > 0) {
      return allChannelMembers.some(
        m => m.channel_id === channelId && m.employee_id === user?.id
      )
    }
    const members = channelMembers[channelId] || []
    return members.some(m => m.employeeId === user?.id)
  }

  // 加入頻道
  const handleJoinChannel = async (channelId: string) => {
    if (!user || !currentWorkspace) return

    try {
      const { addChannelMembers } = await import('@/services/workspace-members')
      await addChannelMembers(currentWorkspace.id, channelId, [user.id], 'member')
      await loadChannelMembers(currentWorkspace.id, channelId)
      await useChannelMemberStore.getState().fetchAll()
      await loadChannels(currentWorkspace.id)
    } catch (error) {
      logger.error('Failed to join channel:', error)
    }
  }

  // 離開頻道
  const handleLeaveChannel = async (channelId: string) => {
    if (!user || !currentWorkspace) return

    const channel = channels.find((ch: Channel) => ch.id === channelId)
    if (!channel) return

    const confirmed = await confirm(`確定要離開 #${channel.name} 頻道嗎？`, {
      title: '離開頻道',
      type: 'warning',
    })
    if (!confirmed) return

    try {
      const members = channelMembers[channelId] || []
      const currentMember = members.find(m => m.employeeId === user.id)

      if (currentMember) {
        await removeChannelMember(currentWorkspace.id, channelId, currentMember.id)
        await loadChannelMembers(currentWorkspace.id, channelId)
        await useChannelMemberStore.getState().fetchAll()
        await loadChannels(currentWorkspace.id)
      }
    } catch (error) {
      logger.error('Failed to leave channel:', error)
    }
  }

  // 切換頻道釘選
  const toggleChannelPin = async (channelId: string) => {
    const channel = channels.find((ch: Channel) => ch.id === channelId)
    if (!channel) {
      logger.error('toggleChannelPin: channel not found', channelId)
      return
    }

    try {
      await useChannelStore.getState().update(channelId, {
        is_favorite: !channel.is_favorite,
      })
    } catch (error) {
      logger.error('Failed to toggle pin:', error)
    }
  }

  // 封存頻道
  const archiveChannel = async (channelId: string) => {
    const channel = channels.find((ch: Channel) => ch.id === channelId)
    if (!channel) return

    const confirmed = await confirm(`確定要封存 #${channel.name} 頻道嗎？\n封存後頻道將移至「封存」區域。`, {
      title: '封存頻道',
      type: 'warning',
    })
    if (!confirmed) return

    try {
      const now = new Date().toISOString()
      await useChannelStore.getState().update(channelId, {
        is_archived: true,
        archived_at: now,
        updated_at: now,
      })
      logger.log(`頻道 ${channelId} 已封存`)
    } catch (error) {
      logger.error('Failed to archive channel:', error)
      void alert('封存頻道失敗', 'error')
    }
  }

  // 解除封存頻道
  const unarchiveChannel = async (channelId: string) => {
    const channel = channels.find((ch: Channel) => ch.id === channelId)
    if (!channel) return

    try {
      await useChannelStore.getState().update(channelId, {
        is_archived: false,
        archived_at: null,
        updated_at: new Date().toISOString(),
      })
      logger.log(`頻道 ${channelId} 已解除封存`)
    } catch (error) {
      logger.error('Failed to unarchive channel:', error)
      void alert('解除封存失敗', 'error')
    }
  }

  return {
    // State
    channels,
    channelGroups,
    currentWorkspace,
    searchQuery,
    channelFilter,
    dmMembers,
    isCreatingDm,
    loading,
    user,
    channelMembers,
    allChannelMembers,

    // Actions
    setSearchQuery,
    setChannelFilter,
    createChannelGroup,
    toggleGroupCollapse,
    updateChannelOrder,
    updateChannel,
    deleteChannel,
    deleteChannelGroup,
    createChannel,
    loadChannels,
    loadChannelMembers,
    handleSelectMember,
    checkIsMember,
    handleJoinChannel,
    handleLeaveChannel,
    toggleChannelPin,
    archiveChannel,
    unarchiveChannel,
  }
}
