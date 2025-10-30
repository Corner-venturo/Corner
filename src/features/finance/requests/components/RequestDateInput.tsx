'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface RequestDateInputProps {
  value: string
  onChange: (date: string, isSpecialBilling: boolean) => void
  label?: string
}

export function RequestDateInput({ value, onChange, label = '請款日期' }: RequestDateInputProps) {
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
          {isSpecialBilling ? '⚠️ 特殊出帳：非週四請款' : '💼 一般請款：週四出帳'}
        </p>
      )}
    </div>
  )
}
