/**
 * CreateTourSourceDialog - 新增旅遊團時選擇來源
 * 可選擇：從頭開始 / 從行程表建立 / 從報價單建立
 */

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Plus,
  FileText,
  Calculator,
  Loader2,
  MapPin,
  Calendar,
} from 'lucide-react'
import { useItineraryStore, useQuoteStore } from '@/stores'
import type { Itinerary, Quote } from '@/stores/types'

// 去除 HTML 標籤
function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

interface CreateTourSourceDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelectBlank: () => void
  onSelectItinerary: (itinerary: Itinerary) => void
  onSelectQuote: (quote: Quote) => void
}

type DialogStep = 'select' | 'itinerary-list' | 'quote-list'

export function CreateTourSourceDialog({
  isOpen,
  onClose,
  onSelectBlank,
  onSelectItinerary,
  onSelectQuote,
}: CreateTourSourceDialogProps) {
  const [step, setStep] = useState<DialogStep>('select')
  const { items: itineraries, fetchAll: fetchItineraries, loading: loadingItineraries } = useItineraryStore()
  const { items: quotes, fetchAll: fetchQuotes, loading: loadingQuotes } = useQuoteStore()

  // 載入資料
  useEffect(() => {
    if (isOpen) {
      fetchItineraries()
      fetchQuotes()
    }
  }, [isOpen, fetchItineraries, fetchQuotes])

  // 重置狀態
  useEffect(() => {
    if (!isOpen) {
      setStep('select')
    }
  }, [isOpen])

  // 過濾可用的行程表（未關聯旅遊團的）
  const availableItineraries = useMemo(() => {
    return itineraries
      .filter(i => !i.tour_id)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  }, [itineraries])

  // 過濾可用的報價單（標準報價單，未關聯旅遊團的）
  const availableQuotes = useMemo(() => {
    return quotes
      .filter(q => q.quote_type === 'standard' && !q.tour_id)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  }, [quotes])

  const handleSelectBlank = () => {
    onSelectBlank()
    onClose()
  }

  const handleSelectItinerary = (itinerary: Itinerary) => {
    onSelectItinerary(itinerary)
    onClose()
  }

  const handleSelectQuote = (quote: Quote) => {
    onSelectQuote(quote)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        {step === 'select' ? (
          <>
            <DialogHeader>
              <DialogTitle>新增旅遊團</DialogTitle>
              <DialogDescription>
                選擇建立方式：從頭開始，或從現有行程表/報價單建立
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-4">
              {/* 從頭開始 */}
              <button
                onClick={handleSelectBlank}
                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-dashed border-morandi-primary/30 bg-morandi-primary/5 hover:bg-morandi-primary/10 hover:border-morandi-primary/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-morandi-primary/20 flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 text-morandi-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-morandi-primary">從頭開始</div>
                  <div className="text-sm text-morandi-secondary">建立空白旅遊團，手動填寫所有資料</div>
                </div>
              </button>

              {/* 從行程表建立 */}
              <button
                onClick={() => setStep('itinerary-list')}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-morandi-text flex items-center gap-2">
                    從行程表建立
                    {availableItineraries.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                        {availableItineraries.length}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-morandi-secondary">選擇已發布的行程表，自動帶入行程資料</div>
                </div>
              </button>

              {/* 從報價單建立 */}
              <button
                onClick={() => setStep('quote-list')}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Calculator className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-morandi-text flex items-center gap-2">
                    從報價單建立
                    {availableQuotes.length > 0 && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                        {availableQuotes.length}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-morandi-secondary">選擇標準報價單，自動帶入報價資料</div>
                </div>
              </button>
            </div>
          </>
        ) : step === 'itinerary-list' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button
                  onClick={() => setStep('select')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <FileText className="w-4 h-4" />
                </button>
                選擇行程表
              </DialogTitle>
              <DialogDescription>
                選擇要關聯的行程表，旅遊團將自動帶入行程資料
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              {loadingItineraries ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-morandi-secondary" />
                  <span className="ml-2 text-sm text-morandi-secondary">載入中...</span>
                </div>
              ) : availableItineraries.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {availableItineraries.map(itinerary => (
                    <button
                      key={itinerary.id}
                      onClick={() => handleSelectItinerary(itinerary)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-morandi-text truncate">
                          {stripHtml(itinerary.title) || '未命名行程'}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-morandi-secondary mt-1">
                          {itinerary.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {itinerary.city}
                            </span>
                          )}
                          {itinerary.departure_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {itinerary.departure_date}
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
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-morandi-secondary/30 mx-auto mb-3" />
                  <p className="text-sm text-morandi-secondary">目前沒有可選擇的行程表</p>
                  <p className="text-xs text-morandi-secondary/70 mt-1">請先建立並發布行程表</p>
                </div>
              )}
            </div>

            <div className="flex justify-start mt-4">
              <Button variant="ghost" size="sm" onClick={() => setStep('select')}>
                ← 返回
              </Button>
            </div>
          </>
        ) : step === 'quote-list' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button
                  onClick={() => setStep('select')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Calculator className="w-4 h-4" />
                </button>
                選擇報價單
              </DialogTitle>
              <DialogDescription>
                選擇要關聯的報價單，旅遊團將自動帶入報價資料
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              {loadingQuotes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-morandi-secondary" />
                  <span className="ml-2 text-sm text-morandi-secondary">載入中...</span>
                </div>
              ) : availableQuotes.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {availableQuotes.map(quote => (
                    <button
                      key={quote.id}
                      onClick={() => handleSelectQuote(quote)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-amber-50 hover:border-amber-300 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center shrink-0">
                        <Calculator className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-morandi-gold">{quote.code}</span>
                          <span className="font-medium text-morandi-text truncate">
                            {stripHtml(quote.name) || stripHtml(quote.destination) || '未命名報價單'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-morandi-secondary mt-1">
                          {quote.destination && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {quote.destination}
                            </span>
                          )}
                          {quote.group_size && (
                            <span>{quote.group_size} 人</span>
                          )}
                          {quote.days && (
                            <span>{quote.days} 天</span>
                          )}
                          {quote.total_cost && (
                            <span className="text-morandi-gold">
                              NT$ {quote.total_cost.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="w-10 h-10 text-morandi-secondary/30 mx-auto mb-3" />
                  <p className="text-sm text-morandi-secondary">目前沒有可選擇的報價單</p>
                  <p className="text-xs text-morandi-secondary/70 mt-1">請先建立標準報價單</p>
                </div>
              )}
            </div>

            <div className="flex justify-start mt-4">
              <Button variant="ghost" size="sm" onClick={() => setStep('select')}>
                ← 返回
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
