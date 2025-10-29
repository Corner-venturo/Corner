'use client'

import { useEffect } from 'react'
import { useTimeboxStore } from '@/stores/timebox-store'
import TimeGrid from './time-grid'

interface WeekViewProps {
  selectedWeek: Date
  timeInterval: 30 | 60
}

export default function WeekView({ selectedWeek, timeInterval }: WeekViewProps) {
  const { currentWeek, initializeCurrentWeek } = useTimeboxStore()

  // 初始化當前週
  useEffect(() => {
    if (!currentWeek ||
        new Date(currentWeek.weekStart).getTime() !== getWeekStart(selectedWeek).getTime()) {
      initializeCurrentWeek(selectedWeek)
    }
  }, [selectedWeek, currentWeek, initializeCurrentWeek])

  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 調整為週一開始
    return new Date(d.setDate(diff))
  }

  const weekDays = []
  const weekStart = getWeekStart(selectedWeek)

  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    weekDays.push(day)
  }

  const dayLabels = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']

  return (
    <div className="h-full flex flex-col overflow-hidden bg-card">
      {/* 日期標題列 */}
      <div className="grid grid-cols-8 border-b border-border bg-morandi-container/30">
        {/* 時間欄標題 */}
        <div className="p-2 sm:p-4 text-xs sm:text-sm font-medium text-morandi-secondary border-r border-border flex items-center justify-center">
          時間
        </div>

        {/* 日期欄標題 */}
        {weekDays.map((day, index) => {
          const isToday = day.toDateString() === new Date().toDateString()
          return (
            <div
              key={index}
              className={`p-2 sm:p-4 text-center border-r border-border last:border-r-0 flex items-center justify-center ${
                isToday ? 'bg-morandi-gold/10' : ''
              }`}
            >
              <div className={`text-xs sm:text-sm font-medium ${isToday ? 'text-morandi-gold' : 'text-morandi-secondary'}`}>
                <span className="hidden sm:inline">{dayLabels[day.getDay()]} {day.getDate()}</span>
                <span className="sm:hidden">{dayLabels[day.getDay()].slice(1)} {day.getDate()}</span>
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