'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  FileText,
  Clipboard,
  AlertCircle,
  Check,
  Clock,
  Plane,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  Copy,
  Utensils,
  Accessibility,
  Armchair,
  Briefcase,
  Award,
  Info,
  Save,
  X,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DateCell } from '@/components/table-cells'
import {
  parseAmadeusPNR,
  isUrgent,
  type ParsedPNR,
  type FlightSegment,
  SSRCategory,
} from '@/lib/pnr-parser'
import { useReferenceData } from '@/lib/pnr/use-reference-data'
import { usePNRStore } from '@/stores/pnrs-store'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import type { PNR } from '@/types/pnr.types'

// SSR 類別圖示
const SSR_ICONS: Record<SSRCategory, typeof Utensils> = {
  [SSRCategory.MEAL]: Utensils,
  [SSRCategory.MEDICAL]: Accessibility,
  [SSRCategory.SEAT]: Armchair,
  [SSRCategory.BAGGAGE]: Briefcase,
  [SSRCategory.FREQUENT]: Award,
  [SSRCategory.OTHER]: Info,
}

export function PNRWidget() {
  const [rawPNR, setRawPNR] = useState('')
  const [parsedPNR, setParsedPNR] = useState<ParsedPNR | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const { create: createPNR } = usePNRStore()
  const { user } = useAuthStore()

  // 載入參考資料
  const {
    isReady: refDataReady,
    isLoading: refDataLoading,
    getAirlineName,
    getAirportName,
    getCityName,
    getBookingClassDescription,
    getSSRDescription,
    getSSRCategory,
    getStatusDescription,
    isConfirmedStatus,
    isWaitlistStatus,
    isCancelledStatus,
  } = useReferenceData()

  // 解析 PNR
  const handleParse = useCallback(() => {
    if (!rawPNR.trim()) {
      setError('請貼上 PNR 電報內容')
      setParsedPNR(null)
      return
    }

    try {
      const result = parseAmadeusPNR(rawPNR)
      setParsedPNR(result)
      setError(null)

      // 如果有驗證錯誤，顯示第一個錯誤
      if (!result.validation.isValid && result.validation.errors.length > 0) {
        setError(result.validation.errors[0])
      }
    } catch (err) {
      setError('解析失敗：' + (err instanceof Error ? err.message : '未知錯誤'))
      setParsedPNR(null)
    }
  }, [rawPNR])

  // 從剪貼簿貼上
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setRawPNR(text)
      setError(null)
      setParsedPNR(null)
    } catch {
      setError('無法存取剪貼簿')
    }
  }, [])

  // 清除
  const handleClear = useCallback(() => {
    setRawPNR('')
    setParsedPNR(null)
    setError(null)
    setSaveSuccess(false)
  }, [])

  // 複製訂位代號
  const handleCopyLocator = useCallback(async () => {
    if (parsedPNR?.recordLocator) {
      await navigator.clipboard.writeText(parsedPNR.recordLocator)
    }
  }, [parsedPNR])

  // 儲存到資料庫
  const handleSave = useCallback(async () => {
    if (!parsedPNR || !user?.workspace_id) return

    setIsSaving(true)
    try {
      await createPNR({
        record_locator: parsedPNR.recordLocator || 'UNKNWN',
        workspace_id: user.workspace_id,
        employee_id: user.id || null,
        tour_id: null,
        raw_pnr: rawPNR,
        passenger_names: parsedPNR.passengerNames,
        ticketing_deadline: parsedPNR.ticketingDeadline?.toISOString() || null,
        segments: parsedPNR.segments,
        special_requests: parsedPNR.specialRequests || null,
        other_info: parsedPNR.otherInfo || null,
        status: 'active',
        created_by: user.id || null,
      } as Omit<PNR, 'id' | 'created_at' | 'updated_at'>)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setError('儲存失敗：' + (err instanceof Error ? err.message : '未知錯誤'))
    } finally {
      setIsSaving(false)
    }
  }, [parsedPNR, rawPNR, user, createPNR])

  // 計算剩餘天數
  const getDaysRemaining = (date: Date | null) => {
    if (!date) return null
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="h-full">
      <div
        className={cn(
          'h-full rounded-2xl border border-white/70 shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:border-white/80',
          'bg-gradient-to-br from-amber-50 via-white to-orange-50'
        )}
      >
        <div className="p-5 space-y-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-full p-2.5 text-white shadow-lg shadow-black/10',
                'bg-gradient-to-br from-morandi-gold/20 to-amber-100/60',
                'ring-2 ring-white/50 ring-offset-1 ring-offset-white/20'
              )}
            >
              <FileText className="w-5 h-5 drop-shadow-sm text-morandi-gold" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-morandi-primary leading-tight tracking-wide">
                PNR 解析器
              </p>
              <p className="text-xs text-morandi-secondary/90 mt-1 leading-relaxed">
                貼上 Amadeus 電報，自動提取資訊
              </p>
              {refDataLoading && (
                <p className="text-[10px] text-morandi-secondary/60 mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  載入參考資料中...
                </p>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="rounded-xl bg-white/70 p-3.5 shadow-md border border-white/40 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-morandi-primary flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                PNR 電報
              </label>
              <div className="flex gap-1.5">
                <button
                  onClick={handlePaste}
                  className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-morandi-secondary hover:text-morandi-primary transition-all"
                  title="從剪貼簿貼上"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                </button>
                {rawPNR && (
                  <button
                    onClick={handleClear}
                    className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-morandi-secondary hover:text-morandi-red transition-all"
                    title="清除"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={rawPNR}
              onChange={e => setRawPNR(e.target.value)}
              placeholder={`貼上 Amadeus PNR 電報...

範例:
RP/TPEW123ML/...   FUM2GY
1.CHEN/WILLIAM MR
2  BR 116 Y 15JAN 4 TPECTS HK2  0930 1405
TK TL20JAN/1200`}
              className="w-full h-24 px-3 py-2.5 text-xs font-mono border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm placeholder:text-morandi-secondary/40 resize-none"
            />
            <button
              onClick={handleParse}
              disabled={!rawPNR.trim()}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md',
                'bg-gradient-to-br from-morandi-gold/20 to-amber-100/60 hover:from-morandi-gold/30 hover:to-amber-200/60',
                'text-morandi-primary disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              <Check className="w-4 h-4" />
              解析電報
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-status-danger-bg/80 border border-status-danger/50 p-3 backdrop-blur-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-status-danger flex-shrink-0 mt-0.5" />
                <p className="text-xs text-status-danger font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Validation Warnings */}
          {parsedPNR && parsedPNR.validation?.warnings && parsedPNR.validation.warnings.length > 0 && (
            <div className="rounded-xl bg-amber-50/80 border border-amber-200/50 p-3 backdrop-blur-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700">
                  {parsedPNR.validation.warnings.map((w, i) => (
                    <p key={i}>{w}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Parsed Result */}
          {parsedPNR && !error && (
            <div className="flex-1 rounded-xl bg-white/70 shadow-md border border-white/40 overflow-hidden flex flex-col">
              {/* Result Header */}
              <div
                className="px-4 py-3 bg-white/50 border-b border-white/40 flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-morandi-primary">
                    {parsedPNR.recordLocator || '(無訂位代號)'}
                  </span>
                  {parsedPNR.recordLocator && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleCopyLocator()
                      }}
                      className="p-1 rounded hover:bg-white/50 text-morandi-secondary hover:text-morandi-primary transition-all"
                      title="複製訂位代號"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {parsedPNR.ticketingDeadline && (
                    <div
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                        isUrgent(parsedPNR.ticketingDeadline)
                          ? 'bg-status-danger-bg text-status-danger'
                          : 'bg-status-success-bg text-status-success'
                      )}
                    >
                      <Clock className="w-3 h-3" />
                      {getDaysRemaining(parsedPNR.ticketingDeadline)}天
                    </div>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-morandi-secondary" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-morandi-secondary" />
                  )}
                </div>
              </div>

              {/* Expandable Content */}
              {isExpanded && (
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  {/* Ticketing Deadline */}
                  {parsedPNR.ticketingDeadline && (
                    <div
                      className={cn(
                        'rounded-lg p-3',
                        isUrgent(parsedPNR.ticketingDeadline)
                          ? 'bg-status-danger-bg/50'
                          : 'bg-white/50'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-morandi-secondary" />
                        <span className="text-xs font-semibold text-morandi-primary">
                          出票期限
                        </span>
                      </div>
                      <div
                        className={cn(
                          'text-sm font-bold',
                          isUrgent(parsedPNR.ticketingDeadline)
                            ? 'text-status-danger'
                            : 'text-morandi-primary'
                        )}
                      >
                        <DateCell
                          date={parsedPNR.ticketingDeadline}
                          format="short"
                          showIcon={false}
                          className={cn(
                            'inline-flex',
                            isUrgent(parsedPNR.ticketingDeadline)
                              ? 'text-status-danger'
                              : 'text-morandi-primary'
                          )}
                        />
                        {isUrgent(parsedPNR.ticketingDeadline) && (
                          <span className="ml-2 text-xs">(緊急！)</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Passengers */}
                  {parsedPNR.passengerNames.length > 0 && (
                    <div className="rounded-lg bg-white/50 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-3.5 h-3.5 text-morandi-secondary" />
                        <span className="text-xs font-semibold text-morandi-primary">
                          旅客 ({parsedPNR.passengerNames.length})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {parsedPNR.passengerNames.map((name, idx) => (
                          <p key={idx} className="text-xs text-morandi-primary font-medium">
                            {name}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Flight Segments */}
                  {parsedPNR.segments.length > 0 && (
                    <div className="rounded-lg bg-white/50 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Plane className="w-3.5 h-3.5 text-morandi-secondary" />
                        <span className="text-xs font-semibold text-morandi-primary">
                          航班 ({parsedPNR.segments.length})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {parsedPNR.segments.map((seg, idx) => (
                          <div
                            key={idx}
                            className="bg-white/60 rounded-lg px-3 py-2.5"
                          >
                            {/* 航班號與狀態 */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-morandi-primary">
                                  {getAirlineName(seg.airline)} {seg.airline}{seg.flightNumber}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-morandi-container text-morandi-secondary">
                                  {getBookingClassDescription(seg.class)}
                                </span>
                              </div>
                              <div
                                className={cn(
                                  'px-2 py-0.5 rounded text-[10px] font-bold',
                                  isConfirmedStatus(seg.status)
                                    ? 'bg-status-success-bg text-status-success'
                                    : isWaitlistStatus(seg.status)
                                    ? 'bg-amber-100 text-amber-700'
                                    : isCancelledStatus(seg.status)
                                    ? 'bg-status-danger-bg text-status-danger'
                                    : 'bg-muted text-morandi-secondary'
                                )}
                                title={getStatusDescription(seg.status)}
                              >
                                {seg.status} {getStatusDescription(seg.status)}
                              </div>
                            </div>
                            {/* 航線 */}
                            <div className="flex items-center gap-2 text-xs">
                              <div className="flex-1">
                                <p className="font-bold text-morandi-primary">{seg.origin}</p>
                                <p className="text-[10px] text-morandi-secondary truncate">
                                  {getCityName(seg.origin)}
                                </p>
                              </div>
                              <div className="flex flex-col items-center px-2">
                                <ArrowRight className="w-4 h-4 text-morandi-secondary/50" />
                                <span className="text-[10px] text-morandi-secondary">
                                  {seg.departureDate}
                                </span>
                              </div>
                              <div className="flex-1 text-right">
                                <p className="font-bold text-morandi-primary">{seg.destination}</p>
                                <p className="text-[10px] text-morandi-secondary truncate">
                                  {getCityName(seg.destination)}
                                </p>
                              </div>
                            </div>
                            {/* 時間 */}
                            {(seg.departureTime || seg.arrivalTime) && (
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/50 text-xs text-morandi-secondary">
                                {seg.departureTime && (
                                  <span>出發 {seg.departureTime.slice(0, 2)}:{seg.departureTime.slice(2)}</span>
                                )}
                                {seg.arrivalTime && (
                                  <span>抵達 {seg.arrivalTime.slice(0, 2)}:{seg.arrivalTime.slice(2)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SSR */}
                  {parsedPNR.specialRequests.length > 0 && (
                    <div className="rounded-lg bg-white/50 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-3.5 h-3.5 text-morandi-secondary" />
                        <span className="text-xs font-semibold text-morandi-primary">
                          特殊需求 ({parsedPNR.specialRequests.length})
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {parsedPNR.specialRequests.map((ssr, idx) => {
                          const Icon = SSR_ICONS[ssr.category] || Info
                          // 優先從資料庫取得描述，若無則使用 parser 的結果
                          const dbDescription = getSSRDescription(ssr.code)
                          const displayDescription = dbDescription !== ssr.code
                            ? dbDescription
                            : ssr.description || ssr.code
                          const dbCategory = getSSRCategory(ssr.code)
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs bg-white/60 rounded-lg px-2.5 py-2"
                            >
                              <Icon className="w-3.5 h-3.5 text-morandi-secondary flex-shrink-0" />
                              <span className="font-bold text-morandi-primary">
                                {ssr.code}
                              </span>
                              <span className="text-morandi-secondary flex-1 truncate">
                                {displayDescription}
                              </span>
                              {dbCategory && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-morandi-container text-morandi-secondary flex-shrink-0">
                                  {dbCategory}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="pt-2">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || saveSuccess || !parsedPNR.recordLocator}
                      className={cn(
                        'w-full gap-2',
                        saveSuccess
                          ? 'bg-status-success hover:bg-status-success text-white'
                          : 'bg-morandi-gold hover:bg-morandi-gold-hover text-white'
                      )}
                    >
                      {saveSuccess ? (
                        <>
                          <Check className="w-4 h-4" />
                          已儲存
                        </>
                      ) : isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          儲存中...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          儲存到 PNR 管理
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
