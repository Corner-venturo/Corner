'use client'

/**
 * 模板選擇器組件
 *
 * 簡化版：只選擇風格，進入編輯器後再逐步新增頁面
 */

import { useState, useCallback, useEffect } from 'react'
import {
  BookOpen,
  ChevronRight,
  Check,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  styleSeries,
  generatePageFromTemplate,
  itineraryToTemplateData,
  type StyleSeries,
} from '../templates/engine'
import type { TemplateData } from '../templates/definitions/types'
import type { CanvasPage } from './types'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { cn } from '@/lib/utils'

interface TemplateSelectorProps {
  itineraryId?: string | null
  onBack: () => void
  onComplete: (pages: CanvasPage[], templateData: TemplateData | null, selectedStyle: StyleSeries) => void
  sidebarWidth: string
}

export function TemplateSelector({
  itineraryId,
  onBack,
  onComplete,
  sidebarWidth,
}: TemplateSelectorProps) {
  // 選擇的風格系列
  const [selectedStyle, setSelectedStyle] = useState<StyleSeries | null>(
    styleSeries[0] || null
  )
  // 行程資料
  const [itineraryData, setItineraryData] = useState<TemplateData | null>(null)
  // 載入狀態
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // 載入行程資料
  useEffect(() => {
    if (!itineraryId) return

    const loadItinerary = async () => {
      setIsLoading(true)
      setLoadError(null)

      try {
        const { data, error } = await supabase
          .from('itineraries')
          .select('*')
          .eq('id', itineraryId)
          .single()

        if (error) throw error

        if (data) {
          // 轉換為 TemplateData（處理 null -> undefined）
          const templateData = itineraryToTemplateData({
            title: data.title ?? undefined,
            subtitle: data.subtitle ?? undefined,
            tour_code: data.tour_code ?? undefined,
            cover_image: data.cover_image ?? undefined,
            country: data.country ?? undefined,
            city: data.city ?? undefined,
            departure_date: data.departure_date ?? undefined,
            return_date: (data as { return_date?: string | null }).return_date ?? undefined,
            meeting_info: (data.meeting_info as Record<string, unknown>) ?? undefined,
            leader: (data.leader as Record<string, unknown>) ?? undefined,
            outbound_flight: (data.outbound_flight as Record<string, unknown>) ?? undefined,
            return_flight: (data.return_flight as Record<string, unknown>) ?? undefined,
            daily_itinerary: (data.daily_itinerary as Array<Record<string, unknown>>) ?? undefined,
          })
          setItineraryData(templateData)
        }
      } catch (err) {
        logger.error('Failed to load itinerary:', err)
        setLoadError('載入行程資料失敗')
      } finally {
        setIsLoading(false)
      }
    }

    loadItinerary()
  }, [itineraryId])

  // 開始編輯（只生成封面頁）
  const handleStart = useCallback(async () => {
    if (!selectedStyle) return

    setIsGenerating(true)

    try {
      const data = itineraryData || {
        mainTitle: '旅遊手冊',
        companyName: 'Corner Travel',
      }

      // 只生成封面頁
      const coverTemplateId = selectedStyle.templates.cover
      const coverPage = generatePageFromTemplate(coverTemplateId, data)

      onComplete([coverPage], itineraryData, selectedStyle)
    } catch (err) {
      logger.error('Failed to generate cover:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [selectedStyle, itineraryData, onComplete])

  return (
    <div
      className="fixed inset-0 bg-background transition-all duration-300 overflow-auto"
      style={{ left: sidebarWidth }}
    >
      {/* Header */}
      <div className="h-[72px] bg-background border-b border-border flex items-center px-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mr-4">
          <ArrowLeft size={16} />
          返回
        </Button>
        <div className="flex items-center gap-3">
          <BookOpen size={24} className="text-morandi-gold" />
          <h1 className="text-xl font-semibold text-morandi-primary">選擇手冊風格</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 max-w-3xl mx-auto">
        {/* 載入行程資料提示 */}
        {itineraryId && (
          <div className="mb-8 p-4 rounded-lg bg-morandi-gold/10 border border-morandi-gold/30">
            {isLoading ? (
              <div className="flex items-center gap-2 text-morandi-secondary">
                <Loader2 size={16} className="animate-spin" />
                正在載入行程資料...
              </div>
            ) : loadError ? (
              <div className="text-morandi-red">{loadError}</div>
            ) : itineraryData ? (
              <div>
                <div className="flex items-center gap-2 text-morandi-primary font-medium">
                  <Check size={16} className="text-morandi-green" />
                  已載入行程：{itineraryData.mainTitle || '未命名行程'}
                </div>
                {itineraryData.coverImage && (
                  <p className="text-sm text-morandi-secondary mt-1">
                    ✓ 包含封面圖片
                  </p>
                )}
                {itineraryData.travelDates && (
                  <p className="text-sm text-morandi-secondary">
                    日期：{itineraryData.travelDates}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* 選擇風格 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-morandi-primary mb-4">
            選擇設計風格
          </h2>
          <p className="text-sm text-morandi-secondary mb-4">
            選擇風格後，會先建立封面頁，您可以在編輯器中逐步新增其他頁面
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {styleSeries.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style)}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                  selectedStyle?.id === style.id
                    ? 'border-morandi-gold bg-morandi-gold/5'
                    : 'border-border hover:border-morandi-gold/50'
                )}
              >
                {/* 預覽縮圖 */}
                <div className="w-16 h-24 rounded-lg bg-morandi-container flex items-center justify-center overflow-hidden">
                  <div className="w-12 h-18 bg-white rounded shadow-sm flex flex-col items-center justify-center p-1">
                    <div className="w-full h-1 bg-morandi-gold/30 rounded mb-1" />
                    <div className="w-8 h-8 bg-morandi-container rounded" />
                    <div className="w-full h-1 bg-morandi-primary/20 rounded mt-1" />
                    <div className="w-6 h-0.5 bg-morandi-primary/20 rounded mt-0.5" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-morandi-primary">{style.name}</h3>
                    {selectedStyle?.id === style.id && (
                      <Check size={16} className="text-morandi-gold" />
                    )}
                  </div>
                  <p className="text-sm text-morandi-secondary mt-1">
                    簡約、留白、優雅的設計風格
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 開始按鈕 */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onBack}>
            取消
          </Button>
          <Button
            onClick={handleStart}
            disabled={!selectedStyle || isGenerating || isLoading}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                準備中...
              </>
            ) : (
              <>
                <ChevronRight size={16} />
                開始編輯
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
