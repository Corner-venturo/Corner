'use client'

import React from 'react'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { DailyItinerary, TourFormData } from '../../types'
import { COMP_EDITOR_LABELS } from '../../../constants/labels'

interface AccommodationSectionProps {
  day: DailyItinerary
  dayIndex: number
  data: TourFormData
  updateDailyItinerary: (index: number, field: string, value: unknown) => void
  onOpenHotelSelector: (dayIndex: number) => void
  isLockedByQuote?: boolean  // 有關聯報價單時鎖定編輯
}

export function AccommodationSection({
  day,
  dayIndex,
  data,
  updateDailyItinerary,
  onOpenHotelSelector,
  isLockedByQuote = false,
}: AccommodationSectionProps) {
  // 如果有關聯報價單，飯店欄位鎖定
  const isLocked = isLockedByQuote || day.isSameAccommodation
  
  return (
    <div className="space-y-2">
      {/* 報價單鎖定提示 */}
      {isLockedByQuote && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700">
          <span>🔒</span>
          <span>住宿資訊已從報價單同步，請從報價單修改</span>
        </div>
      )}
      
      {/* 續住勾選（第二天以後才顯示） */}
      {dayIndex > 0 && !isLockedByQuote && (
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={day.isSameAccommodation || false}
            onCheckedChange={checked => {
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
          />
          <span className="text-sm text-morandi-primary">
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
        {!isLockedByQuote && (
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => onOpenHotelSelector(dayIndex)}
              disabled={isLocked}
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
              disabled={isLocked}
              size="xs"
              variant="secondary"
            >
              + 手動新增
            </Button>
          </div>
        )}
      </div>

      {/* 住宿輸入欄位 */}
      <div className={`flex flex-wrap gap-3 ${isLocked ? 'opacity-50' : ''}`}>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-morandi-primary mb-1">住宿名稱</label>
          <Input
            id={`accommodation-input-${dayIndex}`}
            type="text"
            value={day.accommodation || ''}
            onChange={e => updateDailyItinerary(dayIndex, 'accommodation', e.target.value)}
            disabled={isLocked}
            className="h-8 text-sm"
            placeholder={COMP_EDITOR_LABELS.飯店名稱}
          />
        </div>
        <div className="w-24">
          <label className="block text-xs font-medium text-morandi-primary mb-1">星級</label>
          <Select
            value={String(day.accommodationRating ?? 5)}
            onValueChange={val => {
              updateDailyItinerary(dayIndex, 'accommodationRating', val === '0' ? 0 : Number(val))
            }}
            disabled={isLocked}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5星</SelectItem>
              <SelectItem value="4">4星</SelectItem>
              <SelectItem value="3">3星</SelectItem>
              <SelectItem value="2">2星</SelectItem>
              <SelectItem value="1">1星</SelectItem>
              <SelectItem value="0">特色旅宿</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-morandi-primary mb-1">飯店連結</label>
          <Input
            type="url"
            value={day.accommodationUrl || ''}
            onChange={e => updateDailyItinerary(dayIndex, 'accommodationUrl', e.target.value)}
            disabled={isLocked}
            className="h-8 text-sm"
            placeholder="https://..."
          />
        </div>
      </div>
    </div>
  )
}
