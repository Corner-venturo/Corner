'use client'

import { useTimeboxStore } from '@/stores/timebox-store'

import ScheduledBoxItem from './scheduled-box-item'
// import { logger } from '@/lib/utils/logger'

interface TimeGridProps {
  weekDays: Date[]
  timeInterval: 30 | 60
}

export default function TimeGrid({ weekDays, timeInterval }: TimeGridProps) {
  const { scheduledBoxes, addScheduledBox, currentWeek, initializeCurrentWeek, boxes, createBox } = useTimeboxStore()

  // 生成時間段 - 根據 timeInterval 動態生成
  const timeSlots: string[] = []
  for (let hour = 6; hour < 24; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
    if (timeInterval === 30) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
  }

  // 檢查時間衝突
  const hasConflict = (dayOfWeek: number, start_time: string, duration: number) => {
    const startMinutes = timeToMinutes(start_time)
    const endMinutes = startMinutes + duration

    return scheduledBoxes.some(box => {
      if (box.dayOfWeek !== dayOfWeek) return false

      const boxStartMinutes = timeToMinutes(box.start_time)
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

  // 獲取或創建預設的普通箱子
  const getDefaultBasicBox = () => {
    // 尋找已存在的普通箱子
    let basicBox = boxes.find(box => box.type === 'basic')

    // 如果沒有，創建一個預設的普通箱子
    if (!basicBox) {
      createBox({
        name: '日常安排',
        color: '#D4D4D4', // 雲石灰
        type: 'basic',
        user_id: 'current-user',
      })
      // 重新獲取
      basicBox = boxes.find(box => box.type === 'basic')
    }

    return basicBox
  }

  // 直接新增普通箱子到時間格
  const handleAddBasicBox = (dayOfWeek: number, start_time: string) => {
    // 確保有 currentWeek
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

      initializeCurrentWeek(weekDays[0])
      weekId = generateId()
    }

    // 獲取預設普通箱子
    const basicBox = getDefaultBasicBox()
    if (!basicBox) return

    // 預設時長使用當前的時間間隔
    const defaultDuration = timeInterval

    // 檢查衝突
    if (hasConflict(dayOfWeek, start_time, defaultDuration)) {
      alert('此時段已有其他箱子，請選擇其他時間')
      return
    }

    // 直接新增箱子
    addScheduledBox({
      boxId: basicBox.id,
      weekId: weekId || generateId(),
      dayOfWeek,
      start_time,
      duration: defaultDuration,
      completed: false,
    })
  }

  // 獲取單元格中的箱子（起始時段）
  const getBoxesInCell = (dayOfWeek: number, timeSlot: string) => {
    // 30 分鐘視圖：只返回精確匹配的箱子
    if (timeInterval === 30) {
      const box = scheduledBoxes.find(box =>
        box.dayOfWeek === dayOfWeek && box.start_time === timeSlot
      )
      return box ? [box] : []
    }

    // 60 分鐘視圖：返回這個小時內所有開始的箱子
    const currentMinutes = timeToMinutes(timeSlot)
    const nextHourMinutes = currentMinutes + 60

    return scheduledBoxes.filter(box => {
      if (box.dayOfWeek !== dayOfWeek) return false
      const boxStartMinutes = timeToMinutes(box.start_time)
      return boxStartMinutes >= currentMinutes && boxStartMinutes < nextHourMinutes
    })
  }

  // 檢查時段是否被任何箱子佔用
  const _isTimeSlotOccupied = (dayOfWeek: number, timeSlot: string) => {
    const currentMinutes = timeToMinutes(timeSlot)

    return scheduledBoxes.some(box => {
      if (box.dayOfWeek !== dayOfWeek) return false

      const boxStartMinutes = timeToMinutes(box.start_time)
      const boxEndMinutes = boxStartMinutes + box.duration

      return currentMinutes >= boxStartMinutes && currentMinutes < boxEndMinutes
    })
  }

  // 獲取佔用此時段的箱子
  const getOccupyingBox = (dayOfWeek: number, timeSlot: string) => {
    const currentMinutes = timeToMinutes(timeSlot)

    return scheduledBoxes.find(box => {
      if (box.dayOfWeek !== dayOfWeek) return false

      const boxStartMinutes = timeToMinutes(box.start_time)
      const boxEndMinutes = boxStartMinutes + box.duration

      return currentMinutes >= boxStartMinutes && currentMinutes < boxEndMinutes
    })
  }

  // 判斷箱子在此時段的位置類型
  const getBoxPositionType = (scheduledBox: any, timeSlot: string) => {
    const currentMinutes = timeToMinutes(timeSlot)
    const boxStartMinutes = timeToMinutes(scheduledBox.start_time)
    const boxEndMinutes = boxStartMinutes + scheduledBox.duration

    if (currentMinutes === boxStartMinutes) return 'start'
    if (currentMinutes + timeInterval === boxEndMinutes) return 'end'
    return 'middle'
  }

  // 計算箱子高度
  const getBoxHeight = (duration: number) => {
    // 每格的高度（根據視圖模式）
    const slotHeight = timeInterval === 30 ? 32 : 64 // 30分=32px, 60分=64px

    // 計算佔用幾格
    const slotsNeeded = duration / timeInterval

    return slotsNeeded * slotHeight
  }

  // 計算箱子在格子內的 top 偏移量
  const getBoxTopOffset = (start_time: string) => {
    // 在 30 分鐘視圖下，每個箱子都在格子頂部
    if (timeInterval === 30) return 0

    // 在 60 分鐘視圖下，需要計算箱子在整點格子內的偏移
    const [_hour, minute] = start_time.split(':').map(Number)

    // 如果是整點（:00），在格子頂部
    if (minute === 0) return 0

    // 如果是半點（:30），在格子中間（偏移 32px）
    if (minute === 30) return 32

    // 其他情況按比例計算
    return (minute / 60) * 64
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-8 min-h-[600px]">
        {/* 時間軸 */}
        <div className="border-r border-border bg-morandi-container/10">
          {timeSlots.map((timeSlot) => (
            <div
              key={timeSlot}
              className={`${timeInterval === 30 ? 'h-8' : 'h-16'} flex items-center justify-center text-xs sm:text-sm text-morandi-secondary border-b border-border/50`}
            >
              {timeSlot}
            </div>
          ))}
        </div>

        {/* 日期列 */}
        {weekDays.map((day, dayIndex) => (
          <div key={dayIndex} className="border-r border-border last:border-r-0 relative bg-card">
            {timeSlots.map((timeSlot, timeIndex) => {
              const boxesInCell = getBoxesInCell(dayIndex, timeSlot)
              const occupyingBox = getOccupyingBox(dayIndex, timeSlot)
              const isOccupied = !!occupyingBox
              const hasBoxes = boxesInCell.length > 0

              // 如果時段被佔用但不是起始格（30分鐘視圖的中間部分），渲染佔位
              if (isOccupied && !hasBoxes && timeInterval === 30) {
                const baseBox = boxes.find(b => b.id === occupyingBox.boxId)
                const positionType = getBoxPositionType(occupyingBox, timeSlot)

                const borderRadius = positionType === 'start' ? 'rounded-t-md' :
                                    positionType === 'end' ? 'rounded-b-md' : ''

                return (
                  <div
                    key={`${dayIndex}-${timeIndex}`}
                    className={`h-8 border-b border-border/50 relative cursor-pointer ${borderRadius}`}
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
                        {minutesToTime(timeToMinutes(occupyingBox.start_time) + occupyingBox.duration)}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <div
                  key={`${dayIndex}-${timeIndex}`}
                  className={`${timeInterval === 30 ? 'h-8' : 'h-16'} border-b border-border/50 relative cursor-pointer hover:bg-morandi-container/20 transition-colors duration-150`}
                  onClick={() => {
                    if (!isOccupied) {
                      handleAddBasicBox(dayIndex, timeSlot)
                    }
                  }}
                >
                  {/* 渲染這個格子內所有的箱子 */}
                  {boxesInCell.map((box) => (
                    <ScheduledBoxItem
                      key={box.id}
                      scheduledBox={box}
                      height={getBoxHeight(box.duration)}
                      topOffset={getBoxTopOffset(box.start_time)}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}