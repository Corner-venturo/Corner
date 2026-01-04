'use client'

import { useMemo, useRef, useEffect } from 'react'
import TimeGrid from './TimeGrid'
import { getWeekStart, weekDayNames } from '../hooks/useTimeboxData'

// 固定格子高度（像素）- 與 TimeGrid 保持一致
const SLOT_HEIGHTS = {
  30: 40,   // 30分鐘間隔：40px
  60: 56,   // 60分鐘間隔：56px
}

interface WeekViewProps {
  selectedWeek: Date
  timeInterval: 30 | 60
}

export default function WeekView({ selectedWeek, timeInterval }: WeekViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const weekDays = useMemo(() => {
    const start = getWeekStart(selectedWeek)
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      return day
    })
  }, [selectedWeek])

  // 自動滾動到當前時間位置
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const startHour = 6 // 與 TimeGrid 保持一致

    // 如果當前時間在顯示範圍內，滾動到當前時間
    if (currentHour >= startHour && currentHour < 24) {
      const slotHeight = SLOT_HEIGHTS[timeInterval]
      const slotMinutes = timeInterval
      const minutesSinceStart = (currentHour - startHour) * 60 + currentMinute

      // 計算當前時間位置，並往前偏移 1 小時讓時間線在畫面中間偏上
      const scrollPosition = Math.max(0, (minutesSinceStart / slotMinutes) * slotHeight - 100)

      scrollContainer.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      })
    }
  }, [timeInterval]) // 當時間間隔改變時重新計算

  return (
    <div className="h-full flex flex-col overflow-hidden border border-border rounded-xl">
      {/* 日期標題列 - 不透明背景，圓角在上方 */}
      <div className="grid grid-cols-8 border-b-2 border-morandi-gold/20 bg-card sticky top-0 z-10 rounded-t-xl">
        {/* 時間欄標題 */}
        <div className="py-2 px-1 text-xs font-medium text-morandi-secondary border-r border-border flex items-center justify-center rounded-tl-xl">
          時間
        </div>

        {/* 日期欄標題 */}
        {weekDays.map((day, index) => {
          const isToday = day.toDateString() === new Date().toDateString()
          const isLast = index === weekDays.length - 1
          return (
            <div
              key={index}
              className={`py-2 px-1 text-center border-r border-border last:border-r-0 ${
                isToday ? 'bg-morandi-gold/30' : ''
              } ${isLast ? 'rounded-tr-xl' : ''}`}
            >
              <div className={`text-xs font-medium ${isToday ? 'text-morandi-gold' : 'text-morandi-secondary'}`}>
                <span className="hidden sm:inline">{weekDayNames[day.getDay()]} {day.getDate()}</span>
                <span className="sm:hidden">{day.getDate()}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 時間網格 */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto scrollable-content">
        <TimeGrid
          weekDays={weekDays}
          timeInterval={timeInterval}
        />
      </div>
    </div>
  )
}
