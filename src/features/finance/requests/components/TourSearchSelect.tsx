'use client'

import { Input } from '@/components/ui/input'
import { UI_DELAYS } from '@/lib/constants/timeouts'

interface Tour {
  id: string
  code: string
  name: string
  departure_date: string
}

interface TourSearchSelectProps {
  value: string
  onChange: (value: string) => void
  onSelect: (tour: Tour) => void
  tours: Tour[]
  showDropdown: boolean
  onShowDropdown: (show: boolean) => void
  placeholder?: string
  label?: string
}

export function TourSearchSelect({
  value,
  onChange,
  onSelect,
  tours,
  showDropdown,
  onShowDropdown,
  placeholder = '搜尋團號、團名或日期 (如: 0820)...',
  label = '選擇旅遊團',
}: TourSearchSelectProps) {
  return (
    <div>
      {label && <label className="text-sm font-medium text-morandi-primary">{label}</label>}
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onClick={() => onShowDropdown(true)}
          onBlur={() => setTimeout(() => onShowDropdown(false), UI_DELAYS.SHORT_DELAY)}
          className="mt-1 bg-background"
        />
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
            {tours.length > 0 ? (
              tours.map(tour => (
                <div
                  key={tour.id}
                  onClick={() => {
                    onSelect(tour)
                    onShowDropdown(false)
                  }}
                  className="p-3 hover:bg-morandi-container/20 cursor-pointer border-b border-border last:border-b-0"
                >
                  <div className="font-medium">
                    {tour.code} - {tour.name}
                  </div>
                  <div className="text-sm text-morandi-secondary">
                    出發: {new Date(tour.departure_date).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-sm text-morandi-secondary">找不到相符的旅遊團</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
