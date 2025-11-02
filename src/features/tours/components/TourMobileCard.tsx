'use client'

import React from 'react'
import { Tour } from '@/stores/types'
import { cn } from '@/lib/utils'
import { MapPin, Calendar, Users, DollarSign, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface TourMobileCardProps {
  tour: Tour
  onClick: () => void
  getStatusColor: (status: string) => string
}

export function TourMobileCard({ tour, onClick, getStatusColor }: TourMobileCardProps) {
  // 狀態標籤
  const statusLabels: Record<string, string> = {
    pending: '待確認',
    confirmed: '已確認',
    in_progress: '進行中',
    completed: '已完成',
    cancelled: '已取消',
    archived: '已封存',
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card border border-border rounded-xl p-4 shadow-sm',
        'active:scale-[0.98] transition-all duration-200 cursor-pointer',
        'hover:shadow-md hover:border-morandi-gold/30'
      )}
    >
      {/* 標題列 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-morandi-primary text-base truncate mb-1">
            {tour.tour_code || '未命名旅遊團'}
          </h3>
          <p className="text-sm text-morandi-secondary truncate">
            {tour.tour_name || '無團名'}
          </p>
        </div>
        <ChevronRight size={20} className="text-morandi-secondary flex-shrink-0 ml-2" />
      </div>

      {/* 狀態標籤 */}
      <div className="mb-3">
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            getStatusColor(tour.status || 'pending')
          )}
        >
          {statusLabels[tour.status || 'pending'] || tour.status}
        </span>
      </div>

      {/* 資訊網格 */}
      <div className="space-y-2">
        {/* 目的地 */}
        {tour.destination && (
          <div className="flex items-center text-sm">
            <MapPin size={16} className="text-morandi-secondary mr-2 flex-shrink-0" />
            <span className="text-morandi-primary truncate">{tour.destination}</span>
          </div>
        )}

        {/* 出發日期 */}
        {tour.departure_date && (
          <div className="flex items-center text-sm">
            <Calendar size={16} className="text-morandi-secondary mr-2 flex-shrink-0" />
            <span className="text-morandi-primary">
              {format(new Date(tour.departure_date), 'yyyy/MM/dd', { locale: zhTW })}
              {tour.return_date && (
                <span className="text-morandi-secondary">
                  {' '}
                  - {format(new Date(tour.return_date), 'MM/dd', { locale: zhTW })}
                </span>
              )}
            </span>
          </div>
        )}

        {/* 人數 */}
        <div className="flex items-center text-sm">
          <Users size={16} className="text-morandi-secondary mr-2 flex-shrink-0" />
          <span className="text-morandi-primary">
            {tour.member_count || 0} 人
            {tour.max_participants && (
              <span className="text-morandi-secondary"> / {tour.max_participants}</span>
            )}
          </span>
        </div>

        {/* 價格（如果有） */}
        {tour.price_per_person && (
          <div className="flex items-center text-sm">
            <DollarSign size={16} className="text-morandi-secondary mr-2 flex-shrink-0" />
            <span className="text-morandi-primary font-medium">
              NT$ {tour.price_per_person.toLocaleString()}
            </span>
            <span className="text-morandi-secondary text-xs ml-1">/ 人</span>
          </div>
        )}
      </div>

      {/* 領隊資訊（如果有） */}
      {tour.tour_leader_name && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-morandi-secondary">領隊</span>
            <span className="text-morandi-primary font-medium">{tour.tour_leader_name}</span>
          </div>
        </div>
      )}
    </div>
  )
}
