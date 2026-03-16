'use client'

import { useDroppable } from '@dnd-kit/core'

export type DropZoneAcceptType = 'attraction' | 'hotel' | 'restaurant'

interface DroppableZoneProps {
  id: string
  acceptType: DropZoneAcceptType
  children: React.ReactNode
  className?: string
}

export function DroppableZone({ id, acceptType, children, className }: DroppableZoneProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id,
    data: { acceptType },
  })

  const draggedType = active?.data.current?.type as string | undefined
  const isCompatible = draggedType === acceptType
  const showHighlight = isOver && isCompatible
  const showReject = isOver && !isCompatible

  const highlightStyles: Record<DropZoneAcceptType, string> = {
    attraction: 'ring-2 ring-morandi-gold/60 bg-morandi-gold/10',
    hotel: 'ring-2 ring-blue-500/60 bg-blue-500/10',
    restaurant: 'ring-2 ring-orange-500/60 bg-orange-500/10',
  }

  return (
    <div
      ref={setNodeRef}
      className={`${className || ''} transition-all duration-150 ${
        showHighlight ? highlightStyles[acceptType] : ''
      }${showReject ? ' ring-1 ring-red-300/40' : ''}`}
    >
      {children}
    </div>
  )
}
