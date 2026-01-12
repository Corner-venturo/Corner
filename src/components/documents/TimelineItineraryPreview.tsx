'use client'

/**
 * TimelineItineraryPreview - 時間軸行程表預覽組件
 * 用於在報價單對話框中顯示行程表內容
 */

import React, { useMemo } from 'react'
import { Clock, MapPin, Coffee, UtensilsCrossed, Moon, Building2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimelineItineraryData, TimelineDay, TimelineAttraction } from '@/types/timeline-itinerary.types'

interface TimelineItineraryPreviewProps {
  data: TimelineItineraryData | null
  loading?: boolean
  className?: string
}

// 格式化時間 (0900 -> 09:00)
function formatTime(time?: string): string {
  if (!time || time.length !== 4) return time || ''
  return `${time.slice(0, 2)}:${time.slice(2)}`
}

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
}

// 單日行程渲染
function DaySection({ day }: { day: TimelineDay }) {
  return (
    <div className="mb-4 last:mb-0">
      {/* Day 標題 */}
      <div className="flex items-center gap-2 mb-2 pb-1 border-b border-border/50">
        <span className="text-xs font-medium text-morandi-gold">Day {day.dayNumber}</span>
        {day.date && (
          <span className="text-xs text-morandi-secondary">{formatDate(day.date)}</span>
        )}
        {day.title && (
          <span className="text-xs text-morandi-primary font-medium flex-1 truncate">{day.title}</span>
        )}
      </div>

      {/* 景點列表 */}
      <div className="space-y-1.5 pl-2">
        {day.attractions.map((attraction: TimelineAttraction) => (
          <AttractionItem key={attraction.id} attraction={attraction} />
        ))}
      </div>

      {/* 住宿 */}
      {day.accommodation && (
        <div className="flex items-center gap-1.5 mt-2 pl-2 text-xs text-morandi-secondary">
          <Building2 size={12} className="text-morandi-gold shrink-0" />
          <span className="truncate">{day.accommodation}</span>
        </div>
      )}
    </div>
  )
}

// 單個景點渲染
function AttractionItem({ attraction }: { attraction: TimelineAttraction }) {
  const hasTime = attraction.startTime || attraction.endTime
  const timeStr = hasTime
    ? `${formatTime(attraction.startTime)}${attraction.endTime ? ' - ' + formatTime(attraction.endTime) : ''}`
    : ''

  // 餐食圖標
  const MealIcon = useMemo(() => {
    switch (attraction.mealType) {
      case 'breakfast': return Coffee
      case 'lunch': return UtensilsCrossed
      case 'dinner': return Moon
      default: return null
    }
  }, [attraction.mealType])

  if (!attraction.name) return null

  return (
    <div className="flex items-start gap-2 text-xs">
      {/* 時間 */}
      {hasTime && (
        <span className="font-mono text-morandi-secondary shrink-0 w-[70px]">{timeStr}</span>
      )}

      {/* 內容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          {MealIcon && <MealIcon size={11} className="text-morandi-gold shrink-0" />}
          <span
            className="text-morandi-primary"
            style={attraction.color ? { color: attraction.color } : undefined}
          >
            {attraction.name}
          </span>
        </div>
        {attraction.menu && (
          <span
            className="text-morandi-secondary text-[10px] block mt-0.5"
            style={attraction.color ? { color: attraction.color, opacity: 0.8 } : undefined}
          >
            {attraction.menu}
          </span>
        )}
      </div>
    </div>
  )
}

export function TimelineItineraryPreview({ data, loading, className }: TimelineItineraryPreviewProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-6', className)}>
        <Loader2 className="w-5 h-5 animate-spin text-morandi-secondary" />
      </div>
    )
  }

  if (!data || !data.days || data.days.length === 0) {
    return (
      <div className={cn('text-center py-6 text-sm text-morandi-secondary', className)}>
        <Clock className="w-8 h-8 mx-auto mb-2 text-morandi-muted" />
        <p>尚無行程資料</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* 標題 */}
      {(data.title || data.subtitle) && (
        <div className="pb-2 mb-2 border-b border-border">
          {data.title && (
            <h4 className="text-sm font-medium text-morandi-primary">{data.title}</h4>
          )}
          {data.subtitle && (
            <p className="text-xs text-morandi-secondary mt-0.5">{data.subtitle}</p>
          )}
        </div>
      )}

      {/* 每日行程 */}
      <div className="max-h-[300px] overflow-y-auto pr-1">
        {data.days.map((day) => (
          <DaySection key={day.id} day={day} />
        ))}
      </div>
    </div>
  )
}
