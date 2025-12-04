'use client'

import { useState, useEffect } from 'react'
import { ChannelSidebar } from './ChannelSidebar'
import { MessageView } from './MessageView'
import { MessageInput } from './MessageInput'
import type { User } from '@/stores/types'
import type { Workspace, Channel } from '@/stores/workspace/types'

interface ChatLayoutProps {
  initialData: {
    workspaces: Workspace[];
    channels: Channel[];
    user: User | null;
  };
}

export function ChatLayout({ initialData }: ChatLayoutProps) {
  const { workspaces, channels, user } = initialData
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(workspaces?.[0] || null)
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(channels?.[0] || null)

  useEffect(() => {
    // Set initial state from server-fetched data
    if (!currentWorkspace && workspaces?.[0]) {
      setCurrentWorkspace(workspaces[0])
    }
    if (!currentChannel && channels?.[0]) {
      setCurrentChannel(channels[0])
    }
  }, [workspaces, channels, currentWorkspace, currentChannel])

  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel)
  }

  return (
    <div className="h-screen w-full flex bg-gray-100">
      <div className="w-64 flex-shrink-0">
        <ChannelSidebar 
          workspaces={workspaces}
          channels={channels}
          currentWorkspace={currentWorkspace}
          onChannelSelect={handleChannelSelect}
          user={user}
        />
      </div>
      <main className="flex-1 flex flex-col">
        <MessageView channel={currentChannel} />
        <MessageInput channel={currentChannel} />
      </main>
    </div>
  )
}
