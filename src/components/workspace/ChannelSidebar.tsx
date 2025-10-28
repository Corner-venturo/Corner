'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Users,
  UserMinus,
  GripVertical,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Channel, useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ChannelMember } from '@/services/workspace-members';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ROLE_LABELS: Record<string, string> = {
  owner: '擁有者',
  admin: '管理員',
  manager: '管理者',
  member: '成員',
  guest: '訪客',
};

const STATUS_LABELS: Record<string, string> = {
  active: '使用中',
  invited: '已邀請',
  pending: '待加入',
  suspended: '已停用',
  removed: '已移除',
};

const STATUS_BADGE_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  invited: 'secondary',
  pending: 'secondary',
  suspended: 'outline',
  removed: 'destructive',
};

const getMemberInitials = (name?: string | null, fallback?: string | null) => {
  const source = name || fallback || '';
  if (!source) return '成員';
  const words = source.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

const formatRoleLabel = (role?: string | null) => {
  if (!role) return '成員';
  const normalized = role.toLowerCase();
  return ROLE_LABELS[normalized] || role;
};

const formatStatusLabel = (status?: string | null) => {
  if (!status) return '未知狀態';
  const normalized = status.toLowerCase();
  return STATUS_LABELS[normalized] || status;
};

const getStatusBadgeVariant = (status?: string | null) => {
  if (!status) return 'outline';
  const normalized = status.toLowerCase();
  return STATUS_BADGE_VARIANTS[normalized] || 'outline';
};

interface ChannelSidebarProps {
  selectedChannelId: string | null;
  onSelectChannel: (channel: Channel) => void;
}

interface SortableChannelItemProps {
  channel: Channel;
  isActive: boolean;
  onSelectChannel: (channel: Channel) => void;
  toggleChannelFavorite: (id: string) => void;
  onDelete?: (id: string) => void;
}

function SortableChannelItem({ channel, isActive, onSelectChannel, toggleChannelFavorite, onDelete }: SortableChannelItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: channel.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 判斷是否為旅遊團頻道
  const isTourChannel = !!channel.tour_id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-grab active:cursor-grabbing transition-colors',
        isActive
          ? 'bg-morandi-gold/15 text-morandi-primary font-medium'
          : 'text-morandi-secondary hover:bg-morandi-container/20 hover:text-morandi-primary'
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => onSelectChannel(channel)}>
        {channel.type === 'private' ? (
          <Lock size={14} className="shrink-0" />
        ) : (
          <Hash size={14} className="shrink-0" />
        )}
        <span className="flex-1 truncate">{channel.name}</span>
      </div>
      <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log('🌟 [SortableChannelItem] 星號按鈕被點擊:', channel.name);
            toggleChannelFavorite(channel.id);
          }}
          className={cn(
            'opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-morandi-gold/20 transition-opacity',
            channel.is_favorite && 'opacity-100 text-morandi-gold'
          )}
        >
          <Star size={12} fill={channel.is_favorite ? 'currentColor' : 'none'} />
        </button>
        {!isTourChannel && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(channel.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 text-red-600 hover:text-red-700 transition-opacity"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

interface DroppableGroupHeaderProps {
  groupId: string;
  groupName: string;
  isCollapsed: boolean;
  onToggle: () => void;
}

function DroppableGroupHeader({ groupId, groupName, isCollapsed, onToggle }: DroppableGroupHeaderProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: groupId,
  });

  return (
    <button
      ref={setNodeRef}
      className={cn(
        'flex items-center gap-1 px-2 py-1 text-xs font-semibold text-morandi-secondary uppercase tracking-wider flex-1 hover:bg-morandi-container/20 rounded transition-colors',
        isOver && 'bg-morandi-gold/20'
      )}
      onClick={onToggle}
    >
      {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
      <span>{groupName}</span>
      {isOver && <span className="ml-auto text-morandi-gold">放開以移動</span>}
    </button>
  );
}

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
    reorderChannels,
    updateChannel,
    deleteChannel,
    createChannel,
  } = useWorkspaceStore();
  const { user } = useAuthStore();

  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    favorites: true,
    ungrouped: true
  });
  const [memberToRemove, setMemberToRemove] = useState<ChannelMember | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingChannel, setIsDeletingChannel] = useState(false);
  const [showCreateChannelDialog, setShowCreateChannelDialog] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 需要拖曳 8px 才會觸發拖曳，允許正常點擊
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const canManageMembers = useMemo(() => {
    if (!user) return false;
    const permissions = user.permissions || [];
    return permissions.includes('super_admin') ||
      permissions.includes('admin') ||
      permissions.includes('workspace:manage_members') ||
      permissions.includes('workspace:manage');
  }, [user]);

  // 篩選頻道
  const filteredChannels = useMemo(() => {
    let filtered = channels;

    // 搜尋篩選
    if (searchQuery) {
      filtered = filtered.filter(ch =>
        ch.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 狀態篩選
    if (channelFilter === 'starred') {
      filtered = filtered.filter(ch => ch.is_favorite);
    }

    // 根據 order 排序
    filtered = [...filtered].sort((a, b) => {
      const orderA = a.order ?? 9999;
      const orderB = b.order ?? 9999;
      return orderA - orderB;
    });

    return filtered;
  }, [channels, searchQuery, channelFilter]);

  useEffect(() => {
    if (!selectedChannelId || !currentWorkspace) {
      return;
    }

    void loadChannelMembers(currentWorkspace.id, selectedChannelId);
  }, [selectedChannelId, currentWorkspace?.id, loadChannelMembers]);

  const currentChannelMembers = useMemo(() => {
    if (!selectedChannelId) return [];
    return channelMembers[selectedChannelId] || [];
  }, [channelMembers, selectedChannelId]);

  const handleRemoveMember = async () => {
    if (!memberToRemove || !selectedChannelId || !currentWorkspace) {
      return;
    }

    setIsRemovingMember(true);
    try {
      await removeChannelMember(currentWorkspace.id, selectedChannelId, memberToRemove.id);
      setIsRemoveDialogOpen(false);
      setMemberToRemove(null);
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (!channelToDelete) {
      return;
    }

    setIsDeletingChannel(true);
    try {
      await deleteChannel(channelToDelete.id);
      setIsDeleteDialogOpen(false);
      setChannelToDelete(null);
    } catch (error) {
      console.error('Failed to delete channel:', error);
    } finally {
      setIsDeletingChannel(false);
    }
  };

  const handleDeleteClick = (channelId: string) => {
    const channel = channels.find(ch => ch.id === channelId);
    if (channel) {
      setChannelToDelete(channel);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('🎯 [handleDragEnd] 拖曳結束:', { activeId: active.id, overId: over?.id });

    if (!over || active.id === over.id) {
      console.log('⏭️ [handleDragEnd] 沒有目標或拖到自己，跳過');
      return;
    }

    const draggedChannelId = active.id as string;
    const draggedChannel = channels.find(ch => ch.id === draggedChannelId);

    if (!draggedChannel) {
      console.error('❌ [handleDragEnd] 找不到被拖曳的頻道:', draggedChannelId);
      return;
    }

    console.log('🎯 [handleDragEnd] 被拖曳的頻道:', draggedChannel.name);

    // 檢查是否拖到群組標題上（over.id 是群組 ID）
    const targetGroup = channelGroups.find(g => g.id === over.id);

    if (targetGroup) {
      console.log('📁 [handleDragEnd] 拖到群組:', targetGroup.name);
      // 拖到群組：更新該頻道的 group_id
      await updateChannel(draggedChannelId, {
        group_id: targetGroup.id,
        is_favorite: false // 移到群組時取消最愛
      });
      return;
    }

    // 檢查是否拖到其他頻道上
    const targetChannel = channels.find(ch => ch.id === over.id);

    if (targetChannel) {
      console.log('📄 [handleDragEnd] 拖到頻道:', targetChannel.name);

      // 同群組內排序或跨群組拖曳到另一個頻道上
      const bothHaveNoGroup = !draggedChannel.group_id && !targetChannel.group_id;
      const sameGroup = draggedChannel.group_id === targetChannel.group_id;

      if (!bothHaveNoGroup && !sameGroup) {
        console.log('🔀 [handleDragEnd] 跨群組拖曳');
        // 跨群組：只在兩個頻道都沒有群組時才允許移動
        // 或者目標頻道的 group_id 確實存在於 channel_groups 中
        if (!targetChannel.group_id) {
          // 移到沒有群組的區域
          await updateChannel(draggedChannelId, {
            group_id: null,
            is_favorite: false
          });
        } else {
          // 檢查目標群組是否存在
          const targetGroupExists = channelGroups.find(g => g.id === targetChannel.group_id);
          if (targetGroupExists) {
            await updateChannel(draggedChannelId, {
              group_id: targetChannel.group_id,
              is_favorite: false
            });
          } else {
            console.warn('⚠️ [handleDragEnd] 目標群組不存在，取消移動');
          }
        }
      } else {
        console.log('🔄 [handleDragEnd] 同群組內排序');
        // 同群組內：重新排序
        const groupChannels = channels.filter(ch =>
          (bothHaveNoGroup ? !ch.group_id : ch.group_id === draggedChannel.group_id) &&
          ch.is_favorite === draggedChannel.is_favorite
        );

        console.log('🔄 [handleDragEnd] 群組內頻道數量:', groupChannels.length);

        const oldIndex = groupChannels.findIndex(ch => ch.id === draggedChannelId);
        const newIndex = groupChannels.findIndex(ch => ch.id === over.id);

        console.log('🔄 [handleDragEnd] 移動:', { oldIndex, newIndex });

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedChannels = arrayMove(groupChannels, oldIndex, newIndex);

          console.log('🔄 [handleDragEnd] 重新排序後的頻道:', reorderedChannels.map((ch, i) => ({ name: ch.name, order: i })));

          // 更新順序
          for (let i = 0; i < reorderedChannels.length; i++) {
            console.log(`🔢 [handleDragEnd] 更新順序: ${reorderedChannels[i].name} -> ${i}`);
            await updateChannelOrder(reorderedChannels[i].id, i);
          }
          console.log('✅ [handleDragEnd] 所有順序更新完成');
        }
      }
    }
  };

  // 分類頻道
  const favoriteChannels = filteredChannels.filter(ch => ch.is_favorite);
  const ungroupedChannels = filteredChannels.filter(ch => !ch.group_id && !ch.is_favorite);
  const groupedChannels = channelGroups.map(group => ({
    group,
    channels: filteredChannels.filter(ch => ch.group_id === group.id)
  }));

  const renderChannelList = (channelList: Channel[]) => {
    return (
      <div className="space-y-0.5">
        {channelList.map((channel) => (
          <SortableChannelItem
            key={channel.id}
            channel={channel}
            isActive={channel.id === selectedChannelId}
            onSelectChannel={onSelectChannel}
            toggleChannelFavorite={toggleChannelFavorite}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>
    );
  };

  const handleCreateGroup = () => {
    if (newGroupName.trim() && currentWorkspace) {
      createChannelGroup({
        workspace_id: currentWorkspace.id,
        name: newGroupName.trim(),
        is_collapsed: false,
        order: channelGroups.length
      });
      setNewGroupName('');
      setShowNewGroupDialog(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !currentWorkspace || !user) {
      return;
    }

    try {
      await createChannel({
        workspace_id: currentWorkspace.id,
        name: newChannelName.trim(),
        description: newChannelDescription.trim() || undefined,
        type: newChannelType,
        created_by: user.id, // 🔥 修正：User 類型只有 id，沒有 employee_id
      });

      // 重置表單
      setNewChannelName('');
      setNewChannelDescription('');
      setNewChannelType('public');
      setShowCreateChannelDialog(false);
    } catch (error) {
      console.error('Failed to create channel:', error);
    }
  };

  return (
    <div className="w-[280px] bg-white border-r border-morandi-gold/20 flex flex-col shrink-0">
      {/* 工作空間標題列 */}
      <div className="h-[52px] px-6 border-b border-morandi-gold/20 bg-gradient-to-r from-morandi-gold/5 to-transparent flex items-center">
        <div className="flex items-center justify-between w-full">
          <h2 className="font-semibold text-morandi-primary truncate flex-1">
            {currentWorkspace?.icon} {currentWorkspace?.name || '工作空間'}
          </h2>
          <div className="flex items-center gap-1">
            {/* TODO: 實作搜尋功能 */}
            {/* <button className="btn-icon-morandi !w-7 !h-7">
              <Search size={14} />
            </button> */}
            <DropdownMenu>
              <DropdownMenuTrigger className="btn-icon-morandi !w-7 !h-7">
                <Filter size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setChannelFilter('all')} className="dropdown-item-morandi">
                  全部頻道
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChannelFilter('starred')} className="dropdown-item-morandi">
                  已加星號
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChannelFilter('unread')} className="dropdown-item-morandi">
                  未讀訊息
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChannelFilter('muted')} className="dropdown-item-morandi">
                  已靜音
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger className="btn-icon-morandi !w-7 !h-7">
                <Settings size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                <DropdownMenuItem onClick={() => setShowCreateChannelDialog(true)} className="dropdown-item-morandi">
                  <Plus size={14} className="mr-2" />
                  建立頻道
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowNewGroupDialog(true)} className="dropdown-item-morandi">
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
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-morandi h-8 text-sm"
        />
      </div>

      {/* 頻道區塊 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filteredChannels.map(ch => ch.id)} strategy={verticalListSortingStrategy}>
          <div className="flex-1 overflow-y-auto">
            {/* 我的最愛 */}
            {favoriteChannels.length > 0 && (
              <div className="px-2 py-2">
                <button
                  className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-morandi-secondary uppercase tracking-wider w-full hover:bg-morandi-container/20 rounded transition-colors"
                  onClick={() => setExpandedSections(prev => ({ ...prev, favorites: !prev.favorites }))}
                >
                  {expandedSections.favorites ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <Star size={12} />
                  <span>我的最愛</span>
                </button>
                {expandedSections.favorites && (
                  <div className="mt-1">
                    {renderChannelList(favoriteChannels)}
                  </div>
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
                  />
                </div>
                {!group.is_collapsed && groupChannels.length > 0 && (
                  <div className="mt-1">
                    {renderChannelList(groupChannels)}
                  </div>
                )}
              </div>
            ))}

            {/* 未分組頻道 */}
            {ungroupedChannels.length > 0 && (
              <div className="px-2 py-2">
                <div className="flex items-center justify-between group/section">
                  <button
                    className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-morandi-secondary uppercase tracking-wider flex-1 hover:bg-morandi-container/20 rounded transition-colors"
                    onClick={() => setExpandedSections(prev => ({ ...prev, ungrouped: !prev.ungrouped }))}
                  >
                    {expandedSections.ungrouped ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
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
                  <div className="mt-1">
                    {renderChannelList(ungroupedChannels)}
                  </div>
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
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
              autoFocus
              className="input-morandi"
            />
            <div className="flex gap-2 mt-3 justify-end">
              <button className="btn-morandi-secondary !py-1.5 !px-3 text-sm" onClick={() => setShowNewGroupDialog(false)}>
                取消
              </button>
              <button className="btn-morandi-primary !py-1.5 !px-3 text-sm" onClick={handleCreateGroup}>建立</button>
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
                <label className="block text-sm font-medium text-morandi-primary mb-1">頻道名稱</label>
                <input
                  type="text"
                  placeholder="例如：專案討論"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  autoFocus
                  className="input-morandi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">頻道描述（選填）</label>
                <textarea
                  placeholder="說明這個頻道的用途"
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  className="input-morandi resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-2">頻道類型</label>
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
                  setShowCreateChannelDialog(false);
                  setNewChannelName('');
                  setNewChannelDescription('');
                  setNewChannelType('public');
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

      <Dialog
        open={isRemoveDialogOpen}
        onOpenChange={(open) => {
          setIsRemoveDialogOpen(open);
          if (!open) {
            setMemberToRemove(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>移除頻道成員</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-morandi-secondary">
            確定要將「{memberToRemove?.profile?.displayName || memberToRemove?.profile?.englishName || '此成員'}」移出頻道嗎？
          </p>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setIsRemoveDialogOpen(false);
                setMemberToRemove(null);
              }}
              disabled={isRemovingMember}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={isRemovingMember}
            >
              {isRemovingMember ? '移除中...' : '移除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setChannelToDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-morandi-primary">刪除頻道</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-morandi-secondary">
            確定要刪除頻道「{channelToDelete?.name}」嗎？此操作無法復原。
          </p>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setChannelToDelete(null);
              }}
              disabled={isDeletingChannel}
              className="text-morandi-secondary hover:text-morandi-primary"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteChannel}
              disabled={isDeletingChannel}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingChannel ? '刪除中...' : '刪除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
