'use client'

import { useState, memo, useEffect } from 'react'
import { useTimeboxStore, ScheduledBox } from '@/stores/timebox-store'
import { Dumbbell, MessageSquare, Package, Check } from 'lucide-react'
import WorkoutDialog from './box-dialogs/workout-dialog'
import ReminderDialog from './box-dialogs/reminder-dialog'
import BasicDialog from './box-dialogs/basic-dialog'

const typeIcons = {
  workout: Dumbbell,
  reminder: MessageSquare,
  basic: Package,
}

interface ScheduledBoxItemProps {
  scheduledBox: ScheduledBox
  height: number
}

function ScheduledBoxItem({ scheduledBox, height }: ScheduledBoxItemProps) {
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
      className={`h-full w-full rounded-t-md shadow-sm border-l-4 p-2 text-white cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
        scheduledBox.completed ? 'opacity-75' : ''
      }`}
      style={{
        backgroundColor: box.color,
        borderLeftColor: scheduledBox.completed ? '#10B981' : box.color,
      }}
      onClick={() => setShowDialog(true)}
    >
      <div className="flex items-start justify-between h-full">
        <div className="flex-1 min-w-0">
          {/* 箱子名稱 */}
          <div className="font-medium text-sm truncate mb-1">
            {box.name}
          </div>

          {/* 時間資訊 */}
          <div className="text-xs opacity-90">
            {scheduledBox.startTime} • {formatDuration(scheduledBox.duration)}
          </div>

          {/* 完成狀態 */}
          {scheduledBox.completed && scheduledBox.completedAt && (
            <div className="text-xs opacity-90 mt-1">
              ✓ {new Date(scheduledBox.completedAt).toLocaleTimeString('zh-TW', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center space-y-1 ml-2">
          {/* 類型圖示 */}
          <Icon className="h-4 w-4" />

          {/* 完成標記 */}
          {scheduledBox.completed && (
            <Check className="h-3 w-3 text-green-300" />
          )}
        </div>
      </div>

      {/* 對話框 */}
      {showDialog && (
        <>
          {box.type === 'workout' && (
            <WorkoutDialog
              scheduledBox={scheduledBox}
              onClose={() => setShowDialog(false)}
            />
          )}
          {box.type === 'reminder' && (
            <ReminderDialog
              scheduledBox={scheduledBox}
              onClose={() => setShowDialog(false)}
            />
          )}
          {box.type === 'basic' && (
            <BasicDialog
              scheduledBox={scheduledBox}
              onClose={() => setShowDialog(false)}
            />
          )}
        </>
      )}
    </div>
  )
}

export default memo(ScheduledBoxItem)