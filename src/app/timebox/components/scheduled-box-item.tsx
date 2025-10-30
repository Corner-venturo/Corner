'use client'

import { useState, memo, useEffect } from 'react'

import { Dumbbell, MessageSquare, Package, Check } from 'lucide-react'

import { useTimeboxStore, ScheduledBox } from '@/stores/timebox-store'

import BasicDialog from './box-dialogs/basic-dialog'
import ReminderDialog from './box-dialogs/reminder-dialog'
import WorkoutDialog from './box-dialogs/workout-dialog'

const typeIcons = {
  workout: Dumbbell,
  reminder: MessageSquare,
  basic: Package,
}

interface ScheduledBoxItemProps {
  scheduledBox: ScheduledBox
  height: number
  topOffset?: number
}

function ScheduledBoxItem({ scheduledBox, height, topOffset = 0 }: ScheduledBoxItemProps) {
  const { boxes } = useTimeboxStore()
  const [showDialog, setShowDialog] = useState(false)

  // 監聽來自中間格子的點擊事件
  useEffect(() => {
    const handleOpenDialog = (event: CustomEvent) => {
      if (event.detail.scheduledBoxId === scheduledBox.id) {
        setShowDialog(true)
      }
    }

    window.addEventListener('openBoxDialog', handleOpenDialog as EventListener)
    return () => {
      window.removeEventListener('openBoxDialog', handleOpenDialog as EventListener)
    }
  }, [scheduledBox.id])

  const box = boxes.find(b => b.id === scheduledBox.boxId)
  if (!box) return null

  const Icon = typeIcons[box.type]

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${minutes}m`
  }

  return (
    <div
      className={`absolute inset-x-0.5 rounded-xl shadow-sm border border-border/40 px-3 py-2 text-white cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
        scheduledBox.completed ? 'opacity-80' : ''
      }`}
      style={{
        top: `${topOffset + 2}px`,
        height: `${height - 4}px`,
        backgroundColor: box.color,
        borderLeft: `4px solid ${scheduledBox.completed ? 'var(--morandi-green)' : box.color}`,
      }}
      onClick={() => setShowDialog(true)}
    >
      <div className="flex h-full flex-col justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{box.name}</div>
            <div className="text-xs opacity-90">
              {scheduledBox.start_time} • {formatDuration(scheduledBox.duration)}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 text-white/90">
            <Icon className="h-4 w-4" />
            {scheduledBox.completed && <Check className="h-3 w-3 text-morandi-green" />}
          </div>
        </div>

        {scheduledBox.completed && scheduledBox.completedAt && (
          <div className="text-[11px] opacity-90">
            ✓{' '}
            {new Date(scheduledBox.completedAt).toLocaleTimeString('zh-TW', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>

      {showDialog && (
        <>
          {box.type === 'workout' && (
            <WorkoutDialog scheduledBox={scheduledBox} onClose={() => setShowDialog(false)} />
          )}
          {box.type === 'reminder' && (
            <ReminderDialog scheduledBox={scheduledBox} onClose={() => setShowDialog(false)} />
          )}
          {box.type === 'basic' && (
            <BasicDialog scheduledBox={scheduledBox} onClose={() => setShowDialog(false)} />
          )}
        </>
      )}
    </div>
  )
}

export default memo(ScheduledBoxItem)
