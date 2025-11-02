'use client'

import { useEffect } from 'react'
import { useTimeboxStore } from '@/stores/timebox-store'
import DayTimeGrid from './day-time-grid'

interface DayViewProps {
  selectedDay: Date
  timeInterval: 30 | 60
}

export default function DayView({ selectedDay, timeInterval }: DayViewProps) {
  const { currentWeek, initializeCurrentWeek } = useTimeboxStore()

  // 計算週的開始日期（週一）
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  // 初始化當前週（如果選擇的日期跨週了）
  useEffect(() => {
    if (
      !currentWeek ||
      new Date(currentWeek.weekStart).getTime() !== getWeekStart(selectedDay).getTime()
    ) {
      initializeCurrentWeek(selectedDay)
    }
  }, [selectedDay, currentWeek, initializeCurrentWeek])

  const dayLabels = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
  const isToday = selectedDay.toDateString() === new Date().toDateString()

  return (
    <div className="h-full flex flex-col overflow-hidden bg-card">
      {/* 日期標題列 */}
      <div className="grid grid-cols-2 border-b border-border bg-morandi-container/30">
        {/* 時間欄標題 */}
        <div className="py-3 px-3 text-sm font-medium text-morandi-secondary border-r border-border flex items-center justify-center">
          時間
        </div>

        {/* 日期欄標題 */}
        <div
          className={`py-3 px-3 text-center flex items-center justify-center ${
            isToday ? 'bg-morandi-gold/10' : ''
          }`}
        >
          <div className={`text-sm font-medium ${isToday ? 'text-morandi-gold' : 'text-morandi-secondary'}`}>
            {dayLabels[selectedDay.getDay()]} {selectedDay.getDate()}日
          </div>
        </div>
      </div>

      {/* 時間網格 */}
      <div className="flex-1 overflow-auto scrollable-content">
        <DayTimeGrid selectedDay={selectedDay} timeInterval={timeInterval} />
      </div>
    </div>
  )
}
