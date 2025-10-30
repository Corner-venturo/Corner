'use client'

import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'

interface ChatHeaderProps {
  showMemberSidebar: boolean
  onToggleMemberSidebar: () => void
}

export function ChatHeader({ showMemberSidebar, onToggleMemberSidebar }: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onToggleMemberSidebar}>
        <Users size={16} />
      </Button>
    </div>
  )
}
