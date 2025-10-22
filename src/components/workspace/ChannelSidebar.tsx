'use client';

import { useState, useMemo } from 'react';
import { Hash, Lock, Star, Search, ChevronDown, ChevronRight, Plus, Settings, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Channel, ChannelGroup, useWorkspaceStore } from '@/stores/workspace-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  } = useWorkspaceStore();

  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    favorites: true,
    ungrouped: true
  });

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
    </div>
  );
}
