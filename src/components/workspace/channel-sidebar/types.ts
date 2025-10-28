import type { Channel } from '@/stores/workspace-store';

export interface ChannelSidebarProps {
  selectedChannelId: string | null;
  onSelectChannel: (channel: Channel) => void;
}

export interface SortableChannelItemProps {
  channel: Channel;
  isActive: boolean;
  onSelectChannel: (channel: Channel) => void;
  toggleChannelFavorite: (id: string) => void;
  onDelete?: (id: string) => void;
}

export interface DroppableGroupHeaderProps {
  groupId: string;
  groupName: string;
  isCollapsed: boolean;
  onToggle: () => void;
}
