'use client'

import React, { useState } from 'react'
import { logger } from '@/lib/utils/logger'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plane, Calendar, AlertCircle, Clock, CheckCircle2, XCircle, 
  AlertTriangle, Info, Utensils, Crown, Phone, Heart, Shield 
} from 'lucide-react'
import { 
  parseAmadeusPNR, 
  validateAmadeusPNR,
  formatSegment, 
  extractImportantDates, 
  isUrgent,
  type EnhancedSSR,
  type EnhancedOSI,
  SSRCategory,
  OSICategory 
} from '@/lib/pnr-parser'
import { usePNRStore } from '@/stores/pnrs-store'
import { useCalendarEventStore } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'
import { useWorkspaceChannels } from '@/stores/workspace'
import { toast } from 'sonner'
import type { Todo } from '@/stores/types'

interface QuickPNRProps {
  todo?: Todo
  onUpdate?: (updates: Partial<Todo>) => void
  onClose?: () => void
}

export function QuickPNR({ todo, onUpdate, onClose }: QuickPNRProps) {
  const [rawPNR, setRawPNR] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parsedData, setParsedData] = useState<ReturnType<typeof parseAmadeusPNR> | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { create: createPNR } = usePNRStore()
  const { create: createCalendarEvent } = useCalendarEventStore()
  const { user } = useAuthStore()
  const { currentWorkspace } = useWorkspaceChannels()

  // 即時驗證
  const validation = rawPNR.trim() ? validateAmadeusPNR(rawPNR) : null
  
  // 解析電報
  const handleParse = () => {
    if (!rawPNR.trim()) {
      toast.error('請貼上電報內容')
      return
    }

    if (validation && !validation.isValid) {
      toast.error(`格式錯誤: ${validation.errors[0]}`)
      return
    }

    setIsParsing(true)
    try {
      const parsed = parseAmadeusPNR(rawPNR)
      logger.log('🔍 解析結果:', parsed)
      logger.log('📅 出票期限:', parsed.ticketingDeadline)
      logger.log('✈️ 航班數量:', parsed.segments.length)
      logger.log('🎫 SSR數量:', parsed.specialRequests.length)
      logger.log('ℹ️ OSI數量:', parsed.otherInfo.length)
      setParsedData(parsed)
      
      if (parsed.validation.warnings.length > 0) {
        toast.warning(`解析成功，但有 ${parsed.validation.warnings.length} 個警告`)
      } else {
        toast.success('電報解析成功！')
      }
    } catch (error) {
      toast.error('電報格式錯誤，請檢查內容')
      logger.error(error)
    } finally {
      setIsParsing(false)
    }
  }

  // 新增期限到待辦事項
  const handleAddDeadline = async () => {
    logger.log('🔍 handleAddDeadline called', {
      parsedData,
      onUpdate: !!onUpdate,
      todo
    });

    if (!parsedData || !parsedData.ticketingDeadline) {
      toast.error('請先解析電報並確認有出票期限')
      return
    }

    if (!onUpdate) {
      toast.error('無法更新待辦事項（onUpdate 未傳入）')
      logger.error('❌ onUpdate is not defined');
      return
    }

    try {
      const updates = {
        deadline: parsedData.ticketingDeadline.toISOString(),
        priority: (isUrgent(parsedData.ticketingDeadline) ? 5 : 4) as 1 | 2 | 3 | 4 | 5,
        title: `出票：${parsedData.recordLocator} - ${parsedData.passengerNames[0]}`,
      };

      logger.log('📝 Updating todo with:', JSON.stringify(updates, null, 2));
      logger.log('📝 Update keys:', Object.keys(updates));
      await onUpdate(updates);
      logger.log('✅ Todo updated successfully');

      // 儲存 PNR 記錄
      if (user && currentWorkspace && parsedData.recordLocator) {
        await createPNR({
          record_locator: parsedData.recordLocator,
          workspace_id: currentWorkspace.id,
          employee_id: user.id,
          raw_pnr: rawPNR,
          passenger_names: parsedData.passengerNames,
          ticketing_deadline: parsedData.ticketingDeadline?.toISOString() ?? null,
          cancellation_deadline: parsedData.cancellationDeadline?.toISOString() ?? null,
          segments: parsedData.segments,
          special_requests: parsedData.specialRequests,
          other_info: parsedData.otherInfo,
          status: 'active' as const,
          notes: null,
          created_by: user.id,
          updated_by: null,
        })
      }

      toast.success('出票期限已設定！')
      // 不清空電報，讓使用者可以繼續操作
    } catch (error) {
      toast.error('設定失敗，請稍後再試')
      logger.error('新增期限失敗:', error)
    }
  }

  // 新增航班到行事曆
  const handleAddToCalendar = async () => {
    if (!parsedData || !user || !currentWorkspace) {
      toast.error('請先解析電報')
      return
    }

    if (parsedData.segments.length === 0) {
      toast.error('沒有找到航班資訊')
      return
    }

    try {
      const { departureDates } = extractImportantDates(parsedData)

      for (const { date, description } of departureDates) {
        await createCalendarEvent({
          title: description,
          description: `PNR: ${parsedData.recordLocator}\n旅客: ${parsedData.passengerNames.join(', ')}`,
          start: date.toISOString(),
          end: new Date(date.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 預設 2 小時
          all_day: false,
          type: 'other' as const,
          visibility: 'company' as const,
          owner_id: user.id,
          workspace_id: currentWorkspace.id,
          created_by: user.id,
        })
      }

      // 儲存 PNR 記錄
      if (parsedData.recordLocator) {
        await createPNR({
          record_locator: parsedData.recordLocator,
          workspace_id: currentWorkspace.id,
          employee_id: user.id,
          raw_pnr: rawPNR,
          passenger_names: parsedData.passengerNames,
          ticketing_deadline: parsedData.ticketingDeadline?.toISOString() ?? null,
          cancellation_deadline: parsedData.cancellationDeadline?.toISOString() ?? null,
          segments: parsedData.segments,
          special_requests: parsedData.specialRequests,
          other_info: parsedData.otherInfo,
          status: 'active' as const,
          notes: null,
          created_by: user.id,
          updated_by: null,
        })
      }

      toast.success(`已新增 ${departureDates.length} 個航班到行事曆！`)
      // 不清空電報，讓使用者可以繼續操作
    } catch (error) {
      toast.error('新增失敗，請稍後再試')
      logger.error('新增行事曆失敗:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* 標題 */}
      <div className="flex items-center gap-2 pb-3 border-b border-morandi-container/20">
        <div className="p-1.5 bg-morandi-sky/10 rounded-lg">
          <Plane size={16} className="text-morandi-sky" />
        </div>
        <div>
          <h5 className="text-sm font-semibold text-morandi-primary">快速 PNR</h5>
          <p className="text-xs text-morandi-secondary">貼上 Amadeus 電報進行解析</p>
        </div>
      </div>

      {/* 電報輸入 */}
      <div>
        <label className="block text-xs font-medium text-morandi-primary mb-1">
          Amadeus 電報內容
          {validation && (
            <span className={`ml-2 ${validation.isValid ? 'text-morandi-success' : validation.errors.length > 0 ? 'text-morandi-alert' : 'text-morandi-gold'}`}>
              {validation.isValid ? (
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  格式正確
                </span>
              ) : validation.errors.length > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <XCircle size={12} />
                  {validation.errors[0]}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {validation.warnings.length} 個警告
                </span>
              )}
            </span>
          )}
        </label>
        <Textarea
          placeholder={`範例：
RP/TPEW123ML/TPEW123ML        AA/SU  16NOV25/1238Z   FUM2GY
1.WU/MINGTUNG  2.CHANG/TSEYUN
3  BR 116 Q 15JAN 4 TPECTS HK2  0930 1405  15JAN  E  BR/FUM2GY
SRVGML/S3/P1
OSBR PASSENGER IS VIP
OPW-20NOV:2038/1C7/BR REQUIRES TICKET ON OR BEFORE 23NOV:2038
AP TPE 02-2712-8888`}
          rows={10}
          className={`shadow-sm text-xs font-mono transition-colors ${
            validation 
              ? validation.isValid 
                ? 'border-morandi-success/50 focus:border-morandi-success' 
                : validation.errors.length > 0
                ? 'border-morandi-alert/50 focus:border-morandi-alert'
                : 'border-morandi-gold/50 focus:border-morandi-gold'
              : ''
          }`}
          value={rawPNR}
          onChange={e => setRawPNR(e.target.value)}
        />
        
        {/* 即時驗證提示 */}
        {validation && (validation.errors.length > 0 || validation.warnings.length > 0 || validation.suggestions.length > 0) && (
          <div className="mt-2 space-y-1">
            {validation.errors.map((error, idx) => (
              <div key={idx} className="flex items-center gap-1 text-xs text-morandi-alert">
                <XCircle size={10} />
                {error}
              </div>
            ))}
            {validation.warnings.map((warning, idx) => (
              <div key={idx} className="flex items-center gap-1 text-xs text-morandi-gold">
                <AlertTriangle size={10} />
                {warning}
              </div>
            ))}
            {validation.suggestions.map((suggestion, idx) => (
              <div key={idx} className="flex items-center gap-1 text-xs text-morandi-secondary">
                <Info size={10} />
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 解析按鈕 */}
      {!parsedData && (
        <Button
          onClick={handleParse}
          disabled={isParsing || !rawPNR.trim() || !!(validation && !validation.isValid)}
          className={`w-full shadow-md h-9 text-xs transition-colors ${
            validation?.isValid 
              ? 'bg-morandi-success hover:bg-morandi-success/90'
              : 'bg-morandi-sky hover:bg-morandi-sky/90'
          }`}
        >
          <Plane size={14} className="mr-1.5" />
          {isParsing ? '解析中...' : validation?.isValid ? '解析電報 (驗證通過)' : '解析電報'}
        </Button>
      )}

      {/* 解析結果 */}
      {parsedData && (
        <div className="space-y-3 bg-morandi-container/10 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <h6 className="text-xs font-semibold text-morandi-primary">解析結果</h6>
            <button
              onClick={() => {
                setParsedData(null)
                setRawPNR('')
              }}
              className="text-xs text-morandi-secondary hover:text-morandi-primary"
            >
              重新輸入
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* 基本資訊 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium text-morandi-primary">訂位代號</span>
                <p className="text-morandi-secondary mt-0.5 font-mono">
                  {parsedData.recordLocator || '無'}
                </p>
              </div>
              <div>
                <span className="font-medium text-morandi-primary">旅客人數</span>
                <p className="text-morandi-secondary mt-0.5">
                  {parsedData.passengerNames.length} 人
                </p>
              </div>
            </div>

            <div>
              <span className="font-medium text-morandi-primary">旅客姓名</span>
              <div className="mt-1 space-y-1">
                {parsedData.passengerNames.map((name, idx) => (
                  <div key={idx} className="text-morandi-secondary font-mono bg-morandi-container/10 px-2 py-1 rounded">
                    {idx + 1}. {name}
                  </div>
                ))}
              </div>
            </div>

            {/* 出票期限 */}
            {parsedData.ticketingDeadline && (
              <div className="bg-morandi-container/5 p-2 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  {isUrgent(parsedData.ticketingDeadline) && (
                    <AlertCircle size={14} className="text-morandi-alert" />
                  )}
                  <Clock size={14} className="text-morandi-primary" />
                  <span className="font-medium text-morandi-primary">出票期限</span>
                </div>
                <p className={
                  isUrgent(parsedData.ticketingDeadline)
                    ? 'text-morandi-alert font-semibold'
                    : 'text-morandi-secondary'
                }>
                  {parsedData.ticketingDeadline.toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'short'
                  })}
                  {isUrgent(parsedData.ticketingDeadline) && (
                    <span className="ml-2 text-xs bg-morandi-alert/10 text-morandi-alert px-1 py-0.5 rounded">緊急</span>
                  )}
                </p>
              </div>
            )}

            {/* 航班資訊 */}
            {parsedData.segments.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-morandi-primary">航班資訊</span>
                  <span className="text-xs text-morandi-secondary">{parsedData.segments.length} 個航段</span>
                </div>
                <div className="space-y-2">
                  {parsedData.segments.slice(0, showAdvanced ? undefined : 3).map((seg, idx) => (
                    <div key={idx} className="bg-morandi-container/5 p-2 rounded-lg">
                      <div className="flex items-center gap-2 text-morandi-primary font-medium mb-1">
                        <Plane size={12} className="text-morandi-sky" />
                        {formatSegment(seg)}
                      </div>
                      <div className="text-xs text-morandi-secondary ml-4">
                        艙等: {seg.class} | 狀態: {seg.status} | 人數: {seg.passengers}
                      </div>
                    </div>
                  ))}
                  {parsedData.segments.length > 3 && !showAdvanced && (
                    <button
                      onClick={() => setShowAdvanced(true)}
                      className="text-xs text-morandi-sky hover:text-morandi-sky/80"
                    >
                      顯示所有 {parsedData.segments.length} 個航段 →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* SSR 特殊服務 */}
            {parsedData.specialRequests.length > 0 && showAdvanced && (
              <div>
                <span className="font-medium text-morandi-primary block mb-2">特殊服務需求 (SSR)</span>
                <div className="space-y-1">
                  {parsedData.specialRequests.map((ssr, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-morandi-secondary bg-morandi-container/5 p-2 rounded">
                      {getSSRIcon(ssr)}
                      <span className="font-mono text-xs">{ssr.code}</span>
                      {ssr.description && <span>- {ssr.description}</span>}
                      {ssr.segments && <span className="text-xs text-morandi-gold">航段 {ssr.segments.join(',')}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OSI 其他資訊 */}
            {parsedData.otherInfo.length > 0 && showAdvanced && (
              <div>
                <span className="font-medium text-morandi-primary block mb-2">其他服務資訊 (OSI)</span>
                <div className="space-y-1">
                  {parsedData.otherInfo.map((osi, idx) => (
                    <div key={idx} className="text-morandi-secondary bg-morandi-container/5 p-2 rounded text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        {getOSIIcon(osi)}
                        <span className="font-mono">{osi.airline}</span>
                      </div>
                      <p className="ml-4">{osi.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 切換進階檢視 */}
            {(parsedData.specialRequests.length > 0 || parsedData.otherInfo.length > 0) && (
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-morandi-sky hover:text-morandi-sky/80"
              >
                {showAdvanced ? '隱藏進階資訊' : `顯示SSR/OSI (${parsedData.specialRequests.length + parsedData.otherInfo.length}項)`}
              </button>
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-2 pt-2">
            {parsedData.ticketingDeadline && onUpdate && (
              <Button
                onClick={handleAddDeadline}
                className="flex-1 bg-morandi-gold hover:bg-morandi-gold-hover shadow-md h-9 text-xs"
              >
                <Clock size={14} className="mr-1.5" />
                新增期限
              </Button>
            )}

            {parsedData.segments.length > 0 && (
              <Button
                onClick={handleAddToCalendar}
                className="flex-1 bg-morandi-success hover:bg-morandi-success/90 shadow-md h-9 text-xs"
              >
                <Calendar size={14} className="mr-1.5" />
                新增行事曆
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// SSR 圖標映射
function getSSRIcon(ssr: EnhancedSSR) {
  switch (ssr.category) {
    case SSRCategory.MEAL:
      return <Utensils size={14} className="text-morandi-gold" />
    case SSRCategory.MEDICAL:
      return <Heart size={14} className="text-morandi-alert" />
    case SSRCategory.SEAT:
      return <Crown size={14} className="text-morandi-sky" />
    case SSRCategory.BAGGAGE:
      return <Shield size={14} className="text-morandi-secondary" />
    case SSRCategory.FREQUENT:
      return <Crown size={14} className="text-morandi-success" />
    default:
      return <Info size={14} className="text-morandi-secondary" />
  }
}

// OSI 圖標映射
function getOSIIcon(osi: EnhancedOSI) {
  switch (osi.category) {
    case OSICategory.CONTACT:
      return <Phone size={14} className="text-morandi-sky" />
    case OSICategory.VIP:
      return <Crown size={14} className="text-morandi-gold" />
    case OSICategory.MEDICAL:
      return <Heart size={14} className="text-morandi-alert" />
    default:
      return <Info size={14} className="text-morandi-secondary" />
  }
}
