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
import { useItineraryStore, useQuoteStore } from '@/stores'
import { generateCode } from '@/stores/utils/code-generator'
import { DEFAULT_CATEGORIES } from '@/features/quotes/constants'
import type { Tour, Itinerary, Quote } from '@/stores/types'

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
    return itineraries.filter(i => i.tour_id === tour.id && !(i as any)._deleted)
  }, [itineraries, tour.id])

  const availableItineraries = useMemo(() => {
    let filtered = itineraries
      .filter(i => !(i as any)._deleted)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())

    if (itineraryFilterType === 'template') {
      filtered = filtered.filter(i => i.is_template === true)
    } else if (itineraryFilterType === 'non-template') {
      filtered = filtered.filter(i => i.is_template !== true && !i.tour_id)
    } else {
      filtered = filtered.filter(i => i.is_template === true || !i.tour_id)
    }

    if (itinerarySearchQuery.trim()) {
      const query = itinerarySearchQuery.toLowerCase()
      filtered = filtered.filter(i =>
        (i.title?.toLowerCase().includes(query)) ||
        (i.tour_code?.toLowerCase().includes(query)) ||
        (i.city?.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [itineraries, itineraryFilterType, itinerarySearchQuery])

  const handleCreateItinerary = async () => {
    try {
      setIsCreatingItinerary(true)
      const newItinerary = await createItinerary({
        title: tour.name,
        tour_id: tour.id,
        tour_code: tour.code,
        status: 'draft',
        departure_date: tour.departure_date || '',
        city: tour.location || '',
        daily_itinerary: [],
      } as any)

      if (newItinerary?.id) {
        onClose()
        router.push(`/itinerary/new?id=${newItinerary.id}`)
      }
    } catch (error) {
      console.error('建立行程表失敗:', error)
    } finally {
      setIsCreatingItinerary(false)
    }
  }

  const handleLinkItinerary = async (itinerary: Itinerary) => {
    try {
      setIsLinkingItinerary(true)

      if (itinerary.is_template) {
        const newItinerary = await createItinerary({
          ...itinerary,
          id: undefined,
          tour_id: tour.id,
          tour_code: tour.code,
          is_template: false,
          title: itinerary.title || tour.name,
        } as any)

        if (newItinerary?.id) {
          onClose()
          router.push(`/itinerary/new?id=${newItinerary.id}`)
        }
      } else {
        await updateItinerary(itinerary.id, {
          tour_id: tour.id,
          tour_code: tour.code,
        })
        onClose()
        router.push(`/itinerary/new?id=${itinerary.id}`)
      }
    } catch (error) {
      console.error('連結行程表失敗:', error)
    } finally {
      setIsLinkingItinerary(false)
    }
  }

  const handleUnlinkItinerary = async (e: React.MouseEvent, itinerary: Itinerary) => {
    e.stopPropagation()
    try {
      setIsUnlinkingItinerary(true)
      await updateItinerary(itinerary.id, {
        tour_id: null,
        tour_code: null,
      })
      await fetchItineraries()
    } catch (error) {
      console.error('斷開連結失敗:', error)
    } finally {
      setIsUnlinkingItinerary(false)
    }
  }

  const handleViewItinerary = (itinerary: Itinerary) => {
    onClose()
    router.push(`/itinerary/new?id=${itinerary.id}`)
  }

  // ========== 報價單相關 ==========

  const linkedQuotes = useMemo(() => {
    return quotes.filter(q => q.tour_id === tour.id && !(q as any)._deleted)
  }, [quotes, tour.id])

  const availableQuotes = useMemo(() => {
    let filtered = quotes
      .filter(q => q.quote_type === 'standard' && !q.tour_id && !(q as any)._deleted)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    if (quoteSearchQuery.trim()) {
      const query = quoteSearchQuery.toLowerCase()
      filtered = filtered.filter(q =>
        (q.name?.toLowerCase().includes(query)) ||
        (q.code?.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [quotes, quoteSearchQuery])

  const handleCreateQuote = async () => {
    try {
      setIsCreatingQuote(true)
      const code = generateCode('TP', { quoteType: 'standard' }, quotes)

      const newQuote = await createQuote({
        code,
        name: tour.name,
        quote_type: 'standard',
        status: 'draft',
        tour_id: tour.id,
        categories: DEFAULT_CATEGORIES,
        group_size: tour.max_participants || 20,
      } as any)

      if (newQuote?.id) {
        onClose()
        router.push(`/quotes/${newQuote.id}`)
      }
    } catch (error) {
      console.error('建立報價單失敗:', error)
    } finally {
      setIsCreatingQuote(false)
    }
  }

  const handleLinkQuote = async (quote: Quote) => {
    try {
      setIsLinkingQuote(true)
      await updateQuote(quote.id, { tour_id: tour.id })
      onClose()
      router.push(`/quotes/${quote.id}`)
    } catch (error) {
      console.error('連結報價單失敗:', error)
    } finally {
      setIsLinkingQuote(false)
    }
  }

  const handleUnlinkQuote = async (e: React.MouseEvent, quote: Quote) => {
    e.stopPropagation()
    try {
      setIsUnlinkingQuote(true)
      await updateQuote(quote.id, { tour_id: null })
      await fetchQuotes()
    } catch (error) {
      console.error('斷開連結失敗:', error)
    } finally {
      setIsUnlinkingQuote(false)
    }
  }

  const handleViewQuote = (quote: Quote) => {
    onClose()
    router.push(`/quotes/${quote.id}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>管理文件</DialogTitle>
          <DialogDescription>
            為「{tour.name}」管理行程表與報價單
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-4 overflow-hidden">
          {/* ========== 左邊：行程表 ========== */}
          <div className="space-y-4 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 pb-2 border-b border-morandi-container">
              <FileText className="w-5 h-5 text-morandi-primary" />
              <span className="font-medium text-morandi-primary">行程表</span>
            </div>

            {/* 建立新行程表 */}
            <button
              onClick={handleCreateItinerary}
              disabled={isCreatingItinerary}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-morandi-primary/30 bg-morandi-primary/5 hover:bg-morandi-primary/10 hover:border-morandi-primary/50 transition-colors text-left disabled:opacity-50"
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
              <div>
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
                          <span className="text-morandi-text truncate text-sm">{itinerary.title || '未命名'}</span>
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
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
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
                    <SelectContent>
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
                  {availableItineraries.map(itinerary => (
                    <button
                      key={itinerary.id}
                      onClick={() => handleLinkItinerary(itinerary)}
                      disabled={isLinkingItinerary}
                      className="w-full flex items-center justify-between p-2 rounded-lg border border-morandi-container bg-white hover:bg-morandi-container/30 transition-colors text-left disabled:opacity-50 text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {itinerary.tour_code && (
                            <span className="font-mono text-xs text-morandi-gold">{itinerary.tour_code}</span>
                          )}
                          <span className="text-morandi-text truncate">{itinerary.title || '未命名'}</span>
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
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-morandi-secondary text-xs border border-dashed border-morandi-container rounded-lg">
                  沒有可連結的行程表
                </div>
              )}
            </div>
          </div>

          {/* ========== 右邊：報價單 ========== */}
          <div className="space-y-4 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 pb-2 border-b border-morandi-container">
              <Calculator className="w-5 h-5 text-morandi-gold" />
              <span className="font-medium text-morandi-primary">報價單</span>
            </div>

            {/* 建立新報價單 */}
            <button
              onClick={handleCreateQuote}
              disabled={isCreatingQuote}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-morandi-gold/30 bg-morandi-gold/5 hover:bg-morandi-gold/10 hover:border-morandi-gold/50 transition-colors text-left disabled:opacity-50"
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
              <div>
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
                          <span className="text-morandi-text truncate text-sm">{quote.name || '未命名'}</span>
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
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
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
                  {availableQuotes.map(quote => (
                    <button
                      key={quote.id}
                      onClick={() => handleLinkQuote(quote)}
                      disabled={isLinkingQuote}
                      className="w-full flex items-center justify-between p-2 rounded-lg border border-morandi-container bg-white hover:bg-morandi-container/30 transition-colors text-left disabled:opacity-50 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-morandi-gold">{quote.code}</span>
                        <span className="text-morandi-text truncate">{quote.name || '未命名'}</span>
                        {quote.versions && quote.versions.length > 0 && (
                          <span className="text-[10px] bg-morandi-container text-morandi-secondary px-1 py-0.5 rounded">
                            {quote.versions.length} 版
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
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
