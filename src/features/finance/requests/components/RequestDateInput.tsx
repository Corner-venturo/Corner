'use client'

import { useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface RequestDateInputProps {
  value: string
  onChange: (date: string, isSpecialBilling: boolean) => void
  label?: string
}

// 計算下一個週四（如果今天是週四，跳到下週四）
function getNextThursday(): string {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=週日, 1=週一, ..., 4=週四

  let daysUntilThursday = 4 - dayOfWeek
  if (daysUntilThursday <= 0) {
    // 今天是週四或之後，跳到下週四
    daysUntilThursday += 7
  }

  const nextThursday = new Date(today)
  nextThursday.setDate(today.getDate() + daysUntilThursday)

  // 格式化為 YYYY-MM-DD
  return nextThursday.toISOString().split('T')[0]
}

export function RequestDateInput({ value, onChange, label = '請款日期' }: RequestDateInputProps) {
  // 打開時自動帶入下一個週四
  useEffect(() => {
    if (!value) {
      const nextThursday = getNextThursday()
      onChange(nextThursday, false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDateChange = (selectedDate: string) => {
    const isThursday = selectedDate ? new Date(selectedDate + 'T00:00:00').getDay() === 4 : false
    onChange(selectedDate, !isThursday)
  }

  const isSpecialBilling = value && new Date(value + 'T00:00:00').getDay() !== 4

  return (
    <div>
      <label className="text-sm font-medium text-morandi-primary">{label}</label>
      <Input
        type="date"
        value={value}
        onChange={e => handleDateChange(e.target.value)}
        className={cn(
          'mt-1',
          isSpecialBilling ? 'bg-morandi-gold/10 border-morandi-gold/20' : 'bg-background'
        )}
      />
      {value && (
        <p
          className={cn(
            'text-xs mt-1',
            isSpecialBilling ? 'text-morandi-gold' : 'text-morandi-secondary'
          )}
        >
          {isSpecialBilling ? '特殊出帳：非週四請款' : '一般請款：週四出帳'}
        </p>
      )}
    </div>
  )
}
