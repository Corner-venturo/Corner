'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { DroppableGroupHeaderProps } from './types';

export function DroppableGroupHeader({
  groupId,
  groupName,
  isCollapsed,
  onToggle
}: DroppableGroupHeaderProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: groupId,
  });

  return (
    <button
      ref={setNodeRef}
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
  );
}
