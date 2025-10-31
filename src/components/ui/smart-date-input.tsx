'use client'

import React, { useRef, useState } from 'react'
import { _Input } from './input'
import { cn } from '@/lib/utils'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { format, parse, isValid } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SPECIAL_DELAYS } from '@/lib/constants/timeouts'
import 'react-day-picker/style.css'

interface SmartDateInputProps {
  value: string
  onChange: (value: string) => void
  min?: string
  className?: string
  _placeholder?: string
  required?: boolean
  initialMonth?: string // 初始顯示的月份（YYYY-MM-DD 格式）
}

export function SmartDateInput({
  value,
  onChange,
  min,
  className,
  _placeholder = 'YYYY-MM-DD',
  required = false,
  initialMonth,
}: SmartDateInputProps) {
  const yearRef = useRef<HTMLInputElement>(null)
  const monthRef = useRef<HTMLInputElement>(null)
  const dayRef = useRef<HTMLInputElement>(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // 分解日期字串
  const parts = value ? value.split('-') : []
  const year = parts[0] || ''
  const month = parts[1] || ''
  const day = parts[2] || ''

  // 將字串轉換為 Date 物件用於日曆
  const dateValue = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined
  const minDate = min ? parse(min, 'yyyy-MM-dd', new Date()) : undefined
  const initialMonthDate = initialMonth ? parse(initialMonth, 'yyyy-MM-dd', new Date()) : undefined

  // 從日曆選擇日期
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const formatted = format(date, 'yyyy-MM-dd')
      onChange(formatted)
      setIsCalendarOpen(false)
    }
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '') // 只允許數字

    // 直接更新，不補0
    onChange(val ? `${val}${month ? '-' + month : ''}${day ? '-' + day : ''}` : '')

    // 當輸入4位數時，自動跳到月份
    if (val.length === 4) {
      setTimeout(() => monthRef.current?.focus(), SPECIAL_DELAYS.NEXT_TICK)
    }
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')

    // 只有當輸入值大於12時才調整為12，允許 '0' 開頭的輸入
    if (val.length === 2 && parseInt(val) > 12) {
      val = '12'
    }

    // 完整輸入 "00" 時清空（但允許輸入過程中的 "0"）
    if (val === '00') {
      val = ''
    }

    // 直接更新，不補0
    onChange(`${year}${val ? '-' + val : ''}${day ? '-' + day : ''}`)

    // 當輸入2位數時，自動跳到日期
    if (val.length === 2 && parseInt(val) > 0 && parseInt(val) <= 12) {
      setTimeout(() => dayRef.current?.focus(), SPECIAL_DELAYS.NEXT_TICK)
    }
  }

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')

    // 只有當輸入值大於31時才調整為31，允許 '0' 開頭的輸入
    if (val.length === 2 && parseInt(val) > 31) {
      val = '31'
    }

    // 完整輸入 "00" 時清空（但允許輸入過程中的 "0"）
    if (val === '00') {
      val = ''
    }

    // 直接更新，不補0
    onChange(`${year}${month ? '-' + month : ''}${val ? '-' + val : ''}`)
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: 'year' | 'month' | 'day'
  ) => {
    // 按下 Backspace 時，如果當前欄位是空的，跳到前一個欄位
    if (e.key === 'Backspace') {
      const input = e.currentTarget
      if (input.value.length === 0 || input.selectionStart === 0) {
        if (type === 'day') monthRef.current?.focus()
        if (type === 'month') yearRef.current?.focus()
      }
    }

    // 按下 / 或 - 時，跳到下一個欄位
    if (e.key === '/' || e.key === '-') {
      e.preventDefault()
      if (type === 'year') monthRef.current?.focus()
      if (type === 'month') dayRef.current?.focus()
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-1 px-3 h-10 border border-input rounded-md bg-background flex-1 focus-within:border-morandi-gold transition-colors">
        <input
          ref={yearRef}
          type="text"
          inputMode="numeric"
          value={year}
          onChange={handleYearChange}
          onKeyDown={e => handleKeyDown(e, 'year')}
          placeholder="YYYY"
          className="w-14 bg-transparent outline-none text-center placeholder:text-muted-foreground text-base md:text-sm"
          maxLength={4}
          required={required}
        />
        <span className="text-morandi-secondary">/</span>
        <input
          ref={monthRef}
          type="text"
          inputMode="numeric"
          value={month}
          onChange={handleMonthChange}
          onKeyDown={e => handleKeyDown(e, 'month')}
          placeholder="MM"
          className="w-10 bg-transparent outline-none text-center placeholder:text-muted-foreground text-base md:text-sm"
          maxLength={2}
          required={required}
        />
        <span className="text-morandi-secondary">/</span>
        <input
          ref={dayRef}
          type="text"
          inputMode="numeric"
          value={day}
          onChange={handleDayChange}
          onKeyDown={e => handleKeyDown(e, 'day')}
          placeholder="DD"
          className="w-10 bg-transparent outline-none text-center placeholder:text-muted-foreground text-base md:text-sm"
          maxLength={2}
          required={required}
        />
      </div>

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="h-10 w-10 flex items-center justify-center border border-input rounded-md bg-background hover:bg-morandi-bg-subtle transition-colors"
            title="選擇日期"
          >
            <CalendarIcon className="h-4 w-4 text-morandi-secondary" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <DayPicker
            mode="single"
            selected={dateValue && isValid(dateValue) ? dateValue : undefined}
            onSelect={handleCalendarSelect}
            disabled={minDate ? { before: minDate } : undefined}
            defaultMonth={
              initialMonthDate && isValid(initialMonthDate) ? initialMonthDate : undefined
            }
            className="p-3"
            classNames={{
              months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
              month: 'space-y-4',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-sm font-medium',
              nav: 'space-x-1 flex items-center',
              nav_button: 'h-10 w-10 bg-transparent p-0 opacity-50 hover:opacity-100',
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: 'text-morandi-secondary rounded-md w-9 font-normal text-[0.8rem]',
              row: 'flex w-full mt-2',
              cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-morandi-bg-subtle first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
              day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-morandi-bg-subtle rounded-md transition-colors',
              day_selected:
                'bg-morandi-primary text-white hover:bg-morandi-primary hover:text-white focus:bg-morandi-primary focus:text-white',
              day_today: 'bg-morandi-bg-subtle text-morandi-primary',
              day_outside: 'text-morandi-secondary opacity-50',
              day_disabled: 'text-morandi-secondary opacity-50',
              day_range_middle:
                'aria-selected:bg-morandi-bg-subtle aria-selected:text-morandi-primary',
              day_hidden: 'invisible',
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
