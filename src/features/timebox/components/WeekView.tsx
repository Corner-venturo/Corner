'use client'

import { useMemo } from 'react'
import TimeGrid from './TimeGrid'
import { getWeekStart, weekDayNames } from '../hooks/useTimeboxData'

interface WeekViewProps {
  selectedWeek: Date
  timeInterval: 30 | 60
}

export default function WeekView({ selectedWeek, timeInterval }: WeekViewProps) {
  const weekDays = useMemo(() => {
    const start = getWeekStart(selectedWeek)
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      return day
    })
  }, [selectedWeek])

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
      <div className="flex-1 overflow-auto scrollable-content">
        <TimeGrid
          weekDays={weekDays}
          timeInterval={timeInterval}
        />
      </div>
    </div>
  )
}
