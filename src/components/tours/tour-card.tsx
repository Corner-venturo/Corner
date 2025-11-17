'use client'

import React from 'react'
import { Tour } from '@/stores/types'
import { MapPin, Calendar, Users, DollarSign, TrendingUp, Edit2, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface TourCardProps {
  tour: Tour
  onClick?: () => void
  onEdit?: () => void
  onQuote?: () => void
  actualMembers: number
}

export function TourCard({ tour, onClick, onEdit, onQuote, actualMembers }: TourCardProps) {
  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'bg-morandi-container border-morandi-secondary'
    const colors: Record<string, string> = {
      提案: 'bg-morandi-blue border-morandi-blue',
      進行中: 'bg-morandi-green border-morandi-green',
      待結案: 'bg-morandi-gold border-morandi-gold',
      結案: 'bg-morandi-container border-morandi-secondary',
      特殊團: 'bg-morandi-red border-morandi-red',
    }
    return colors[status] || 'bg-morandi-container border-morandi-secondary'
  }

  const profitColor = tour.profit >= 0 ? 'text-morandi-green' : 'text-morandi-red'
  const occupancyRate =
    tour.max_participants > 0 ? (actualMembers / tour.max_participants) * 100 : 0
  const occupancyColor =
    occupancyRate >= 80
      ? 'text-morandi-green'
      : occupancyRate >= 50
        ? 'text-morandi-gold'
        : 'text-morandi-red'

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-card border-2 border-border rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer',
        'hover:border-morandi-gold'
      )}
    >
      {/* 狀態標籤 - 右上角 */}
      <div className="absolute top-4 right-4">
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium text-white',
            getStatusColor(tour.status).split(' ')[0]
          )}
        >
          {tour.status}
        </span>
      </div>

      {/* 主要內容 */}
      <div className="space-y-4">
        {/* 頭部：目的地和團號 */}
        <div className="pr-20">
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className="text-morandi-gold" size={20} />
            <h3 className="text-xl font-bold text-morandi-primary truncate">{tour.location}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-morandi-secondary">團號:</span>
            <span className="text-sm font-mono text-morandi-primary">{tour.code}</span>
          </div>
        </div>

        {/* 旅遊團名稱 */}
        <div className="text-morandi-primary font-medium line-clamp-2 min-h-[3rem]">
          {tour.name}
        </div>

        {/* 日期資訊 */}
        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="text-morandi-secondary" size={16} />
          <span className="text-morandi-primary">
            {new Date(tour.departure_date).toLocaleDateString('zh-TW', {
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span className="text-morandi-secondary">-</span>
          <span className="text-morandi-primary">
            {new Date(tour.return_date).toLocaleDateString('zh-TW', {
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* 統計資訊網格 */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          {/* 人數 */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-morandi-secondary">
              <Users size={14} />
              <span className="text-xs">參與人數</span>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className={cn('text-2xl font-bold', occupancyColor)}>{actualMembers}</span>
              <span className="text-sm text-morandi-secondary">/ {tour.max_participants}</span>
            </div>
            <div className="text-xs text-morandi-secondary">{occupancyRate.toFixed(0)}% 滿團率</div>
          </div>

          {/* 收入 */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-morandi-secondary">
              <DollarSign size={14} />
              <span className="text-xs">總收入</span>
            </div>
            <div className="text-lg font-bold text-morandi-primary">
              ${tour.total_revenue.toLocaleString()}
            </div>
            <div className="text-xs text-morandi-secondary">NT$</div>
          </div>

          {/* 成本 */}
          <div className="space-y-1">
            <div className="text-xs text-morandi-secondary">總成本</div>
            <div className="text-sm font-medium text-morandi-red">
              ${tour.total_cost.toLocaleString()}
            </div>
          </div>

          {/* 利潤 */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-morandi-secondary">
              <TrendingUp size={14} />
              <span className="text-xs">預估利潤</span>
            </div>
            <div className={cn('text-sm font-bold', profitColor)}>
              ${tour.profit.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 操作按鈕 - 懸停時顯示 */}
      <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={e => {
            e.stopPropagation()
            onEdit?.()
          }}
          className="h-8 w-8 p-0 bg-white hover:bg-morandi-container"
          title="編輯"
        >
          <Edit2 size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={e => {
            e.stopPropagation()
            onQuote?.()
          }}
          className="h-8 w-8 p-0 bg-white hover:bg-morandi-container"
          title="報價"
        >
          <Calculator size={14} />
        </Button>
      </div>
    </div>
  )
}
