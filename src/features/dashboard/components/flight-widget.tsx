'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Plane,
  Search,
  Calendar,
  Loader2,
  AlertCircle,
  Clock,
  ArrowRight,
  Building2,
  ChevronDown,
  PlaneTakeoff,
  PlaneLanding,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  searchFlightAction,
  searchAirportDeparturesAction,
  type FlightData,
  type AirportFlightItem,
} from '../actions/flight-actions'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type SearchMode = 'flight' | 'airport'
type AirportDirection = 'departure' | 'arrival'

const STORAGE_KEYS = {
  LAST_QUERY: 'flight-widget-last-query',
}

// 全形轉半形函數
const toHalfWidth = (str: string): string => {
  return str
    .replace(/[\uff01-\uff5e]/g, ch => {
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    })
    .replace(/\u3000/g, ' ')
}

// 常用機場
const COMMON_AIRPORTS = [
  { code: 'TPE', name: '桃園' },
  { code: 'TSA', name: '松山' },
  { code: 'KHH', name: '高雄' },
  { code: 'NRT', name: '成田' },
  { code: 'HND', name: '羽田' },
  { code: 'KIX', name: '關西' },
  { code: 'ICN', name: '仁川' },
  { code: 'HKG', name: '香港' },
]

export function FlightWidget() {
  // 查詢模式
  const [searchMode, setSearchMode] = useState<SearchMode>('flight')

  // 航班號查詢
  const [flightNumber, setFlightNumber] = useState('')
  const [queryDate, setQueryDate] = useState(new Date().toISOString().split('T')[0])
  const [flightData, setFlightData] = useState<FlightData | null>(null)

  // 機場查詢
  const [airportCode, setAirportCode] = useState('TPE')
  const [direction, setDirection] = useState<AirportDirection>('departure')
  const [destinationFilter, setDestinationFilter] = useState('')
  const [airportFlights, setAirportFlights] = useState<AirportFlightItem[]>([])

  // 共用狀態
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // 載入上次查詢
  useEffect(() => {
    const lastQuery = localStorage.getItem(STORAGE_KEYS.LAST_QUERY)
    if (lastQuery) {
      try {
        const query = JSON.parse(lastQuery)
        if (query.mode) setSearchMode(query.mode)
        if (query.flightNumber) setFlightNumber(query.flightNumber)
        if (query.date) setQueryDate(query.date)
        if (query.airportCode) setAirportCode(query.airportCode)
        if (query.direction) setDirection(query.direction)
      } catch {
        // ignore
      }
    }
  }, [])

  // 儲存查詢
  const saveQuery = () => {
    localStorage.setItem(
      STORAGE_KEYS.LAST_QUERY,
      JSON.stringify({
        mode: searchMode,
        flightNumber,
        date: queryDate,
        airportCode,
        direction,
      })
    )
  }

  // 查詢航班號
  const handleSearchFlight = () => {
    if (!flightNumber.trim()) {
      setError('請輸入航班號碼')
      return
    }

    startTransition(async () => {
      setError(null)
      setFlightData(null)
      setAirportFlights([])
      const result = await searchFlightAction(flightNumber, queryDate)
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setFlightData(result.data)
        saveQuery()
      }
    })
  }

  // 查詢機場航班
  const handleSearchAirport = () => {
    if (!airportCode.trim()) {
      setError('請選擇機場')
      return
    }

    startTransition(async () => {
      setError(null)
      setFlightData(null)
      setAirportFlights([])

      const result = await searchAirportDeparturesAction(
        airportCode,
        queryDate,
        destinationFilter || undefined
      )

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setAirportFlights(result.data)
        saveQuery()
      }
    })
  }

  const handleSearch = () => {
    if (searchMode === 'flight') {
      handleSearchFlight()
    } else {
      handleSearchAirport()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 狀態顏色
  const getStatusColor = (status: string) => {
    if (status.includes('延誤') || status.includes('取消')) {
      return 'bg-red-100 text-red-700'
    }
    if (status.includes('飛行中') || status.includes('登機')) {
      return 'bg-blue-100 text-blue-700'
    }
    if (status.includes('抵達') || status.includes('起飛')) {
      return 'bg-green-100 text-green-700'
    }
    return 'bg-gray-100 text-gray-700'
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
              <p className="text-xs text-morandi-secondary/90 mt-1 leading-relaxed">
                查詢航班或機場時刻表
              </p>
            </div>
          </div>

          {/* 查詢模式切換 */}
          <div className="flex rounded-xl bg-white/50 p-1 gap-1">
            <button
              onClick={() => setSearchMode('flight')}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5',
                searchMode === 'flight'
                  ? 'bg-white shadow-sm text-morandi-primary'
                  : 'text-morandi-secondary hover:bg-white/50'
              )}
            >
              <Plane className="w-3.5 h-3.5" />
              航班號
            </button>
            <button
              onClick={() => setSearchMode('airport')}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5',
                searchMode === 'airport'
                  ? 'bg-white shadow-sm text-morandi-primary'
                  : 'text-morandi-secondary hover:bg-white/50'
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              機場時刻
            </button>
          </div>

          {/* 查詢表單 */}
          <div className="rounded-xl bg-white/70 p-3.5 shadow-md border border-white/40 space-y-3">
            {searchMode === 'flight' ? (
              /* 航班號查詢表單 */
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
                  placeholder="例如: BR191, CI100"
                  className="w-full px-3 py-2.5 text-sm font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm placeholder:text-morandi-secondary/50"
                />
              </div>
            ) : (
              /* 機場查詢表單 */
              <>
                <div>
                  <label className="text-xs font-semibold text-morandi-primary mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    出發機場
                  </label>
                  <Select value={airportCode} onValueChange={setAirportCode}>
                    <SelectTrigger className="w-full px-3 py-2.5 text-sm font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm">
                      <SelectValue placeholder="選擇機場" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_AIRPORTS.map(airport => (
                        <SelectItem key={airport.code} value={airport.code}>
                          {airport.code} - {airport.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-morandi-primary mb-2 flex items-center gap-1.5">
                    <PlaneLanding className="w-3.5 h-3.5" />
                    目的地（選填）
                  </label>
                  <input
                    type="text"
                    value={destinationFilter}
                    onChange={e => setDestinationFilter(toHalfWidth(e.target.value).toUpperCase())}
                    onKeyPress={handleKeyPress}
                    placeholder="例如: NRT, Tokyo"
                    className="w-full px-3 py-2.5 text-sm font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm placeholder:text-morandi-secondary/50"
                  />
                </div>
              </>
            )}

            {/* 日期選擇 */}
            <div>
              <label className="text-xs font-semibold text-morandi-primary mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                日期
              </label>
              <DatePicker
                value={queryDate}
                onChange={(date) => setQueryDate(date)}
                placeholder="選擇日期"
                className="w-full px-3 py-2.5 text-sm font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm"
              />
            </div>

            <button
              onClick={handleSearch}
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

          {/* 航班號查詢結果 */}
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
                <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold', getStatusColor(flightData.statusText))}>
                  {flightData.statusText}
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
                  <div className="flex flex-col items-center">
                    <ArrowRight className="w-5 h-5 text-morandi-secondary/50" />
                    {flightData.duration && (
                      <p className="text-[10px] text-morandi-secondary mt-1">{flightData.duration}</p>
                    )}
                  </div>
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
                    <PlaneTakeoff className="w-3 h-3 text-morandi-secondary" />
                    <p className="text-xs text-morandi-secondary">起飛</p>
                  </div>
                  <p className="font-semibold text-sm text-morandi-primary">
                    {flightData.departure.time}
                  </p>
                  {flightData.departure.terminal && (
                    <p className="text-xs text-morandi-secondary mt-1">
                      T{flightData.departure.terminal}
                      {flightData.departure.gate && ` · ${flightData.departure.gate}`}
                    </p>
                  )}
                </div>
                <div className="bg-white/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <PlaneLanding className="w-3 h-3 text-morandi-secondary" />
                    <p className="text-xs text-morandi-secondary">降落</p>
                  </div>
                  <p className="font-semibold text-sm text-morandi-primary">
                    {flightData.arrival.time}
                  </p>
                  {flightData.arrival.terminal && (
                    <p className="text-xs text-morandi-secondary mt-1">
                      T{flightData.arrival.terminal}
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

          {/* 機場航班列表結果 */}
          {airportFlights.length > 0 && !error && (
            <div className="flex-1 rounded-xl bg-white/70 shadow-md border border-white/40 overflow-hidden flex flex-col">
              {/* 標題列 */}
              <div className="px-4 py-2.5 bg-white/50 border-b border-white/40 flex items-center justify-between">
                <p className="text-xs font-semibold text-morandi-primary">
                  {airportCode} 出發航班
                </p>
                <p className="text-xs text-morandi-secondary">
                  共 {airportFlights.length} 班
                </p>
              </div>

              {/* 航班列表 */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-white/30 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-morandi-secondary">時間</th>
                      <th className="px-3 py-2 text-left font-semibold text-morandi-secondary">航班</th>
                      <th className="px-3 py-2 text-left font-semibold text-morandi-secondary">目的地</th>
                      <th className="px-3 py-2 text-left font-semibold text-morandi-secondary">狀態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/30">
                    {airportFlights.map((flight, idx) => (
                      <tr key={`${flight.flightNumber}-${idx}`} className="hover:bg-white/30">
                        <td className="px-3 py-2 font-medium text-morandi-primary">
                          {flight.scheduledTime}
                        </td>
                        <td className="px-3 py-2">
                          <div>
                            <p className="font-medium text-morandi-primary">{flight.flightNumber}</p>
                            <p className="text-[10px] text-morandi-secondary truncate max-w-[80px]">
                              {flight.airline}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div>
                            <p className="font-medium text-morandi-primary">{flight.destinationIata}</p>
                            <p className="text-[10px] text-morandi-secondary truncate max-w-[80px]">
                              {flight.destination}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', getStatusColor(flight.status))}>
                            {flight.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
