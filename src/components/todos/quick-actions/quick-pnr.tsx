'use client'

import { logger } from '@/lib/utils/logger'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Plane, Calendar, AlertCircle, Clock } from 'lucide-react'
import { parseAmadeusPNR, formatSegment, extractImportantDates, isUrgent } from '@/lib/pnr-parser'
import { usePNRStore } from '@/stores/pnrs-store'
import { useCalendarEventStore } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { toast } from 'sonner'
import type { Todo } from '@/stores/types'

interface QuickPNRProps {
  todo?: Todo
  onUpdate?: (updates: Partial<Todo>) => void
}

export function QuickPNR({ todo, onUpdate }: QuickPNRProps) {
  const [rawPNR, setRawPNR] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parsedData, setParsedData] = useState<ReturnType<typeof parseAmadeusPNR> | null>(null)

  const { create: createPNR } = usePNRStore()
  const { create: createCalendarEvent } = useCalendarEventStore()
  const { user } = useAuthStore()
  const { currentWorkspace } = useWorkspaceStore()

  // 解析電報
  const handleParse = () => {
    if (!rawPNR.trim()) {
      toast.error('請貼上電報內容')
      return
    }

    setIsParsing(true)
    try {
      const parsed = parseAmadeusPNR(rawPNR)
      logger.log('🔍 解析結果:', parsed)
      logger.log('📅 出票期限:', parsed.ticketingDeadline)
      logger.log('✈️ 航班數量:', parsed.segments.length)
      setParsedData(parsed)
      toast.success('電報解析成功！')
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
          ticketing_deadline: parsedData.ticketingDeadline ? parsedData.ticketingDeadline.toISOString() : null,
          cancellation_deadline: parsedData.cancellationDeadline ? parsedData.cancellationDeadline.toISOString() : null,
          segments: parsedData.segments,
          special_requests: parsedData.specialRequests,
          other_info: parsedData.otherInfo,
          status: 'active',
        } as any)
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
          start_time: date.toISOString(),
          end_time: new Date(date.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 預設 2 小時
          workspace_id: currentWorkspace.id,
          created_by: user.id,
          event_type: 'flight',
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
          ticketing_deadline: parsedData.ticketingDeadline ? parsedData.ticketingDeadline.toISOString() : null,
          cancellation_deadline: parsedData.cancellationDeadline ? parsedData.cancellationDeadline.toISOString() : null,
          segments: parsedData.segments,
          special_requests: parsedData.specialRequests,
          other_info: parsedData.otherInfo,
          status: 'active',
        } as any)
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
        </label>
        <Textarea
          placeholder={`範例：
1. JOHNSON/BRIAN MR
2  UA 978 Y 18JUL GRUIAH HK1 1830 2345
8  TK TL03JUN/ABCB23129
AP TPE 02-2712-8888`}
          rows={8}
          className="shadow-sm text-xs font-mono"
          value={rawPNR}
          onChange={e => setRawPNR(e.target.value)}
        />
      </div>

      {/* 解析按鈕 */}
      {!parsedData && (
        <Button
          onClick={handleParse}
          disabled={isParsing || !rawPNR.trim()}
          className="w-full bg-morandi-sky hover:bg-morandi-sky/90 shadow-md h-9 text-xs"
        >
          <Plane size={14} className="mr-1.5" />
          {isParsing ? '解析中...' : '解析電報'}
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

          <div className="space-y-2 text-xs">
            <div>
              <span className="font-medium text-morandi-primary">訂位代號：</span>
              <span className="text-morandi-secondary">{parsedData.recordLocator || '無'}</span>
            </div>

            <div>
              <span className="font-medium text-morandi-primary">旅客：</span>
              <span className="text-morandi-secondary">
                {parsedData.passengerNames.join(', ') || '無'}
              </span>
            </div>

            {parsedData.ticketingDeadline && (
              <div className="flex items-center gap-2">
                {isUrgent(parsedData.ticketingDeadline) && (
                  <AlertCircle size={14} className="text-morandi-alert" />
                )}
                <span className="font-medium text-morandi-primary">出票期限：</span>
                <span
                  className={
                    isUrgent(parsedData.ticketingDeadline)
                      ? 'text-morandi-alert font-semibold'
                      : 'text-morandi-secondary'
                  }
                >
                  {parsedData.ticketingDeadline.toLocaleDateString('zh-TW')}
                </span>
              </div>
            )}

            {parsedData.segments.length > 0 && (
              <div>
                <span className="font-medium text-morandi-primary block mb-1">航班：</span>
                <div className="space-y-1 ml-2">
                  {parsedData.segments.map((seg, idx) => (
                    <div key={idx} className="text-morandi-secondary flex items-center gap-2">
                      <Calendar size={12} className="text-morandi-sky" />
                      {formatSegment(seg)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-2 pt-2">
            {parsedData.ticketingDeadline && onUpdate && (
              <Button
                onClick={handleAddDeadline}
                className="flex-1 bg-morandi-gold hover:bg-morandi-gold/90 shadow-md h-9 text-xs"
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
