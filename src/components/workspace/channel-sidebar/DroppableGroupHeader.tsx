'use client'

import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { DroppableGroupHeaderProps } from './types'
import { COMP_WORKSPACE_LABELS } from '../constants/labels'

export function DroppableGroupHeader({
  groupId,
  groupName,
  isCollapsed,
  onToggle,
  onDelete,
}: DroppableGroupHeaderProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: groupId,
  })

  return (
    <div ref={setNodeRef} className="flex items-center gap-1 group/header w-full">
      <button
        className={cn(
          'flex items-center gap-1 px-2 py-1 text-xs font-semibold text-morandi-secondary uppercase tracking-wider flex-1 hover:bg-morandi-container/20 rounded transition-colors',
          isOver && 'bg-morandi-gold/20'
        )}
        onClick={onToggle}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        <span>{groupName}</span>
        {isOver && <span className="ml-auto text-morandi-gold">放開以移動</span>}
      </button>
      {onDelete && (
        <button
          onClick={e => {
            e.stopPropagation()
            onDelete(groupId)
          }}
          className="opacity-0 group-hover/header:opacity-100 p-1 rounded hover:bg-status-danger-bg text-status-danger hover:text-status-danger transition-opacity"
          title={COMP_WORKSPACE_LABELS.刪除群組}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}
