'use client'

import { ChevronsUpDown, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

export function ChannelSidebar({
  workspaces,
  channels,
  currentWorkspace,
  onChannelSelect,
  user
}) {
  const { logout } = useAuthStore()

  return (
    <div className="h-full bg-gray-800 text-gray-300 flex flex-col">
      {/* Workspace Selector */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="font-bold text-lg text-white">{currentWorkspace?.name || 'Workspace'}</h1>
        {/* A real workspace switcher would go here */}
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-sm font-bold text-gray-400 mb-2">CHANNELS</h2>
        <ul>
          {channels?.map(channel => (
            <li 
              key={channel.id} 
              className="cursor-pointer hover:bg-gray-700 p-2 rounded text-white"
              onClick={() => onChannelSelect(channel)}
            >
              # {channel.name}
            </li>
          ))}
        </ul>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-600"></div>
          <span className="font-semibold text-white">{user?.email || 'User'}</span>
        </div>
        <button onClick={logout} className="text-gray-400 hover:text-white">
          <LogOut size={20} />
        </button>
      </div>
    </div>
  )
}
