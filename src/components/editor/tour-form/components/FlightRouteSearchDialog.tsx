'use client'

import React, { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Loader2, Plane, Clock, MapPin } from 'lucide-react'
import { searchAirportDeparturesAction, AirportFlightItem } from '@/features/dashboard/actions/flight-actions'
import { alert } from '@/lib/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface FlightRouteSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultOrigin?: string      // 預設出發機場 (如 TPE)
  defaultDestination?: string // 預設目的地 (如 DAD)
  defaultDate?: string        // 預設日期 YYYY-MM-DD
  onSelectFlight: (flight: {
    flightNumber: string
    airline: string
    departureAirport: string
    arrivalAirport: string
    departureTime: string
    arrivalTime: string
  }) => void
}

export function FlightRouteSearchDialog({
  open,
  onOpenChange,
  defaultOrigin = 'TPE',
  defaultDestination = '',
  defaultDate,
  onSelectFlight,
}: FlightRouteSearchDialogProps) {
  // 搜尋條件
  const [origin, setOrigin] = useState(defaultOrigin)
  const [destination, setDestination] = useState(defaultDestination)
  const [searchDate, setSearchDate] = useState(defaultDate || new Date().toISOString().split('T')[0])

  // 搜尋狀態
  const [loading, setLoading] = useState(false)
  const [flights, setFlights] = useState<AirportFlightItem[]>([])
  const [searched, setSearched] = useState(false)

  // 重置狀態（當 Dialog 開啟時）
  React.useEffect(() => {
    if (open) {
      setOrigin(defaultOrigin)
      setDestination(defaultDestination)
      setSearchDate(defaultDate || new Date().toISOString().split('T')[0])
      setFlights([])
      setSearched(false)
    }
  }, [open, defaultOrigin, defaultDestination, defaultDate])

  // 執行搜尋
  const handleSearch = useCallback(async () => {
    if (!origin) {
      void alert('請輸入出發機場代碼', 'warning')
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const result = await searchAirportDeparturesAction(
        origin,
        searchDate,
        destination || undefined
      )

      if (result.error) {
        void alert(result.error, 'error')
        setFlights([])
        return
      }

      setFlights(result.data || [])
    } catch {
      void alert('查詢時發生錯誤', 'error')
      setFlights([])
    } finally {
      setLoading(false)
    }
  }, [origin, destination, searchDate])

  // 選擇航班
  const handleSelectFlight = useCallback((flight: AirportFlightItem) => {
    onSelectFlight({
      flightNumber: flight.flightNumber,
      airline: flight.airline,
      departureAirport: origin.toUpperCase(),
      arrivalAirport: flight.destinationIata,
      departureTime: flight.scheduledTime,
      arrivalTime: '', // API 沒有提供抵達時間，需要另外查詢
    })
    onOpenChange(false)
  }, [origin, onSelectFlight, onOpenChange])

  // 格式化日期顯示
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-morandi-gold" />
            查詢航線航班
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* 搜尋條件 */}
          <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  出發機場
                </label>
                <Input
                  type="text"
                  value={origin}
                  onChange={e => setOrigin(e.target.value.toUpperCase())}
                  placeholder="TPE"
                  className="text-sm h-9 uppercase"
                  maxLength={3}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  目的地
                </label>
                <Input
                  type="text"
                  value={destination}
                  onChange={e => setDestination(e.target.value.toUpperCase())}
                  placeholder="DAD"
                  className="text-sm h-9 uppercase"
                  maxLength={3}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  日期
                </label>
                <Input
                  type="date"
                  value={searchDate}
                  onChange={e => setSearchDate(e.target.value)}
                  className="text-sm h-9"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleSearch}
                  disabled={loading || !origin}
                  className="w-full h-9 bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1"
                >
                  {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Search size={14} />
                  )}
                  查詢
                </Button>
              </div>
            </div>

            {destination && (
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin size={12} />
                查詢 {origin} → {destination} 的直飛航班
              </div>
            )}
          </div>

          {/* 搜尋日期顯示 */}
          {searched && (
            <div className="text-sm text-slate-600 flex items-center gap-2">
              <Clock size={14} />
              {formatDateDisplay(searchDate)} 的航班
              {flights.length > 0 && (
                <span className="text-morandi-gold font-medium">
                  （共 {flights.length} 班）
                </span>
              )}
            </div>
          )}

          {/* 航班列表 */}
          <div className="flex-1 overflow-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-morandi-gold" />
                <span className="ml-2 text-slate-500">查詢中...</span>
              </div>
            ) : searched && flights.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Plane className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>找不到符合條件的航班</p>
                <p className="text-xs mt-1">請確認機場代碼是否正確</p>
              </div>
            ) : flights.length > 0 ? (
              <div className="space-y-2">
                {flights.map((flight, index) => (
                  <button
                    key={`${flight.flightNumber}-${index}`}
                    type="button"
                    onClick={() => handleSelectFlight(flight)}
                    className={cn(
                      'w-full p-3 rounded-lg border text-left transition-all',
                      'hover:border-morandi-gold hover:bg-morandi-gold/5',
                      'focus:outline-none focus:ring-2 focus:ring-morandi-gold/30'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* 航班號碼 */}
                        <div className="bg-slate-100 px-2 py-1 rounded">
                          <span className="text-sm font-bold text-slate-700">
                            {flight.flightNumber}
                          </span>
                        </div>
                        {/* 航空公司 */}
                        <span className="text-sm text-slate-600">
                          {flight.airline}
                        </span>
                      </div>
                      {/* 時間 */}
                      <div className="text-right">
                        <span className="text-lg font-bold text-morandi-primary">
                          {flight.scheduledTime}
                        </span>
                        {flight.estimatedTime && flight.estimatedTime !== flight.scheduledTime && (
                          <span className="text-xs text-orange-500 ml-2">
                            → {flight.estimatedTime}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <MapPin size={10} />
                        {origin} → {flight.destinationIata}
                        <span className="ml-1 text-slate-400">
                          ({flight.destination})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {flight.terminal && (
                          <span>航廈 {flight.terminal}</span>
                        )}
                        {flight.gate && (
                          <span>登機門 {flight.gate}</span>
                        )}
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[10px]',
                          flight.status === '預計' || flight.status === '準時'
                            ? 'bg-green-100 text-green-700'
                            : flight.status === '延誤'
                            ? 'bg-orange-100 text-orange-700'
                            : flight.status === '已取消'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                        )}>
                          {flight.status}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
