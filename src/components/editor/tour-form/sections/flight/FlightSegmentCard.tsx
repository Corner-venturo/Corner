'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2, List } from 'lucide-react'

interface FlightSegmentCardProps {
  title: string
  flightData: {
    airline?: string
    flightNumber?: string
    departureDate?: string
    duration?: string
    departureAirport?: string
    departureTime?: string
    arrivalAirport?: string
    arrivalTime?: string
    hasMeal?: boolean
  }
  onFieldChange: (field: string, value: string | boolean) => void
  onSearch: () => void
  onRouteSearch: () => void
  isLoading: boolean
}

export function FlightSegmentCard({
  title,
  flightData,
  onFieldChange,
  onSearch,
  onRouteSearch,
  isLoading,
}: FlightSegmentCardProps) {
  return (
    <div className="bg-[#F9F8F6] p-4 rounded-lg space-y-3 border border-[#E8E4E0]">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-[#333333]">{title}</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={flightData.hasMeal || false}
              onChange={e => onFieldChange('hasMeal', e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border text-morandi-gold focus:ring-morandi-gold"
            />
            <span className="text-xs text-morandi-secondary">餐食</span>
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onSearch}
            disabled={isLoading || !flightData.flightNumber}
            className="h-7 text-xs gap-1"
          >
            {isLoading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Search size={12} />
            )}
            查詢航班
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRouteSearch}
            className="h-7 text-xs gap-1 border-morandi-gold/50 text-morandi-gold hover:bg-morandi-gold/10"
          >
            <List size={12} />
            查詢航線
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
            航空公司
          </label>
          <Input
            type="text"
            value={flightData.airline || ''}
            onChange={e => onFieldChange('airline', e.target.value)}
            className="text-xs h-8"
            placeholder="長榮航空"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
            航班號碼
          </label>
          <Input
            type="text"
            value={flightData.flightNumber || ''}
            onChange={e => onFieldChange('flightNumber', e.target.value)}
            className="text-xs h-8"
            placeholder="BR158"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
            日期 (月/日)
          </label>
          <Input
            type="text"
            value={flightData.departureDate || ''}
            onChange={e => onFieldChange('departureDate', e.target.value)}
            className="text-xs h-8"
            placeholder="02/19"
            enableMathCalculation={false}
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
            飛行時間
          </label>
          <Input
            type="text"
            value={flightData.duration || ''}
            onChange={e => onFieldChange('duration', e.target.value)}
            className="text-xs h-8"
            placeholder="2h 30m"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
            出發機場
          </label>
          <Input
            type="text"
            value={flightData.departureAirport || ''}
            onChange={e => onFieldChange('departureAirport', e.target.value)}
            className="text-xs h-8"
            placeholder="TPE"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
            出發時間
          </label>
          <Input
            type="text"
            value={flightData.departureTime || ''}
            onChange={e => onFieldChange('departureTime', e.target.value)}
            className="text-xs h-8"
            placeholder="06:50"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
            抵達機場
          </label>
          <Input
            type="text"
            value={flightData.arrivalAirport || ''}
            onChange={e => onFieldChange('arrivalAirport', e.target.value)}
            className="text-xs h-8"
            placeholder="KMQ"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
            抵達時間
          </label>
          <Input
            type="text"
            value={flightData.arrivalTime || ''}
            onChange={e => onFieldChange('arrivalTime', e.target.value)}
            className="text-xs h-8"
            placeholder="09:55"
          />
        </div>
      </div>
    </div>
  )
}
