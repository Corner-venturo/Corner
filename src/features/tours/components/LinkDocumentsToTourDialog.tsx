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
import { toast } from 'sonner'

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // 取得 tour 關聯的 proposal_package（透過 proposal_package_id）
  const tourProposalPackage = useMemo(() => {
    if (!tour.proposal_package_id) return null
    return proposalPackages.find(p => p.id === tour.proposal_package_id) || null
  }, [tour, proposalPackages])

  // 檢查行程表類型
  const itineraryType = useMemo(() => {
    return tourProposalPackage?.itinerary_type || null
  }, [tourProposalPackage])

  // 檢查是否有快速行程表（timeline_data）
  const hasTimelineData = useMemo(() => {
    return itineraryType === 'timeline' &&
           tourProposalPackage?.timeline_data &&
           typeof tourProposalPackage.timeline_data === 'object' &&
           Object.keys(tourProposalPackage.timeline_data).length > 0
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

  // 建立快速報價單並跳轉到編輯頁面
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
        customer_name: tour.name,
        tour_code: tour.code || '',
        issue_date: new Date().toISOString().split('T')[0],
        group_size: tour.max_participants || 20,
      } as Omit<Quote, 'id' | 'created_at' | 'updated_at'>)

      if (newQuote?.id) {
        onClose()
        router.push(`/quotes/${newQuote.id}`)
      }
    } catch (error) {
      logger.error('建立快速報價單失敗:', error)
      toast.error('建立快速報價單失敗')
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

  // 開啟行程表對話框
  const handleOpenItineraryDialog = () => {
    setTimelineDialogOpen(true)
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
          <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>管理文件</DialogTitle>
              <DialogDescription>
                為「{tour.name}」管理行程表與報價單
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-4 mt-4 flex-1 min-h-0 overflow-hidden">
              {/* ========== 行程 ========== */}
              <div className="flex flex-col p-3 rounded-lg border border-morandi-container bg-white overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-morandi-container/50 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-morandi-gold" />
                    <span className="font-medium text-sm text-morandi-primary">行程</span>
                  </div>
                  <button
                    onClick={() => {
                      onClose()
                      router.push(`/itinerary/new?tour_id=${tour.id}`)
                    }}
                    className="p-1 text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors"
                    title="新增行程表"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto mt-2">
                  {hasTimelineData ? (
                    <button
                      onClick={handleOpenItineraryDialog}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-morandi-gold/5 transition-colors text-left"
                    >
                      <Eye className="w-3.5 h-3.5 text-morandi-gold" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-morandi-primary">快速行程表</div>
                        <div className="text-[10px] text-morandi-secondary">
                          {(tourProposalPackage?.timeline_data as TimelineItineraryData)?.days?.length || 0} 天
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="text-xs text-morandi-secondary text-center py-4">
                      尚未建立
                    </div>
                  )}
                </div>
              </div>

              {/* ========== 報價 ========== */}
              <div className="flex flex-col p-3 rounded-lg border border-morandi-container bg-white overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-morandi-container/50 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-morandi-gold" />
                    <span className="font-medium text-sm text-morandi-primary">報價</span>
                  </div>
                  <button
                    onClick={handleCreateStandardQuote}
                    disabled={isCreatingStandardQuote}
                    className="p-1 text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors disabled:opacity-50"
                    title="新增報價單"
                  >
                    {isCreatingStandardQuote ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="flex-1 overflow-auto mt-2 space-y-1">
                  {linkedStandardQuotes.length > 0 ? (
                    linkedStandardQuotes.map(quote => (
                      <div
                        key={quote.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-morandi-gold/5 text-xs"
                      >
                        <button
                          onClick={() => handleViewQuote(quote)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <div className="font-mono text-morandi-gold">{quote.code}</div>
                          <div className="text-morandi-secondary truncate text-[10px]">
                            {stripHtml(quote.name) || '未命名'}
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleViewQuote(quote)}
                            className="p-1 text-morandi-secondary hover:text-morandi-primary rounded"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleUnlinkQuote(e, quote)}
                            disabled={isUnlinkingQuote}
                            className="p-1 text-morandi-red/60 hover:text-morandi-red rounded disabled:opacity-50"
                          >
                            <Unlink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-morandi-secondary text-center py-4">
                      尚未建立
                    </div>
                  )}
                </div>
              </div>

              {/* ========== 快速報價單 ========== */}
              <div className="flex flex-col p-3 rounded-lg border border-morandi-container bg-white overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-morandi-container/50 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-morandi-primary" />
                    <span className="font-medium text-sm text-morandi-primary">快速報價單</span>
                  </div>
                  <button
                    onClick={handleCreateQuickQuote}
                    disabled={isCreatingQuickQuote}
                    className="p-1 text-morandi-primary hover:bg-morandi-primary/10 rounded transition-colors disabled:opacity-50"
                    title="新增快速報價單"
                  >
                    {isCreatingQuickQuote ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="flex-1 overflow-auto mt-2 space-y-1">
                  {linkedQuickQuotes.length > 0 ? (
                    linkedQuickQuotes.map(quote => (
                      <div
                        key={quote.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-morandi-primary/5 text-xs"
                      >
                        <button
                          onClick={() => handleViewQuote(quote)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <div className="font-mono text-morandi-primary">{quote.code}</div>
                          <div className="text-morandi-secondary truncate text-[10px]">
                            {stripHtml(quote.name) || '未命名'}
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleViewQuote(quote)}
                            className="p-1 text-morandi-secondary hover:text-morandi-primary rounded"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleUnlinkQuote(e, quote)}
                            disabled={isUnlinkingQuote}
                            className="p-1 text-morandi-red/60 hover:text-morandi-red rounded disabled:opacity-50"
                          >
                            <Unlink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-morandi-secondary text-center py-4">
                      尚未建立
                    </div>
                  )}
                </div>
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
