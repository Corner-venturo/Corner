'use client'

import { useState } from 'react'
import { logger } from '@/lib/utils/logger'
import {
  parseAmadeusPNR,
  validateAmadeusPNR,
  extractImportantDates,
  isUrgent,
} from '@/lib/pnr-parser'
import { createPNR, createCalendarEvent } from '@/data'
import { useAuthStore } from '@/stores/auth-store'
import { useWorkspaceChannels } from '@/stores/workspace'
import { toast } from 'sonner'
import type { Todo } from '@/stores/types'

interface UsePnrQuickActionProps {
  todo?: Todo
  onUpdate?: (updates: Partial<Todo>) => void
  onClose?: () => void
}

export function usePnrQuickAction({ todo, onUpdate, onClose }: UsePnrQuickActionProps) {
  const [rawPNR, setRawPNR] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parsedData, setParsedData] = useState<ReturnType<typeof parseAmadeusPNR> | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

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

  // 儲存 PNR 記錄到資料庫
  const savePNRRecord = async () => {
    if (!user || !currentWorkspace || !parsedData?.recordLocator) {
      return
    }

    await createPNR({
      record_locator: parsedData.recordLocator,
      workspace_id: currentWorkspace.id,
      employee_id: user.id,
      tour_id: null,
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
      await savePNRRecord()

      toast.success('出票期限已設定！')
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
        } as Parameters<typeof createCalendarEvent>[0])
      }

      // 儲存 PNR 記錄
      await savePNRRecord()

      toast.success(`已新增 ${departureDates.length} 個航班到行事曆！`)
    } catch (error) {
      toast.error('新增失敗，請稍後再試')
      logger.error('新增行事曆失敗:', error)
    }
  }

  // 重新輸入
  const handleReset = () => {
    setParsedData(null)
    setRawPNR('')
    setShowAdvanced(false)
  }

  return {
    // 狀態
    rawPNR,
    isParsing,
    parsedData,
    showAdvanced,
    validation,

    // 方法
    setRawPNR,
    setShowAdvanced,
    handleParse,
    handleAddDeadline,
    handleAddToCalendar,
    handleReset,
  }
}
