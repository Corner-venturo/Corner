/**
 * LinkDocumentsToTourDialog - 旅遊團文件管理對話框
 * 左邊：行程表（根據 proposal_package.itinerary_type 顯示對應類型）
 *   - timeline: 快速行程表（開啟 TimelineItineraryDialog）
 *   - simple: 網頁行程表（跳轉到行程編輯頁面）
 * 中間：團體報價單
 * 右邊：快速報價單
 */

'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Plus,
  FileText,
  Calculator,
  Loader2,
  ExternalLink,
  Unlink,
  Eye,
} from 'lucide-react'
import { useQuoteStore, useTourStore } from '@/stores'
import { useProposalPackages } from '@/hooks/cloud-hooks'
import { generateCode } from '@/stores/utils/code-generator'
import { DEFAULT_CATEGORIES } from '@/features/quotes/constants'
import type { Tour, Quote } from '@/stores/types'
import type { ProposalPackage, TimelineItineraryData } from '@/types/proposal.types'
import { logger } from '@/lib/utils/logger'
import { stripHtml } from '@/lib/utils/string-utils'
import { supabase } from '@/lib/supabase/client'
import { TimelineItineraryDialog } from '@/features/proposals/components/TimelineItineraryDialog'

interface LinkDocumentsToTourDialogProps {
  isOpen: boolean
  onClose: () => void
  tour: Tour
}

export function LinkDocumentsToTourDialog({
  isOpen,
  onClose,
  tour,
}: LinkDocumentsToTourDialogProps) {
  const router = useRouter()

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

  // Proposal Packages（用於取得 timeline_data）
  const { items: proposalPackages, fetchAll: fetchProposalPackages } = useProposalPackages()

  // 報價單狀態
  const [isCreatingStandardQuote, setIsCreatingStandardQuote] = useState(false)
  const [isCreatingQuickQuote, setIsCreatingQuickQuote] = useState(false)
  const [isUnlinkingQuote, setIsUnlinkingQuote] = useState(false)

  // 行程表對話框狀態
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false)

  // 載入資料
  useEffect(() => {
    if (isOpen) {
      fetchQuotes()
      fetchProposalPackages()
    }
  }, [isOpen, fetchQuotes, fetchProposalPackages])

  // 取得 tour 關聯的 proposal_package（透過 proposal_package_id）
  const tourProposalPackage = useMemo(() => {
    const tourWithPackage = tour as Tour & { proposal_package_id?: string }
    if (!tourWithPackage.proposal_package_id) return null
    return proposalPackages.find(p => p.id === tourWithPackage.proposal_package_id) || null
  }, [tour, proposalPackages])

  // 檢查行程表類型
  const itineraryType = useMemo(() => {
    return tourProposalPackage?.itinerary_type || null
  }, [tourProposalPackage])

  // 檢查是否有 timeline_data（快速行程表）
  const hasTimelineData = useMemo(() => {
    return itineraryType === 'timeline' &&
           tourProposalPackage?.timeline_data &&
           typeof tourProposalPackage.timeline_data === 'object' &&
           Object.keys(tourProposalPackage.timeline_data).length > 0
  }, [itineraryType, tourProposalPackage])

  // 檢查是否有簡易行程表（連結到行程表系統）
  const hasSimpleItinerary = useMemo(() => {
    return itineraryType === 'simple' && !!tourProposalPackage?.itinerary_id
  }, [itineraryType, tourProposalPackage])

  // ========== 報價單相關 ==========

  // 已連結的團體報價單
  const linkedStandardQuotes = useMemo(() => {
    return quotes.filter(q => {
      const item = q as Quote & { _deleted?: boolean }
      return q.tour_id === tour.id && !item._deleted && q.quote_type === 'standard'
    })
  }, [quotes, tour.id])

  // 已連結的快速報價單
  const linkedQuickQuotes = useMemo(() => {
    return quotes.filter(q => {
      const item = q as Quote & { _deleted?: boolean }
      return q.tour_id === tour.id && !item._deleted && q.quote_type === 'quick'
    })
  }, [quotes, tour.id])

  // 建立團體報價單
  const handleCreateStandardQuote = async () => {
    try {
      setIsCreatingStandardQuote(true)
      const code = generateCode('TP', {}, quotes)

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
      logger.error('建立團體報價單失敗:', error)
    } finally {
      setIsCreatingStandardQuote(false)
    }
  }

  // 建立快速報價單
  const handleCreateQuickQuote = async () => {
    try {
      setIsCreatingQuickQuote(true)
      const code = generateCode('TP', { quoteType: 'quick' }, quotes)

      const newQuote = await createQuote({
        code,
        name: tour.name,
        quote_type: 'quick',
        status: 'draft',
        tour_id: tour.id,
        group_size: tour.max_participants || 20,
      } as Omit<Quote, 'id' | 'created_at' | 'updated_at'>)

      if (newQuote?.id) {
        onClose()
        router.push(`/quotes/${newQuote.id}`)
      }
    } catch (error) {
      logger.error('建立快速報價單失敗:', error)
    } finally {
      setIsCreatingQuickQuote(false)
    }
  }

  const handleUnlinkQuote = async (e: React.MouseEvent, quote: Quote) => {
    e.stopPropagation()
    try {
      setIsUnlinkingQuote(true)
      await updateQuote(quote.id, {
        tour_id: undefined,
        status: 'proposed',
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

  // 開啟快速行程表對話框
  const handleOpenTimelineDialog = () => {
    setTimelineDialogOpen(true)
  }

  // 開啟簡易行程表（跳轉到行程編輯頁面）
  const handleOpenSimpleItinerary = () => {
    if (tourProposalPackage?.itinerary_id) {
      onClose()
      router.push(`/itinerary/new?itinerary_id=${tourProposalPackage.itinerary_id}`)
    }
  }

  // 關閉行程表對話框
  const handleCloseTimelineDialog = () => {
    setTimelineDialogOpen(false)
  }

  // 儲存時間軸資料
  const handleSaveTimeline = useCallback(async (timelineData: TimelineItineraryData) => {
    if (!tourProposalPackage) return

    try {
      const jsonData = JSON.parse(JSON.stringify(timelineData))

      const { error } = await supabase
        .from('proposal_packages')
        .update({
          itinerary_type: 'timeline',
          timeline_data: jsonData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tourProposalPackage.id)

      if (error) throw error
      fetchProposalPackages()
    } catch (error) {
      logger.error('儲存時間軸資料失敗:', error)
      throw error
    }
  }, [tourProposalPackage, fetchProposalPackages])

  // 主對話框開啟時，子對話框應關閉
  const mainDialogOpen = isOpen && !timelineDialogOpen

  return (
    <>
      {/* 主對話框 */}
      {mainDialogOpen && (
        <Dialog open={mainDialogOpen} onOpenChange={open => !open && onClose()} modal={true}>
          <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>管理文件</DialogTitle>
              <DialogDescription>
                為「{tour.name}」管理行程表與報價單
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-4 mt-4 flex-1 min-h-0 overflow-hidden">
              {/* ========== 左邊：行程表 ========== */}
              <div className="flex flex-col overflow-hidden min-h-0">
                <div className="flex items-center gap-2 pb-2 border-b border-morandi-container flex-shrink-0">
                  <FileText className="w-5 h-5 text-morandi-primary" />
                  <span className="font-medium text-morandi-primary">行程表</span>
                </div>

                {hasTimelineData ? (
                  // 快速行程表（Timeline）
                  <div className="mt-3">
                    <button
                      onClick={handleOpenTimelineDialog}
                      className="w-full flex items-center gap-2 p-3 rounded-lg border border-morandi-gold/30 bg-morandi-gold/5 hover:bg-morandi-gold/10 transition-colors text-left"
                    >
                      <div className="w-6 h-6 rounded bg-morandi-gold/20 flex items-center justify-center shrink-0">
                        <Eye className="w-3.5 h-3.5 text-morandi-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-morandi-gold text-xs">查看/編輯行程表</div>
                        <div className="text-[10px] text-morandi-secondary mt-0.5">
                          快速行程表 · {(tourProposalPackage?.timeline_data as TimelineItineraryData)?.days?.length || 0} 天
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-morandi-gold/60" />
                    </button>
                  </div>
                ) : hasSimpleItinerary ? (
                  // 簡易行程表（連結到行程表系統）
                  <div className="mt-3">
                    <button
                      onClick={handleOpenSimpleItinerary}
                      className="w-full flex items-center gap-2 p-3 rounded-lg border border-morandi-gold/30 bg-morandi-gold/5 hover:bg-morandi-gold/10 transition-colors text-left"
                    >
                      <div className="w-6 h-6 rounded bg-morandi-gold/20 flex items-center justify-center shrink-0">
                        <Eye className="w-3.5 h-3.5 text-morandi-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-morandi-gold text-xs">查看/編輯行程表</div>
                        <div className="text-[10px] text-morandi-secondary mt-0.5">
                          網頁行程表
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-morandi-gold/60" />
                    </button>
                  </div>
                ) : (
                  // 尚未建立行程表
                  <div className="flex-1 flex items-center justify-center mt-3">
                    <div className="text-center py-4 text-morandi-secondary text-[10px]">
                      尚未建立行程表
                    </div>
                  </div>
                )}
              </div>

              {/* ========== 中間：團體報價單 ========== */}
              <div className="flex flex-col overflow-hidden min-h-0">
                <div className="flex items-center gap-2 pb-2 border-b border-morandi-container flex-shrink-0">
                  <Calculator className="w-5 h-5 text-morandi-gold" />
                  <span className="font-medium text-morandi-primary">團體報價單</span>
                </div>

                {/* 建立新團體報價單 */}
                <button
                  onClick={handleCreateStandardQuote}
                  disabled={isCreatingStandardQuote}
                  className="w-full flex items-center gap-2 p-2 mt-3 rounded-lg border border-dashed border-morandi-gold/30 bg-morandi-gold/5 hover:bg-morandi-gold/10 hover:border-morandi-gold/50 transition-colors text-left disabled:opacity-50 flex-shrink-0"
                >
                  <div className="w-6 h-6 rounded bg-morandi-gold/20 flex items-center justify-center shrink-0">
                    {isCreatingStandardQuote ? (
                      <Loader2 className="w-3.5 h-3.5 text-morandi-gold animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-morandi-gold" />
                    )}
                  </div>
                  <span className="font-medium text-morandi-gold text-xs">建立團體報價單</span>
                </button>

                {/* 已關聯的團體報價單 */}
                {linkedStandardQuotes.length > 0 && (
                  <div className="flex-shrink-0 mt-3">
                    <div className="text-xs font-medium text-morandi-secondary mb-1.5">已建立</div>
                    <div className="space-y-1">
                      {linkedStandardQuotes.map(quote => (
                        <div
                          key={quote.id}
                          className="flex items-center justify-between p-1.5 rounded-lg border border-morandi-gold/30 bg-morandi-gold/5 text-xs"
                        >
                          <button
                            onClick={() => handleViewQuote(quote)}
                            className="flex-1 min-w-0 text-left hover:opacity-80"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-morandi-gold">{quote.code}</span>
                              <span className="text-morandi-text truncate">{stripHtml(quote.name) || '未命名'}</span>
                            </div>
                          </button>
                          <div className="flex items-center gap-0.5 shrink-0 ml-1">
                            <button
                              onClick={() => handleViewQuote(quote)}
                              className="p-0.5 text-morandi-secondary hover:text-morandi-primary rounded"
                              title="查看"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleUnlinkQuote(e, quote)}
                              disabled={isUnlinkingQuote}
                              className="p-0.5 text-morandi-red/60 hover:text-morandi-red rounded disabled:opacity-50"
                              title="移除"
                            >
                              <Unlink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 空白狀態 */}
                {linkedStandardQuotes.length === 0 && (
                  <div className="flex-1 flex items-center justify-center mt-3">
                    <div className="text-center py-4 text-morandi-secondary text-[10px]">
                      尚未建立團體報價單
                    </div>
                  </div>
                )}
              </div>

              {/* ========== 右邊：快速報價單 ========== */}
              <div className="flex flex-col overflow-hidden min-h-0">
                <div className="flex items-center gap-2 pb-2 border-b border-morandi-container flex-shrink-0">
                  <Calculator className="w-5 h-5 text-morandi-primary" />
                  <span className="font-medium text-morandi-primary">快速報價單</span>
                </div>

                {/* 建立新快速報價單 */}
                <button
                  onClick={handleCreateQuickQuote}
                  disabled={isCreatingQuickQuote}
                  className="w-full flex items-center gap-2 p-2 mt-3 rounded-lg border border-dashed border-morandi-primary/30 bg-morandi-primary/5 hover:bg-morandi-primary/10 hover:border-morandi-primary/50 transition-colors text-left disabled:opacity-50 flex-shrink-0"
                >
                  <div className="w-6 h-6 rounded bg-morandi-primary/20 flex items-center justify-center shrink-0">
                    {isCreatingQuickQuote ? (
                      <Loader2 className="w-3.5 h-3.5 text-morandi-primary animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-morandi-primary" />
                    )}
                  </div>
                  <span className="font-medium text-morandi-primary text-xs">建立快速報價單</span>
                </button>

                {/* 已關聯的快速報價單 */}
                {linkedQuickQuotes.length > 0 && (
                  <div className="flex-shrink-0 mt-3">
                    <div className="text-xs font-medium text-morandi-secondary mb-1.5">已建立</div>
                    <div className="space-y-1">
                      {linkedQuickQuotes.map(quote => (
                        <div
                          key={quote.id}
                          className="flex items-center justify-between p-1.5 rounded-lg border border-morandi-primary/30 bg-morandi-primary/5 text-xs"
                        >
                          <button
                            onClick={() => handleViewQuote(quote)}
                            className="flex-1 min-w-0 text-left hover:opacity-80"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-morandi-primary">{quote.code}</span>
                              <span className="text-morandi-text truncate">{stripHtml(quote.name) || '未命名'}</span>
                            </div>
                          </button>
                          <div className="flex items-center gap-0.5 shrink-0 ml-1">
                            <button
                              onClick={() => handleViewQuote(quote)}
                              className="p-0.5 text-morandi-secondary hover:text-morandi-primary rounded"
                              title="查看"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleUnlinkQuote(e, quote)}
                              disabled={isUnlinkingQuote}
                              className="p-0.5 text-morandi-red/60 hover:text-morandi-red rounded disabled:opacity-50"
                              title="移除"
                            >
                              <Unlink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 空白狀態 */}
                {linkedQuickQuotes.length === 0 && (
                  <div className="flex-1 flex items-center justify-center mt-3">
                    <div className="text-center py-4 text-morandi-secondary text-[10px]">
                      尚未建立快速報價單
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 時間軸行程表對話框 */}
      {tourProposalPackage && (
        <TimelineItineraryDialog
          isOpen={timelineDialogOpen}
          onClose={handleCloseTimelineDialog}
          pkg={tourProposalPackage}
          onSave={handleSaveTimeline}
        />
      )}
    </>
  )
}
