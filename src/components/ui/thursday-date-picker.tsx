'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface ThursdayDatePickerProps {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  allowAnyDay?: boolean // 特殊請款允許任何日期
}

const dayNames = ['日', '一', '二', '三', '四', '五', '六']

export function ThursdayDatePicker({
  value,
  onChange,
  disabled = false,
  className,
  allowAnyDay = false,
}: ThursdayDatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )
  const [showWarning, setShowWarning] = React.useState(false)

  // 同步外部 value 到內部 state
  React.useEffect(() => {
    if (value) {
      setDate(new Date(value))
    } else {
      setDate(undefined)
    }
  }, [value])

  const handleSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined)
      onChange('')
      setShowWarning(false)
      return
    }

    const dayOfWeek = selectedDate.getDay()
    const isThursday = dayOfWeek === 4

    // 如果不是特殊請款且不是週四，顯示警告
    if (!allowAnyDay && !isThursday) {
      setShowWarning(true)
      setTimeout(() => setShowWarning(false), 3000) // 3秒後自動隱藏
      return
    }

    setDate(selectedDate)
    const formattedDate = format(selectedDate, 'yyyy-MM-dd')
    onChange(formattedDate)
    setShowWarning(false)
  }

  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground',
              allowAnyDay && 'bg-morandi-gold/10 border-morandi-gold/50',
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'yyyy/MM/dd') : <span>選擇日期</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            locale={zhTW}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {showWarning && (
        <div className="mt-2 flex items-center gap-2 text-sm text-morandi-red">
          <AlertCircle size={16} />
          <span>請選擇週四作為請款日期</span>
        </div>
      )}
    </div>
  )
}
