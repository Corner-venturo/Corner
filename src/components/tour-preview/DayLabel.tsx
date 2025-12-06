import React from 'react'
import { morandiColors } from '@/lib/constants/morandi-colors'

export interface DayLabelProps {
  dayNumber?: number
  dayLabel?: string // 自定義標籤（如 "Day 3-B"），優先於 dayNumber
  isAlternative?: boolean // 是否為建議方案
  variant?: 'default' | 'large' | 'small'
  className?: string
}

/**
 * Day 標籤組件
 * 用於顯示「Day 01」「Day 02」或「Day 03-B」等日期標識
 */
export function DayLabel({ dayNumber, dayLabel, isAlternative = false, variant = 'default', className = '' }: DayLabelProps) {
  // 優先使用 dayLabel，否則用 dayNumber 生成
  const displayLabel = dayLabel || `Day ${String(dayNumber || 1).padStart(2, '0')}`
  // 轉換為全大寫的 "DAY XX" 格式
  const formattedLabel = displayLabel.toUpperCase().replace('DAY ', 'DAY ')

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
        backgroundColor: isAlternative ? morandiColors.text.secondary : morandiColors.gold,
        color: '#FFFFFF',
        boxShadow: isAlternative
          ? '0 2px 8px rgba(150, 140, 130, 0.3)'
          : '0 2px 8px rgba(212, 175, 55, 0.3)',
      }}
    >
      {formattedLabel}
    </div>
  )
}
