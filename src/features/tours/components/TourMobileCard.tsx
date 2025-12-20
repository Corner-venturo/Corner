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

export function TourMobileCard({ tour: tourProp, onClick, getStatusColor }: TourMobileCardProps) {
  // Cast tour to ensure proper types
  const tour = tourProp as Tour & Record<string, unknown>

  // 狀態值（已為中文）
  const statusValue = String(tour.status || '提案')

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
            {tour.code || '未命名旅遊團'}
          </h3>
          <p className="text-sm text-morandi-secondary truncate">{tour.name || '無團名'}</p>
        </div>
        <ChevronRight size={20} className="text-morandi-secondary flex-shrink-0 ml-2" />
      </div>

      {/* 狀態標籤 */}
      <div className="mb-3">
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            getStatusColor(statusValue) as string
          )}
        >
          {statusValue}
        </span>
      </div>

      {/* 資訊網格 */}
      <div className="space-y-2">
        {/* 目的地 */}
        {'destination' in tour && Boolean(tour.destination) && (
          <div className="flex items-center text-sm">
            <MapPin size={16} className="text-morandi-secondary mr-2 flex-shrink-0" />
            <span className="text-morandi-primary truncate">{String(tour.destination)}</span>
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
            {('member_count' in tour && typeof tour.member_count === 'number' ? tour.member_count : 0)} 人
            {tour.max_participants ? (
              <span className="text-morandi-secondary"> / {tour.max_participants}</span>
            ) : null}
          </span>
        </div>

        {/* 價格（如果有） */}
        {'price_per_person' in tour && typeof tour.price_per_person === 'number' ? (
          <div className="flex items-center text-sm">
            <DollarSign size={16} className="text-morandi-secondary mr-2 flex-shrink-0" />
            <span className="text-morandi-primary font-medium">
              NT$ {tour.price_per_person.toLocaleString()}
            </span>
            <span className="text-morandi-secondary text-xs ml-1">/ 人</span>
          </div>
        ) : null}
      </div>

      {/* 領隊資訊（如果有） */}
      {'tour_leader_name' in tour && Boolean(tour.tour_leader_name) ? (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-morandi-secondary">領隊</span>
            <span className="text-morandi-primary font-medium">{String(tour.tour_leader_name)}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
