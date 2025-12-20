'use client'

import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface DatePickerProps {
  value?: string | Date | null
  onChange?: (date: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  buttonClassName?: string
  /** 日期格式：'YYYY-MM-DD' (預設) 或 'YYYY/MM/DD' */
  format?: 'dash' | 'slash'
  /** 最小可選日期 */
  minDate?: Date
  /** 最大可選日期 */
  maxDate?: Date
  /** 是否顯示清除按鈕 */
  clearable?: boolean
}

/**
 * 統一的日期選擇器組件
 * 使用 Popover + Calendar 取代原生 input[type="date"]
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'YYYY / MM / DD',
  disabled = false,
  className,
  buttonClassName,
  format = 'dash',
  minDate,
  maxDate,
  clearable = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // 將各種格式的值轉換為 Date 物件
  const parseValue = (val: string | Date | null | undefined): Date | undefined => {
    if (!val) return undefined
    if (val instanceof Date) return val
    // 支援 YYYY-MM-DD 和 YYYY/MM/DD 格式
    const normalized = val.replace(/\//g, '-')
    const date = new Date(normalized)
    return isNaN(date.getTime()) ? undefined : date
  }

  // 格式化日期為字串
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return format === 'slash' ? `${year}/${month}/${day}` : `${year}-${month}-${day}`
  }

  // 顯示用的日期格式（統一為 YYYY / MM / DD）
  const displayValue = (val: string | Date | null | undefined): string => {
    const date = parseValue(val)
    if (!date) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year} / ${month} / ${day}`
  }

  const selectedDate = parseValue(value)

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange?.(formatDate(date))
      setOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.('')
  }

  // 建立 disabled 配置
  const disabledConfig = React.useMemo(() => {
    if (!minDate && !maxDate) return undefined
    return {
      before: minDate,
      after: maxDate,
    }
  }, [minDate, maxDate])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full h-10 justify-between text-left font-normal bg-white',
            !value && 'text-muted-foreground',
            buttonClassName,
            className
          )}
        >
          <span className="flex-1 truncate">
            {value ? displayValue(value) : placeholder}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {clearable && value && (
              <span
                onClick={handleClear}
                className="h-4 w-4 shrink-0 rounded-full hover:bg-muted flex items-center justify-center cursor-pointer"
              >
                ×
              </span>
            )}
            <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect as (date: Date | { from: Date; to?: Date } | undefined) => void}
          defaultMonth={selectedDate || new Date()}
          disabled={disabledConfig}
        />
      </PopoverContent>
    </Popover>
  )
}

/**
 * 日期範圍選擇器
 */
export interface DateRangePickerProps {
  startValue?: string | null
  endValue?: string | null
  onStartChange?: (date: string) => void
  onEndChange?: (date: string) => void
  startPlaceholder?: string
  endPlaceholder?: string
  disabled?: boolean
  className?: string
  format?: 'dash' | 'slash'
}

export function DateRangePicker({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  startPlaceholder = '開始日期',
  endPlaceholder = '結束日期',
  disabled = false,
  className,
  format = 'dash',
}: DateRangePickerProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DatePicker
        value={startValue}
        onChange={onStartChange}
        placeholder={startPlaceholder}
        disabled={disabled}
        format={format}
        className="flex-1"
      />
      <span className="text-muted-foreground">~</span>
      <DatePicker
        value={endValue}
        onChange={onEndChange}
        placeholder={endPlaceholder}
        disabled={disabled}
        format={format}
        className="flex-1"
      />
    </div>
  )
}
