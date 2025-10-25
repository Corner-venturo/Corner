import { useState, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'

export function useCalendarNavigation() {
  const calendarRef = useRef<FullCalendar>(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  // 月份切換
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    setCurrentDate(newDate)
    calendarRef.current?.getApi().prev()
  }

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    setCurrentDate(newDate)
    calendarRef.current?.getApi().next()
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    calendarRef.current?.getApi().today()
  }

  // 格式化當前月份
  const getCurrentMonthYear = () => {
    return currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })
  }

  return {
    calendarRef,
    currentDate,
    handlePrevMonth,
    handleNextMonth,
    handleToday,
    getCurrentMonthYear,
  }
}
