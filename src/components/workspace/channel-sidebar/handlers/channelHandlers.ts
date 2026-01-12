import { logger } from '@/lib/utils/logger'
import { arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Channel, ChannelGroup } from '@/stores/workspace/types'
import { useChannelStore } from '@/stores/workspace/channel-store'
import { useChannelMemberStore } from '@/stores/workspace/channel-member-store'
import { alert } from '@/lib/ui/alert-dialog'

/** Channel creation data */
interface CreateChannelData {
  workspace_id: string
  name: string
  description?: string
  type: 'public' | 'private'
  scope?: 'workspace' | 'company'
  created_by: string
}

/** Channel group creation data */
interface CreateChannelGroupData {
  workspace_id: string
  name: string
  is_collapsed: boolean
  order: number
}

interface ChannelHandlersParams {
  channels: Channel[]
  channelGroups: ChannelGroup[]
  currentWorkspace: { id: string } | null
  user: { id: string } | null
  updateChannel: (channelId: string, updates: Partial<Channel>) => Promise<void>
  updateChannelOrder: (channelId: string, order: number) => Promise<void>
  createChannel: (channel: CreateChannelData) => Promise<Channel | null>
  deleteChannel: (channelId: string) => Promise<void>
  deleteChannelGroup: (groupId: string) => Promise<void>
  loadChannels: (workspaceId: string) => Promise<void>
  createChannelGroup: (group: CreateChannelGroupData) => void
  selectedMembers: string[]
}

/**
 * 建立頻道操作處理函數
 */
export function createChannelHandlers(params: ChannelHandlersParams) {
  const {
    channels,
    channelGroups,
    currentWorkspace,
    user,
    updateChannel,
    updateChannelOrder,
    createChannel,
    deleteChannel,
    deleteChannelGroup,
    loadChannels,
    createChannelGroup,
    selectedMembers,
  } = params

  // 編輯頻道
  const handleEditChannel = async (
    channelToEdit: Channel | null,
    editChannelName: string,
    editChannelDescription: string
  ) => {
    if (!channelToEdit || !editChannelName.trim()) return

    try {
      await updateChannel(channelToEdit.id, {
        name: editChannelName.trim(),
        description: editChannelDescription.trim() || undefined,
      })
    } catch (error) {
      logger.error('Failed to update channel:', error)
    }
  }

  // 刪除頻道
  const handleDeleteChannel = async (channelToDelete: Channel | null) => {
    if (!channelToDelete) return
    try {
      await deleteChannel(channelToDelete.id)
    } catch (error) {
      logger.error('Failed to delete channel:', error)
    }
  }

  // 刪除群組
  const handleDeleteGroup = async (groupToDelete: ChannelGroup | null) => {
    if (!groupToDelete) return
    try {
      await deleteChannelGroup(groupToDelete.id)
    } catch (error) {
      logger.error('Failed to delete group:', error)
    }
  }

  // 建立群組
  const handleCreateGroup = (newGroupName: string) => {
    if (newGroupName.trim() && currentWorkspace) {
      createChannelGroup({
        workspace_id: currentWorkspace.id,
        name: newGroupName.trim(),
        is_collapsed: false,
        order: channelGroups.length,
      })
    }
  }

  // 建立頻道
  const handleCreateChannel = async (
    newChannelName: string,
    newChannelDescription: string,
    newChannelType: 'public' | 'private',
    newChannelScope: 'workspace' | 'company'
  ) => {
    if (!newChannelName.trim() || !currentWorkspace || !user || selectedMembers.length === 0) {
      return
    }

    try {
      const newChannel = await createChannel({
        workspace_id: currentWorkspace.id,
        name: newChannelName.trim(),
        description: newChannelDescription.trim() || undefined,
        type: newChannelType,
        scope: newChannelScope,
        created_by: user.id,
      })

      if (newChannel?.id) {
        try {
          const channelMemberStore = useChannelMemberStore.getState()
          const memberPromises = selectedMembers.map(async employeeId => {
            return channelMemberStore.create({
              workspace_id: currentWorkspace.id,
              channel_id: newChannel.id,
              employee_id: employeeId,
              role: employeeId === user.id ? 'owner' : 'member',
              status: 'active',
            })
          })

          await Promise.all(memberPromises)
          logger.log(`✅ Added ${selectedMembers.length} members to channel`)
          await channelMemberStore.fetchAll()
        } catch (memberError) {
          logger.warn('⚠️ Failed to add members:', memberError)
        }
      }
    } catch (error) {
      logger.error('Failed to create channel:', error)
      void alert('建立頻道失敗', 'error')
    }
  }

  // 拖放處理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const draggedChannelId = active.id as string
    const draggedChannel = channels.find(ch => ch.id === draggedChannelId)

    if (!draggedChannel) return

    const targetGroup = channelGroups.find(g => g.id === over.id)

    if (targetGroup) {
      await updateChannel(draggedChannelId, {
        group_id: targetGroup.id,
        is_favorite: false,
      })
      return
    }

    const targetChannel = channels.find(ch => ch.id === over.id)

    if (targetChannel) {
      const bothHaveNoGroup = !draggedChannel.group_id && !targetChannel.group_id
      const sameGroup = draggedChannel.group_id === targetChannel.group_id

      if (!bothHaveNoGroup && !sameGroup) {
        if (!targetChannel.group_id) {
          await updateChannel(draggedChannelId, {
            group_id: null,
            is_favorite: false,
          })
        } else {
          const targetGroupExists = channelGroups.find(g => g.id === targetChannel.group_id)
          if (targetGroupExists) {
            await updateChannel(draggedChannelId, {
              group_id: targetChannel.group_id,
              is_favorite: false,
            })
          }
        }
      } else {
        const groupChannels = channels.filter(
          ch =>
            (bothHaveNoGroup ? !ch.group_id : ch.group_id === draggedChannel.group_id) &&
            ch.is_favorite === draggedChannel.is_favorite
        )

        const oldIndex = groupChannels.findIndex(ch => ch.id === draggedChannelId)
        const newIndex = groupChannels.findIndex(ch => ch.id === over.id)

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedChannels = arrayMove(groupChannels, oldIndex, newIndex)

          for (let i = 0; i < reorderedChannels.length; i++) {
            await updateChannelOrder(reorderedChannels[i].id, i)
          }
        }
      }
    }
  }

  return {
    handleEditChannel,
    handleDeleteChannel,
    handleDeleteGroup,
    handleCreateGroup,
    handleCreateChannel,
    handleDragEnd,
  }
}
