'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import {
  useTimeboxBoxes,
  useTimeboxWeeks,
  useTimeboxScheduledBoxes,
  formatDateString,
  type TimeboxScheduledBox,
} from '../hooks/useTimeboxData'
import ScheduledBoxItem from './ScheduledBoxItem'
import BoxSelector from './BoxSelector'
import { alert } from '@/lib/ui/alert-dialog'

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
      <div className="flex items-center justify-center p-8 text-red-500">
        <div className="text-center">
          <p className="font-medium">載入資料時發生錯誤</p>
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
  const [slotHeight, setSlotHeight] = useState<number>(timeInterval === 30 ? 40 : 56)
  const measureRef = useRef<HTMLDivElement | null>(null)

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
      })
    }
  }, [userId, weekDays, weeks, createWeek])

  // 測量格子高度
  useEffect(() => {
    if (!measureRef.current) return

    const observer = new ResizeObserver((entries) => {
      if (!entries[0]) return
      const { height } = entries[0].contentRect
      if (height > 0) {
        setSlotHeight(height)
      }
    })

    observer.observe(measureRef.current)
    return () => observer.disconnect()
  }, [timeInterval])

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

    await createScheduledBox({
      user_id: userId,
      box_id: boxId,
      week_id: currentWeekRecord.id,
      day_of_week: dayOfWeek,
      start_time: start_time + ':00',
      duration,
      completed: false,
      data: null,
    })

    setSelectorTarget(null)
  }

  const slotClass = timeInterval === 30 ? 'min-h-[2.5rem]' : 'min-h-[3.5rem]'
  const dayStartMinutes = startHour * 60
  const totalMinutes = (endHour - startHour) * 60

  return (
    <div className="relative">
      <div className="grid grid-cols-8 min-h-[600px]">
        {/* 時間軸 */}
        <div className="border-r border-border bg-morandi-container/10">
          {timeSlots.map((timeSlot, index) => (
            <div
              key={timeSlot}
              className={`${slotClass} flex items-center justify-center text-xs sm:text-sm text-morandi-secondary border-b border-border/50`}
              ref={index === 0 ? measureRef : undefined}
            >
              {timeSlot}
            </div>
          ))}
        </div>

        {/* 每天的欄位 */}
        {weekDays.map((day, dayIndex) => {
          const dayOfWeek = day.getDay()
          const boxesInDay = currentScheduledBoxes
            .filter((box) => box.day_of_week === dayOfWeek)
            .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))

          return (
            <div
              key={dayIndex}
              className="relative border-r border-border last:border-r-0 bg-card"
              style={{ minHeight: `${(totalMinutes / slotMinutes) * slotHeight}px` }}
            >
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
