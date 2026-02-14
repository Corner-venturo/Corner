'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Plane, Calendar, AlertCircle, Clock,
  Utensils, Crown, Phone, Heart, Shield, Info
} from 'lucide-react'
import { formatDateChineseWithWeekday } from '@/lib/utils/format-date'
import {
  formatSegment,
  isUrgent,
  type EnhancedSSR,
  type EnhancedOSI,
  SSRCategory,
  OSICategory
} from '@/lib/pnr-parser'
import type { parseAmadeusPNR } from '@/lib/pnr-parser'
import { PNR_LABELS } from './constants/labels'

interface PnrPreviewProps {
  parsedData: ReturnType<typeof parseAmadeusPNR>
  showAdvanced: boolean
  onToggleAdvanced: () => void
  onReset: () => void
  onAddDeadline?: () => void
  onAddToCalendar?: () => void
  canAddDeadline: boolean
}

export function PnrPreview({
  parsedData,
  showAdvanced,
  onToggleAdvanced,
  onReset,
  onAddDeadline,
  onAddToCalendar,
  canAddDeadline,
}: PnrPreviewProps) {
  return (
    <div className="space-y-3 bg-morandi-container/10 p-3 rounded-lg">
      <div className="flex items-center justify-between">
        <h6 className="text-xs font-semibold text-morandi-primary">{PNR_LABELS.LABEL_4250}</h6>
        <button
          onClick={onReset}
          className="text-xs text-morandi-secondary hover:text-morandi-primary"
        >
          {PNR_LABELS.LABEL_9198}
        </button>
      </div>

      <div className="space-y-3 text-xs">
        {/* 基本資訊 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium text-morandi-primary">{PNR_LABELS.LABEL_9227}</span>
            <p className="text-morandi-secondary mt-0.5 font-mono">
              {parsedData.recordLocator || '無'}
            </p>
          </div>
          <div>
            <span className="font-medium text-morandi-primary">{PNR_LABELS.LABEL_392}</span>
            <p className="text-morandi-secondary mt-0.5">
              {parsedData.passengerNames.length} 人
            </p>
          </div>
        </div>

        <div>
          <span className="font-medium text-morandi-primary">{PNR_LABELS.LABEL_8113}</span>
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
              <span className="font-medium text-morandi-primary">{PNR_LABELS.LABEL_9939}</span>
            </div>
            <p className={
              isUrgent(parsedData.ticketingDeadline)
                ? 'text-morandi-alert font-semibold'
                : 'text-morandi-secondary'
            }>
              {formatDateChineseWithWeekday(parsedData.ticketingDeadline)}
              {isUrgent(parsedData.ticketingDeadline) && (
                <span className="ml-2 text-xs bg-morandi-alert/10 text-morandi-alert px-1 py-0.5 rounded">{PNR_LABELS.LABEL_3458}</span>
              )}
            </p>
          </div>
        )}

        {/* 航班資訊 */}
        {parsedData.segments.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-morandi-primary">{PNR_LABELS.LABEL_1343}</span>
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
                  onClick={onToggleAdvanced}
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
            <span className="font-medium text-morandi-primary block mb-2">{PNR_LABELS.LABEL_7702}</span>
            <div className="space-y-1">
              {parsedData.specialRequests.map((ssr, idx) => (
                <div key={idx} className="flex items-center gap-2 text-morandi-secondary bg-morandi-container/5 p-2 rounded">
                  {getSSRIcon(ssr)}
                  <span className="font-mono text-xs">{ssr.code}</span>
                  {ssr.description && <span>- {ssr.description}</span>}
                  {ssr.segments && <span className="text-xs text-morandi-gold">{PNR_LABELS.LABEL_3194} {ssr.segments.join(',')}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OSI 其他資訊 */}
        {parsedData.otherInfo.length > 0 && showAdvanced && (
          <div>
            <span className="font-medium text-morandi-primary block mb-2">{PNR_LABELS.LABEL_5164}</span>
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
            onClick={onToggleAdvanced}
            className="text-xs text-morandi-sky hover:text-morandi-sky/80"
          >
            {showAdvanced ? '隱藏進階資訊' : `顯示SSR/OSI (${parsedData.specialRequests.length + parsedData.otherInfo.length}項)`}
          </button>
        )}
      </div>

      {/* 操作按鈕 */}
      <div className="flex gap-2 pt-2">
        {parsedData.ticketingDeadline && canAddDeadline && onAddDeadline && (
          <Button
            onClick={onAddDeadline}
            className="flex-1 bg-morandi-gold hover:bg-morandi-gold-hover shadow-md h-9 text-xs"
          >
            <Clock size={14} className="mr-1.5" />
            {PNR_LABELS.ADD_4933}
          </Button>
        )}

        {parsedData.segments.length > 0 && onAddToCalendar && (
          <Button
            onClick={onAddToCalendar}
            className="flex-1 bg-morandi-success hover:bg-morandi-success/90 shadow-md h-9 text-xs"
          >
            <Calendar size={14} className="mr-1.5" />
            {PNR_LABELS.ADD_7463}
          </Button>
        )}
      </div>
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
