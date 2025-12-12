'use client'

import { logger } from '@/lib/utils/logger'
import { useEffect } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent } from '@dnd-kit/core'
import { useAuthStore } from '@/stores/auth-store'
import { removeChannelMember } from '@/services/workspace-members'
import { useWorkspaceChannels, useWorkspaceMembers } from '@/stores/workspace-store'
import { useChannelMemberStore } from '@/stores/workspace/channel-member-store'
import { useChannelStore } from '@/stores/workspace/channel-store'
import type { Channel, ChannelGroup } from '@/stores/workspace/types'
import type { ChannelSidebarProps } from './types'
import { useChannelSidebar } from './useChannelSidebar'
import { useChannelState } from './hooks/useChannelState'
import {
  MemberManagementDialog,
  ChannelDeleteDialog,
  GroupDeleteDialog,
} from './MemberManagementDialog'
import { WorkspaceHeader } from './WorkspaceHeader'
import { CreateGroupDialog } from './CreateGroupDialog'
import { CreateChannelDialog } from './CreateChannelDialog'
import { EditChannelDialog } from './EditChannelDialog'
import { ChannelList } from './ChannelList'
import { confirm, alert } from '@/lib/ui/alert-dialog'

export function ChannelSidebar({ selectedChannelId, onSelectChannel }: ChannelSidebarProps) {
  // 🔥 直接訂閱 channel store 的 items，繞過 Facade 的響應式問題
  const channelStoreItems = useChannelStore(state => state.items)

  // Use selective hooks for better performance
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

  // 🔥 使用 store 的 items 作為 channels（響應式更新）
  const channels = channelStoreItems as Channel[]

  const { channelMembers, loadChannelMembers } = useWorkspaceMembers()

  const { user } = useAuthStore()

  // 🔥 載入所有頻道成員資料（用於檢查是否已加入頻道）
  const allChannelMembers = useChannelMemberStore(state => state.items)

  // Use the new state hook
  const {
    showNewGroupDialog,
    setShowNewGroupDialog,
    newGroupName,
    setNewGroupName,
    memberToRemove,
    isRemoveDialogOpen,
    isRemovingMember,
    setIsRemovingMember,
    openRemoveMemberDialog,
    closeRemoveMemberDialog,
    channelToDelete,
    isDeleteDialogOpen,
    isDeletingChannel,
    setIsDeletingChannel,
    openDeleteChannelDialog,
    closeDeleteChannelDialog,
    groupToDelete,
    isGroupDeleteDialogOpen,
    isDeletingGroup,
    setIsDeletingGroup,
    openDeleteGroupDialog,
    closeDeleteGroupDialog,
    showCreateChannelDialog,
    setShowCreateChannelDialog,
    newChannelName,
    setNewChannelName,
    newChannelDescription,
    setNewChannelDescription,
    newChannelType,
    setNewChannelType,
    newChannelScope,
    setNewChannelScope,
    selectedMembers,
    setSelectedMembers,
    resetCreateChannelDialog,
    showEditChannelDialog,
    channelToEdit,
    editChannelName,
    setEditChannelName,
    editChannelDescription,
    setEditChannelDescription,
    openEditChannelDialog,
    resetEditChannelDialog,
  } = useChannelState()

  const { expandedSections, setExpandedSections, filteredChannels } = useChannelSidebar(
    channels,
    searchQuery,
    channelFilter
  )

  // 🔥 載入所有頻道成員資料（用於檢查是否已加入）
  useEffect(() => {
    if (!currentWorkspace) return

    // 載入 channel_members store（包含所有頻道的成員資料）
    useChannelMemberStore.getState().fetchAll()
  }, [currentWorkspace?.id])

  // 🔥 開啟建立頻道對話框時，自動選中建立者
  useEffect(() => {
    if (showCreateChannelDialog && user?.id && !selectedMembers.includes(user.id)) {
      setSelectedMembers([user.id])
    }
  }, [showCreateChannelDialog, user?.id])

  // Load channel members when selectedChannelId changes
  useEffect(() => {
    if (!selectedChannelId || !currentWorkspace) {
      return
    }

    void loadChannelMembers(currentWorkspace.id, selectedChannelId)
     
  }, [selectedChannelId, currentWorkspace?.id])

  const handleRemoveMember = async () => {
    if (!memberToRemove || !selectedChannelId || !currentWorkspace) {
      return
    }

    setIsRemovingMember(true)
    try {
      await removeChannelMember(currentWorkspace.id, selectedChannelId, memberToRemove.id)
      closeRemoveMemberDialog()
    } catch (error) {
    } finally {
      setIsRemovingMember(false)
    }
  }

  const handleDeleteChannel = async () => {
    if (!channelToDelete) {
      return
    }

    setIsDeletingChannel(true)
    try {
      await deleteChannel(channelToDelete.id)
      closeDeleteChannelDialog()
    } catch (error) {
    } finally {
      setIsDeletingChannel(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!groupToDelete) {
      return
    }

    setIsDeletingGroup(true)
    try {
      await deleteChannelGroup(groupToDelete.id)
      closeDeleteGroupDialog()
    } catch (error) {
    } finally {
      setIsDeletingGroup(false)
    }
  }

  const handleDeleteGroupClick = (groupId: string) => {
    const group = channelGroups.find((g: ChannelGroup) => g.id === groupId)
    if (group) {
      openDeleteGroupDialog(group)
    }
  }

  const handleDeleteClick = (channelId: string) => {
    const channel = channels.find((ch: Channel) => ch.id === channelId)
    if (channel) {
      openDeleteChannelDialog(channel)
    }
  }

  const handleJoinChannel = async (channelId: string) => {
    if (!user || !currentWorkspace) return

    try {
      const { addChannelMembers } = await import('@/services/workspace-members')
      await addChannelMembers(currentWorkspace.id, channelId, [user.id], 'member')

      // 🔥 重新載入頻道成員列表
      await loadChannelMembers(currentWorkspace.id, channelId)

      // 🔥 重新載入 channel_members store（更新成員數量）
      const { useChannelMemberStore } = await import('@/stores/workspace/channel-member-store')
      await useChannelMemberStore.getState().fetchAll()

      // 🔥 重新載入頻道列表（更新側邊欄的「未加入」狀態）
      await loadChannels(currentWorkspace.id)
    } catch (error) {
      logger.error('Failed to join channel:', error)
    }
  }

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

        // 🔥 重新載入頻道成員列表
        await loadChannelMembers(currentWorkspace.id, channelId)

        // 🔥 重新載入 channel_members store（更新成員數量）
        const { useChannelMemberStore } = await import('@/stores/workspace/channel-member-store')
        await useChannelMemberStore.getState().fetchAll()

        // 🔥 重新載入頻道列表（更新側邊欄的「未加入」狀態）
        await loadChannels(currentWorkspace.id)
      }
    } catch (error) {
      logger.error('Failed to leave channel:', error)
    }
  }

  const toggleChannelPin = async (channelId: string) => {
    const channel = channels.find((ch: Channel) => ch.id === channelId)
    if (!channel) {
      logger.error('toggleChannelPin: channel not found', channelId)
      return
    }

    try {
      // 🔥 直接使用 store 的 update，繞過 Facade，確保響應式更新
      await useChannelStore.getState().update(channelId, {
        is_favorite: !channel.is_favorite,
      })
    } catch (error) {
      logger.error('Failed to toggle pin:', error)
    }
  }

  const handleEditClick = (channelId: string) => {
    const channel = channels.find((ch: Channel) => ch.id === channelId)
    if (channel) {
      openEditChannelDialog(channel)
    }
  }

  const handleEditChannel = async () => {
    if (!channelToEdit || !editChannelName.trim()) return

    try {
      await updateChannel(channelToEdit.id, {
        name: editChannelName.trim(),
        description: editChannelDescription.trim() || undefined,
      })
      resetEditChannelDialog()
    } catch (error) {
      logger.error('Failed to update channel:', error)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const draggedChannelId = active.id as string
    const draggedChannel = channels.find((ch: Channel) => ch.id === draggedChannelId)

    if (!draggedChannel) {
      return
    }

    const targetGroup = channelGroups.find((g: ChannelGroup) => g.id === over.id)

    if (targetGroup) {
      await updateChannel(draggedChannelId, {
        group_id: targetGroup.id,
        is_favorite: false,
      })
      return
    }

    const targetChannel = channels.find((ch: Channel) => ch.id === over.id)

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
          const targetGroupExists = channelGroups.find((g: ChannelGroup) => g.id === targetChannel.group_id)
          if (targetGroupExists) {
            await updateChannel(draggedChannelId, {
              group_id: targetChannel.group_id,
              is_favorite: false,
            })
          }
        }
      } else {
        const groupChannels = channels.filter(
          (ch: Channel) =>
            (bothHaveNoGroup ? !ch.group_id : ch.group_id === draggedChannel.group_id) &&
            ch.is_favorite === draggedChannel.is_favorite
        )

        const oldIndex = groupChannels.findIndex((ch: Channel) => ch.id === draggedChannelId)
        const newIndex = groupChannels.findIndex((ch: Channel) => ch.id === over.id)

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedChannels = arrayMove(groupChannels, oldIndex, newIndex)

          for (let i = 0; i < reorderedChannels.length; i++) {
            await updateChannelOrder(reorderedChannels[i].id, i)
          }
        }
      }
    }
  }

  const isAdmin = user?.permissions?.includes('admin') ?? false

  const checkIsMember = (channelId: string): boolean => {
    // 🔥 優先使用 channel_members store（包含所有頻道的成員資料）
    if (allChannelMembers.length > 0) {
      return allChannelMembers.some(
        m => m.channel_id === channelId && m.employee_id === user?.id
      )
    }

    // Fallback: 使用當前載入的頻道成員列表
    const members = channelMembers[channelId] || []
    return members.some(m => m.employeeId === user?.id)
  }

  // Helper function: sort channels by name
  const sortChannels = (channels: Channel[]) => {
    return [...channels].sort((a: Channel, b: Channel) => {
      // 🔥 已改為獨立「我的最愛」群組，這裡只需依名稱排序
      return a.name.localeCompare(b.name, 'zh-TW')
    })
  }

  // 1. Company announcements (system group, fixed at top)
  const announcementGroup = channelGroups.find(
    (g: ChannelGroup) => g.is_system && g.system_type === 'company_announcements'
  )
  const announcementChannels = announcementGroup
    ? sortChannels(
        filteredChannels.filter((ch: Channel) => ch.group_id === announcementGroup.id && !ch.is_archived)
      )
    : []

  // 🔥 2. 我的最愛（is_favorite: true，獨立群組顯示）
  const favoriteChannels = sortChannels(
    filteredChannels.filter(
      (ch: Channel) => ch.is_favorite && !ch.is_archived && checkIsMember(ch.id)
    )
  )
  // 已加入最愛的頻道 ID 列表（用於排除）
  const favoriteChannelIds = new Set(favoriteChannels.map(ch => ch.id))

  // 3. User-defined groups (exclude archived and favorites)
  const userGroups = channelGroups
    .filter((g: ChannelGroup) => !g.is_system)
    .sort((a: ChannelGroup, b: ChannelGroup) => (a.order || 0) - (b.order || 0))
  const userGroupedChannels = userGroups.map((group: ChannelGroup) => ({
    group,
    channels: sortChannels(
      filteredChannels.filter(
        ch => ch.group_id === group.id && !ch.is_archived && checkIsMember(ch.id) && !favoriteChannelIds.has(ch.id)
      )
    ),
  }))

  // 4. Ungrouped channels (joined but not grouped, exclude archived and favorites)
  const ungroupedChannels = sortChannels(
    filteredChannels.filter((ch: Channel) => !ch.group_id && !ch.is_archived && checkIsMember(ch.id) && !favoriteChannelIds.has(ch.id))
  )

  // 4. Unjoined channels (public + not joined, exclude archived)
  const unjoinedChannels = sortChannels(
    filteredChannels.filter((ch: Channel) => ch.type === 'public' && !ch.is_archived && !checkIsMember(ch.id))
  )

  // 5. Archived (system group, fixed at bottom)
  const archivedGroup = channelGroups.find((g: ChannelGroup) => g.is_system && g.system_type === 'archived')
  const archivedChannels = archivedGroup
    ? sortChannels(
        filteredChannels.filter((ch: Channel) => ch.is_archived || ch.group_id === archivedGroup.id)
      )
    : []

  const handleCreateGroup = () => {
    if (newGroupName.trim() && currentWorkspace) {
      createChannelGroup({
        workspace_id: currentWorkspace.id,
        name: newGroupName.trim(),
        is_collapsed: false,
        order: channelGroups.length,
      })
      setNewGroupName('')
      setShowNewGroupDialog(false)
    }
  }

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !currentWorkspace || !user || selectedMembers.length === 0) {
      return
    }

    try {
      // 建立頻道
      const newChannel = await createChannel({
        workspace_id: currentWorkspace.id,
        name: newChannelName.trim(),
        description: newChannelDescription.trim() || undefined,
        type: newChannelType,
        scope: newChannelScope, // 全集團或分公司
        created_by: user.id,
      } as Parameters<typeof createChannel>[0])

      // 🔥 批次加入選中的成員
      if (newChannel?.id) {
        try {
          const channelMemberStore = useChannelMemberStore.getState()

          // 批次建立成員
          const memberPromises = selectedMembers.map(async (employeeId) => {
            return channelMemberStore.create({
              workspace_id: currentWorkspace.id,
              channel_id: newChannel.id,
              employee_id: employeeId,
              role: employeeId === user.id ? 'owner' : 'member', // 建立者是 owner
              status: 'active',
            })
          })

          await Promise.all(memberPromises)
          logger.log(`✅ Added ${selectedMembers.length} members to channel`)

          // 🔥 重新載入 channel_members store
          await channelMemberStore.fetchAll()
        } catch (memberError) {
          logger.warn('⚠️ Failed to add members:', memberError)
        }
      }

      resetCreateChannelDialog()
    } catch (error) {
      logger.error('Failed to create channel:', error)
      void alert('建立頻道失敗', 'error')
    }
  }

  return (
    <div className="w-[280px] bg-white border-r border-morandi-gold/20 flex flex-col shrink-0">
      {/* Workspace header */}
      <WorkspaceHeader
        workspaceName={currentWorkspace?.name || ''}
        workspaceIcon={currentWorkspace?.icon || ''}
        channelFilter={channelFilter}
        onFilterChange={setChannelFilter}
        onCreateChannel={() => setShowCreateChannelDialog(true)}
        onCreateGroup={() => setShowNewGroupDialog(true)}
        onRefresh={() => currentWorkspace?.id && loadChannels(currentWorkspace.id)}
        isRefreshing={loading}
      />

      {/* Search input */}
      <div className="px-4 py-2">
        <input
          type="text"
          placeholder="搜尋頻道..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* Channel list */}
      <ChannelList
        announcementChannels={announcementChannels}
        announcementGroup={announcementGroup}
        favoriteChannels={favoriteChannels}
        userGroupedChannels={userGroupedChannels}
        ungroupedChannels={ungroupedChannels}
        unjoinedChannels={unjoinedChannels}
        archivedChannels={archivedChannels}
        archivedGroup={archivedGroup}
        selectedChannelId={selectedChannelId}
        isAdmin={isAdmin}
        expandedSections={expandedSections}
        searchQuery={searchQuery}
        onSelectChannel={onSelectChannel}
        toggleChannelFavorite={toggleChannelPin}
        onDelete={handleDeleteClick}
        onEdit={handleEditClick}
        onJoinChannel={handleJoinChannel}
        onLeaveChannel={handleLeaveChannel}
        checkIsMember={checkIsMember}
        toggleGroupCollapse={toggleGroupCollapse}
        handleDeleteGroupClick={handleDeleteGroupClick}
        onToggleExpanded={(section: string, expanded: boolean) => {
          setExpandedSections(prev => ({ ...prev, [section]: expanded }))
        }}
        onDragEnd={handleDragEnd}
      />

      {/* Dialogs */}
      <CreateGroupDialog
        isOpen={showNewGroupDialog}
        groupName={newGroupName}
        onGroupNameChange={setNewGroupName}
        onClose={() => setShowNewGroupDialog(false)}
        onCreate={handleCreateGroup}
      />

      <CreateChannelDialog
        isOpen={showCreateChannelDialog}
        channelName={newChannelName}
        channelDescription={newChannelDescription}
        channelType={newChannelType}
        channelScope={newChannelScope}
        selectedMembers={selectedMembers}
        onChannelNameChange={setNewChannelName}
        onChannelDescriptionChange={setNewChannelDescription}
        onChannelTypeChange={setNewChannelType}
        onChannelScopeChange={setNewChannelScope}
        onMembersChange={setSelectedMembers}
        onClose={resetCreateChannelDialog}
        onCreate={handleCreateChannel}
      />

      <EditChannelDialog
        isOpen={showEditChannelDialog}
        channelName={editChannelName}
        channelDescription={editChannelDescription}
        onChannelNameChange={setEditChannelName}
        onChannelDescriptionChange={setEditChannelDescription}
        onClose={resetEditChannelDialog}
        onSave={handleEditChannel}
      />

      <MemberManagementDialog
        memberToRemove={memberToRemove}
        isRemoveDialogOpen={isRemoveDialogOpen}
        isRemovingMember={isRemovingMember}
        onClose={closeRemoveMemberDialog}
        onRemove={handleRemoveMember}
      />

      <ChannelDeleteDialog
        channelToDelete={channelToDelete}
        isDeleteDialogOpen={isDeleteDialogOpen}
        isDeletingChannel={isDeletingChannel}
        onClose={closeDeleteChannelDialog}
        onDelete={handleDeleteChannel}
      />

      <GroupDeleteDialog
        groupToDelete={groupToDelete}
        isDeleteDialogOpen={isGroupDeleteDialogOpen}
        isDeletingGroup={isDeletingGroup}
        onClose={closeDeleteGroupDialog}
        onDelete={handleDeleteGroup}
      />
    </div>
  )
}
