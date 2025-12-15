'use client'

import React from 'react'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DailyItinerary, TourFormData } from '../../types'

interface AccommodationSectionProps {
  day: DailyItinerary
  dayIndex: number
  data: TourFormData
  updateDailyItinerary: (index: number, field: string, value: unknown) => void
  onOpenHotelSelector: (dayIndex: number) => void
}

export function AccommodationSection({
  day,
  dayIndex,
  data,
  updateDailyItinerary,
  onOpenHotelSelector,
}: AccommodationSectionProps) {
  return (
    <div className="space-y-2">
      {/* 續住勾選（第二天以後才顯示） */}
      {dayIndex > 0 && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={day.isSameAccommodation || false}
            onChange={e => {
              const checked = e.target.checked
              if (checked) {
                // 勾選續住：複製前一天的住宿資料
                const prevDay = data.dailyItinerary[dayIndex - 1]
                updateDailyItinerary(dayIndex, 'isSameAccommodation', true)
                updateDailyItinerary(dayIndex, 'accommodation', prevDay?.accommodation || '')
                updateDailyItinerary(dayIndex, 'accommodationUrl', prevDay?.accommodationUrl || '')
                updateDailyItinerary(dayIndex, 'accommodationRating', prevDay?.accommodationRating ?? 5)
              } else {
                // 取消續住
                updateDailyItinerary(dayIndex, 'isSameAccommodation', false)
              }
            }}
            className="h-4 w-4 text-morandi-gold focus:ring-morandi-gold border-morandi-container rounded"
          />
          <span className="text-sm text-morandi-secondary">
            續住
            {data.dailyItinerary[dayIndex - 1]?.accommodation && (
              <span className="text-morandi-gold ml-1">
                （{data.dailyItinerary[dayIndex - 1].accommodation}）
              </span>
            )}
          </span>
        </label>
      )}

      {/* 住宿標題與飯店庫按鈕 */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-morandi-primary flex items-center gap-2">
          <Building2 size={14} />
          住宿
        </label>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => onOpenHotelSelector(dayIndex)}
            disabled={day.isSameAccommodation}
            size="xs"
            variant="default"
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white disabled:opacity-50"
          >
            從飯店庫選擇
          </Button>
          <Button
            type="button"
            onClick={() => {
              // 清空欄位讓用戶手動輸入
              updateDailyItinerary(dayIndex, 'accommodation', '')
              updateDailyItinerary(dayIndex, 'accommodationUrl', '')
              updateDailyItinerary(dayIndex, 'accommodationRating', 5)
              // Focus 到輸入框
              setTimeout(() => {
                const input = document.querySelector(`#accommodation-input-${dayIndex}`) as HTMLInputElement
                input?.focus()
              }, 0)
            }}
            disabled={day.isSameAccommodation}
            size="xs"
            variant="secondary"
          >
            + 手動新增
          </Button>
        </div>
      </div>

      {/* 住宿輸入欄位 */}
      <div className={`flex flex-wrap gap-3 ${day.isSameAccommodation ? 'opacity-50' : ''}`}>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-morandi-secondary mb-1">住宿名稱</label>
          <input
            id={`accommodation-input-${dayIndex}`}
            type="text"
            value={day.accommodation || ''}
            onChange={e => updateDailyItinerary(dayIndex, 'accommodation', e.target.value)}
            disabled={day.isSameAccommodation}
            className="w-full px-2 py-1 border rounded text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="飯店名稱"
          />
        </div>
        <div className="w-24">
          <label className="block text-xs font-medium text-morandi-secondary mb-1">星級</label>
          <select
            value={day.accommodationRating ?? 5}
            onChange={e => {
              const val = e.target.value
              updateDailyItinerary(dayIndex, 'accommodationRating', val === '0' ? 0 : Number(val))
            }}
            disabled={day.isSameAccommodation}
            className="w-full px-2 py-1 border rounded text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value={5}>5星</option>
            <option value={4}>4星</option>
            <option value={3}>3星</option>
            <option value={2}>2星</option>
            <option value={1}>1星</option>
            <option value={0}>特色旅宿</option>
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-morandi-secondary mb-1">飯店連結</label>
          <input
            type="url"
            value={day.accommodationUrl || ''}
            onChange={e => updateDailyItinerary(dayIndex, 'accommodationUrl', e.target.value)}
            disabled={day.isSameAccommodation}
            className="w-full px-2 py-1 border rounded text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="https://..."
          />
        </div>
      </div>
    </div>
  )
}
