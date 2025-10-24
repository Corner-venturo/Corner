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

  // 分類頻道
  const favoriteChannels = filteredChannels.filter(ch => ch.is_favorite);
  const ungroupedChannels = filteredChannels.filter(ch => !ch.group_id && !ch.is_favorite);
  const groupedChannels = channelGroups.map(group => ({
    group,
    channels: filteredChannels.filter(ch => ch.group_id === group.id)
  }));

  const renderChannel = (channel: Channel) => {
    const isActive = channel.id === selectedChannelId;

    return (
      <div
        key={channel.id}
        className={cn(
          'group flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer transition-colors',
          isActive
            ? 'bg-morandi-gold/15 text-morandi-primary font-medium'
            : 'text-morandi-secondary hover:bg-morandi-container/20 hover:text-morandi-primary'
        )}
        onClick={() => onSelectChannel(channel)}
      >
        {channel.type === 'private' ? (
          <Lock size={14} className="shrink-0" />
        ) : (
          <Hash size={14} className="shrink-0" />
        )}
        <span className="flex-1 truncate">{channel.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleChannelFavorite(channel.id);
          }}
          className={cn(
            'opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-morandi-gold/20 transition-opacity',
            channel.is_favorite && 'opacity-100 text-morandi-gold'
          )}
        >
          <Star size={12} fill={channel.is_favorite ? 'currentColor' : 'none'} />
        </button>
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

  return (
    <div className="w-[280px] bg-morandi-container/5 border-r border-morandi-gold/20 flex flex-col shrink-0">
      {/* 工作空間標題列 */}
      <div className="h-[52px] px-6 border-b border-morandi-gold/20 bg-gradient-to-r from-morandi-gold/5 to-transparent flex items-center">
        <div className="flex items-center justify-between w-full">
          <h2 className="font-semibold text-morandi-primary truncate flex-1">
            {currentWorkspace?.icon} {currentWorkspace?.name || '工作空間'}
          </h2>
          <div className="flex items-center gap-1">
            <button className="btn-icon-morandi !w-7 !h-7">
              <Search size={14} />
            </button>
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
            <button className="btn-icon-morandi !w-7 !h-7">
              <Settings size={14} />
            </button>
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
              <div className="mt-1 space-y-0.5">
                {favoriteChannels.map(renderChannel)}
              </div>
            )}
          </div>
        )}

        {/* 自訂群組 */}
        {groupedChannels.map(({ group, channels: groupChannels }) => (
          <div key={group.id} className="px-2 py-2">
            <div className="flex items-center justify-between group/section">
              <button
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-morandi-secondary uppercase tracking-wider flex-1 hover:bg-morandi-container/20 rounded transition-colors"
                onClick={() => toggleGroupCollapse(group.id)}
              >
                {group.is_collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                <span>{group.name}</span>
              </button>
            </div>
            {!group.is_collapsed && groupChannels.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {groupChannels.map(renderChannel)}
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
              <div className="mt-1 space-y-0.5">
                {ungroupedChannels.map(renderChannel)}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 border-t border-morandi-gold/20">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-morandi-secondary">
              <Users size={12} />
              <span>頻道成員</span>
              {selectedChannelId && (
                <span className="text-[11px] text-morandi-secondary/70">{currentChannelMembers.length}</span>
              )}
            </div>
          </div>
          <div className="px-3 pb-4 space-y-1.5">
            {selectedChannelId ? (
              currentChannelMembers.length > 0 ? (
                currentChannelMembers.map((member) => {
                  const displayName = member.profile?.displayName || member.profile?.englishName || '未命名成員';
                  const roleLabel = formatRoleLabel(member.role);
                  const statusLabel = formatStatusLabel(member.status);
                  const statusVariant = getStatusBadgeVariant(member.status);

                  return (
                    <div
                      key={member.id}
                      className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-morandi-container/20"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-morandi-container text-[12px] font-semibold text-morandi-primary">
                        {getMemberInitials(member.profile?.displayName, member.profile?.englishName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-morandi-primary">{displayName}</p>
                        {member.profile?.englishName && member.profile.englishName !== displayName && (
                          <p className="truncate text-[11px] text-morandi-secondary">
                            {member.profile.englishName}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-morandi-secondary">
                          <Badge variant="secondary" className="capitalize">
                            {roleLabel}
                          </Badge>
                          <Badge variant={statusVariant} className="capitalize">
                            {statusLabel}
                          </Badge>
                        </div>
                      </div>
                      {canManageMembers && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-morandi-red opacity-0 transition-opacity hover:text-morandi-red group-hover:opacity-100"
                          onClick={(event) => {
                            event.stopPropagation();
                            setMemberToRemove(member);
                            setIsRemoveDialogOpen(true);
                          }}
                        >
                          <UserMinus size={14} />
                        </Button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="rounded-md bg-morandi-container/20 px-3 py-4 text-xs text-morandi-secondary">
                  尚未有成員加入此頻道
                </p>
              )
            ) : (
              <p className="rounded-md bg-morandi-container/20 px-3 py-4 text-xs text-morandi-secondary">
                選擇頻道以查看成員
              </p>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}
