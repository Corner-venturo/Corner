/**
 * LinkDocumentsToTourDialog - 旅遊團連結文件對話框（合併版）
 * 左邊：行程表管理
 * 右邊：報價單管理
 */

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Plus,
  FileText,
  Calculator,
  Loader2,
  ExternalLink,
  Calendar,
  MapPin,
  Unlink,
  Search,
} from 'lucide-react'
import { useItineraryStore, useQuoteStore, useTourStore } from '@/stores'
import { generateCode } from '@/stores/utils/code-generator'
import { DEFAULT_CATEGORIES } from '@/features/quotes/constants'
import type { Tour, Itinerary, Quote } from '@/stores/types'
import { logger } from '@/lib/utils/logger'
import { stripHtml } from '@/lib/utils/string-utils'

interface LinkDocumentsToTourDialogProps {
  isOpen: boolean
  onClose: () => void
  tour: Tour
}

type FilterType = 'all' | 'template' | 'non-template'

export function LinkDocumentsToTourDialog({
  isOpen,
  onClose,
  tour,
}: LinkDocumentsToTourDialogProps) {
  const router = useRouter()

  // 行程表 Store
  const {
    items: itineraries,
    fetchAll: fetchItineraries,
    create: createItinerary,
    update: updateItinerary,
    loading: loadingItineraries,
  } = useItineraryStore()

  // 報價單 Store
  const {
    items: quotes,
    fetchAll: fetchQuotes,
    create: createQuote,
    update: updateQuote,
    loading: loadingQuotes,
  } = useQuoteStore()

  // 旅遊團 Store（用於查詢報價單連結的旅遊團名稱）
  const { items: tours } = useTourStore()

  // 行程表狀態
  const [isCreatingItinerary, setIsCreatingItinerary] = useState(false)
  const [isLinkingItinerary, setIsLinkingItinerary] = useState(false)
  const [isUnlinkingItinerary, setIsUnlinkingItinerary] = useState(false)
  const [itineraryFilterType, setItineraryFilterType] = useState<FilterType>('all')
  const [itinerarySearchQuery, setItinerarySearchQuery] = useState('')

  // 報價單狀態
  const [isCreatingQuote, setIsCreatingQuote] = useState(false)
  const [isLinkingQuote, setIsLinkingQuote] = useState(false)
  const [isUnlinkingQuote, setIsUnlinkingQuote] = useState(false)
  const [quoteSearchQuery, setQuoteSearchQuery] = useState('')

  // 載入資料
  useEffect(() => {
    if (isOpen) {
      fetchItineraries()
      fetchQuotes()
    }
  }, [isOpen, fetchItineraries, fetchQuotes])

  // ========== 行程表相關 ==========

  const linkedItineraries = useMemo(() => {
    // Filter out soft-deleted items if _deleted flag exists
    return itineraries.filter(i => {
      const item = i as Itinerary & { _deleted?: boolean }
      return i.tour_id === tour.id && !item._deleted
    })
  }, [itineraries, tour.id])

  const availableItineraries = useMemo(() => {
    const isSearching = itinerarySearchQuery.trim().length > 0
    const query = itinerarySearchQuery.toLowerCase()

    // 基本過濾：未刪除、不是當前旅遊團已連結的
    let filtered = itineraries
      .filter(i => {
        const item = i as Itinerary & { _deleted?: boolean }
        return !item._deleted && i.tour_id !== tour.id
      })
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())

    // 先依篩選類型過濾
    if (itineraryFilterType === 'template') {
      filtered = filtered.filter(i => i.is_template === true)
    } else if (itineraryFilterType === 'non-template') {
      if (isSearching) {
        // 搜尋時：顯示所有非範本（包含已綁定其他團的）
        filtered = filtered.filter(i => i.is_template !== true)
      } else {
        // 預設：只顯示未綁定的非範本
        filtered = filtered.filter(i => i.is_template !== true && !i.tour_id)
      }
    } else {
      // all 模式
      if (isSearching) {
        // 搜尋時：顯示所有（範本或非範本，包含已綁定其他團的）
        // 不做額外過濾
      } else {
        // 預設：只顯示範本或未綁定的
        filtered = filtered.filter(i => i.is_template === true || !i.tour_id)
      }
    }

    // 搜尋關鍵字過濾
    if (isSearching) {
      filtered = filtered.filter(i =>
        (i.title?.toLowerCase().includes(query)) ||
        (i.tour_code?.toLowerCase().includes(query)) ||
        (i.city?.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [itineraries, itineraryFilterType, itinerarySearchQuery, tour.id])

  const handleCreateItinerary = async () => {
    try {
      setIsCreatingItinerary(true)
      // Create itinerary with minimal required fields
      // 從旅遊團帶入航班資訊
      const tourWithFlight = tour as typeof tour & {
        outbound_flight?: { text?: string } | null
        return_flight?: { text?: string } | null
      }
      const newItinerary = await createItinerary({
        title: tour.name,
        tour_id: tour.id,
        tour_code: tour.code,
        status: 'draft',
        departure_date: tour.departure_date || '',
        city: tour.location || '',
        daily_itinerary: [],
        // Required fields with defaults
        tagline: '',
        subtitle: '',
        description: '',
        cover_image: '',
        country: '',
        features: [],
        focus_cards: [],
        // 從旅遊團帶入航班資訊
        outbound_flight: tourWithFlight.outbound_flight?.text ? {
          airline: '',
          flightNumber: tourWithFlight.outbound_flight.text,
          departureAirport: '',
          departureTime: '',
          arrivalAirport: '',
          arrivalTime: '',
        } : undefined,
        return_flight: tourWithFlight.return_flight?.text ? {
          airline: '',
          flightNumber: tourWithFlight.return_flight.text,
          departureAirport: '',
          departureTime: '',
          arrivalAirport: '',
          arrivalTime: '',
        } : undefined,
      } as unknown as Omit<Itinerary, 'id' | 'created_at' | 'updated_at'>)

      if (newItinerary?.id) {
        onClose()
        router.push(`/itinerary/new?itinerary_id=${newItinerary.id}`)
      }
    } catch (error) {
      logger.error('建立行程表失敗:', error)
    } finally {
      setIsCreatingItinerary(false)
    }
  }

  const handleLinkItinerary = async (itinerary: Itinerary) => {
    try {
      setIsLinkingItinerary(true)

      if (itinerary.is_template) {
        // 從範本建立新行程表 → 跳轉
        const { id, created_at, updated_at, ...templateData } = itinerary
        const newItinerary = await createItinerary({
          ...templateData,
          tour_id: tour.id,
          tour_code: tour.code,
          is_template: false,
          title: itinerary.title || tour.name,
        } as Omit<Itinerary, 'id' | 'created_at' | 'updated_at'>)

        if (newItinerary?.id) {
          onClose()
          router.push(`/itinerary/new?itinerary_id=${newItinerary.id}`)
        }
      } else {
        // 連結現有行程表 → 不跳轉，只更新列表
        await updateItinerary(itinerary.id, {
          tour_id: tour.id,
          tour_code: tour.code,
        })
        await fetchItineraries()
      }
    } catch (error) {
      logger.error('連結行程表失敗:', error)
    } finally {
      setIsLinkingItinerary(false)
    }
  }

  const handleUnlinkItinerary = async (e: React.MouseEvent, itinerary: Itinerary) => {
    e.stopPropagation()
    try {
      setIsUnlinkingItinerary(true)
      await updateItinerary(itinerary.id, {
        tour_id: undefined,
        tour_code: undefined,
      })
      await fetchItineraries()
    } catch (error) {
      logger.error('斷開連結失敗:', error)
    } finally {
      setIsUnlinkingItinerary(false)
    }
  }

  const handleViewItinerary = (itinerary: Itinerary) => {
    onClose()
    router.push(`/itinerary/new?itinerary_id=${itinerary.id}`)
  }

  // ========== 報價單相關 ==========

  const linkedQuotes = useMemo(() => {
    // Filter out soft-deleted items if _deleted flag exists
    return quotes.filter(q => {
      const item = q as Quote & { _deleted?: boolean }
      return q.tour_id === tour.id && !item._deleted
    })
  }, [quotes, tour.id])

  const availableQuotes = useMemo(() => {
    const isSearching = quoteSearchQuery.trim().length > 0
    const query = quoteSearchQuery.toLowerCase()

    // 基本過濾：標準報價單、未刪除、不是當前旅遊團已連結的
    let filtered = quotes
      .filter(q => {
        const item = q as Quote & { _deleted?: boolean }
        return q.quote_type === 'standard' && !item._deleted && q.tour_id !== tour.id
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    if (isSearching) {
      // 搜尋時：顯示所有報價單（包含已綁定其他團的）
      filtered = filtered.filter(q =>
        (q.name?.toLowerCase().includes(query)) ||
        (q.code?.toLowerCase().includes(query))
      )
    } else {
      // 預設：只顯示未綁定的報價單
      filtered = filtered.filter(q => !q.tour_id)
    }

    return filtered
  }, [quotes, quoteSearchQuery, tour.id])

  // 取得報價單連結的旅遊團名稱
  const getLinkedTourName = (tourId: string | null | undefined): string | null => {
    if (!tourId) return null
    const linkedTour = tours.find(t => t.id === tourId)
    return linkedTour ? linkedTour.name : '未知旅遊團'
  }

  const handleCreateQuote = async () => {
    try {
      setIsCreatingQuote(true)
      const code = generateCode('TP', {}, quotes)

      // Create quote with minimal required fields
      const newQuote = await createQuote({
        code,
        name: tour.name,
        quote_type: 'standard',
        status: 'draft',
        tour_id: tour.id,
        categories: DEFAULT_CATEGORIES,
        group_size: tour.max_participants || 20,
      } as Omit<Quote, 'id' | 'created_at' | 'updated_at'>)

      if (newQuote?.id) {
        onClose()
        router.push(`/quotes/${newQuote.id}`)
      }
    } catch (error) {
      logger.error('建立報價單失敗:', error)
    } finally {
      setIsCreatingQuote(false)
    }
  }

  const handleLinkQuote = async (quote: Quote) => {
    try {
      setIsLinkingQuote(true)
      await updateQuote(quote.id, {
        tour_id: tour.id,
        status: '進行中', // 綁定旅遊團後自動變更為進行中
      })
      await fetchQuotes() // 重新載入以更新列表
    } catch (error) {
      logger.error('連結報價單失敗:', error)
    } finally {
      setIsLinkingQuote(false)
    }
  }

  const handleUnlinkQuote = async (e: React.MouseEvent, quote: Quote) => {
    e.stopPropagation()
    try {
      setIsUnlinkingQuote(true)
      await updateQuote(quote.id, {
        tour_id: undefined,
        status: 'proposed', // 解除綁定後自動變更為提案
      })
      await fetchQuotes()
    } catch (error) {
      logger.error('斷開連結失敗:', error)
    } finally {
      setIsUnlinkingQuote(false)
    }
  }

  const handleViewQuote = (quote: Quote) => {
    onClose()
    router.push(`/quotes/${quote.id}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()} modal={true}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>管理文件</DialogTitle>
          <DialogDescription>
            為「{tour.name}」管理行程表與報價單
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-4 flex-1 min-h-0 overflow-hidden">
          {/* ========== 左邊：行程表 ========== */}
          <div className="flex flex-col overflow-hidden min-h-0">
            <div className="flex items-center gap-2 pb-2 border-b border-morandi-container flex-shrink-0">
              <FileText className="w-5 h-5 text-morandi-primary" />
              <span className="font-medium text-morandi-primary">行程表</span>
            </div>

            {/* 建立新行程表 */}
            <button
              onClick={handleCreateItinerary}
              disabled={isCreatingItinerary}
              className="w-full flex items-center gap-3 p-3 mt-4 rounded-lg border border-dashed border-morandi-primary/30 bg-morandi-primary/5 hover:bg-morandi-primary/10 hover:border-morandi-primary/50 transition-colors text-left disabled:opacity-50 flex-shrink-0"
            >
              <div className="w-7 h-7 rounded bg-morandi-primary/20 flex items-center justify-center shrink-0">
                {isCreatingItinerary ? (
                  <Loader2 className="w-4 h-4 text-morandi-primary animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 text-morandi-primary" />
                )}
              </div>
              <span className="font-medium text-morandi-primary text-sm">建立新行程表</span>
            </button>

            {/* 已關聯的行程表 */}
            {linkedItineraries.length > 0 && (
              <div className="flex-shrink-0 mt-4">
                <div className="text-xs font-medium text-morandi-secondary mb-2">已關聯</div>
                <div className="space-y-1.5">
                  {linkedItineraries.map(itinerary => (
                    <div
                      key={itinerary.id}
                      className="flex items-center justify-between p-2 rounded-lg border border-morandi-gold/30 bg-morandi-gold/5 text-sm"
                    >
                      <button
                        onClick={() => handleViewItinerary(itinerary)}
                        className="flex-1 min-w-0 text-left hover:opacity-80"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-morandi-gold">{itinerary.tour_code}</span>
                          <span className="text-morandi-text truncate text-sm">{stripHtml(itinerary.title) || '未命名'}</span>
                        </div>
                      </button>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => handleViewItinerary(itinerary)}
                          className="p-1 text-morandi-secondary hover:text-morandi-primary rounded"
                          title="查看"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleUnlinkItinerary(e, itinerary)}
                          disabled={isUnlinkingItinerary}
                          className="p-1 text-morandi-red/60 hover:text-morandi-red rounded disabled:opacity-50"
                          title="斷開連結"
                        >
                          {isUnlinkingItinerary ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Unlink className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 連結現有行程表 */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 mt-4">
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <span className="text-xs font-medium text-morandi-secondary">連結現有</span>
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-morandi-secondary" />
                    <Input
                      value={itinerarySearchQuery}
                      onChange={(e) => setItinerarySearchQuery(e.target.value)}
                      placeholder="搜尋..."
                      className="w-[100px] h-7 pl-7 text-xs"
                    />
                  </div>
                  <Select value={itineraryFilterType} onValueChange={(v) => setItineraryFilterType(v as FilterType)}>
                    <SelectTrigger className="w-[90px] h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="template">公司範例</SelectItem>
                      <SelectItem value="non-template">非公司範例</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loadingItineraries ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-morandi-secondary" />
                </div>
              ) : availableItineraries.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
                  {availableItineraries.map(itinerary => {
                    const isLinkedToOtherTour = !!itinerary.tour_id && !itinerary.is_template
                    const linkedTourName = getLinkedTourName(itinerary.tour_id)

                    return (
                      <button
                        key={itinerary.id}
                        onClick={() => !isLinkedToOtherTour && handleLinkItinerary(itinerary)}
                        disabled={isLinkingItinerary || isLinkedToOtherTour}
                        className={`w-full flex flex-col p-2 rounded-lg border transition-colors text-left text-sm ${
                          isLinkedToOtherTour
                            ? 'border-morandi-container/50 bg-morandi-container/20 cursor-not-allowed opacity-60'
                            : 'border-morandi-container bg-white hover:bg-morandi-container/30 disabled:opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {itinerary.tour_code && (
                            <span className={`font-mono text-xs ${isLinkedToOtherTour ? 'text-morandi-secondary' : 'text-morandi-gold'}`}>
                              {itinerary.tour_code}
                            </span>
                          )}
                          <span className={`truncate ${isLinkedToOtherTour ? 'text-morandi-secondary' : 'text-morandi-text'}`}>
                            {stripHtml(itinerary.title) || '未命名'}
                          </span>
                          {itinerary.is_template && (
                            <span className="text-[10px] bg-morandi-primary/10 text-morandi-primary px-1 py-0.5 rounded">
                              範例
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-morandi-secondary mt-0.5">
                          {itinerary.city && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {itinerary.city}
                            </span>
                          )}
                          {itinerary.daily_itinerary?.length > 0 && (
                            <span>{itinerary.daily_itinerary.length} 天</span>
                          )}
                        </div>
                        {isLinkedToOtherTour && linkedTourName && (
                          <div className="text-[10px] text-morandi-secondary mt-1 flex items-center gap-1">
                            <span>已連結：</span>
                            <span className="text-morandi-primary/70 truncate">{linkedTourName}</span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-morandi-secondary text-xs border border-dashed border-morandi-container rounded-lg">
                  沒有可連結的行程表
                </div>
              )}
            </div>
          </div>

          {/* ========== 右邊：報價單 ========== */}
          <div className="flex flex-col overflow-hidden min-h-0">
            <div className="flex items-center gap-2 pb-2 border-b border-morandi-container flex-shrink-0">
              <Calculator className="w-5 h-5 text-morandi-gold" />
              <span className="font-medium text-morandi-primary">報價單</span>
            </div>

            {/* 建立新報價單 */}
            <button
              onClick={handleCreateQuote}
              disabled={isCreatingQuote}
              className="w-full flex items-center gap-3 p-3 mt-4 rounded-lg border border-dashed border-morandi-gold/30 bg-morandi-gold/5 hover:bg-morandi-gold/10 hover:border-morandi-gold/50 transition-colors text-left disabled:opacity-50 flex-shrink-0"
            >
              <div className="w-7 h-7 rounded bg-morandi-gold/20 flex items-center justify-center shrink-0">
                {isCreatingQuote ? (
                  <Loader2 className="w-4 h-4 text-morandi-gold animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 text-morandi-gold" />
                )}
              </div>
              <span className="font-medium text-morandi-gold text-sm">建立新報價單</span>
            </button>

            {/* 已關聯的報價單 */}
            {linkedQuotes.length > 0 && (
              <div className="flex-shrink-0 mt-4">
                <div className="text-xs font-medium text-morandi-secondary mb-2">已關聯</div>
                <div className="space-y-1.5">
                  {linkedQuotes.map(quote => (
                    <div
                      key={quote.id}
                      className="flex items-center justify-between p-2 rounded-lg border border-morandi-gold/30 bg-morandi-gold/5 text-sm"
                    >
                      <button
                        onClick={() => handleViewQuote(quote)}
                        className="flex-1 min-w-0 text-left hover:opacity-80"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-morandi-gold">{quote.code}</span>
                          <span className="text-morandi-text truncate text-sm">{stripHtml(quote.name) || stripHtml(quote.destination) || '未命名'}</span>
                          {quote.versions && quote.versions.length > 0 && (
                            <span className="text-[10px] bg-morandi-gold/20 text-morandi-gold px-1 py-0.5 rounded">
                              {quote.versions.length} 版
                            </span>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => handleViewQuote(quote)}
                          className="p-1 text-morandi-secondary hover:text-morandi-primary rounded"
                          title="查看"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleUnlinkQuote(e, quote)}
                          disabled={isUnlinkingQuote}
                          className="p-1 text-morandi-red/60 hover:text-morandi-red rounded disabled:opacity-50"
                          title="斷開連結"
                        >
                          {isUnlinkingQuote ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Unlink className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 連結現有報價單 */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 mt-4">
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <span className="text-xs font-medium text-morandi-secondary">連結現有</span>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-morandi-secondary" />
                  <Input
                    value={quoteSearchQuery}
                    onChange={(e) => setQuoteSearchQuery(e.target.value)}
                    placeholder="搜尋..."
                    className="w-[120px] h-7 pl-7 text-xs"
                  />
                </div>
              </div>

              {loadingQuotes ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-morandi-secondary" />
                </div>
              ) : availableQuotes.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
                  {availableQuotes.map(quote => {
                    const isLinkedToOtherTour = !!quote.tour_id
                    const linkedTourName = getLinkedTourName(quote.tour_id)

                    return (
                      <button
                        key={quote.id}
                        onClick={() => !isLinkedToOtherTour && handleLinkQuote(quote)}
                        disabled={isLinkingQuote || isLinkedToOtherTour}
                        className={`w-full flex flex-col p-2 rounded-lg border transition-colors text-left text-sm ${
                          isLinkedToOtherTour
                            ? 'border-morandi-container/50 bg-morandi-container/20 cursor-not-allowed opacity-60'
                            : 'border-morandi-container bg-white hover:bg-morandi-container/30 disabled:opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs ${isLinkedToOtherTour ? 'text-morandi-secondary' : 'text-morandi-gold'}`}>
                            {quote.code}
                          </span>
                          <span className={`truncate ${isLinkedToOtherTour ? 'text-morandi-secondary' : 'text-morandi-text'}`}>
                            {stripHtml(quote.name) || stripHtml(quote.destination) || '未命名'}
                          </span>
                          {quote.versions && quote.versions.length > 0 && (
                            <span className="text-[10px] bg-morandi-container text-morandi-secondary px-1 py-0.5 rounded">
                              {quote.versions.length} 版
                            </span>
                          )}
                        </div>
                        {isLinkedToOtherTour && linkedTourName && (
                          <div className="text-[10px] text-morandi-secondary mt-1 flex items-center gap-1">
                            <span>已連結：</span>
                            <span className="text-morandi-primary/70 truncate">{linkedTourName}</span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-morandi-secondary text-xs border border-dashed border-morandi-container rounded-lg">
                  沒有可連結的報價單
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
