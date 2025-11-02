'use client'

import { useEffect } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent } from '@dnd-kit/core'
import { useAuthStore } from '@/stores/auth-store'
import { removeChannelMember } from '@/services/workspace-members'
import { useWorkspaceChannels, useWorkspaceMembers } from '@/stores/workspace-store'
import type { Channel } from '@/stores/workspace-store'
import type { ChannelSidebarProps } from './types'
import { useChannelSidebar } from './useChannelSidebar'
import { useChannelState } from './hooks/useChannelState'
import { MemberManagementDialog, ChannelDeleteDialog, GroupDeleteDialog } from './MemberManagementDialog'
import { WorkspaceHeader } from './WorkspaceHeader'
import { CreateGroupDialog } from './CreateGroupDialog'
import { CreateChannelDialog } from './CreateChannelDialog'
import { EditChannelDialog } from './EditChannelDialog'
import { ChannelList } from './ChannelList'

export function ChannelSidebar({ selectedChannelId, onSelectChannel }: ChannelSidebarProps) {
  // Use selective hooks for better performance
  const {
    channels,
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

  const {
    channelMembers,
    loadChannelMembers,
  } = useWorkspaceMembers()

  const { user } = useAuthStore()

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

  // Load channel members when selectedChannelId changes
  useEffect(() => {
    if (!selectedChannelId || !currentWorkspace) {
      return
    }

    void loadChannelMembers(currentWorkspace.id, selectedChannelId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const group = channelGroups.find(g => g.id === groupId)
    if (group) {
      openDeleteGroupDialog(group)
    }
  }

  const handleDeleteClick = (channelId: string) => {
    const channel = channels.find(ch => ch.id === channelId)
    if (channel) {
      openDeleteChannelDialog(channel)
    }
  }

  const handleJoinChannel = async (channelId: string) => {
    if (!user || !currentWorkspace) return

    try {
      const { addChannelMembers } = await import('@/services/workspace-members')
      await addChannelMembers(currentWorkspace.id, channelId, [user.id], 'member')
      await loadChannelMembers(currentWorkspace.id, channelId)
    } catch (error) {
      console.error('Failed to join channel:', error)
    }
  }

  const handleLeaveChannel = async (channelId: string) => {
    if (!user || !currentWorkspace) return

    const channel = channels.find(ch => ch.id === channelId)
    if (!channel) return

    const confirmed = confirm(`確定要離開 #${channel.name} 頻道嗎？`)
    if (!confirmed) return

    try {
      const members = channelMembers[channelId] || []
      const currentMember = members.find(m => m.employeeId === user.id)

      if (currentMember) {
        await removeChannelMember(currentWorkspace.id, channelId, currentMember.id)
        await loadChannelMembers(currentWorkspace.id, channelId)
      }
    } catch (error) {
      console.error('Failed to leave channel:', error)
    }
  }

  const toggleChannelPin = async (channelId: string) => {
    const channel = channels.find(ch => ch.id === channelId)
    if (!channel) return

    try {
      await updateChannel(channelId, {
        is_pinned: !channel.is_pinned,
      })
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  const handleEditClick = (channelId: string) => {
    const channel = channels.find(ch => ch.id === channelId)
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
      console.error('Failed to update channel:', error)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const draggedChannelId = active.id as string
    const draggedChannel = channels.find(ch => ch.id === draggedChannelId)

    if (!draggedChannel) {
      return
    }

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

  const isAdmin = user?.permissions?.includes('admin') ?? false

  const checkIsMember = (channelId: string): boolean => {
    const members = channelMembers[channelId] || []
    return members.some(m => m.employeeId === user?.id)
  }

  // Helper function: sort channels by pinned and name
  const sortChannels = (channels: Channel[]) => {
    return [...channels].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return a.name.localeCompare(b.name, 'zh-TW')
    })
  }

  // 1. Company announcements (system group, fixed at top)
  const announcementGroup = channelGroups.find(g => g.is_system && g.system_type === 'company_announcements')
  const announcementChannels = announcementGroup
    ? sortChannels(filteredChannels.filter(ch => ch.group_id === announcementGroup.id && !ch.is_archived))
    : []

  // 2. User-defined groups (exclude archived)
  const userGroups = channelGroups.filter(g => !g.is_system).sort((a, b) => (a.order || 0) - (b.order || 0))
  const userGroupedChannels = userGroups.map(group => ({
    group,
    channels: sortChannels(filteredChannels.filter(ch => ch.group_id === group.id && !ch.is_archived && checkIsMember(ch.id))),
  }))

  // 3. Ungrouped channels (joined but not grouped, exclude archived)
  const ungroupedChannels = sortChannels(
    filteredChannels.filter(ch => !ch.group_id && !ch.is_archived && checkIsMember(ch.id))
  )

  // 4. Unjoined channels (public + not joined, exclude archived)
  const unjoinedChannels = sortChannels(
    filteredChannels.filter(ch => ch.type === 'public' && !ch.is_archived && !checkIsMember(ch.id))
  )

  // 5. Archived (system group, fixed at bottom)
  const archivedGroup = channelGroups.find(g => g.is_system && g.system_type === 'archived')
  const archivedChannels = archivedGroup
    ? sortChannels(filteredChannels.filter(ch => ch.is_archived || ch.group_id === archivedGroup.id))
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
    if (!newChannelName.trim() || !currentWorkspace || !user) {
      return
    }

    try {
      await createChannel({
        workspace_id: currentWorkspace.id,
        name: newChannelName.trim(),
        description: newChannelDescription.trim() || undefined,
        type: newChannelType,
        created_by: user.id,
      })

      resetCreateChannelDialog()
    } catch (error) {
      console.error('Failed to create channel:', error)
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
        userGroupedChannels={userGroupedChannels}
        ungroupedChannels={ungroupedChannels}
        unjoinedChannels={unjoinedChannels}
        archivedChannels={archivedChannels}
        archivedGroup={archivedGroup}
        selectedChannelId={selectedChannelId}
        isAdmin={isAdmin}
        expandedSections={expandedSections}
        onSelectChannel={onSelectChannel}
        toggleChannelFavorite={toggleChannelPin}
        onDelete={handleDeleteClick}
        onEdit={handleEditClick}
        onJoinChannel={handleJoinChannel}
        onLeaveChannel={handleLeaveChannel}
        checkIsMember={checkIsMember}
        toggleGroupCollapse={toggleGroupCollapse}
        handleDeleteGroupClick={handleDeleteGroupClick}
        onToggleExpanded={(section, expanded) => {
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
        onChannelNameChange={setNewChannelName}
        onChannelDescriptionChange={setNewChannelDescription}
        onChannelTypeChange={setNewChannelType}
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
