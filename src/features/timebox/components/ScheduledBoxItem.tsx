'use client'

import { useState, memo, useCallback } from 'react'
import { Dumbbell, MessageSquare, Package, Check } from 'lucide-react'
import { type TimeboxScheduledBox, type TimeboxBox, useTimeboxScheduledBoxes } from '../hooks/useTimeboxData'
import { useTimeboxResize } from '../hooks/useTimeboxResize'
import { useTimeboxDrag } from '../hooks/useTimeboxDrag'
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
  slotHeight: number
  slotMinutes: number
  startHour: number
  allScheduledBoxes: TimeboxScheduledBox[]
}

function ScheduledBoxItem({
  scheduledBox,
  height,
  topOffset = 0,
  boxes,
  slotHeight,
  slotMinutes,
  startHour,
  allScheduledBoxes,
}: ScheduledBoxItemProps) {
  const [showDialog, setShowDialog] = useState(false)
  const { update: updateScheduledBox } = useTimeboxScheduledBoxes()

  const box = boxes.find(b => b.id === scheduledBox.box_id)
  if (!box) return null

  const boxType = (box.type || 'basic') as 'workout' | 'reminder' | 'basic'
  const Icon = typeIcons[boxType] || Package

  // 拖曳調整時長
  const { isResizing, previewDuration, hasConflict: resizeConflict, handleResizeStart } = useTimeboxResize({
    scheduledBoxId: scheduledBox.id,
    initialDuration: scheduledBox.duration,
    dayOfWeek: scheduledBox.day_of_week,
    startTime: scheduledBox.start_time,
    slotHeight,
    slotMinutes,
    allScheduledBoxes,
    onResize: async (newDuration) => {
      await updateScheduledBox(scheduledBox.id, { duration: newDuration })
    },
  })

  // 拖曳移動（支援跨天）
  const { isDragging, previewTopOffset, previewDayOfWeek, hasConflict: dragConflict, handleDragStart } = useTimeboxDrag({
    scheduledBoxId: scheduledBox.id,
    dayOfWeek: scheduledBox.day_of_week,
    initialStartTime: scheduledBox.start_time,
    duration: isResizing ? previewDuration : scheduledBox.duration,
    slotHeight,
    slotMinutes,
    startHour,
    allScheduledBoxes,
    onMove: async (newStartTime, newDayOfWeek) => {
      const updates: Partial<TimeboxScheduledBox> = { start_time: newStartTime }
      if (newDayOfWeek !== undefined) {
        updates.day_of_week = newDayOfWeek
      }
      await updateScheduledBox(scheduledBox.id, updates)
    },
  })

  // 計算顯示高度（resize 時使用預覽值）
  const displayHeight = isResizing
    ? (previewDuration / slotMinutes) * slotHeight
    : height

  // 計算顯示位置（drag 時使用預覽值）
  const displayTopOffset = isDragging ? previewTopOffset : topOffset

  // 是否跨天拖曳中
  const isCrossDayDragging = isDragging && previewDayOfWeek !== scheduledBox.day_of_week

  // 是否有任何衝突
  const hasConflict = resizeConflict || dragConflict

  // 快速切換完成狀態
  const handleQuickComplete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation() // 防止打開對話框
    await updateScheduledBox(scheduledBox.id, { completed: !scheduledBox.completed })
  }, [scheduledBox.id, scheduledBox.completed, updateScheduledBox])

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

  // 決定顯示的時長文字（拖曳時顯示預覽值）
  const displayDuration = isResizing ? previewDuration : scheduledBox.duration

  // 是否正在操作中
  const isActive = isResizing || isDragging

  return (
    <>
      <div
        className={`absolute inset-x-1 rounded-lg shadow-sm border-2 px-2 py-1 text-white transition-all duration-100 hover:shadow-md group ${
          scheduledBox.completed ? 'opacity-75' : ''
        } ${isActive ? 'z-50 shadow-lg' : ''} ${hasConflict ? 'border-red-500' : 'border-border/40'} ${
          isDragging ? 'cursor-grabbing opacity-90' : 'cursor-grab'
        } ${isCrossDayDragging ? 'ring-2 ring-morandi-gold ring-offset-2' : ''}`}
        style={{
          top: `${displayTopOffset}px`,
          height: `${Math.max(displayHeight - 2, 20)}px`,
          backgroundColor: hasConflict ? '#ef4444' : (box.color || '#D4D4D4'),
          borderLeft: `3px solid ${scheduledBox.completed ? 'var(--morandi-green, #4ade80)' : 'rgba(255,255,255,0.3)'}`,
          // 拖曳時禁用過渡動畫，讓移動更即時
          transition: isActive ? 'none' : undefined,
        }}
        onClick={() => !isActive && setShowDialog(true)}
        onPointerDown={(e) => {
          // 如果點擊的是 resize handle，不要觸發 drag
          if ((e.target as HTMLElement).dataset.resizeHandle) return
          handleDragStart(e)
        }}
      >
        <div className="flex h-full items-center gap-1.5 overflow-hidden pb-1.5">
          <Icon className="h-3 w-3 flex-shrink-0 opacity-90" />
          <div className="flex-1 min-w-0 leading-tight">
            <div className="font-medium text-xs truncate">
              {box.name}
            </div>
            {displayHeight > 28 && (
              <div className="text-[10px] opacity-80 truncate">
                {formatTime(scheduledBox.start_time)} • {formatDuration(displayDuration)}
              </div>
            )}
          </div>
          {/* 快速完成按鈕 */}
          <button
            onClick={handleQuickComplete}
            className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
              scheduledBox.completed
                ? 'bg-card/30 hover:bg-card/50'
                : 'bg-card/20 hover:bg-card/40'
            }`}
            title={scheduledBox.completed ? '取消完成' : '標記完成'}
          >
            <Check className={`h-3 w-3 ${scheduledBox.completed ? 'opacity-100' : 'opacity-40'}`} />
          </button>
        </div>

        {/* 底部 Resize Handle */}
        <div
          data-resize-handle="true"
          onPointerDown={(e) => {
            e.stopPropagation()
            handleResizeStart(e)
          }}
          className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize rounded-b-lg transition-colors ${
            isResizing
              ? 'bg-card/50'
              : 'bg-transparent group-hover:bg-card/20'
          }`}
          title="拖曳調整時長"
        />
      </div>

      {/* 跨天拖曳時的幽靈預覽 */}
      {isCrossDayDragging && (
        <div
          className="fixed pointer-events-none z-[100] rounded-lg px-2 py-1 text-white opacity-50"
          style={{
            width: '120px',
            height: `${Math.max(displayHeight - 2, 20)}px`,
            backgroundColor: box.color || '#D4D4D4',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="flex h-full items-center gap-1.5">
            <Icon className="h-3 w-3 flex-shrink-0 opacity-90" />
            <div className="font-medium text-xs truncate">{box.name}</div>
          </div>
        </div>
      )}

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
