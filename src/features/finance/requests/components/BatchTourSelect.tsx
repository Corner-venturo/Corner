'use client'

import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { UI_DELAYS } from '@/lib/constants/timeouts'
import { cn } from '@/lib/utils'
import { Search, ChevronDown } from 'lucide-react'

interface Tour {
  id: string
  code: string
  name: string
  departure_date: string
}

interface BatchTourSelectProps {
  searchValue: string
  onSearchChange: (value: string) => void
  tours: Tour[]
  selectedTourIds: string[]
  onToggleTour: (tourId: string) => void
  onRemoveTour: (tourId: string) => void
  showDropdown: boolean
  onShowDropdown: (show: boolean) => void
  allTours: Tour[]
  tourAllocations?: Record<string, number> // 每個團的分配金額
  onAllocationChange?: (tourId: string, amount: number) => void
  totalItemsAmount?: number // 總項目金額
}

export function BatchTourSelect({
  searchValue,
  onSearchChange,
  tours,
  selectedTourIds,
  onToggleTour,
  onRemoveTour,
  showDropdown,
  onShowDropdown,
  allTours,
  tourAllocations = {},
  onAllocationChange,
  totalItemsAmount = 0,
}: BatchTourSelectProps) {
  return (
    <div className="border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-morandi-primary mb-4">選擇旅遊團</h3>
      {/* Combobox-style Multi-Select */}
      <div className="relative">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-morandi-secondary pointer-events-none"
          />
          <Input
            placeholder="搜尋團號、團名或日期 (如: 0820)..."
            value={searchValue}
            onChange={e => onSearchChange(e.target.value)}
            onClick={() => onShowDropdown(true)}
            onBlur={() => setTimeout(() => onShowDropdown(false), UI_DELAYS.SHORT_DELAY)}
            className="pl-10 pr-8"
          />
          <button
            type="button"
            onClick={() => onShowDropdown(!showDropdown)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 flex items-center justify-center hover:bg-morandi-container/50 rounded transition-colors"
          >
            <ChevronDown
              size={16}
              className={cn('text-morandi-secondary transition-transform', showDropdown && 'transform rotate-180')}
            />
          </button>
        </div>
        {showDropdown && (
          <div className="absolute z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden mt-1 w-full max-h-[16rem]">
            <div className="overflow-y-auto max-h-[16rem]">
              {tours.length > 0 ? (
                tours.map(tour => {
                  const isSelected = selectedTourIds.includes(tour.id)
                  return (
                    <button
                      key={tour.id}
                      type="button"
                      onClick={() => onToggleTour(tour.id)}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm transition-colors hover:bg-morandi-container/30 focus:bg-morandi-container/30 focus:outline-none',
                        isSelected && 'bg-morandi-gold/10 font-medium'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                            isSelected ? 'bg-morandi-gold border-morandi-gold' : 'border-morandi-container'
                          )}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-morandi-primary truncate">
                            {tour.code} - {tour.name}
                          </div>
                          <div className="text-xs text-morandi-secondary">
                            出發: {new Date(tour.departure_date).toLocaleDateString('zh-TW')}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="px-3 py-6 text-center text-sm text-morandi-secondary">找不到相符的旅遊團</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected tours with allocation */}
      {selectedTourIds.length > 0 && (
        <div className="mt-4 p-4 bg-morandi-container/10 rounded">
          <div className="text-sm font-medium text-morandi-primary mb-3">
            已選擇 {selectedTourIds.length} 個旅遊團
            {totalItemsAmount > 0 && (
              <span className="ml-2 text-morandi-secondary">
                （項目總額：NT$ {totalItemsAmount.toLocaleString()}）
              </span>
            )}
          </div>
          <div className="space-y-2">
            {selectedTourIds.map(tourId => {
              const tour = allTours.find(t => t.id === tourId)
              if (!tour) return null
              const allocation = tourAllocations[tourId] || 0
              return (
                <div key={tourId} className="flex items-center gap-3 bg-white p-3 rounded border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{tour.code}</div>
                    <div className="text-xs text-morandi-secondary truncate">{tour.name}</div>
                  </div>
                  {onAllocationChange && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-morandi-secondary whitespace-nowrap">分配金額：</span>
                      <Input
                        type="number"
                        value={allocation}
                        onChange={e => onAllocationChange(tourId, Number(e.target.value))}
                        className="w-36 h-9 text-right"
                        placeholder="0"
                      />
                    </div>
                  )}
                  <button
                    onClick={() => onRemoveTour(tourId)}
                    className="text-morandi-red hover:bg-morandi-red/10 p-2 rounded shrink-0"
                    title="移除此團"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
          {onAllocationChange && totalItemsAmount > 0 && (
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-morandi-primary">已分配金額：</span>
                <span className="text-lg font-bold text-morandi-gold">
                  NT$ {Object.values(tourAllocations).reduce((sum, amt) => sum + amt, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-morandi-secondary">項目總額：</span>
                <span className="text-sm text-morandi-secondary">NT$ {totalItemsAmount.toLocaleString()}</span>
              </div>
              {Object.values(tourAllocations).reduce((sum, amt) => sum + amt, 0) !== totalItemsAmount && (
                <div className="flex justify-between items-center text-morandi-red">
                  <span className="text-sm font-medium">差額：</span>
                  <span className="text-sm font-bold">
                    NT${' '}
                    {(
                      totalItemsAmount - Object.values(tourAllocations).reduce((sum, amt) => sum + amt, 0)
                    ).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
