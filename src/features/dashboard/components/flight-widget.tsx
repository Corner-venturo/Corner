'use client'

import { useState, useEffect } from 'react'
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

interface RouteData {
  airline: string
  flightNumber: string
  departure: string
  arrival: string
}

// API Key 輪替池（每個員工可以註冊自己的免費帳號）
const API_KEY_POOL = [
  { user: 'default', key: process.env.NEXT_PUBLIC_AVIATIONSTACK_KEY || '', quota: 100, used: 0 },
]

const STORAGE_KEYS = {
  CACHE: 'flight-widget-cache',
  API_KEYS: 'flight-widget-api-keys',
  LAST_QUERY: 'flight-widget-last-query',
}

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

interface CacheData {
  data: FlightData | RouteData[]
  timestamp: number
  query: string
}

function getCachedData(query: string): FlightData | RouteData[] | null {
  try {
    const cache = localStorage.getItem(STORAGE_KEYS.CACHE)
    if (!cache) return null

    const cacheData: CacheData[] = JSON.parse(cache)
    const entry = cacheData.find(c => c.query === query)

    if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
      return entry.data
    }

    const validCache = cacheData.filter(c => Date.now() - c.timestamp < CACHE_DURATION)
    localStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(validCache))

    return null
  } catch {
    return null
  }
}

function setCachedData(query: string, data: FlightData | RouteData[]) {
  try {
    const cache = localStorage.getItem(STORAGE_KEYS.CACHE)
    const cacheData: CacheData[] = cache ? JSON.parse(cache) : []
    const newCache = cacheData.filter(c => c.query !== query)
    newCache.push({ query, data, timestamp: Date.now() })

    if (newCache.length > 50) {
      newCache.sort((a, b) => b.timestamp - a.timestamp)
      newCache.splice(50)
    }

    localStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(newCache))
  } catch (error) {
    console.error('快取儲存失敗:', error)
  }
}

function getNextApiKey(): string | null {
  try {
    const savedKeys = localStorage.getItem(STORAGE_KEYS.API_KEYS)
    const keys = savedKeys ? JSON.parse(savedKeys) : API_KEY_POOL

    const availableKey = keys.reduce(
      (prev: (typeof API_KEY_POOL)[0], curr: (typeof API_KEY_POOL)[0]) =>
        curr.used < prev.used ? curr : prev
    )

    if (availableKey.used >= availableKey.quota) {
      return null
    }

    return availableKey.key
  } catch {
    return API_KEY_POOL[0].key
  }
}

function incrementApiKeyUsage(apiKey: string) {
  try {
    const savedKeys = localStorage.getItem(STORAGE_KEYS.API_KEYS)
    const keys = savedKeys ? JSON.parse(savedKeys) : API_KEY_POOL

    const updatedKeys = keys.map((k: (typeof API_KEY_POOL)[0]) =>
      k.key === apiKey ? { ...k, used: k.used + 1 } : k
    )

    localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(updatedKeys))
  } catch (error) {
    console.error('更新 API 使用次數失敗:', error)
  }
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
  const [queryType, setQueryType] = useState<'flight' | 'route'>('flight')
  const [flightNumber, setFlightNumber] = useState('')
  const [queryDate, setQueryDate] = useState(new Date().toISOString().split('T')[0])
  const [departure, setDeparture] = useState('')
  const [arrival, setArrival] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flightData, setFlightData] = useState<FlightData | null>(null)
  const [routeData, setRouteData] = useState<RouteData[]>([])

  // 載入上次查詢
  useEffect(() => {
    const lastQuery = localStorage.getItem(STORAGE_KEYS.LAST_QUERY)
    if (lastQuery) {
      const query = JSON.parse(lastQuery)
      setQueryType(query.type)
      if (query.type === 'flight') {
        setFlightNumber(query.flightNumber || '')
        setQueryDate(query.date || new Date().toISOString().split('T')[0])
      } else {
        setDeparture(query.departure || '')
        setArrival(query.arrival || '')
      }
    }
  }, [])

  // 查詢航班
  const searchFlight = async () => {
    if (!flightNumber.trim()) {
      setError('請輸入航班號碼')
      return
    }

    const query = `flight-${flightNumber}-${queryDate}`
    const cached = getCachedData(query)
    if (cached && !Array.isArray(cached)) {
      setFlightData(cached)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const apiKey = getNextApiKey()
      if (!apiKey) {
        throw new Error('API 額度已用盡，請稍後再試或聯絡管理員新增 API Key')
      }

      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockData: FlightData = {
        flightNumber: flightNumber.toUpperCase(),
        airline: 'EVA Air',
        departure: {
          airport: 'Taiwan Taoyuan International',
          iata: 'TPE',
          terminal: '2',
          gate: 'D5',
          time: '23:55',
        },
        arrival: {
          airport: 'Los Angeles International',
          iata: 'LAX',
          terminal: 'B',
          time: '21:30',
        },
        status: 'scheduled',
        aircraft: 'Boeing 777-300ER',
        date: queryDate,
      }

      setFlightData(mockData)
      setCachedData(query, mockData)
      incrementApiKeyUsage(apiKey)

      localStorage.setItem(
        STORAGE_KEYS.LAST_QUERY,
        JSON.stringify({
          type: 'flight',
          flightNumber,
          date: queryDate,
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : '查詢失敗，請稍後再試')
      setFlightData(null)
    } finally {
      setLoading(false)
    }
  }

  // 查詢航線
  const searchRoute = async () => {
    if (!departure.trim() || !arrival.trim()) {
      setError('請輸入出發地和目的地')
      return
    }

    const query = `route-${departure}-${arrival}`
    const cached = getCachedData(query)
    if (cached && Array.isArray(cached)) {
      setRouteData(cached)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const apiKey = getNextApiKey()
      if (!apiKey) {
        throw new Error('API 額度已用盡，請稍後再試或聯絡管理員新增 API Key')
      }

      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockData: RouteData[] = [
        {
          airline: 'EVA Air',
          flightNumber: 'BR191',
          departure: departure.toUpperCase(),
          arrival: arrival.toUpperCase(),
        },
        {
          airline: 'China Airlines',
          flightNumber: 'CI007',
          departure: departure.toUpperCase(),
          arrival: arrival.toUpperCase(),
        },
        {
          airline: 'Starlux Airlines',
          flightNumber: 'JX001',
          departure: departure.toUpperCase(),
          arrival: arrival.toUpperCase(),
        },
      ]

      setRouteData(mockData)
      setCachedData(query, mockData)
      incrementApiKeyUsage(apiKey)

      localStorage.setItem(
        STORAGE_KEYS.LAST_QUERY,
        JSON.stringify({
          type: 'route',
          departure,
          arrival,
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : '查詢失敗，請稍後再試')
      setRouteData([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (queryType === 'flight') {
        searchFlight()
      } else {
        searchRoute()
      }
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
                查詢航班資訊或搜尋航線
              </p>
            </div>
          </div>

          {/* Tab 切換 */}
          <div className="rounded-xl bg-white/70 p-1.5 shadow-md border border-white/40 flex gap-1.5">
            <button
              onClick={() => setQueryType('flight')}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200',
                queryType === 'flight'
                  ? 'bg-gradient-to-br from-sky-200/60 to-indigo-100/60 text-morandi-primary shadow-sm'
                  : 'text-morandi-secondary/70 hover:text-morandi-primary hover:bg-white/50'
              )}
            >
              航班號
            </button>
            <button
              onClick={() => setQueryType('route')}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200',
                queryType === 'route'
                  ? 'bg-gradient-to-br from-sky-200/60 to-indigo-100/60 text-morandi-primary shadow-sm'
                  : 'text-morandi-secondary/70 hover:text-morandi-primary hover:bg-white/50'
              )}
            >
              航線
            </button>
          </div>

          {/* 查詢表單 */}
          <div className="rounded-xl bg-white/70 p-3.5 shadow-md border border-white/40 space-y-3">
            {queryType === 'flight' ? (
              <>
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
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-morandi-primary mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    出發地
                  </label>
                  <input
                    type="text"
                    value={departure}
                    onChange={e => setDeparture(toHalfWidth(e.target.value).toUpperCase())}
                    onKeyPress={handleKeyPress}
                    placeholder="TPE"
                    maxLength={3}
                    className="w-full px-3 py-2.5 text-sm font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm placeholder:text-morandi-secondary/50 text-center"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-morandi-primary mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    目的地
                  </label>
                  <input
                    type="text"
                    value={arrival}
                    onChange={e => setArrival(toHalfWidth(e.target.value).toUpperCase())}
                    onKeyPress={handleKeyPress}
                    placeholder="LAX"
                    maxLength={3}
                    className="w-full px-3 py-2.5 text-sm font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm placeholder:text-morandi-secondary/50 text-center"
                  />
                </div>
              </div>
            )}

            <button
              onClick={queryType === 'flight' ? searchFlight : searchRoute}
              disabled={loading}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md',
                'bg-gradient-to-br from-sky-200/60 to-indigo-100/60 hover:from-sky-300/60 hover:to-indigo-200/60',
                'text-morandi-primary disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {loading ? (
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
          {queryType === 'flight' && flightData && !error && (
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

          {/* 航線資訊顯示 */}
          {queryType === 'route' && routeData.length > 0 && !error && (
            <div className="flex-1 overflow-auto space-y-2">
              {routeData.map((route, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-white/70 p-3 shadow-md border border-white/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-200/60 to-indigo-100/60 flex items-center justify-center flex-shrink-0">
                        <Plane className="w-4 h-4 text-morandi-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-morandi-primary">
                          {route.flightNumber}
                        </p>
                        <p className="text-xs text-morandi-secondary">{route.airline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-morandi-primary">{route.departure}</span>
                      <ArrowRight className="w-4 h-4 text-morandi-secondary/50" />
                      <span className="font-semibold text-morandi-primary">{route.arrival}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
