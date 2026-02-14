import React from 'react'
import { Loader2 } from 'lucide-react'
import { HotelCard } from './HotelCard'
import type { LuxuryHotel } from '../HotelSelector'
import { COMP_EDITOR_LABELS } from '../constants/labels'

interface HotelListProps {
  hotels: LuxuryHotel[]
  selectedIds: Set<string>
  loading: boolean
  selectedCountryId: string
  searchQuery: string
  onToggleSelection: (id: string) => void
}

export function HotelList({
  hotels,
  selectedIds,
  loading,
  selectedCountryId,
  searchQuery,
  onToggleSelection,
}: HotelListProps) {
  // 空狀態顯示
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-morandi-secondary">
        <Loader2 className="animate-spin mr-2" size={20} />
        {COMP_EDITOR_LABELS.載入中}
      </div>
    )
  }

  if (hotels.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-morandi-secondary">
        {!selectedCountryId ? COMP_EDITOR_LABELS.請先選擇國家 : searchQuery ? COMP_EDITOR_LABELS.找不到符合的飯店 : COMP_EDITOR_LABELS.沒有可選擇的飯店}
      </div>
    )
  }

  // 飯店卡片網格
  return (
    <div className="grid grid-cols-2 gap-3 p-3">
      {hotels.map(hotel => (
        <HotelCard
          key={hotel.id}
          hotel={hotel}
          isSelected={selectedIds.has(hotel.id)}
          onToggle={onToggleSelection}
        />
      ))}
    </div>
  )
}
