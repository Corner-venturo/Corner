'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect, useTransition } from 'react'
import {
  Plane,
  Search,
  Calendar,
  Loader2,
  AlertCircle,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { searchFlightAction } from '../actions/flight-actions'

interface FlightData {
  flightNumber: string
  airline: string
  departure: {
    airport: string
    iata: string
    terminal?: string
    gate?: string
    time: string
  }
  arrival: {
    airport: string
    iata: string
    terminal?: string
    time: string
  }
  status: string
  aircraft?: string
  date: string
}

const STORAGE_KEYS = {
  LAST_QUERY: 'flight-widget-last-query',
}

// 全形轉半形函數
const toHalfWidth = (str: string): string => {
  return str
    .replace(/[\uff01-\uff5e]/g, ch => {
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    })
    .replace(/\u3000/g, ' ') // 全形空格轉半形空格
}

export function FlightWidget() {
  const [flightNumber, setFlightNumber] = useState('')
  const [queryDate, setQueryDate] = useState(new Date().toISOString().split('T')[0])
  const [error, setError] = useState<string | null>(null)
  const [flightData, setFlightData] = useState<FlightData | null>(null)
  const [isPending, startTransition] = useTransition()

  // 載入上次查詢
  useEffect(() => {
    const lastQuery = localStorage.getItem(STORAGE_KEYS.LAST_QUERY)
    if (lastQuery) {
      const query = JSON.parse(lastQuery)
      setFlightNumber(query.flightNumber || '')
      setQueryDate(query.date || new Date().toISOString().split('T')[0])
    }
  }, [])

  // 查詢航班
  const handleSearchFlight = () => {
    if (!flightNumber.trim()) {
      setError('請輸入航班號碼')
      return
    }

    startTransition(async () => {
      setError(null)
      setFlightData(null)
      const result = await searchFlightAction(flightNumber, queryDate)
      if (result.error) {
        setError(result.error)
      } else {
        setFlightData(result.data)
        // Save successful query to local storage
        localStorage.setItem(
          STORAGE_KEYS.LAST_QUERY,
          JSON.stringify({
            flightNumber,
            date: queryDate,
          })
        )
      }
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchFlight()
    }
  }

  return (
    <div className="h-full">
      <div
        className={cn(
          'h-full rounded-2xl border border-white/70 shadow-xl backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:border-white/80',
          'bg-gradient-to-br from-sky-50 via-white to-indigo-50'
        )}
      >
        <div className="p-5 space-y-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-full p-2.5 text-white shadow-lg shadow-black/10',
                'bg-gradient-to-br from-sky-200/60 to-indigo-100/60',
                'ring-2 ring-white/50 ring-offset-1 ring-offset-white/20'
              )}
            >
              <Plane className="w-5 h-5 drop-shadow-sm" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-morandi-primary leading-tight tracking-wide">
                航班查詢
              </p>
              <p className="text-xs text-morandi-secondary/90 mt-1.5 leading-relaxed">
                輸入航班號碼查詢即時資訊
              </p>
            </div>
          </div>

          {/* 查詢表單 */}
          <div className="rounded-xl bg-white/70 p-3.5 shadow-md border border-white/40 space-y-3">
            <div>
              <label className="text-xs font-semibold text-morandi-primary mb-2 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5" />
                航班號碼
              </label>
              <input
                type="text"
                value={flightNumber}
                onChange={e => setFlightNumber(toHalfWidth(e.target.value).toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="例如: BR191"
                className="w-full px-3 py-2.5 text-sm font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm placeholder:text-morandi-secondary/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-morandi-primary mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                日期
              </label>
              <input
                type="date"
                value={queryDate}
                onChange={e => setQueryDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm"
              />
            </div>

            <button
              onClick={handleSearchFlight}
              disabled={isPending}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md',
                'bg-gradient-to-br from-sky-200/60 to-indigo-100/60 hover:from-sky-300/60 hover:to-indigo-200/60',
                'text-morandi-primary disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  查詢中...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  查詢
                </>
              )}
            </button>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="rounded-xl bg-red-50/80 border border-red-200/50 p-3.5 backdrop-blur-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* 航班資訊顯示 */}
          {flightData && !error && (
            <div className="flex-1 rounded-xl bg-white/70 p-4 shadow-md border border-white/40 overflow-auto space-y-3">
              {/* 航班號與狀態 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-200/60 to-indigo-100/60 flex items-center justify-center">
                    <Plane className="w-4 h-4 text-morandi-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-morandi-primary">
                      {flightData.flightNumber}
                    </p>
                    <p className="text-xs text-morandi-secondary">{flightData.airline}</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                  {flightData.status === 'scheduled' ? '準時' : flightData.status}
                </span>
              </div>

              {/* 航線資訊 */}
              <div className="bg-white/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-morandi-secondary mb-1">出發</p>
                    <p className="font-bold text-base text-morandi-primary">
                      {flightData.departure.iata}
                    </p>
                    <p className="text-xs text-morandi-secondary truncate">
                      {flightData.departure.airport}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-morandi-secondary/50 flex-shrink-0" />
                  <div className="flex-1 text-right">
                    <p className="text-xs text-morandi-secondary mb-1">抵達</p>
                    <p className="font-bold text-base text-morandi-primary">
                      {flightData.arrival.iata}
                    </p>
                    <p className="text-xs text-morandi-secondary truncate">
                      {flightData.arrival.airport}
                    </p>
                  </div>
                </div>
              </div>

              {/* 時間與航廈資訊 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-morandi-secondary" />
                    <p className="text-xs text-morandi-secondary">起飛時間</p>
                  </div>
                  <p className="font-semibold text-sm text-morandi-primary">
                    {flightData.departure.time}
                  </p>
                  {flightData.departure.terminal && (
                    <p className="text-xs text-morandi-secondary mt-1">
                      航廈 {flightData.departure.terminal} · {flightData.departure.gate}
                    </p>
                  )}
                </div>
                <div className="bg-white/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-morandi-secondary" />
                    <p className="text-xs text-morandi-secondary">降落時間</p>
                  </div>
                  <p className="font-semibold text-sm text-morandi-primary">
                    {flightData.arrival.time}
                  </p>
                  {flightData.arrival.terminal && (
                    <p className="text-xs text-morandi-secondary mt-1">
                      航廈 {flightData.arrival.terminal}
                    </p>
                  )}
                </div>
              </div>

              {/* 機型 */}
              {flightData.aircraft && (
                <div className="bg-white/50 rounded-lg p-2.5">
                  <p className="text-xs text-morandi-secondary mb-1">機型</p>
                  <p className="font-semibold text-sm text-morandi-primary">
                    {flightData.aircraft}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
