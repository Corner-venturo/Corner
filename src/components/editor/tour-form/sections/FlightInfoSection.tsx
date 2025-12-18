import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import { TourFormData, FlightStyleType } from '../types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { CalendarPlus, Search, Loader2, Plane, Undo2, Settings2, Check, List } from 'lucide-react'
import { searchFlightAction } from '@/features/dashboard/actions/flight-actions'
import { alert } from '@/lib/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTemplates, getTemplateColor } from '@/features/itinerary/hooks/useTemplates'
import { FlightRouteSearchDialog } from '../components/FlightRouteSearchDialog'
import { PreviewPanel } from '../components/PreviewPanel'
import { TourFlightSection } from '@/features/tours/components/sections/TourFlightSection'

interface FlightInfoSectionProps {
  data: TourFormData
  updateFlightField: (
    flightType: 'outboundFlight' | 'returnFlight',
    field: string,
    value: string | boolean
  ) => void
  updateFlightFields?: (
    flightType: 'outboundFlight' | 'returnFlight',
    fields: Record<string, string>
  ) => void
  onGenerateDailyItinerary?: (days: number, departureDate: string) => void
  updateField?: (field: keyof TourFormData, value: FlightStyleType) => void
  // 復原功能
  canUndoItinerary?: boolean
  onUndoItinerary?: () => void
  // 精簡模式（只顯示卡片，不顯示額外內容）
  compact?: boolean
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

export function FlightInfoSection({ data, updateFlightField, updateFlightFields, onGenerateDailyItinerary, updateField, canUndoItinerary, onUndoItinerary, compact = false }: FlightInfoSectionProps) {
  // 從資料庫載入模板
  const { flightTemplates, loading: templatesLoading } = useTemplates()

  // 從資料庫載入的航班風格選項
  const flightStyleOptions = useMemo(() => {
    return flightTemplates.map(template => ({
      value: template.id as FlightStyleType,
      label: template.name,
      description: template.description || '',
      color: getTemplateColor(template.id),
      previewImage: template.preview_image_url,
    }))
  }, [flightTemplates])

  // Modal 顯示狀態
  const [showFlightSettings, setShowFlightSettings] = useState(false)

  // 航班查詢狀態
  const [loadingOutbound, setLoadingOutbound] = useState(false)
  const [loadingReturn, setLoadingReturn] = useState(false)

  // 航線查詢 Dialog 狀態
  const [showRouteSearchOutbound, setShowRouteSearchOutbound] = useState(false)
  const [showRouteSearchReturn, setShowRouteSearchReturn] = useState(false)

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
      void alert('請先輸入航班號碼', 'warning')
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
        void alert(result.error, 'error')
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
      void alert('查詢航班時發生錯誤', 'error')
    } finally {
      setLoadingOutbound(false)
    }
  }, [data.outboundFlight?.flightNumber, data.outboundFlight?.departureDate, data.departureDate, updateFlightField, updateFlightFields])

  // 查詢回程航班
  const handleSearchReturn = useCallback(async () => {
    const flightNumber = data.returnFlight?.flightNumber
    const dateStr = data.returnFlight?.departureDate // 格式 MM/DD

    if (!flightNumber) {
      void alert('請先輸入航班號碼', 'warning')
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
        void alert(result.error, 'error')
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
      void alert('查詢航班時發生錯誤', 'error')
    } finally {
      setLoadingReturn(false)
    }
  }, [data.returnFlight?.flightNumber, data.returnFlight?.departureDate, data.departureDate, updateFlightField, updateFlightFields])

  // 取得目前選擇的風格資訊
  const currentStyle = flightStyleOptions.find(s => s.value === (data.flightStyle || 'original')) || {
    value: 'original' as FlightStyleType,
    label: '經典金色',
    description: '莫蘭迪金色風格',
    color: getTemplateColor('original'),
    previewImage: null,
  }

  // 產生航班摘要文字
  const getFlightSummary = () => {
    const outbound = data.outboundFlight
    const returnFlight = data.returnFlight

    if (!outbound?.flightNumber && !returnFlight?.flightNumber) {
      return '尚未設定航班'
    }

    const parts: string[] = []
    if (outbound?.flightNumber) {
      parts.push(`去程: ${outbound.flightNumber}`)
    }
    if (returnFlight?.flightNumber) {
      parts.push(`回程: ${returnFlight.flightNumber}`)
    }
    return parts.join(' / ')
  }

  return (
    <div className="space-y-3">
      {/* 摘要按鈕卡片 - 點擊開啟設定 Modal */}
      <button
        type="button"
        onClick={() => setShowFlightSettings(true)}
        className="w-full group"
      >
        <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-[#B8A99A]/30 bg-[#B8A99A]/5 hover:border-[#B8A99A] hover:shadow-md transition-all">
          {/* 航班圖示 */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#B8A99A' }}
          >
            <Plane className="w-5 h-5 text-white" />
          </div>

          {/* 航班資訊 */}
          <div className="flex-1 text-left">
            <h2 className="text-base font-bold text-morandi-primary">航班資訊</h2>
            <p className="text-xs text-morandi-secondary">
              {currentStyle.label}{tripDays > 0 ? ` · ${tripDays} 天` : ''}
            </p>
          </div>
        </div>
      </button>

      {/* 行程天數自動計算（保留在主面板以便快速存取） */}
      {!compact && tripDays > 0 && data.departureDate && (
        <div className="bg-gradient-to-r from-morandi-gold/10 to-morandi-gold/5 p-3 rounded-lg border border-morandi-gold/30">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-morandi-primary">行程天數</span>
              <span className="text-lg font-bold text-morandi-gold">{tripDays}</span>
              <span className="text-sm text-morandi-secondary">天</span>
            </div>
            <div className="h-6 w-px bg-morandi-container hidden sm:block"></div>
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
            <div className="h-6 w-px bg-morandi-container hidden sm:block"></div>
            <div className="flex items-center gap-2">
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
              {canUndoItinerary && onUndoItinerary && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onUndoItinerary}
                  className="text-xs gap-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  <Undo2 size={14} />
                  復原
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 航班設定 Modal */}
      <Dialog open={showFlightSettings} onOpenChange={setShowFlightSettings}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden p-0">
          <div className="flex h-full">
            {/* 左側：設定表單 */}
            <div className="w-1/2 p-6 overflow-y-auto max-h-[90vh] border-r border-morandi-container">
              <DialogHeader className="mb-4">
                <DialogTitle className="flex items-center gap-2">
                  <Plane className="w-5 h-5" style={{ color: '#B8A99A' }} />
                  航班設定
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
            {/* 航班卡片風格選擇 */}
            {updateField && (
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Plane className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">航班卡片風格</span>
                </div>
                {templatesLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-morandi-gold" />
                    <span className="ml-2 text-sm text-slate-500">載入中...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {flightStyleOptions.map((option) => {
                      const isSelected = (data.flightStyle || 'original') === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateField('flightStyle', option.value)}
                          className={cn(
                            'relative flex flex-col items-start p-2.5 rounded-lg border-2 transition-all text-left',
                            isSelected
                              ? 'border-morandi-gold bg-morandi-gold/10'
                              : 'border-transparent bg-white hover:border-slate-300'
                          )}
                        >
                          {/* 預覽圖（如果有） */}
                          {option.previewImage && (
                            <div className="w-full h-12 mb-2 rounded overflow-hidden bg-slate-100">
                              <img
                                src={option.previewImage}
                                alt={option.label}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5">
                              <Check className="w-3.5 h-3.5 text-morandi-gold" />
                            </div>
                          )}
                          <span className={cn(
                            'text-xs font-bold',
                            isSelected ? 'text-morandi-gold' : 'text-slate-700'
                          )}>
                            {option.label}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">{option.description}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 去程航班 */}
            <div className="bg-[#F9F8F6] p-4 rounded-lg space-y-3 border border-[#E8E4E0]">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#333333]">去程航班</h3>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.outboundFlight?.hasMeal || false}
                      onChange={e => updateFlightField('outboundFlight', 'hasMeal', e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-morandi-gold focus:ring-morandi-gold"
                    />
                    <span className="text-xs text-morandi-secondary">餐食</span>
                  </label>
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
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowRouteSearchOutbound(true)}
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
                    onChange={e => updateFlightField('outboundFlight', 'departureDate', e.target.value)}
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
                    value={data.outboundFlight?.duration || ''}
                    onChange={e => updateFlightField('outboundFlight', 'duration', e.target.value)}
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
                    value={data.outboundFlight?.departureAirport || ''}
                    onChange={e => updateFlightField('outboundFlight', 'departureAirport', e.target.value)}
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
            <div className="bg-[#F9F8F6] p-4 rounded-lg space-y-3 border border-[#E8E4E0]">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#333333]">回程航班</h3>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.returnFlight?.hasMeal || false}
                      onChange={e => updateFlightField('returnFlight', 'hasMeal', e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-morandi-gold focus:ring-morandi-gold"
                    />
                    <span className="text-xs text-morandi-secondary">餐食</span>
                  </label>
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
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowRouteSearchReturn(true)}
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
                    onChange={e => updateFlightField('returnFlight', 'departureDate', e.target.value)}
                    className="text-xs h-8"
                    placeholder="02/23"
                    enableMathCalculation={false}
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
            </div>

            {/* 右側：即時預覽 */}
            <PreviewPanel
              styleLabel={currentStyle?.label}
              styleColor={currentStyle?.color}
            >
              {(viewMode) => (
                <div className="w-full h-full overflow-auto p-6">
                  <TourFlightSection
                    data={{
                      outboundFlight: data.outboundFlight,
                      returnFlight: data.returnFlight,
                      flightStyle: data.flightStyle || 'original',
                    }}
                    viewMode={viewMode}
                  />
                </div>
              )}
            </PreviewPanel>
          </div>
        </DialogContent>
      </Dialog>

      {/* 去程航線查詢 Dialog */}
      <FlightRouteSearchDialog
        open={showRouteSearchOutbound}
        onOpenChange={setShowRouteSearchOutbound}
        defaultOrigin={data.outboundFlight?.departureAirport || 'TPE'}
        defaultDestination={data.outboundFlight?.arrivalAirport || ''}
        defaultDate={(() => {
          // 嘗試從出發日期計算
          if (data.departureDate) {
            const dep = parseDate(data.departureDate)
            if (dep) return dep.toISOString().split('T')[0]
          }
          return new Date().toISOString().split('T')[0]
        })()}
        onSelectFlight={(flight) => {
          const fields: Record<string, string> = {
            flightNumber: flight.flightNumber,
            airline: flight.airline,
            departureAirport: flight.departureAirport,
            arrivalAirport: flight.arrivalAirport,
            departureTime: flight.departureTime,
          }
          if (flight.arrivalTime) {
            fields.arrivalTime = flight.arrivalTime
          }
          if (updateFlightFields) {
            updateFlightFields('outboundFlight', fields)
          } else {
            Object.entries(fields).forEach(([key, value]) => {
              updateFlightField('outboundFlight', key, value)
            })
          }
        }}
      />

      {/* 回程航線查詢 Dialog */}
      <FlightRouteSearchDialog
        open={showRouteSearchReturn}
        onOpenChange={setShowRouteSearchReturn}
        defaultOrigin={data.returnFlight?.departureAirport || data.outboundFlight?.arrivalAirport || ''}
        defaultDestination={data.returnFlight?.arrivalAirport || 'TPE'}
        defaultDate={(() => {
          // 嘗試從回程日期計算
          if (data.returnFlight?.departureDate && data.departureDate) {
            const dep = parseDate(data.departureDate)
            if (dep) {
              const [month, day] = (data.returnFlight.departureDate || '').split('/').map(Number)
              if (month && day) {
                let year = dep.getFullYear()
                if (month < dep.getMonth() + 1) year += 1
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              }
            }
          }
          return new Date().toISOString().split('T')[0]
        })()}
        onSelectFlight={(flight) => {
          const fields: Record<string, string> = {
            flightNumber: flight.flightNumber,
            airline: flight.airline,
            departureAirport: flight.departureAirport,
            arrivalAirport: flight.arrivalAirport,
            departureTime: flight.departureTime,
          }
          if (flight.arrivalTime) {
            fields.arrivalTime = flight.arrivalTime
          }
          if (updateFlightFields) {
            updateFlightFields('returnFlight', fields)
          } else {
            Object.entries(fields).forEach(([key, value]) => {
              updateFlightField('returnFlight', key, value)
            })
          }
        }}
      />
    </div>
  )
}
