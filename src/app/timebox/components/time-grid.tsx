'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { useTimeboxStore } from '@/stores/timebox-store'
import { alert } from '@/lib/ui/alert-dialog'

import ScheduledBoxItem from './scheduled-box-item'
import BoxSelector from './box-selector'

interface TimeGridProps {
  weekDays: Date[]
  timeInterval: 30 | 60
}

export default function TimeGrid({ weekDays, timeInterval }: TimeGridProps) {
  const { scheduledBoxes, addScheduledBox, currentWeek, boxes, createBox } = useTimeboxStore()

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

  const [selectorTarget, setSelectorTarget] = useState<{
    dayOfWeek: number
    start_time: string
  } | null>(null)
  const [slotHeight, setSlotHeight] = useState<number>(timeInterval === 30 ? 36 : 48)
  const measureRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!measureRef.current) return

    const observer = new ResizeObserver(entries => {
      if (!entries[0]) return
      const { height } = entries[0].contentRect
      if (height > 0) {
        setSlotHeight(height)
      }
    })

    observer.observe(measureRef.current)
    return () => observer.disconnect()
  }, [timeInterval])

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const hasConflict = (dayOfWeek: number, start_time: string, duration: number) => {
    const startMinutes = timeToMinutes(start_time)
    const endMinutes = startMinutes + duration

    return scheduledBoxes.some(box => {
      if (box.day_of_week !== dayOfWeek) return false
      if (currentWeek?.id && box.week_id !== currentWeek.id) return false

      const boxStart = timeToMinutes(box.start_time)
      const boxEnd = boxStart + box.duration

      return startMinutes < boxEnd && endMinutes > boxStart
    })
  }

  const ensureBasicBox = () => {
    const existing = boxes.find(box => box.type === 'basic')
    if (existing) return existing

    createBox({
      name: '日常安排',
      color: '#D4D4D4',
      type: 'basic',
      user_id: 'current-user',
    })

    return boxes.find(box => box.type === 'basic') ?? null
  }

  const handleCellClick = (dayOfWeek: number, timeSlot: string) => {
    const startMinutes = timeToMinutes(timeSlot)
    const overlap = scheduledBoxes.some(box => {
      if (box.day_of_week !== dayOfWeek) return false
      if (currentWeek?.id && box.week_id !== currentWeek.id) return false
      const boxStart = timeToMinutes(box.start_time)
      const boxEnd = boxStart + box.duration
      return startMinutes >= boxStart && startMinutes < boxEnd
    })

    if (overlap) return

    ensureBasicBox()
    setSelectorTarget({ dayOfWeek, start_time: timeSlot })
  }

  const handleSelectBox = async (boxId: string, duration: number) => {
    if (!selectorTarget) return
    if (!currentWeek?.id) {
      setSelectorTarget(null)
      return
    }

    const { dayOfWeek, start_time } = selectorTarget

    if (hasConflict(dayOfWeek, start_time, duration)) {
      await alert('此時段已有其他箱子，請選擇其他時間', 'warning', '時段衝突')
      return
    }

    addScheduledBox({
      box_id: boxId,
      week_id: currentWeek.id,
      day_of_week: dayOfWeek,
      start_time,
      duration,
      completed: false,
    })

    setSelectorTarget(null)
  }

  const slotClass = timeInterval === 30 ? 'min-h-[2.25rem]' : 'min-h-[3rem]'
  const dayStartMinutes = startHour * 60
  const totalMinutes = (endHour - startHour) * 60

  return (
    <div className="relative">
      <div className="grid grid-cols-8">
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

        {weekDays.map((_day, dayIndex) => {
          const boxesInDay = (scheduledBoxes || [])
            .filter(box => {
              if (box.day_of_week !== dayIndex) return false
              if (currentWeek?.id && box.week_id !== currentWeek.id) return false
              return true
            })
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
                    className={`${slotClass} border-b border-border/40 transition-colors hover:bg-morandi-container/20`}
                    onClick={() => handleCellClick(dayIndex, timeSlot)}
                  >
                    {slotIndex === 0 && <span className="sr-only">time-slot</span>}
                  </div>
                ))}
              </div>

              {boxesInDay.map(box => {
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
                  />
                )
              })}
            </div>
          )
        })}
      </div>

      {selectorTarget && (
        <BoxSelector
          timeInterval={timeInterval}
          onSelect={handleSelectBox}
          onClose={() => setSelectorTarget(null)}
        />
      )}
    </div>
  )
}
