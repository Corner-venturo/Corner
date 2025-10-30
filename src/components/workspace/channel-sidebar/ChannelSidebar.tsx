'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Hash,
  Lock,
  Star,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Channel, useWorkspaceStore } from '@/stores/workspace-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ChannelMember } from '@/services/workspace-members'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useAuthStore } from '@/stores/auth-store'
import { addChannelMembers } from '@/services/workspace-members'
import type { ChannelSidebarProps } from './types'
import { SortableChannelItem } from './SortableChannelItem'
import { DroppableGroupHeader } from './DroppableGroupHeader'
import { MemberManagementDialog, ChannelDeleteDialog, GroupDeleteDialog } from './MemberManagementDialog'
import { useChannelSidebar } from './useChannelSidebar'

export function ChannelSidebar({ selectedChannelId, onSelectChannel }: ChannelSidebarProps) {
  const {
    channels,
    channelGroups,
    currentWorkspace,
    searchQuery,
    channelFilter,
    setSearchQuery,
    setChannelFilter,
    toggleChannelFavorite,
    createChannelGroup,
    toggleGroupCollapse,
    channelMembers,
    loadChannelMembers,
    removeChannelMember,
    updateChannelOrder,
    updateChannel,
    deleteChannel,
    deleteChannelGroup,
    createChannel,
  } = useWorkspaceStore()
  const { user } = useAuthStore()

  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [memberToRemove, setMemberToRemove] = useState<ChannelMember | null>(null)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [isRemovingMember, setIsRemovingMember] = useState(false)
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletingChannel, setIsDeletingChannel] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<import('@/stores/workspace-store').ChannelGroup | null>(null)
  const [isGroupDeleteDialogOpen, setIsGroupDeleteDialogOpen] = useState(false)
  const [isDeletingGroup, setIsDeletingGroup] = useState(false)
  const [showCreateChannelDialog, setShowCreateChannelDialog] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDescription, setNewChannelDescription] = useState('')
  const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public')
  const [showEditChannelDialog, setShowEditChannelDialog] = useState(false)
  const [channelToEdit, setChannelToEdit] = useState<Channel | null>(null)
  const [editChannelName, setEditChannelName] = useState('')
  const [editChannelDescription, setEditChannelDescription] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const { expandedSections, setExpandedSections, filteredChannels } = useChannelSidebar(
    channels,
    searchQuery,
    channelFilter
  )

  useEffect(() => {
    if (!selectedChannelId || !currentWorkspace) {
      return
    }

    void loadChannelMembers(currentWorkspace.id, selectedChannelId)
  }, [selectedChannelId, currentWorkspace?.id, loadChannelMembers])

  const handleRemoveMember = async () => {
    if (!memberToRemove || !selectedChannelId || !currentWorkspace) {
      return
    }

    setIsRemovingMember(true)
    try {
      await removeChannelMember(currentWorkspace.id, selectedChannelId, memberToRemove.id)
      setIsRemoveDialogOpen(false)
      setMemberToRemove(null)
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
      setIsDeleteDialogOpen(false)
      setChannelToDelete(null)
    } catch (error) {
    } finally {
      setIsDeletingChannel(false)
    }
  }

  const handleDeleteClick = (channelId: string) => {
    const channel = channels.find(ch => ch.id === channelId)
    if (channel) {
      setChannelToDelete(channel)
      setIsDeleteDialogOpen(true)
    }
  }

  const handleDeleteGroup = async () => {
    if (!groupToDelete) {
      return
    }

    setIsDeletingGroup(true)
    try {
      await deleteChannelGroup(groupToDelete.id)
      setIsGroupDeleteDialogOpen(false)
      setGroupToDelete(null)
    } catch (error) {
      console.error('Failed to delete group:', error)
    } finally {
      setIsDeletingGroup(false)
    }
  }

  const handleDeleteGroupClick = (groupId: string) => {
    const group = channelGroups.find(g => g.id === groupId)
    if (group) {
      setGroupToDelete(group)
      setIsGroupDeleteDialogOpen(true)
    }
  }

  const handleJoinChannel = async (channelId: string) => {
    if (!user || !currentWorkspace) return

    try {
      await addChannelMembers(currentWorkspace.id, channelId, [user.id], 'member')
      // 重新載入頻道成員
      await loadChannelMembers(currentWorkspace.id, channelId)
    } catch (error) {
      console.error('Failed to join channel:', error)
    }
  }

  const handleEditClick = (channelId: string) => {
    const channel = channels.find(ch => ch.id === channelId)
    if (channel) {
      setChannelToEdit(channel)
      setEditChannelName(channel.name)
      setEditChannelDescription(channel.description || '')
      setShowEditChannelDialog(true)
    }
  }

  const handleEditChannel = async () => {
    if (!channelToEdit || !editChannelName.trim()) return

    try {
      await updateChannel(channelToEdit.id, {
        name: editChannelName.trim(),
        description: editChannelDescription.trim() || undefined,
      })
      setShowEditChannelDialog(false)
      setChannelToEdit(null)
      setEditChannelName('')
      setEditChannelDescription('')
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

  const favoriteChannels = filteredChannels.filter(ch => ch.is_favorite)
  const ungroupedChannels = filteredChannels.filter(ch => !ch.group_id && !ch.is_favorite)
  const groupedChannels = channelGroups.map(group => ({
    group,
    channels: filteredChannels.filter(ch => ch.group_id === group.id),
  }))

  // 檢查當前用戶是否為管理員
  const isAdmin = user?.permissions?.includes('admin') ?? false

  // 檢查當前用戶是否為頻道成員
  const checkIsMember = (channelId: string): boolean => {
    const members = channelMembers[channelId] || []
    return members.some(m => m.employeeId === user?.id)
  }

  const renderChannelList = (channelList: Channel[]) => {
    return (
      <div className="space-y-0.5">
        {channelList.map(channel => (
          <SortableChannelItem
            key={channel.id}
            channel={channel}
            isActive={channel.id === selectedChannelId}
            onSelectChannel={onSelectChannel}
            toggleChannelFavorite={toggleChannelFavorite}
            onDelete={handleDeleteClick}
            onEdit={handleEditClick}
            isAdmin={isAdmin}
            isMember={checkIsMember(channel.id)}
            onJoinChannel={handleJoinChannel}
          />
        ))}
      </div>
    )
  }

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

      setNewChannelName('')
      setNewChannelDescription('')
      setNewChannelType('public')
      setShowCreateChannelDialog(false)
    } catch (error) {}
  }

  return (
    <div className="w-[280px] bg-white border-r border-morandi-gold/20 flex flex-col shrink-0">
      {/* 工作空間標題列 */}
      <div className="h-[52px] px-6 border-b border-morandi-gold/20 bg-gradient-to-r from-morandi-gold/5 to-transparent flex items-center">
        <div className="flex items-center justify-between w-full">
          <h2 className="font-semibold text-morandi-primary truncate flex-1">
            {currentWorkspace?.icon} {currentWorkspace?.name || '工作空間'}
          </h2>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger className="btn-icon-morandi !w-7 !h-7">
                <Filter size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setChannelFilter('all')}
                  className="dropdown-item-morandi"
                >
                  全部頻道
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setChannelFilter('starred')}
                  className="dropdown-item-morandi"
                >
                  已加星號
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setChannelFilter('unread')}
                  className="dropdown-item-morandi"
                >
                  未讀訊息
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setChannelFilter('muted')}
                  className="dropdown-item-morandi"
                >
                  已靜音
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger className="btn-icon-morandi !w-7 !h-7">
                <Settings size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                <DropdownMenuItem
                  onClick={() => setShowCreateChannelDialog(true)}
                  className="dropdown-item-morandi"
                >
                  <Plus size={14} className="mr-2" />
                  建立頻道
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowNewGroupDialog(true)}
                  className="dropdown-item-morandi"
                >
                  <Plus size={14} className="mr-2" />
                  建立群組
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* 搜尋框 */}
      <div className="px-4 py-2">
        <input
          type="text"
          placeholder="搜尋頻道..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* 頻道區塊 */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={filteredChannels.map(ch => ch.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex-1 overflow-y-auto">
            {/* 我的最愛 */}
            {favoriteChannels.length > 0 && (
              <div className="px-2 py-2">
                <button
                  className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-morandi-secondary uppercase tracking-wider w-full hover:bg-morandi-container/20 rounded transition-colors"
                  onClick={() =>
                    setExpandedSections(prev => ({ ...prev, favorites: !prev.favorites }))
                  }
                >
                  {expandedSections.favorites ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                  <Star size={12} />
                  <span>我的最愛</span>
                </button>
                {expandedSections.favorites && (
                  <div className="mt-1">{renderChannelList(favoriteChannels)}</div>
                )}
              </div>
            )}

            {/* 自訂群組 */}
            {groupedChannels.map(({ group, channels: groupChannels }) => (
              <div key={group.id} className="px-2 py-2">
                <div className="flex items-center justify-between group/section">
                  <DroppableGroupHeader
                    groupId={group.id}
                    groupName={group.name}
                    isCollapsed={group.is_collapsed}
                    onToggle={() => toggleGroupCollapse(group.id)}
                    onDelete={handleDeleteGroupClick}
                  />
                </div>
                {!group.is_collapsed && groupChannels.length > 0 && (
                  <div className="mt-1">{renderChannelList(groupChannels)}</div>
                )}
              </div>
            ))}

            {/* 未分組頻道 */}
            {ungroupedChannels.length > 0 && (
              <div className="px-2 py-2">
                <div className="flex items-center justify-between group/section">
                  <button
                    className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-morandi-secondary uppercase tracking-wider flex-1 hover:bg-morandi-container/20 rounded transition-colors"
                    onClick={() =>
                      setExpandedSections(prev => ({ ...prev, ungrouped: !prev.ungrouped }))
                    }
                  >
                    {expandedSections.ungrouped ? (
                      <ChevronDown size={12} />
                    ) : (
                      <ChevronRight size={12} />
                    )}
                    <Hash size={12} />
                    <span>頻道</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover/section:opacity-100 transition-opacity"
                    onClick={() => setShowNewGroupDialog(true)}
                  >
                    <Plus size={12} />
                  </Button>
                </div>
                {expandedSections.ungrouped && (
                  <div className="mt-1">{renderChannelList(ungroupedChannels)}</div>
                )}
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* 新增群組對話框 */}
      {showNewGroupDialog && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="card-morandi-elevated w-80">
            <h3 className="font-semibold mb-3 text-morandi-primary">新增群組</h3>
            <input
              type="text"
              placeholder="群組名稱"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
              autoFocus
              className="input-morandi"
            />
            <div className="flex gap-2 mt-3 justify-end">
              <button
                className="btn-morandi-secondary !py-1.5 !px-3 text-sm"
                onClick={() => setShowNewGroupDialog(false)}
              >
                取消
              </button>
              <button
                className="btn-morandi-primary !py-1.5 !px-3 text-sm"
                onClick={handleCreateGroup}
              >
                建立
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增頻道對話框 */}
      {showCreateChannelDialog && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="card-morandi-elevated w-96">
            <h3 className="font-semibold mb-4 text-morandi-primary">建立頻道</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  頻道名稱
                </label>
                <input
                  type="text"
                  placeholder="例如：專案討論"
                  value={newChannelName}
                  onChange={e => setNewChannelName(e.target.value)}
                  autoFocus
                  className="input-morandi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  頻道描述（選填）
                </label>
                <textarea
                  placeholder="說明這個頻道的用途"
                  value={newChannelDescription}
                  onChange={e => setNewChannelDescription(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-2">
                  頻道類型
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewChannelType('public')}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg border transition-colors text-sm',
                      newChannelType === 'public'
                        ? 'border-morandi-gold bg-morandi-gold/10 text-morandi-primary'
                        : 'border-morandi-gold/20 text-morandi-secondary hover:border-morandi-gold/40'
                    )}
                  >
                    <Hash size={16} className="inline mr-1" />
                    公開
                  </button>
                  <button
                    onClick={() => setNewChannelType('private')}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg border transition-colors text-sm',
                      newChannelType === 'private'
                        ? 'border-morandi-gold bg-morandi-gold/10 text-morandi-primary'
                        : 'border-morandi-gold/20 text-morandi-secondary hover:border-morandi-gold/40'
                    )}
                  >
                    <Lock size={16} className="inline mr-1" />
                    私密
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4 justify-end">
              <button
                className="btn-morandi-secondary !py-1.5 !px-3 text-sm"
                onClick={() => {
                  setShowCreateChannelDialog(false)
                  setNewChannelName('')
                  setNewChannelDescription('')
                  setNewChannelType('public')
                }}
              >
                取消
              </button>
              <button
                className="btn-morandi-primary !py-1.5 !px-3 text-sm"
                onClick={handleCreateChannel}
                disabled={!newChannelName.trim()}
              >
                建立
              </button>
            </div>
          </div>
        </div>
      )}

      <MemberManagementDialog
        memberToRemove={memberToRemove}
        isRemoveDialogOpen={isRemoveDialogOpen}
        isRemovingMember={isRemovingMember}
        onClose={() => {
          setIsRemoveDialogOpen(false)
          setMemberToRemove(null)
        }}
        onRemove={handleRemoveMember}
      />

      <ChannelDeleteDialog
        channelToDelete={channelToDelete}
        isDeleteDialogOpen={isDeleteDialogOpen}
        isDeletingChannel={isDeletingChannel}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setChannelToDelete(null)
        }}
        onDelete={handleDeleteChannel}
      />

      <GroupDeleteDialog
        groupToDelete={groupToDelete}
        isDeleteDialogOpen={isGroupDeleteDialogOpen}
        isDeletingGroup={isDeletingGroup}
        onClose={() => {
          setIsGroupDeleteDialogOpen(false)
          setGroupToDelete(null)
        }}
        onDelete={handleDeleteGroup}
      />

      {/* 編輯頻道 Dialog */}
      {showEditChannelDialog && channelToEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px] shadow-xl">
            <h3 className="text-lg font-semibold text-morandi-primary mb-4">編輯頻道</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-morandi-secondary mb-1">
                  頻道名稱
                </label>
                <input
                  type="text"
                  value={editChannelName}
                  onChange={e => setEditChannelName(e.target.value)}
                  className="w-full px-3 py-2 border border-morandi-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50"
                  placeholder="輸入頻道名稱"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-morandi-secondary mb-1">
                  描述（可選）
                </label>
                <textarea
                  value={editChannelDescription}
                  onChange={e => setEditChannelDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-morandi-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50"
                  placeholder="輸入頻道描述"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowEditChannelDialog(false)
                  setChannelToEdit(null)
                  setEditChannelName('')
                  setEditChannelDescription('')
                }}
                className="flex-1 px-4 py-2 border border-morandi-gold/30 rounded-lg text-morandi-secondary hover:bg-morandi-container/20 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleEditChannel}
                disabled={!editChannelName.trim()}
                className="flex-1 px-4 py-2 bg-morandi-gold text-white rounded-lg hover:bg-morandi-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                儲存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
