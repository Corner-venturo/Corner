/**
 * 頻道列表區塊組件
 */

import { ChevronDown, ChevronRight, Hash, Star, Plus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SortableChannelItem } from './SortableChannelItem'
import { DroppableGroupHeader } from './DroppableGroupHeader'
import type { Channel } from '@/stores/workspace-store'

interface ChannelListSectionProps {
  channels: Channel[]
  selectedChannelId: string | null
  onSelectChannel: (channel: Channel | null) => void
  toggleChannelFavorite: (channelId: string) => void
  onDelete: (channelId: string) => void
  onEdit: (channelId: string) => void
  onJoinChannel: (channelId: string) => void
  onLeaveChannel: (channelId: string) => void
  isAdmin: boolean
  checkIsMember: (channelId: string) => boolean
  isExpanded: boolean
  onToggleExpanded: () => void
  title: string
  icon: 'star' | 'hash' | 'userPlus'
  showAddButton?: boolean
  onAddClick?: () => void
}

export function ChannelListSection({
  channels,
  selectedChannelId,
  onSelectChannel,
  toggleChannelFavorite,
  onDelete,
  onEdit,
  onJoinChannel,
  onLeaveChannel,
  isAdmin,
  checkIsMember,
  isExpanded,
  onToggleExpanded,
  title,
  icon,
  showAddButton,
  onAddClick,
}: ChannelListSectionProps) {
  if (channels.length === 0) return null

  const Icon = icon === 'star' ? Star : icon === 'userPlus' ? UserPlus : Hash

  return (
    <div className="px-2 py-2">
      <div className="flex items-center justify-between group/section">
        <button
          className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-morandi-secondary uppercase tracking-wider flex-1 hover:bg-morandi-container/20 rounded transition-colors"
          onClick={onToggleExpanded}
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <Icon size={12} />
          <span>{title}</span>
        </button>
        {showAddButton && onAddClick && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover/section:opacity-100 transition-opacity"
            onClick={onAddClick}
          >
            <Plus size={12} />
          </Button>
        )}
      </div>
      {isExpanded && (
        <div className="mt-1 space-y-0.5">
          {channels.map(channel => (
            <SortableChannelItem
              key={channel.id}
              channel={channel}
              isActive={channel.id === selectedChannelId}
              onSelectChannel={onSelectChannel}
              toggleChannelFavorite={toggleChannelFavorite}
              onDelete={onDelete}
              onEdit={onEdit}
              isAdmin={isAdmin}
              isMember={checkIsMember(channel.id)}
              onJoinChannel={onJoinChannel}
              onLeaveChannel={onLeaveChannel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface GroupedChannelListProps {
  group: import('@/stores/workspace-store').ChannelGroup
  channels: Channel[]
  selectedChannelId: string | null
  onSelectChannel: (channel: Channel | null) => void
  toggleChannelFavorite: (channelId: string) => void
  onDelete: (channelId: string) => void
  onEdit: (channelId: string) => void
  onJoinChannel: (channelId: string) => void
  onLeaveChannel: (channelId: string) => void
  isAdmin: boolean
  checkIsMember: (channelId: string) => boolean
  toggleGroupCollapse: (groupId: string) => void
  handleDeleteGroupClick: (groupId: string) => void
}

export function GroupedChannelList({
  group,
  channels,
  selectedChannelId,
  onSelectChannel,
  toggleChannelFavorite,
  onDelete,
  onEdit,
  onJoinChannel,
  onLeaveChannel,
  isAdmin,
  checkIsMember,
  toggleGroupCollapse,
  handleDeleteGroupClick,
}: GroupedChannelListProps) {
  return (
    <div className="px-2 py-2">
      <div className="flex items-center justify-between group/section">
        <DroppableGroupHeader
          groupId={group.id}
          groupName={group.name}
          isCollapsed={group.is_collapsed ?? false}
          onToggle={() => toggleGroupCollapse(group.id)}
          onDelete={handleDeleteGroupClick}
        />
      </div>
      {!group.is_collapsed && channels.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {channels.map(channel => (
            <SortableChannelItem
              key={channel.id}
              channel={channel}
              isActive={channel.id === selectedChannelId}
              onSelectChannel={onSelectChannel}
              toggleChannelFavorite={toggleChannelFavorite}
              onDelete={onDelete}
              onEdit={onEdit}
              isAdmin={isAdmin}
              isMember={checkIsMember(channel.id)}
              onJoinChannel={onJoinChannel}
              onLeaveChannel={onLeaveChannel}
            />
          ))}
        </div>
      )}
    </div>
  )
}
