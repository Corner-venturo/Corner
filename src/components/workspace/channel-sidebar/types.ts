import type { Channel } from '@/stores/workspace-store'

export interface ChannelSidebarProps {
  selectedChannelId: string | null
  onSelectChannel: (channel: Channel | null) => void
}

export interface SortableChannelItemProps {
  channel: Channel
  isActive: boolean
  onSelectChannel: (channel: Channel | null) => void
  toggleChannelFavorite: (id: string) => void
  onDelete?: (id: string) => void
  onEdit?: (id: string) => void
  isAdmin?: boolean
  isMember?: boolean
  onJoinChannel?: (channelId: string) => void
  onLeaveChannel?: (channelId: string) => void
}

export interface DroppableGroupHeaderProps {
  groupId: string
  groupName: string
  isCollapsed: boolean
  onToggle: () => void
  onDelete?: (groupId: string) => void
}
