'use client'

import { useState } from 'react'

import { useTimeboxStore } from '@/stores/timebox-store'

import BoxSelector from './box-selector'
import ScheduledBoxItem from './scheduled-box-item'

interface TimeGridProps {
  weekDays: Date[]
  timeInterval: 30 | 60
}

export default function TimeGrid({ weekDays, timeInterval }: TimeGridProps) {
  const { scheduledBoxes, addScheduledBox, currentWeek, initializeCurrentWeek, boxes } = useTimeboxStore()
  const [selectedCell, setSelectedCell] = useState<{
    dayOfWeek: number
    startTime: string
  } | null>(null)

  // 生成時間段
  const timeSlots: string[] = []
  for (let hour = 6; hour < 24; hour++) {
    if (timeInterval === 30) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`)
    } else {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
    }
  }

  // 檢查時間衝突
  const hasConflict = (dayOfWeek: number, startTime: string, duration: number) => {
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = startMinutes + duration

    return scheduledBoxes.some(box => {
      if (box.dayOfWeek !== dayOfWeek) return false

      const boxStartMinutes = timeToMinutes(box.startTime)
      const boxEndMinutes = boxStartMinutes + box.duration

      return (startMinutes < boxEndMinutes && endMinutes > boxStartMinutes)
    })
  }

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // 處理箱子選擇
  const handleBoxSelect = (boxId: string, duration: number) => {
    if (!selectedCell) return

    // 確保有 currentWeek，如果沒有則創建
    let weekId = currentWeek?.id
    if (!currentWeek) {
      const weekDays = []
      const today = new Date()
      const weekStart = getWeekStart(today)

      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart)
        day.setDate(weekStart.getDate() + i)
        weekDays.push(day)
      }

      // 使用第一天作為 weekStart 來初始化
      initializeCurrentWeek(weekDays[0])
      weekId = generateId() // 臨時 ID，實際會在 store 中生成
    }

    // 檢查衝突
    if (hasConflict(selectedCell.dayOfWeek, selectedCell.startTime, duration)) {
      alert('此時段已有其他箱子，請選擇其他時間')
      return
    }

    addScheduledBox({
      boxId,
      weekId: weekId || generateId(),
      dayOfWeek: selectedCell.dayOfWeek,
      startTime: selectedCell.startTime,
      duration,
      completed: false,
    })

    setSelectedCell(null)
  }

  // 週開始計算函數（與頁面中的保持一致）
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 調整為週一開始
    return new Date(d.setDate(diff))
  }

  // 簡單的 ID 生成器
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 獲取單元格中的箱子（起始時段）
  const getBoxInCell = (dayOfWeek: number, timeSlot: string) => {
    return scheduledBoxes.find(box =>
      box.dayOfWeek === dayOfWeek && box.startTime === timeSlot
    )
  }

  // 檢查時段是否被任何箱子佔用
  const isTimeSlotOccupied = (dayOfWeek: number, timeSlot: string) => {
    const currentMinutes = timeToMinutes(timeSlot)

    return scheduledBoxes.some(box => {
      if (box.dayOfWeek !== dayOfWeek) return false

      const boxStartMinutes = timeToMinutes(box.startTime)
      const boxEndMinutes = boxStartMinutes + box.duration

      return currentMinutes >= boxStartMinutes && currentMinutes < boxEndMinutes
    })
  }

  // 獲取佔用此時段的箱子
  const getOccupyingBox = (dayOfWeek: number, timeSlot: string) => {
    const currentMinutes = timeToMinutes(timeSlot)

    return scheduledBoxes.find(box => {
      if (box.dayOfWeek !== dayOfWeek) return false

      const boxStartMinutes = timeToMinutes(box.startTime)
      const boxEndMinutes = boxStartMinutes + box.duration

      return currentMinutes >= boxStartMinutes && currentMinutes < boxEndMinutes
    })
  }

  // 判斷箱子在此時段的位置類型
  const getBoxPositionType = (scheduledBox: any, timeSlot: string) => {
    const currentMinutes = timeToMinutes(timeSlot)
    const boxStartMinutes = timeToMinutes(scheduledBox.startTime)
    const boxEndMinutes = boxStartMinutes + scheduledBox.duration

    if (currentMinutes === boxStartMinutes) return 'start'
    if (currentMinutes + timeInterval === boxEndMinutes) return 'end'
    return 'middle'
  }

  // 計算箱子高度（支援任意時長，包括半格）
  const getBoxHeight = (duration: number) => {
    // 基礎時段高度：30分鐘 = 32px (h-8)，使用 Tailwind 的實際像素值
    const baseSlotHeight = 32 // h-8 的像素值
    const baseInterval = 30   // 基礎時段 30 分鐘

    // 計算實際高度：duration / 30 * 32
    // 例如：30分鐘 = 32px, 60分鐘 = 64px, 90分鐘 = 96px
    return (duration / baseInterval) * baseSlotHeight
  }

  // 處理拖放
  const handleDrop = (e: React.DragEvent, dayOfWeek: number, timeSlot: string) => {
    e.preventDefault()

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))

      if (data.type === 'box') {
        setSelectedCell({ dayOfWeek, startTime: timeSlot })
      }
    } catch (error) {
      console.error('Invalid drag data')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-8 min-h-[600px]">
        {/* 時間軸 */}
        <div className="border-r border-border bg-morandi-container/10">
          {timeSlots.map((timeSlot) => (
            <div
              key={timeSlot}
              className="h-8 sm:h-12 flex items-center justify-center text-xs sm:text-sm text-morandi-secondary border-b border-border/50"
            >
              {timeSlot}
            </div>
          ))}
        </div>

        {/* 日期列 */}
        {weekDays.map((day, dayIndex) => (
          <div key={dayIndex} className="border-r border-border last:border-r-0 relative bg-card">
            {timeSlots.map((timeSlot, timeIndex) => {
              const existingBox = getBoxInCell(dayIndex, timeSlot)
              const occupyingBox = getOccupyingBox(dayIndex, timeSlot)
              const isOccupied = !!occupyingBox
              const isStartTime = !!existingBox

              // 如果時段被佔用，渲染箱子的對應部分
              if (isOccupied && !isStartTime) {
                const baseBox = boxes.find(b => b.id === occupyingBox.boxId)
                const positionType = getBoxPositionType(occupyingBox, timeSlot)

                const borderRadius = positionType === 'start' ? 'rounded-t-md' :
                                    positionType === 'end' ? 'rounded-b-md' : ''

                return (
                  <div
                    key={`${dayIndex}-${timeIndex}`}
                    className={`h-8 sm:h-12 border-b border-border/50 relative cursor-pointer ${borderRadius}`}
                    style={{ backgroundColor: baseBox?.color }}
                    onClick={() => {
                      // 點擊中間部分，通過 window 事件通知打開對話框
                      window.dispatchEvent(new CustomEvent('openBoxDialog', {
                        detail: { scheduledBoxId: occupyingBox.id }
                      }))
                    }}
                  >
                    {/* 中間和結尾部分可以顯示簡化資訊 */}
                    {positionType === 'end' && (
                      <div className="absolute bottom-1 right-2 text-xs text-white opacity-75">
                        {minutesToTime(timeToMinutes(occupyingBox.startTime) + occupyingBox.duration)}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <div
                  key={`${dayIndex}-${timeIndex}`}
                  className={`h-8 sm:h-12 border-b border-border/50 relative cursor-pointer hover:bg-morandi-container/20 transition-colors duration-150 ${
                    selectedCell?.dayOfWeek === dayIndex && selectedCell?.startTime === timeSlot
                      ? 'bg-morandi-gold/10 border-morandi-gold/30'
                      : ''
                  }`}
                  onClick={() => {
                    if (!isOccupied) {
                      setSelectedCell({ dayOfWeek: dayIndex, startTime: timeSlot })
                    }
                  }}
                  onDrop={(e) => handleDrop(e, dayIndex, timeSlot)}
                  onDragOver={handleDragOver}
                >
                  {isStartTime && (
                    <div
                      data-box-id={existingBox.id}
                      className="relative h-full w-full"
                    >
                      <ScheduledBoxItem
                        scheduledBox={existingBox}
                        height={getBoxHeight(existingBox.duration)}
                      />
                    </div>
                  )}

                  {/* 提示文字 - 只在空白時段顯示 */}
                  {!isOccupied && selectedCell?.dayOfWeek === dayIndex && selectedCell?.startTime === timeSlot && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-morandi-gold font-medium">點擊新增箱子</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* 箱子選擇器 */}
      {selectedCell && (
        <BoxSelector
          onSelect={handleBoxSelect}
          onClose={() => setSelectedCell(null)}
          timeInterval={timeInterval}
        />
      )}

    </div>
  )
}