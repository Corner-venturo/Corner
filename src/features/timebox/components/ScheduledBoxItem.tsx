'use client'

import { useState, memo } from 'react'
import { Dumbbell, MessageSquare, Package, Check } from 'lucide-react'
import { type TimeboxScheduledBox, type TimeboxBox } from '../hooks/useTimeboxData'
import BasicDialog from './box-dialogs/BasicDialog'
import WorkoutDialog from './box-dialogs/WorkoutDialog'
import ReminderDialog from './box-dialogs/ReminderDialog'

const typeIcons = {
  workout: Dumbbell,
  reminder: MessageSquare,
  basic: Package,
}

interface ScheduledBoxItemProps {
  scheduledBox: TimeboxScheduledBox
  height: number
  topOffset?: number
  boxes: TimeboxBox[]
}

function ScheduledBoxItem({ scheduledBox, height, topOffset = 0, boxes }: ScheduledBoxItemProps) {
  const [showDialog, setShowDialog] = useState(false)

  const box = boxes.find(b => b.id === scheduledBox.box_id)
  if (!box) return null

  const boxType = (box.type || 'basic') as 'workout' | 'reminder' | 'basic'
  const Icon = typeIcons[boxType] || Package

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${minutes}m`
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5)
  }

  return (
    <>
      <div
        className={`absolute inset-x-1 rounded-lg shadow-sm border border-border/40 px-2 py-1 text-white cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
          scheduledBox.completed ? 'opacity-75' : ''
        }`}
        style={{
          top: `${topOffset}px`,
          height: `${Math.max(height - 2, 20)}px`,
          backgroundColor: box.color || '#D4D4D4',
          borderLeft: `3px solid ${scheduledBox.completed ? 'var(--morandi-green, #4ade80)' : 'rgba(255,255,255,0.3)'}`,
        }}
        onClick={() => setShowDialog(true)}
      >
        <div className="flex h-full items-center gap-1.5 overflow-hidden">
          <Icon className="h-3 w-3 flex-shrink-0 opacity-90" />
          <div className="flex-1 min-w-0 leading-tight">
            <div className="font-medium text-xs truncate">
              {box.name}
            </div>
            {height > 28 && (
              <div className="text-[10px] opacity-80 truncate">
                {formatTime(scheduledBox.start_time)} • {formatDuration(scheduledBox.duration)}
              </div>
            )}
          </div>
          {scheduledBox.completed && (
            <Check className="h-3 w-3 flex-shrink-0 text-morandi-green/60" />
          )}
        </div>
      </div>

      {showDialog && (
        <>
          {boxType === 'workout' && (
            <WorkoutDialog
              scheduledBox={scheduledBox}
              box={box}
              onClose={() => setShowDialog(false)}
            />
          )}
          {boxType === 'reminder' && (
            <ReminderDialog
              scheduledBox={scheduledBox}
              box={box}
              onClose={() => setShowDialog(false)}
            />
          )}
          {boxType === 'basic' && (
            <BasicDialog
              scheduledBox={scheduledBox}
              box={box}
              onClose={() => setShowDialog(false)}
            />
          )}
        </>
      )}
    </>
  )
}

export default memo(ScheduledBoxItem)
