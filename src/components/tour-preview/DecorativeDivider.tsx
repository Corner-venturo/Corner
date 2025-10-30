import React from 'react'
import { morandiColors } from '@/lib/constants/morandi-colors'

export interface DecorativeDividerProps {
  variant?: 'simple' | 'ornate' | 'dotted'
  className?: string
}

/**
 * 裝飾性分隔線組件
 * 提供優雅的視覺分隔效果
 */
export function DecorativeDivider({ variant = 'simple', className = '' }: DecorativeDividerProps) {
  if (variant === 'dotted') {
    return (
      <div className={`flex items-center justify-center my-6 ${className}`}>
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: morandiColors.gold }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'ornate') {
    return (
      <div className={`flex items-center gap-4 my-8 ${className}`}>
        <div className="flex-1 h-px" style={{ backgroundColor: morandiColors.primary }} />
        <div className="w-3 h-3 rotate-45 border-2" style={{ borderColor: morandiColors.gold }} />
        <div className="flex-1 h-px" style={{ backgroundColor: morandiColors.primary }} />
      </div>
    )
  }

  // simple variant
  return (
    <div className={`h-px my-6 ${className}`} style={{ backgroundColor: morandiColors.primary }} />
  )
}
