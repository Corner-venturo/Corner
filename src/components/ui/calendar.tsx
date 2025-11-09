'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CalendarProps {
  mode?: 'single' | 'range'
  selected?: Date | { from: Date; to?: Date }
  onSelect?: (date: Date | { from: Date; to?: Date } | undefined) => void
  disabled?: ((date: Date) => boolean) | { before?: Date; after?: Date }
  locale?: any
  initialFocus?: boolean
  className?: string
  defaultMonth?: Date
}

interface DayInfo {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isInRange?: boolean
  isRangeStart?: boolean
  isRangeEnd?: boolean
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  disabled,
  className,
  defaultMonth,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    defaultMonth || (selected instanceof Date ? selected : new Date())
  )

  // 生成當月的所有日期（包含前後月份補齊）
  const generateCalendarDays = (): DayInfo[] => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // 本月第一天
    const firstDay = new Date(year, month, 1)
    // 本月最後一天
    const lastDay = new Date(year, month + 1, 0)

    // 計算第一週需要顯示的上個月日期（從週日開始）
    const startDate = new Date(firstDay)
    startDate.setDate(firstDay.getDate() - firstDay.getDay())

    // 計算最後一週需要顯示的下個月日期
    const endDate = new Date(lastDay)
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()))

    const days: DayInfo[] = []
    const currentDate = new Date(startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    while (currentDate <= endDate) {
      const dateToCheck = new Date(currentDate)
      dateToCheck.setHours(0, 0, 0, 0)

      const isCurrentMonth = currentDate.getMonth() === month
      const isToday = dateToCheck.getTime() === today.getTime()
      const isSelected = checkIfSelected(dateToCheck)
      const { isInRange, isRangeStart, isRangeEnd } = checkIfInRange(dateToCheck)

      days.push({
        date: new Date(currentDate),
        isCurrentMonth,
        isToday,
        isSelected,
        isInRange,
        isRangeStart,
        isRangeEnd,
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days
  }

  // 檢查日期是否被選中
  const checkIfSelected = (date: Date): boolean => {
    if (!selected) return false

    if (selected instanceof Date) {
      const selectedDate = new Date(selected)
      selectedDate.setHours(0, 0, 0, 0)
      return date.getTime() === selectedDate.getTime()
    }

    // Range mode
    if ('from' in selected) {
      const fromDate = new Date(selected.from)
      fromDate.setHours(0, 0, 0, 0)

      if (!selected.to) {
        return date.getTime() === fromDate.getTime()
      }

      const toDate = new Date(selected.to)
      toDate.setHours(0, 0, 0, 0)

      return date.getTime() === fromDate.getTime() || date.getTime() === toDate.getTime()
    }

    return false
  }

  // 檢查日期是否在範圍內
  const checkIfInRange = (
    date: Date
  ): { isInRange: boolean; isRangeStart: boolean; isRangeEnd: boolean } => {
    if (mode !== 'range' || !selected || !(selected as any).from) {
      return { isInRange: false, isRangeStart: false, isRangeEnd: false }
    }

    const range = selected as { from: Date; to?: Date }
    const fromDate = new Date(range.from)
    fromDate.setHours(0, 0, 0, 0)

    if (!range.to) {
      return {
        isInRange: false,
        isRangeStart: date.getTime() === fromDate.getTime(),
        isRangeEnd: false,
      }
    }

    const toDate = new Date(range.to)
    toDate.setHours(0, 0, 0, 0)

    const isInRange = date.getTime() > fromDate.getTime() && date.getTime() < toDate.getTime()
    const isRangeStart = date.getTime() === fromDate.getTime()
    const isRangeEnd = date.getTime() === toDate.getTime()

    return { isInRange, isRangeStart, isRangeEnd }
  }

  // 檢查日期是否被禁用
  const isDateDisabled = (date: Date): boolean => {
    if (!disabled) return false

    if (typeof disabled === 'function') {
      return disabled(date)
    }

    const dateToCheck = new Date(date)
    dateToCheck.setHours(0, 0, 0, 0)

    if (disabled.before) {
      const beforeDate = new Date(disabled.before)
      beforeDate.setHours(0, 0, 0, 0)
      if (dateToCheck < beforeDate) return true
    }

    if (disabled.after) {
      const afterDate = new Date(disabled.after)
      afterDate.setHours(0, 0, 0, 0)
      if (dateToCheck > afterDate) return true
    }

    return false
  }

  // 處理日期點擊
  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return

    if (mode === 'single') {
      onSelect?.(date)
    } else if (mode === 'range') {
      if (!selected || !(selected as any).from || (selected as any).to) {
        // 開始新的範圍選擇
        onSelect?.({ from: date })
      } else {
        // 完成範圍選擇
        const from = (selected as any).from
        if (date < from) {
          onSelect?.({ from: date, to: from })
        } else {
          onSelect?.({ from, to: date })
        }
      }
    }
  }

  // 月份導航
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1)
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1)
      }
      return newMonth
    })
  }

  // 跳轉到今天
  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    if (mode === 'single') {
      onSelect?.(today)
    }
  }

  const days = generateCalendarDays()

  return (
    <div className={cn('p-3', className)}>
      {/* 月份導航 */}
      <div className="flex items-center text-gray-900 dark:text-white mb-6">
        <button
          type="button"
          onClick={() => navigateMonth('prev')}
          className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-white transition-colors"
        >
          <span className="sr-only">上個月</span>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-auto text-sm font-semibold text-center">
          {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
        </div>
        <button
          type="button"
          onClick={() => navigateMonth('next')}
          className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-white transition-colors"
        >
          <span className="sr-only">下個月</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* 星期標題 */}
      <div className="mt-6 grid grid-cols-7 text-xs leading-6 text-gray-500 dark:text-gray-400">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center">
            {day}
          </div>
        ))}
      </div>

      {/* 日期網格 */}
      <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm shadow ring-1 ring-gray-200 dark:bg-white/5 dark:ring-white/10">
        {days.map((day, index) => {
          const isDisabled = isDateDisabled(day.date)
          const isFirstInRow = index % 7 === 0
          const isLastInRow = index % 7 === 6
          const isFirstRow = index < 7
          const isLastRow = index >= days.length - 7

          return (
            <button
              key={day.date.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => handleDateClick(day.date)}
              className={cn(
                'py-1.5 focus:z-10',
                // 背景色
                day.isCurrentMonth
                  ? 'bg-white dark:bg-gray-900/90'
                  : 'bg-gray-50 dark:bg-gray-900/50',
                // Hover 效果
                !isDisabled && 'hover:bg-gray-100 dark:hover:bg-gray-900/75',
                // 文字顏色
                day.isCurrentMonth && !day.isSelected && !day.isToday
                  ? 'text-gray-900 dark:text-white'
                  : '',
                !day.isCurrentMonth && !day.isSelected && !day.isToday
                  ? 'text-gray-400 dark:text-gray-600'
                  : '',
                // 選中狀態
                day.isSelected && 'font-semibold text-white',
                // 今天
                day.isToday && !day.isSelected && 'font-semibold text-morandi-gold',
                // 範圍內
                day.isInRange && 'bg-morandi-gold/10 dark:bg-morandi-gold/20',
                // 禁用狀態
                isDisabled && 'opacity-50 cursor-not-allowed',
                // 圓角（第一個和最後一個）
                isFirstRow && isFirstInRow && 'rounded-tl-lg',
                isFirstRow && isLastInRow && 'rounded-tr-lg',
                isLastRow && isFirstInRow && 'rounded-bl-lg',
                isLastRow && isLastInRow && 'rounded-br-lg'
              )}
            >
              <time
                dateTime={day.date.toISOString()}
                className={cn(
                  'mx-auto flex h-7 w-7 items-center justify-center rounded-full',
                  // 選中狀態的背景
                  day.isSelected && !day.isToday && 'bg-gray-900 dark:bg-white dark:text-gray-900',
                  day.isSelected && day.isToday && 'bg-morandi-gold dark:bg-morandi-gold',
                  // 範圍起點/終點
                  day.isRangeStart && 'bg-morandi-gold text-white',
                  day.isRangeEnd && 'bg-morandi-gold text-white'
                )}
              >
                {day.date.getDate()}
              </time>
            </button>
          )
        })}
      </div>

      {/* 今天按鈕 */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={goToToday}
          className="w-full rounded-md bg-morandi-gold px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-morandi-gold-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-morandi-gold transition-colors"
        >
          今天
        </button>
      </div>
    </div>
  )
}
