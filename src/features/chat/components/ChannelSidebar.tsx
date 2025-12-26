'use client'

import { ChevronsUpDown, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import type { User } from '@/stores/types'
import type { Workspace, Channel } from '@/stores/workspace/types'

interface ChannelSidebarProps {
  workspaces: Workspace[];
  channels: Channel[];
  currentWorkspace: Workspace | null;
  onChannelSelect: (channel: Channel) => void;
  user: User | null;
}

export function ChannelSidebar({
  workspaces,
  channels,
  currentWorkspace,
  onChannelSelect,
  user
}: ChannelSidebarProps) {
  const { logout } = useAuthStore()

  return (
    <div className="h-full bg-foreground text-morandi-muted flex flex-col">
      {/* Workspace Selector */}
      <div className="p-4 border-b border-border">
        <h1 className="font-bold text-lg text-white">{currentWorkspace?.name || 'Workspace'}</h1>
        {/* A real workspace switcher would go here */}
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-sm font-bold text-morandi-muted mb-2">CHANNELS</h2>
        <ul>
          {channels?.map((channel: Channel) => (
            <li
              key={channel.id}
              className="cursor-pointer hover:bg-muted p-2 rounded text-white"
              onClick={() => onChannelSelect(channel)}
            >
              # {channel.name}
            </li>
          ))}
        </ul>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-morandi-muted"></div>
          <span className="font-semibold text-white">{user?.display_name || 'User'}</span>
        </div>
        <button onClick={logout} className="text-morandi-muted hover:text-white">
          <LogOut size={20} />
        </button>
      </div>
    </div>
  )
}
