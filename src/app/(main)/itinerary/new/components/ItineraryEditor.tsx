'use client'

import { TourForm } from '@/components/editor/TourForm'
import { Cloud, CloudOff } from 'lucide-react'
import type { LocalTourData, AutoSaveStatus } from '../hooks/useItineraryEditor'
import type { TierPricing } from '@/stores/types/quote.types'
import { logger } from '@/lib/utils/logger'

interface ItineraryEditorProps {
  tourData: LocalTourData
  autoSaveStatus: AutoSaveStatus
  isDirty: boolean
  quoteTierPricings?: TierPricing[]
  onChange: (newData: LocalTourData) => void
}

export function ItineraryEditor({ tourData, autoSaveStatus, isDirty, quoteTierPricings, onChange }: ItineraryEditorProps) {
  return (
    <div className="w-1/2 bg-card border-r border-border flex flex-col">
      <div className="h-14 bg-morandi-gold/90 text-white px-6 flex items-center justify-between border-b border-border">
        <h2 className="text-lg font-semibold">編輯表單</h2>
        {/* 自動存檔狀態指示 */}
        <div className="flex items-center gap-2 text-sm">
          {autoSaveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-white/80">
              <Cloud size={14} className="animate-pulse" />
              存檔中...
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-white/80">
              <Cloud size={14} />
              已儲存
            </span>
          )}
          {autoSaveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-morandi-red/80">
              <CloudOff size={14} />
              存檔失敗
            </span>
          )}
          {autoSaveStatus === 'idle' && isDirty && (
            <span className="flex items-center gap-1.5 text-white/60">
              <Cloud size={14} />
              未儲存
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-card">
        <TourForm
          data={{
            ...tourData,
            meetingPoints: tourData.meetingInfo ? [tourData.meetingInfo] : [],
            hotels: tourData.hotels || [],
            countries: [],
            showFeatures: tourData.showFeatures !== false,
            showLeaderMeeting: tourData.showLeaderMeeting !== false,
            showHotels: tourData.showHotels || false,
            showPricingDetails: tourData.showPricingDetails || false,
            pricingDetails: tourData.pricingDetails,
            priceTiers: tourData.priceTiers,
            showPriceTiers: tourData.showPriceTiers || false,
            faqs: tourData.faqs,
            showFaqs: tourData.showFaqs || false,
            notices: tourData.notices,
            showNotices: tourData.showNotices || false,
            cancellationPolicy: tourData.cancellationPolicy,
            showCancellationPolicy: tourData.showCancellationPolicy || false,
          }}
          quoteTierPricings={quoteTierPricings}
          onChange={(newData) => {
            logger.log('[ItineraryEditor] TourForm onChange 收到:', { coverImage: newData.coverImage })
            const { meetingPoints, countries, ...restData } = newData
            const updatedData = {
              ...restData,
              status: tourData.status,
              meetingInfo: meetingPoints?.[0] || { time: '', location: '' },
              hotels: newData.hotels || [],
              showPricingDetails: newData.showPricingDetails,
              pricingDetails: newData.pricingDetails,
              priceTiers: newData.priceTiers ?? undefined,
              showPriceTiers: newData.showPriceTiers,
              faqs: newData.faqs ?? undefined,
              showFaqs: newData.showFaqs,
              notices: newData.notices ?? undefined,
              showNotices: newData.showNotices,
              cancellationPolicy: newData.cancellationPolicy ?? undefined,
              showCancellationPolicy: newData.showCancellationPolicy,
            }
            logger.log('[ItineraryEditor] 傳給 parent onChange:', { coverImage: updatedData.coverImage })
            onChange(updatedData)
          }}
        />
      </div>
    </div>
  )
}
