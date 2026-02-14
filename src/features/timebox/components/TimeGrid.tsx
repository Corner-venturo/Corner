'use client'

import { useMemo, useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import {
  useTimeboxBoxes,
  useTimeboxWeeks,
  useTimeboxScheduledBoxes,
  formatDateString,
  type TimeboxScheduledBox,
  type TimeboxWeek,
} from '../hooks/useTimeboxData'
import ScheduledBoxItem from './ScheduledBoxItem'
import BoxSelector from './BoxSelector'
import { alert } from '@/lib/ui/alert-dialog'
import { TIMEBOX_LABELS } from './constants/labels'

// 固定格子高度（像素）- 不依賴 DOM 測量，確保一致性
const SLOT_HEIGHTS = {
  30: 40,   // 30分鐘間隔：40px
  60: 56,   // 60分鐘間隔：56px
}

// 當前時間指示器
function CurrentTimeIndicator({
  slotHeight,
  slotMinutes,
  startHour
}: {
  slotHeight: number
  slotMinutes: number
  startHour: number
}) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000) // 每分鐘更新
    return () => clearInterval(timer)
  }, [])

  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  // 如果當前時間不在顯示範圍內，不顯示
  if (currentHour < startHour || currentHour >= 24) return null

  const minutesSinceStart = (currentHour - startHour) * 60 + currentMinute
  // 使用 slotMinutes 而不是 hardcode 60
  const topPosition = (minutesSinceStart / slotMinutes) * slotHeight

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${topPosition}px` }}
    >
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-morandi-red" />
        <div className="flex-1 h-0.5 bg-morandi-red/60" />
      </div>
    </div>
  )
}

interface TimeGridProps {
  weekDays: Date[]
  timeInterval: 30 | 60
}

export default function TimeGrid({ weekDays, timeInterval }: TimeGridProps) {
  const user = useAuthStore(state => state.user)
  const userId = user?.id

  const { items: boxes, error: boxesError } = useTimeboxBoxes()
  const { items: weeks, create: createWeek, error: weeksError } = useTimeboxWeeks()
  const { items: scheduledBoxes, create: createScheduledBox, error: scheduledError } = useTimeboxScheduledBoxes()

  // 顯示錯誤訊息
  const error = boxesError || weeksError || scheduledError
  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-status-danger">
        <div className="text-center">
          <p className="font-medium">{TIMEBOX_LABELS.LOADING_1274}</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  const slotMinutes = timeInterval
  const startHour = 6
  const endHour = 24

  const timeSlots = useMemo(() => {
    const slots: string[] = []
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      if (timeInterval === 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`)
      }
    }
    return slots
  }, [timeInterval])

  const [selectorTarget, setSelectorTarget] = useState<{ dayOfWeek: number; start_time: string } | null>(null)

  // 使用固定像素高度，確保切換間隔時計算一致
  const slotHeight = SLOT_HEIGHTS[timeInterval]

  // 取得當前週記錄
  const currentWeekRecord = useMemo(() => {
    if (!userId || weekDays.length === 0) return null
    const weekStartStr = formatDateString(weekDays[0])
    return weeks.find(w => w.week_start === weekStartStr && w.user_id === userId)
  }, [weeks, weekDays, userId])

  // 自動創建週記錄
  useEffect(() => {
    if (!userId || weekDays.length === 0) return
    const weekStartStr = formatDateString(weekDays[0])
    const weekEndDate = new Date(weekDays[0])
    weekEndDate.setDate(weekEndDate.getDate() + 6)
    const weekEndStr = formatDateString(weekEndDate)
    const exists = weeks.find(w => w.week_start === weekStartStr && w.user_id === userId)
    if (!exists) {
      createWeek({
        user_id: userId,
        week_start: weekStartStr,
        week_end: weekEndStr,
        name: null,
        archived: false,
      } as Omit<TimeboxWeek, 'id' | 'created_at' | 'updated_at'>)
    }
  }, [userId, weekDays, weeks, createWeek])

  // 當前週的排程
  const currentScheduledBoxes = useMemo(() => {
    if (!currentWeekRecord) return []
    return scheduledBoxes.filter(sb => sb.week_id === currentWeekRecord.id)
  }, [scheduledBoxes, currentWeekRecord])

  // 使用者的箱子
  const userBoxes = useMemo(() => {
    if (!userId) return []
    return boxes.filter(b => b.user_id === userId)
  }, [boxes, userId])

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const hasConflict = (dayOfWeek: number, start_time: string, duration: number) => {
    const startMinutes = timeToMinutes(start_time)
    const endMinutes = startMinutes + duration

    return currentScheduledBoxes.some((box) => {
      if (box.day_of_week !== dayOfWeek) return false

      const boxStart = timeToMinutes(box.start_time)
      const boxEnd = boxStart + box.duration

      return startMinutes < boxEnd && endMinutes > boxStart
    })
  }

  const handleCellClick = (dayOfWeek: number, timeSlot: string) => {
    const startMinutes = timeToMinutes(timeSlot)
    const overlap = currentScheduledBoxes.some((box) => {
      if (box.day_of_week !== dayOfWeek) return false
      const boxStart = timeToMinutes(box.start_time)
      const boxEnd = boxStart + box.duration
      return startMinutes >= boxStart && startMinutes < boxEnd
    })

    if (overlap) return
    setSelectorTarget({ dayOfWeek, start_time: timeSlot })
  }

  const handleSelectBox = async (boxId: string, duration: number) => {
    if (!selectorTarget || !currentWeekRecord || !userId) return

    const { dayOfWeek, start_time } = selectorTarget

    if (hasConflict(dayOfWeek, start_time, duration)) {
      void alert('此時段已有其他箱子，請選擇其他時間', 'warning')
      return
    }

    // 找到箱子的預設內容
    const box = userBoxes.find(b => b.id === boxId)
    const defaultData = box?.default_content || null

    await createScheduledBox({
      user_id: userId,
      box_id: boxId,
      week_id: currentWeekRecord.id,
      day_of_week: dayOfWeek,
      start_time: start_time + ':00',
      duration,
      completed: false,
      data: defaultData,
    })

    setSelectorTarget(null)
  }

  // 使用固定高度樣式，確保與 slotHeight 計算一致
  const slotClass = timeInterval === 30 ? 'h-[40px]' : 'h-[56px]'
  const dayStartMinutes = startHour * 60
  const totalMinutes = (endHour - startHour) * 60

  return (
    <div className="relative">
      <div className="grid grid-cols-8 min-h-[600px]">
        {/* 時間軸 */}
        <div className="border-r border-border bg-morandi-container/10">
          {timeSlots.map((timeSlot) => (
            <div
              key={timeSlot}
              className={`${slotClass} flex items-center justify-center text-xs sm:text-sm text-morandi-secondary border-b border-border/50`}
            >
              {timeSlot}
            </div>
          ))}
        </div>

        {/* 每天的欄位 */}
        {weekDays.map((day, dayIndex) => {
          const dayOfWeek = day.getDay()
          const isToday = day.toDateString() === new Date().toDateString()
          const boxesInDay = currentScheduledBoxes
            .filter((box) => box.day_of_week === dayOfWeek)
            .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))

          return (
            <div
              key={dayIndex}
              className={`relative border-r border-border last:border-r-0 ${isToday ? 'bg-morandi-gold/5' : 'bg-card'}`}
              style={{ minHeight: `${(totalMinutes / slotMinutes) * slotHeight}px` }}
            >
              {/* 今天的當前時間指示器 */}
              {isToday && <CurrentTimeIndicator slotHeight={slotHeight} slotMinutes={slotMinutes} startHour={startHour} />}

              <div className="relative">
                {timeSlots.map((timeSlot, slotIndex) => (
                  <div
                    key={`${dayIndex}-${timeSlot}`}
                    className={`${slotClass} border-b border-border/40 transition-colors hover:bg-morandi-container/20 cursor-pointer`}
                    onClick={() => handleCellClick(dayOfWeek, timeSlot)}
                  >
                    {slotIndex === 0 && <span className="sr-only">time-slot</span>}
                  </div>
                ))}
              </div>

              {boxesInDay.map((box) => {
                const startMinutes = Math.max(timeToMinutes(box.start_time), dayStartMinutes)
                const boxStartOffset = Math.max(0, startMinutes - dayStartMinutes)
                const adjustedDuration = Math.min(box.duration, totalMinutes - boxStartOffset)
                const top = (boxStartOffset / slotMinutes) * slotHeight
                const height = Math.max((adjustedDuration / slotMinutes) * slotHeight, 12)

                return (
                  <ScheduledBoxItem
                    key={box.id}
                    scheduledBox={box}
                    height={height}
                    topOffset={top}
                    boxes={userBoxes}
                    slotHeight={slotHeight}
                    slotMinutes={slotMinutes}
                    startHour={startHour}
                    allScheduledBoxes={currentScheduledBoxes}
                  />
                )
              })}
            </div>
          )
        })}
      </div>

      {selectorTarget && (
        <BoxSelector
          boxes={userBoxes}
          timeInterval={timeInterval}
          onSelect={handleSelectBox}
          onClose={() => setSelectorTarget(null)}
        />
      )}
    </div>
  )
}
