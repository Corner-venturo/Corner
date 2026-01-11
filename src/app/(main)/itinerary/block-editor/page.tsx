/**
 * 區塊編輯器版行程表（新架構）
 *
 * 使用 BlockEditor 組件進行行程編輯
 * 可與原有 /itinerary/new 頁面並存
 */

'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { TourPreview } from '@/components/editor/TourPreview'
import { PublishButton } from '@/components/editor/PublishButton'
import { Button } from '@/components/ui/button'
import { useItineraryStore, useAuthStore } from '@/stores'
import { useItineraries } from '@/hooks/cloud-hooks'
import { toast } from 'sonner'
import { Cloud, CloudOff, Sparkles } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

// 區塊編輯器
import { BlockEditor, tourDataToBlocks, blocksToTourData } from '@/components/editor/block-editor'
import type { AnyBlock } from '@/components/editor/block-editor'
import type { TourFormData } from '@/components/editor/tour-form/types'

function BlockEditorPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const itineraryId = searchParams.get('itinerary_id')

  const { items: itineraries } = useItineraries()
  const { create: createItinerary, update: updateItinerary } = useItineraryStore()
  const { user } = useAuthStore()

  // 區塊狀態
  const [blocks, setBlocks] = useState<AnyBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [currentItineraryId, setCurrentItineraryId] = useState<string | null>(itineraryId)

  // 自動存檔狀態
  const [isDirty, setIsDirty] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // 預覽模式
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')

  // 版本控制（簡化版，區塊編輯器暫不支援版本切換）
  const [currentVersionIndex] = useState(-1)

  // 載入現有行程或創建新行程
  useEffect(() => {
    if (itineraryId && itineraries.length > 0) {
      const itinerary = itineraries.find(i => i.id === itineraryId)
      if (itinerary) {
        // 將現有資料轉換為 TourFormData 格式
        const tourData: TourFormData = {
          tagline: itinerary.tagline || '',
          title: itinerary.title || '',
          subtitle: itinerary.subtitle || '',
          description: itinerary.description || '',
          departureDate: itinerary.departure_date || '',
          tourCode: itinerary.tour_code || '',
          coverImage: itinerary.cover_image || '',
          coverStyle: itinerary.cover_style as TourFormData['coverStyle'],
          country: itinerary.country || '',
          city: itinerary.city || '',
          price: itinerary.price,
          priceNote: itinerary.price_note,
          outboundFlight: itinerary.outbound_flight || {
            airline: '', flightNumber: '', departureAirport: '',
            departureTime: '', arrivalAirport: '', arrivalTime: '',
          },
          returnFlight: itinerary.return_flight || {
            airline: '', flightNumber: '', departureAirport: '',
            departureTime: '', arrivalAirport: '', arrivalTime: '',
          },
          flightStyle: itinerary.flight_style as TourFormData['flightStyle'],
          features: itinerary.features || [],
          featuresStyle: 'original',
          focusCards: itinerary.focus_cards || [],
          leader: itinerary.leader || { name: '', domesticPhone: '', overseasPhone: '' },
          meetingPoints: itinerary.meeting_info ? [itinerary.meeting_info] : [{ time: '', location: '' }],
          hotels: itinerary.hotels || [],
          showFeatures: itinerary.show_features !== false,
          showLeaderMeeting: itinerary.show_leader_meeting !== false,
          showHotels: itinerary.show_hotels || false,
          itinerarySubtitle: itinerary.itinerary_subtitle || '',
          dailyItinerary: itinerary.daily_itinerary || [],
          itineraryStyle: itinerary.itinerary_style as TourFormData['itineraryStyle'],
          pricingDetails: itinerary.pricing_details,
          showPricingDetails: itinerary.show_pricing_details || false,
          priceTiers: itinerary.price_tiers || undefined,
          showPriceTiers: itinerary.show_price_tiers || false,
          faqs: itinerary.faqs || undefined,
          showFaqs: itinerary.show_faqs || false,
          notices: itinerary.notices || undefined,
          showNotices: itinerary.show_notices || false,
          cancellationPolicy: itinerary.cancellation_policy || undefined,
          showCancellationPolicy: itinerary.show_cancellation_policy || false,
        }

        // 轉換為區塊
        const newBlocks = tourDataToBlocks(tourData)
        setBlocks(newBlocks)
      }
    } else if (!itineraryId) {
      // 創建預設區塊
      const defaultData: TourFormData = {
        tagline: 'Venturo Travel 2025',
        title: '',
        subtitle: '',
        description: '',
        departureDate: '',
        tourCode: '',
        country: '',
        city: '',
        outboundFlight: {
          airline: '', flightNumber: '', departureAirport: '',
          departureTime: '', arrivalAirport: '', arrivalTime: '',
        },
        returnFlight: {
          airline: '', flightNumber: '', departureAirport: '',
          departureTime: '', arrivalAirport: '', arrivalTime: '',
        },
        features: [],
        focusCards: [],
        leader: { name: '', domesticPhone: '', overseasPhone: '' },
        meetingPoints: [{ time: '', location: '' }],
        hotels: [],
        itinerarySubtitle: '',
        dailyItinerary: [],
      }
      setBlocks(tourDataToBlocks(defaultData))
    }
    setLoading(false)
  }, [itineraryId, itineraries])

  // 轉換區塊為 TourFormData 用於預覽
  const tourData = blocksToTourData(blocks)

  // 區塊變更處理
  const handleBlocksChange = useCallback((newBlocks: AnyBlock[]) => {
    setBlocks(newBlocks)
    setIsDirty(true)
  }, [])

  // 自動存檔
  const performAutoSave = useCallback(async () => {
    if (!isDirty || blocks.length === 0) return

    setAutoSaveStatus('saving')
    try {
      const data = blocksToTourData(blocks)

      const saveData = {
        tour_id: undefined,
        tagline: data.tagline,
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        departure_date: data.departureDate,
        tour_code: data.tourCode,
        cover_image: data.coverImage,
        cover_style: data.coverStyle || 'original',
        flight_style: data.flightStyle || 'original',
        itinerary_style: data.itineraryStyle || 'original',
        price: data.price || null,
        price_note: data.priceNote || null,
        country: data.country,
        city: data.city,
        status: '提案' as const,
        outbound_flight: data.outboundFlight,
        return_flight: data.returnFlight,
        features: data.features,
        focus_cards: data.focusCards,
        leader: data.leader,
        meeting_info: data.meetingPoints?.[0],
        show_features: data.showFeatures,
        show_leader_meeting: data.showLeaderMeeting,
        hotels: data.hotels || [],
        show_hotels: data.showHotels,
        show_pricing_details: data.showPricingDetails,
        pricing_details: data.pricingDetails,
        price_tiers: data.priceTiers || null,
        show_price_tiers: data.showPriceTiers || false,
        faqs: data.faqs || null,
        show_faqs: data.showFaqs || false,
        notices: data.notices || null,
        show_notices: data.showNotices || false,
        cancellation_policy: data.cancellationPolicy || null,
        show_cancellation_policy: data.showCancellationPolicy || false,
        itinerary_subtitle: data.itinerarySubtitle,
        daily_itinerary: data.dailyItinerary,
      }

      if (currentItineraryId) {
        await updateItinerary(currentItineraryId, saveData as Parameters<typeof updateItinerary>[1])
      } else {
        if (!data.title) {
          setAutoSaveStatus('idle')
          return
        }
        const newItinerary = await createItinerary({
          ...saveData,
          created_by: user?.id || undefined,
        } as Parameters<typeof createItinerary>[0])

        if (newItinerary?.id) {
          setCurrentItineraryId(newItinerary.id)
          window.history.replaceState(null, '', `/itinerary/block-editor?itinerary_id=${newItinerary.id}`)
        }
      }

      setIsDirty(false)
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus('idle'), 3000)
    } catch (error) {
      logger.error('自動存檔失敗:', error)
      setAutoSaveStatus('error')
      toast.error('自動存檔失敗')
    }
  }, [isDirty, blocks, currentItineraryId, updateItinerary, createItinerary, user?.id])

  // 30 秒自動存檔
  useEffect(() => {
    if (isDirty) {
      const timer = setTimeout(performAutoSave, 30000)
      return () => clearTimeout(timer)
    }
  }, [isDirty, performAutoSave])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-morandi-secondary">載入中...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 頁面頂部 */}
      <ResponsiveHeader
        title="區塊編輯器"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '行程管理', href: '/itinerary' },
          { label: '區塊編輯器', href: '#' },
        ]}
        showBackButton
        onBack={() => router.push('/itinerary')}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={performAutoSave}
              disabled={!isDirty || autoSaveStatus === 'saving'}
            >
              {autoSaveStatus === 'saving' ? '存檔中...' : '手動存檔'}
            </Button>
            <PublishButton
              data={{ ...tourData, id: currentItineraryId || undefined }}
              currentVersionIndex={currentVersionIndex}
              onVersionChange={() => {}}
            />
          </div>
        }
      />

      {/* 主要內容區域 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* 左側：區塊編輯器 */}
          <div className="w-1/2 bg-card border-r border-border flex flex-col">
            <div className="h-12 bg-morandi-gold/90 text-white px-4 flex items-center justify-between border-b">
              <div className="flex items-center gap-2">
                <Sparkles size={16} />
                <h2 className="text-sm font-semibold">區塊編輯器</h2>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {autoSaveStatus === 'saving' && (
                  <span className="flex items-center gap-1 text-white/80">
                    <Cloud size={12} className="animate-pulse" />
                    存檔中...
                  </span>
                )}
                {autoSaveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-white/80">
                    <Cloud size={12} />
                    已儲存
                  </span>
                )}
                {autoSaveStatus === 'error' && (
                  <span className="flex items-center gap-1 text-morandi-red/80">
                    <CloudOff size={12} />
                    存檔失敗
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <BlockEditor
                initialBlocks={blocks}
                onBlocksChange={handleBlocksChange}
                showToolbox
              />
            </div>
          </div>

          {/* 右側：即時預覽 */}
          <div className="w-1/2 bg-muted flex flex-col">
            <div className="h-12 bg-card border-b px-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-morandi-primary">即時預覽</h2>
              <div className="flex gap-1 bg-morandi-container/30 rounded p-0.5">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    viewMode === 'desktop'
                      ? 'bg-morandi-gold text-white'
                      : 'text-morandi-secondary hover:text-morandi-primary'
                  }`}
                >
                  💻 電腦
                </button>
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    viewMode === 'mobile'
                      ? 'bg-morandi-gold text-white'
                      : 'text-morandi-secondary hover:text-morandi-primary'
                  }`}
                >
                  📱 手機
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div
                className={`mx-auto bg-card shadow-lg rounded-lg overflow-hidden ${
                  viewMode === 'mobile' ? 'max-w-[390px]' : 'max-w-[1200px]'
                }`}
                style={{ height: viewMode === 'mobile' ? '844px' : 'auto' }}
              >
                <div className="w-full h-full overflow-y-auto">
                  <TourPreview
                    data={{
                      ...tourData,
                      features: tourData.features.map(f => ({
                        ...f,
                        iconComponent: Sparkles,
                      })),
                    }}
                    viewMode={viewMode}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BlockEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morandi-gold" />
        </div>
      }
    >
      <BlockEditorPageContent />
    </Suspense>
  )
}
