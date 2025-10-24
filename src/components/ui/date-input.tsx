'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface DateInputProps {
  value: string // ISO 8601 格式 (YYYY-MM-DD)
  onChange: (value: string) => void
  _placeholder?: string
  disabled?: boolean
  className?: string
  min?: string
  max?: string
}

export function DateInput({
  value,
  onChange,
  _placeholder = 'YYYY/MM/DD',
  disabled = false,
  className,
  min,
  max,
}: DateInputProps) {
  // 將 ISO 格式轉換為顯示格式
  const formatToDisplay = (isoDate: string): { year: string; month: string; day: string } => {
    if (!isoDate || isoDate.length < 10) {
      return { year: '', month: '', day: '' }
    }
    const [year, month, day] = isoDate.split('-')
    return { year, month, day }
  }

  const initial = formatToDisplay(value)
  const [year, setYear] = useState(initial.year)
  const [month, setMonth] = useState(initial.month)
  const [day, setDay] = useState(initial.day)

  const yearRef = useRef<HTMLInputElement>(null)
  const monthRef = useRef<HTMLInputElement>(null)
  const dayRef = useRef<HTMLInputElement>(null)

  // 同步外部 value 的變化
  useEffect(() => {
    const formatted = formatToDisplay(value)
    setYear(formatted.year)
    setMonth(formatted.month)
    setDay(formatted.day)
  }, [value])

  // 組合日期並回傳 ISO 格式
  const emitDate = (y: string, m: string, d: string) => {
    if (y.length === 4 && m.length === 2 && d.length === 2) {
      const isoDate = `${y}-${m}-${d}`

      // 驗證日期有效性
      const date = new Date(isoDate)
      if (isNaN(date.getTime())) return

      // 檢查 min/max 限制
      if (min && isoDate < min) return
      if (max && isoDate > max) return

      onChange(isoDate)
    }
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setYear(val)
    if (val.length === 4) {
      monthRef.current?.focus()
      monthRef.current?.select()
    }
    emitDate(val, month, day)
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')

    // 避免預設零的問題：如果輸入的第一個數字 > 1，自動補零
    if (val.length === 1 && parseInt(val) > 1) {
      val = '0' + val
    }

    // 限制最多 2 位數
    val = val.slice(0, 2)

    // 限制範圍 01-12
    if (val.length === 2) {
      const num = parseInt(val)
      if (num < 1) val = '01'
      if (num > 12) val = '12'
    }

    setMonth(val)

    if (val.length === 2) {
      dayRef.current?.focus()
      dayRef.current?.select()
    }

    emitDate(year, val, day)
  }

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')

    // 避免預設零的問題：如果輸入的第一個數字 > 3，自動補零
    if (val.length === 1 && parseInt(val) > 3) {
      val = '0' + val
    }

    // 限制最多 2 位數
    val = val.slice(0, 2)

    // 限制範圍 01-31
    if (val.length === 2) {
      const num = parseInt(val)
      if (num < 1) val = '01'
      if (num > 31) val = '31'
    }

    setDay(val)
    emitDate(year, month, val)
  }

  const handleYearKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && year.length === 0 && e.currentTarget.selectionStart === 0) {
      // 在年份欄位開頭按 Backspace，不做任何事
      return
    }
  }

  const handleMonthKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && month.length === 0 && e.currentTarget.selectionStart === 0) {
      yearRef.current?.focus()
      const len = year.length
      yearRef.current?.setSelectionRange(len, len)
    }
  }

  const handleDayKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && day.length === 0 && e.currentTarget.selectionStart === 0) {
      monthRef.current?.focus()
      const len = month.length
      monthRef.current?.setSelectionRange(len, len)
    }
  }

  return (
    <div
      className={cn(
        'flex items-center h-10 w-full rounded-md border border-input bg-background px-3 text-sm',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        value={year}
        onChange={handleYearChange}
        onKeyDown={handleYearKeyDown}
        _placeholder="YYYY"
        disabled={disabled}
        className="w-12 bg-transparent outline-none text-center"
        maxLength={4}
      />
      <span className="text-muted-foreground mx-1">/</span>
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        value={month}
        onChange={handleMonthChange}
        onKeyDown={handleMonthKeyDown}
        _placeholder="MM"
        disabled={disabled}
        className="w-8 bg-transparent outline-none text-center"
        maxLength={2}
      />
      <span className="text-muted-foreground mx-1">/</span>
      <input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        value={day}
        onChange={handleDayChange}
        onKeyDown={handleDayKeyDown}
        _placeholder="DD"
        disabled={disabled}
        className="w-8 bg-transparent outline-none text-center"
        maxLength={2}
      />
    </div>
  )
}
