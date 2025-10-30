import React from 'react'
import { morandiColors } from '@/lib/constants/morandi-colors'

export interface DayLabelProps {
  dayNumber: number
  variant?: 'default' | 'large' | 'small'
  className?: string
}

/**
 * Day 標籤組件
 * 用於顯示「Day 01」「Day 02」等日期標識
 */
export function DayLabel({ dayNumber, variant = 'default', className = '' }: DayLabelProps) {
  const paddedDay = String(dayNumber).padStart(2, '0')

  const sizeClasses = {
    small: 'px-3 py-1 text-sm',
    default: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  }

  return (
    <div
      className={`
        inline-flex items-center justify-center
        rounded-full font-bold tracking-wide
        ${sizeClasses[variant]}
        ${className}
      `}
      style={{
        backgroundColor: morandiColors.gold,
        color: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
      }}
    >
      DAY {paddedDay}
    </div>
  )
}
