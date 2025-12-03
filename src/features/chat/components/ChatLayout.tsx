'use client'

import { useState, useEffect } from 'react'
import { ChannelSidebar } from './ChannelSidebar'
import { MessageView } from './MessageView'
import { MessageInput } from './MessageInput'

export function ChatLayout({ initialData }) {
  const { workspaces, channels, user } = initialData
  const [currentWorkspace, setCurrentWorkspace] = useState(workspaces?.[0])
  const [currentChannel, setCurrentChannel] = useState(channels?.[0])

  useEffect(() => {
    // Set initial state from server-fetched data
    if (!currentWorkspace && workspaces?.[0]) {
      setCurrentWorkspace(workspaces[0])
    }
    if (!currentChannel && channels?.[0]) {
      setCurrentChannel(channels[0])
    }
  }, [workspaces, channels, currentWorkspace, currentChannel])

  const handleChannelSelect = (channel) => {
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
