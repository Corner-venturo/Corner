import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import { TourFormData } from '../types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CalendarPlus, Search, Loader2 } from 'lucide-react'
import { searchFlightAction } from '@/features/dashboard/actions/flight-actions'

interface FlightInfoSectionProps {
  data: TourFormData
  updateFlightField: (
    flightType: 'outboundFlight' | 'returnFlight',
    field: string,
    value: string
  ) => void
  updateFlightFields?: (
    flightType: 'outboundFlight' | 'returnFlight',
    fields: Record<string, string>
  ) => void
  onGenerateDailyItinerary?: (days: number, departureDate: string) => void
}

// 日期格式轉換輔助函式
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null

  // 支援 YYYY/MM/DD 或 YYYY-MM-DD 格式
  let parts: string[]
  if (dateStr.includes('/')) {
    parts = dateStr.split('/')
  } else if (dateStr.includes('-')) {
    parts = dateStr.split('-')
  } else {
    return null
  }

  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number)
    return new Date(year, month - 1, day)
  }
  return null
}

function formatDateShort(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}/${day}`
}

function formatDateFull(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

export function FlightInfoSection({ data, updateFlightField, updateFlightFields, onGenerateDailyItinerary }: FlightInfoSectionProps) {
  // 航班查詢狀態
  const [loadingOutbound, setLoadingOutbound] = useState(false)
  const [loadingReturn, setLoadingReturn] = useState(false)

  // Track previous values to detect changes
  const prevOutboundRef = useRef({
    airline: data.outboundFlight?.airline || '',
    arrivalAirport: data.outboundFlight?.arrivalAirport || '',
  })

  // 移除自動帶入航班日期的功能 - 讓業務手動輸入 8 碼日期
  // 舊邏輯：當封面設定出發日期時，自動帶入去程航班日期
  // 新邏輯：航班日期需要業務手動輸入（用戶要求）

  // 自動計算行程天數（根據出發日期和回程日期）
  const tripDays = useMemo(() => {
    if (!data.departureDate || !data.returnFlight?.departureDate) return 0

    const departureDate = parseDate(data.departureDate)
    if (!departureDate) return 0

    // 回程日期格式是 MM/DD，需要補上年份
    const returnDateStr = data.returnFlight.departureDate
    const [month, day] = returnDateStr.split('/').map(Number)
    if (!month || !day) return 0

    // 使用出發年份，如果回程月份小於出發月份則加一年
    let returnYear = departureDate.getFullYear()
    if (month < departureDate.getMonth() + 1) {
      returnYear += 1
    }

    const returnDate = new Date(returnYear, month - 1, day)

    // 計算天數差 + 1（包含出發和回程當天）
    const diffTime = returnDate.getTime() - departureDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    return diffDays > 0 ? diffDays : 0
  }, [data.departureDate, data.returnFlight?.departureDate])

  // Auto-fill return flight when outbound changes
  useEffect(() => {
    const currentAirline = data.outboundFlight?.airline || ''
    const currentArrival = data.outboundFlight?.arrivalAirport || ''
    const prevAirline = prevOutboundRef.current.airline
    const prevArrival = prevOutboundRef.current.arrivalAirport

    // If outbound airline changed and return airline is empty or was same as previous
    if (currentAirline !== prevAirline) {
      const returnAirline = data.returnFlight?.airline || ''
      if (!returnAirline || returnAirline === prevAirline) {
        updateFlightField('returnFlight', 'airline', currentAirline)
      }
    }

    // If outbound arrival airport changed, set it as return departure airport
    if (currentArrival !== prevArrival) {
      const returnDeparture = data.returnFlight?.departureAirport || ''
      if (!returnDeparture || returnDeparture === prevArrival) {
        updateFlightField('returnFlight', 'departureAirport', currentArrival)
      }
    }

    // Update ref
    prevOutboundRef.current = {
      airline: currentAirline,
      arrivalAirport: currentArrival,
    }
  }, [data.outboundFlight?.airline, data.outboundFlight?.arrivalAirport, data.returnFlight?.airline, data.returnFlight?.departureAirport, updateFlightField])

  // 生成每日行程
  const handleGenerateDailyItinerary = useCallback(() => {
    if (tripDays <= 0 || !data.departureDate) return
    if (onGenerateDailyItinerary) {
      onGenerateDailyItinerary(tripDays, data.departureDate)
    }
  }, [tripDays, data.departureDate, onGenerateDailyItinerary])

  // 查詢去程航班
  const handleSearchOutbound = useCallback(async () => {
    const flightNumber = data.outboundFlight?.flightNumber
    const dateStr = data.outboundFlight?.departureDate // 格式 MM/DD

    if (!flightNumber) {
      alert('請先輸入航班號碼')
      return
    }

    // 組合完整日期 YYYY-MM-DD
    let fullDate = ''
    if (dateStr && data.departureDate) {
      const depDate = parseDate(data.departureDate)
      if (depDate) {
        const [month, day] = dateStr.split('/').map(Number)
        const year = depDate.getFullYear()
        fullDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      }
    }

    if (!fullDate) {
      // 使用今天日期
      fullDate = new Date().toISOString().split('T')[0]
    }

    setLoadingOutbound(true)
    try {
      const result = await searchFlightAction(flightNumber, fullDate)
      if (result.error) {
        alert(result.error)
        return
      }
      if (result.data) {
        // 使用批次更新（一次更新所有欄位）
        const fields: Record<string, string> = {
          airline: result.data.airline,
          departureAirport: result.data.departure.iata,
          arrivalAirport: result.data.arrival.iata,
          departureTime: result.data.departure.time,
          arrivalTime: result.data.arrival.time,
        }
        if (result.data.duration) {
          fields.duration = result.data.duration
        }

        if (updateFlightFields) {
          updateFlightFields('outboundFlight', fields)
        } else {
          // fallback: 逐一更新
          Object.entries(fields).forEach(([key, value]) => {
            updateFlightField('outboundFlight', key, value)
          })
        }
      }
    } catch {
      alert('查詢航班時發生錯誤')
    } finally {
      setLoadingOutbound(false)
    }
  }, [data.outboundFlight?.flightNumber, data.outboundFlight?.departureDate, data.departureDate, updateFlightField, updateFlightFields])

  // 查詢回程航班
  const handleSearchReturn = useCallback(async () => {
    const flightNumber = data.returnFlight?.flightNumber
    const dateStr = data.returnFlight?.departureDate // 格式 MM/DD

    if (!flightNumber) {
      alert('請先輸入航班號碼')
      return
    }

    // 組合完整日期 YYYY-MM-DD
    let fullDate = ''
    if (dateStr && data.departureDate) {
      const depDate = parseDate(data.departureDate)
      if (depDate) {
        const [month, day] = dateStr.split('/').map(Number)
        let year = depDate.getFullYear()
        // 如果回程月份小於出發月份，表示跨年
        if (month < depDate.getMonth() + 1) {
          year += 1
        }
        fullDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      }
    }

    if (!fullDate) {
      fullDate = new Date().toISOString().split('T')[0]
    }

    setLoadingReturn(true)
    try {
      const result = await searchFlightAction(flightNumber, fullDate)
      if (result.error) {
        alert(result.error)
        return
      }
      if (result.data) {
        // 使用批次更新（一次更新所有欄位）
        const fields: Record<string, string> = {
          airline: result.data.airline,
          departureAirport: result.data.departure.iata,
          arrivalAirport: result.data.arrival.iata,
          departureTime: result.data.departure.time,
          arrivalTime: result.data.arrival.time,
        }
        if (result.data.duration) {
          fields.duration = result.data.duration
        }

        if (updateFlightFields) {
          updateFlightFields('returnFlight', fields)
        } else {
          // fallback: 逐一更新
          Object.entries(fields).forEach(([key, value]) => {
            updateFlightField('returnFlight', key, value)
          })
        }
      }
    } catch {
      alert('查詢航班時發生錯誤')
    } finally {
      setLoadingReturn(false)
    }
  }, [data.returnFlight?.flightNumber, data.returnFlight?.departureDate, data.departureDate, updateFlightField, updateFlightFields])

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-morandi-primary border-b-2 border-[#C9A961] pb-1.5">
        航班資訊
      </h2>

      {/* 行程天數自動計算 */}
      {tripDays > 0 && data.departureDate && (
        <div className="bg-gradient-to-r from-morandi-gold/10 to-morandi-gold/5 p-3 rounded-lg border border-morandi-gold/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-morandi-primary">行程天數</span>
              <span className="text-lg font-bold text-morandi-gold">{tripDays}</span>
              <span className="text-sm text-morandi-secondary">天</span>
            </div>
            <div className="h-6 w-px bg-morandi-container"></div>
            <div className="text-xs text-morandi-secondary">
              {(() => {
                const dep = parseDate(data.departureDate)
                if (!dep) return null
                const returnDateStr = data.returnFlight?.departureDate || ''
                const [month, day] = returnDateStr.split('/').map(Number)
                if (!month || !day) return null
                let returnYear = dep.getFullYear()
                if (month < dep.getMonth() + 1) returnYear += 1
                const ret = new Date(returnYear, month - 1, day)
                return `${formatDateFull(dep)} → ${formatDateFull(ret)}`
              })()}
            </div>
            <div className="h-6 w-px bg-morandi-container"></div>
            <Button
              type="button"
              size="sm"
              onClick={handleGenerateDailyItinerary}
              disabled={!onGenerateDailyItinerary}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white text-xs gap-1"
            >
              <CalendarPlus size={14} />
              自動產生 {tripDays} 天行程
            </Button>
          </div>
        </div>
      )}

      {/* 去程航班 */}
      <div className="bg-[#F9F5ED] p-3 rounded-lg space-y-2 border border-[#E0D8CC]">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#3D2914]">去程航班</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleSearchOutbound}
            disabled={loadingOutbound || !data.outboundFlight?.flightNumber}
            className="h-7 text-xs gap-1"
          >
            {loadingOutbound ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Search size={12} />
            )}
            查詢航班
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {/* 第一行：航空公司、航班號碼、日期、查詢按鈕區 */}
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              航空公司
            </label>
            <Input
              type="text"
              value={data.outboundFlight?.airline || ''}
              onChange={e => updateFlightField('outboundFlight', 'airline', e.target.value)}
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
              value={data.outboundFlight?.flightNumber || ''}
              onChange={e => updateFlightField('outboundFlight', 'flightNumber', e.target.value)}
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
              value={data.outboundFlight?.departureDate || ''}
              onChange={e => {
                let value = e.target.value
                // 如果輸入完整格式 YYYY/MM/DD，自動截取 MM/DD
                const parts = value.split('/')
                if (parts.length === 3 && parts[0].length === 4) {
                  value = `${parts[1]}/${parts[2]}`
                }
                updateFlightField('outboundFlight', 'departureDate', value)
              }}
              className="text-xs h-8"
              placeholder="01/21"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              飛行時間
            </label>
            <Input
              type="text"
              value={data.outboundFlight?.duration || ''}
              onChange={e => updateFlightField('outboundFlight', 'duration', e.target.value)}
              className="text-xs h-8"
              placeholder="2h 30m"
            />
          </div>
          {/* 第二行：機場和時間資訊 */}
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              出發機場
            </label>
            <Input
              type="text"
              value={data.outboundFlight?.departureAirport || ''}
              onChange={e =>
                updateFlightField('outboundFlight', 'departureAirport', e.target.value)
              }
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
              value={data.outboundFlight?.departureTime || ''}
              onChange={e => updateFlightField('outboundFlight', 'departureTime', e.target.value)}
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
              value={data.outboundFlight?.arrivalAirport || ''}
              onChange={e => updateFlightField('outboundFlight', 'arrivalAirport', e.target.value)}
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
              value={data.outboundFlight?.arrivalTime || ''}
              onChange={e => updateFlightField('outboundFlight', 'arrivalTime', e.target.value)}
              className="text-xs h-8"
              placeholder="09:55"
            />
          </div>
        </div>
      </div>

      {/* 回程航班 */}
      <div className="bg-[#F5F0EB] p-3 rounded-lg space-y-2 border border-[#E0D8CC]">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#3D2914]">回程航班</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleSearchReturn}
            disabled={loadingReturn || !data.returnFlight?.flightNumber}
            className="h-7 text-xs gap-1"
          >
            {loadingReturn ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Search size={12} />
            )}
            查詢航班
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {/* 第一行：航空公司、航班號碼、日期、飛行時間 */}
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              航空公司
            </label>
            <Input
              type="text"
              value={data.returnFlight?.airline || ''}
              onChange={e => updateFlightField('returnFlight', 'airline', e.target.value)}
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
              value={data.returnFlight?.flightNumber || ''}
              onChange={e => updateFlightField('returnFlight', 'flightNumber', e.target.value)}
              className="text-xs h-8"
              placeholder="BR157"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              日期 (月/日)
            </label>
            <Input
              type="text"
              value={data.returnFlight?.departureDate || ''}
              onChange={e => {
                let value = e.target.value
                // 如果輸入完整格式 YYYY/MM/DD，自動截取 MM/DD
                const parts = value.split('/')
                if (parts.length === 3 && parts[0].length === 4) {
                  value = `${parts[1]}/${parts[2]}`
                }
                updateFlightField('returnFlight', 'departureDate', value)
              }}
              className="text-xs h-8"
              placeholder="01/25"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              飛行時間
            </label>
            <Input
              type="text"
              value={data.returnFlight?.duration || ''}
              onChange={e => updateFlightField('returnFlight', 'duration', e.target.value)}
              className="text-xs h-8"
              placeholder="2h 30m"
            />
          </div>
          {/* 第二行：機場和時間資訊 */}
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              出發機場
            </label>
            <Input
              type="text"
              value={data.returnFlight?.departureAirport || ''}
              onChange={e => updateFlightField('returnFlight', 'departureAirport', e.target.value)}
              className="text-xs h-8"
              placeholder="KMQ"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              出發時間
            </label>
            <Input
              type="text"
              value={data.returnFlight?.departureTime || ''}
              onChange={e => updateFlightField('returnFlight', 'departureTime', e.target.value)}
              className="text-xs h-8"
              placeholder="11:00"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              抵達機場
            </label>
            <Input
              type="text"
              value={data.returnFlight?.arrivalAirport || ''}
              onChange={e => updateFlightField('returnFlight', 'arrivalAirport', e.target.value)}
              className="text-xs h-8"
              placeholder="TPE"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              抵達時間
            </label>
            <Input
              type="text"
              value={data.returnFlight?.arrivalTime || ''}
              onChange={e => updateFlightField('returnFlight', 'arrivalTime', e.target.value)}
              className="text-xs h-8"
              placeholder="12:30"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
