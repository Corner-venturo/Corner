'use client'
/**
 * LinkDocumentsToTourDialog - 快速報價單管理對話框
 *
 * 注意：團體報價單和行程表已移至專屬分頁（TourQuoteTab、TourItineraryTab）
 * 此對話框現在只用於管理快速報價單（可建立多份比價）
 */


import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
// DropdownMenu 已移除 - 統一使用 PackageItineraryDialog 入口
import {
  Plus,
  FileText,
  Calculator,
  Loader2,
  ExternalLink,
  Unlink,
  Trash2,
  Eye,
  Zap,
  Clock,
} from 'lucide-react'
import { useQuotes, useToursSlim, useOrdersSlim, createQuote, updateQuote, deleteQuote, invalidateQuotes, useProposalPackage } from '@/data'
import { DEFAULT_CATEGORIES } from '@/features/quotes/constants'
import type { Tour, Quote } from '@/stores/types'
import type { ProposalPackage, TimelineItineraryData } from '@/types/proposal.types'
import { logger } from '@/lib/utils/logger'
import { stripHtml } from '@/lib/utils/string-utils'
import { supabase } from '@/lib/supabase/client'
import { dynamicFrom } from '@/lib/supabase/typed-client'
import { syncTimelineToQuote } from '@/lib/utils/itinerary-quote-sync'
import dynamic from 'next/dynamic'

const ItineraryDialog = dynamic(() => import('@/features/proposals/components/ItineraryDialog').then(m => m.ItineraryDialog), { ssr: false })
import { PackageItineraryDialog } from '@/features/proposals/components/PackageItineraryDialog'
import { toast } from 'sonner'
import type { Proposal } from '@/types/proposal.types'
import { TOURS_LABELS } from './constants/labels'
import { LINK_DOCUMENTS_LABELS } from '../constants/labels'

/**
 * 生成團號為基礎的報價單編號
 * - 團體報價單: {團號}-Q{2位數} → DAD260213A-Q01
 * - 快速報價單: {團號}-QQ{2位數} → DAD260213A-QQ01
 */
async function generateTourBasedQuoteCode(
  tourId: string,
  tourCode: string,
  quoteType: 'standard' | 'quick'
): Promise<string> {
  const prefix = quoteType === 'quick' ? 'QQ' : 'Q'
  const codePattern = `${tourCode}-${prefix}%`

  // 查詢該團現有的同類型報價單編號
  const { data: existingQuotes } = await supabase
    .from('quotes')
    .select('code')
    .eq('tour_id', tourId)
    .like('code', codePattern)
    .order('code', { ascending: false })
    .limit(1)

  let nextNumber = 1
  if (existingQuotes && existingQuotes.length > 0 && existingQuotes[0]?.code) {
    // 從 "DAD260213A-Q01" 提取數字部分
    const match = existingQuotes[0].code.match(/-(?:QQ|Q)(\d+)$/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  return `${tourCode}-${prefix}${String(nextNumber).padStart(2, '0')}`
}

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

  // 報價單
  const { items: quotes, loading: loadingQuotes } = useQuotes()

  // 旅遊團（用於查詢報價單連結的旅遊團名稱）
  const { items: tours } = useToursSlim()

  // 訂單（用於取得業務人員）
  const { items: orders } = useOrdersSlim()

  // Proposal Package（只取單筆，避免載入所有 80+ 筆資料）
  const { item: fetchedPackage, refresh: refreshPackage } = useProposalPackage(tour.proposal_package_id || null)

  // 報價單狀態
  const [isCreatingStandardQuote, setIsCreatingStandardQuote] = useState(false)
  const [isCreatingQuickQuote, setIsCreatingQuickQuote] = useState(false)
  const [isUnlinkingQuote, setIsUnlinkingQuote] = useState(false)
  const [isDeletingQuote, setIsDeletingQuote] = useState(false)

  // 行程表對話框狀態
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false)
  const [packageItineraryDialogOpen, setPackageItineraryDialogOpen] = useState(false)
  const [isCreatingPackage, setIsCreatingPackage] = useState(false)

  // 動態建立的 proposal_package（用於沒有 proposal 的旅遊團）
  const [dynamicPackage, setDynamicPackage] = useState<ProposalPackage | null>(null)

  // 載入資料（SWR 自動處理，不需手動 fetch）
  // useProposalPackage 會自動在 tour.proposal_package_id 存在時載入資料

  // 取得 tour 關聯的 proposal_package（透過 proposal_package_id 或動態建立的）
  const tourProposalPackage = useMemo(() => {
    // 優先使用動態建立的 package
    if (dynamicPackage) return dynamicPackage
    // 使用單筆查詢結果（避免載入所有 packages）
    return fetchedPackage || null
  }, [fetchedPackage, dynamicPackage])

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

  // 取得該團的第一筆訂單資訊（用於報價單預填客戶資訊）
  const firstTourOrder = useMemo(() => {
    return orders.find(o => o.tour_id === tour.id) || null
  }, [orders, tour.id])

  const tourSalesPerson = firstTourOrder?.sales_person || null

  // 為 PackageItineraryDialog 建立模擬 Proposal 物件
  const fakeProposal = useMemo((): Proposal => ({
    id: tour.id,
    code: tour.code || '',
    title: tour.name,
    status: 'converted' as const,
    destination: tour.location || null,
    country_id: tour.country_id || null,
    main_city_id: tour.main_city_id || null,
    expected_start_date: tour.departure_date || null,
    expected_end_date: tour.return_date || null,
    created_at: tour.created_at || new Date().toISOString(),
    updated_at: tour.updated_at || new Date().toISOString(),
    workspace_id: tour.workspace_id || '',
  }), [tour])

  // ========== 報價單相關 ==========

  // 已連結的團體報價單（包含 quote_type 為 null 的舊資料）
  const linkedStandardQuotes = useMemo(() => {
    return quotes.filter(q => {
      const item = q as Quote & { _deleted?: boolean }
      // quote_type 為 'standard' 或 null/undefined（舊資料）都算團體報價單
      const isStandardOrLegacy = q.quote_type === 'standard' || q.quote_type === null || q.quote_type === undefined
      return q.tour_id === tour.id && !item._deleted && isStandardOrLegacy
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

      // 生成團號為基礎的編號: {團號}-Q{2位數}
      const quoteCode = tour.code
        ? await generateTourBasedQuoteCode(tour.id, tour.code, 'standard')
        : undefined

      const newQuote = await createQuote({
        name: tour.name,
        quote_type: 'standard',
        status: 'draft',
        tour_id: tour.id,
        categories: DEFAULT_CATEGORIES,
        group_size: tour.max_participants || 20,
        // 客戶資訊：從訂單取得
        customer_name: firstTourOrder?.contact_person || tour.name,
        contact_phone: firstTourOrder?.contact_phone || '',
        tour_code: tour.code || '',
        issue_date: new Date().toISOString().split('T')[0],
        // 從訂單取得業務人員
        handler_name: tourSalesPerson || undefined,
        // 使用團號為基礎的編號
        ...(quoteCode ? { code: quoteCode } : {}),
      } as Parameters<typeof createQuote>[0])

      if (newQuote?.id) {
        onClose()
        router.push(`/quotes/${newQuote.id}`)
      }
    } catch (error) {
      logger.error('建立團體報價單失敗:', error)
      toast.error(LINK_DOCUMENTS_LABELS.CREATE_QUOTE_FAILED)
    } finally {
      setIsCreatingStandardQuote(false)
    }
  }

  // 建立快速報價單並跳轉到編輯頁面
  const handleCreateQuickQuote = async () => {
    try {
      setIsCreatingQuickQuote(true)

      // 生成團號為基礎的編號: {團號}-QQ{2位數}
      const quoteCode = tour.code
        ? await generateTourBasedQuoteCode(tour.id, tour.code, 'quick')
        : undefined

      const createData = {
        name: tour.name,
        quote_type: 'quick' as const,
        status: 'draft' as const,
        tour_id: tour.id,
        // 客戶資訊：優先從訂單取得，否則用團名
        customer_name: firstTourOrder?.contact_person || tour.name,
        contact_phone: firstTourOrder?.contact_phone || '',
        tour_code: tour.code || '',
        issue_date: new Date().toISOString().split('T')[0],
        group_size: tour.max_participants || 20,
        // 從訂單取得業務人員
        handler_name: tourSalesPerson || undefined,
        // 使用團號為基礎的編號
        ...(quoteCode ? { code: quoteCode } : {}),
      }

      const newQuote = await createQuote(createData as Parameters<typeof createQuote>[0])

      if (newQuote?.id) {
        onClose()
        // 快速報價單使用專屬路由
        router.push(`/quotes/quick/${newQuote.id}`)
      }
    } catch (error) {
      logger.error('建立快速報價單失敗:', error)
      toast.error(LINK_DOCUMENTS_LABELS.CREATE_QUICK_QUOTE_FAILED)
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
      // SWR 自動 revalidate
    } catch (error) {
      logger.error('斷開連結失敗:', error)
    } finally {
      setIsUnlinkingQuote(false)
    }
  }

  const handleDeleteQuote = async (e: React.MouseEvent, quote: Quote) => {
    e.stopPropagation()
    if (!confirm(`${TOURS_LABELS.CONFIRM_DELETE_PREFIX}${quote.name}${TOURS_LABELS.CONFIRM_DELETE_SUFFIX}`)) return
    try {
      setIsDeletingQuote(true)
      await deleteQuote(quote.id)
      toast.success(LINK_DOCUMENTS_LABELS.QUOTE_DELETED)
    } catch (error) {
      logger.error('刪除報價單失敗:', error)
      toast.error(LINK_DOCUMENTS_LABELS.DELETE_QUOTE_FAILED)
    } finally {
      setIsDeletingQuote(false)
    }
  }

  const handleViewQuote = (quote: Quote, isQuickQuote = false) => {
    onClose()
    // 根據類型跳轉到對應路由
    if (isQuickQuote || quote.quote_type === 'quick') {
      router.push(`/quotes/quick/${quote.id}`)
    } else {
      router.push(`/quotes/${quote.id}`)
    }
  }

  // 為旅遊團建立或取得 proposal_package
  const getOrCreatePackageForTour = async (): Promise<ProposalPackage | null> => {
    // 如果已有 package，直接返回
    if (tourProposalPackage) return tourProposalPackage

    setIsCreatingPackage(true)
    try {
      // 計算天數
      let days = 5
      if (tour.departure_date && tour.return_date) {
        const start = new Date(tour.departure_date)
        const end = new Date(tour.return_date)
        days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      }

      // 建立新的 proposal_package
      const newPackageData = {
        id: crypto.randomUUID(),
        proposal_id: null, // 獨立 package，不屬於任何提案
        version_name: tour.name || TOURS_LABELS.ITINERARY_VERSION,
        version_number: 1,
        days,
        start_date: tour.departure_date || null,
        end_date: tour.return_date || null,
        group_size: tour.max_participants || null,
        country_id: null,
        main_city_id: null,
        destination: tour.location || null,
        is_selected: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        workspace_id: tour.workspace_id,
      }

      // 使用 type assertion 因為這是獨立 package（不屬於任何提案）
       
      const { data: newPackage, error } = await dynamicFrom('proposal_packages')
        .insert(newPackageData)
        .select()
        .single()

      if (error) {
        logger.error('建立 proposal_package 失敗:', error)
        toast.error(LINK_DOCUMENTS_LABELS.CREATE_ITINERARY_FAILED)
        return null
      }

      // 更新旅遊團關聯
      const { error: updateError } = await supabase
        .from('tours')
        .update({ proposal_package_id: newPackage.id })
        .eq('id', tour.id)

      if (updateError) {
        logger.error('更新旅遊團關聯失敗:', updateError)
      }

      setDynamicPackage(newPackage as ProposalPackage)
      return newPackage as ProposalPackage
    } catch (err) {
      logger.error('建立 package 錯誤:', err)
      toast.error(LINK_DOCUMENTS_LABELS.CREATE_ITINERARY_FAILED)
      return null
    } finally {
      setIsCreatingPackage(false)
    }
  }

  // 新增行程表（統一入口 - PackageItineraryDialog）
  const handleSelectSimpleItinerary = async () => {
    const pkg = await getOrCreatePackageForTour()
    if (pkg) {
      setPackageItineraryDialogOpen(true)
    }
  }

  // 開啟行程表對話框（根據類型選擇）
  const handleOpenItineraryDialog = () => {
    if (itineraryType === 'timeline') {
      setTimelineDialogOpen(true)
    } else {
      setPackageItineraryDialogOpen(true)
    }
  }

  // 關閉行程表對話框
  const handleCloseTimelineDialog = () => {
    setTimelineDialogOpen(false)
  }

  // 自動鎖定已移除 - 公司規範：一團一份，不需版本鎖定

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

      // 如果有關聯報價單，同步餐食和住宿資料
      if (tourProposalPackage.quote_id) {
        await syncTimelineToQuote(tourProposalPackage.quote_id, timelineData)
      }

      refreshPackage()
    } catch (error) {
      logger.error('儲存時間軸資料失敗:', error)
      throw error
    }
  }, [tourProposalPackage, refreshPackage])

  // 主對話框開啟時，子對話框應關閉
  const mainDialogOpen = isOpen && !timelineDialogOpen && !packageItineraryDialogOpen

  return (
    <>
      {/* 主對話框 */}
      {mainDialogOpen && (
        <Dialog open={mainDialogOpen} onOpenChange={open => !open && onClose()} modal={true}>
          <DialogContent level={1} className="max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>{TOURS_LABELS.LABEL_7445}</DialogTitle>
              <DialogDescription>
                {TOURS_LABELS.QUICK_QUOTE_COMPARE_PREFIX}{tour.name}{TOURS_LABELS.QUICK_QUOTE_COMPARE_SUFFIX}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex-1 min-h-0 overflow-hidden">
              {/* ========== 快速報價單 ========== */}
              <div className="flex flex-col p-4 rounded-lg border border-morandi-container bg-card overflow-hidden h-full">
                <div className="flex items-center justify-between pb-2 border-b border-morandi-container/50 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-morandi-primary" />
                    <span className="font-medium text-sm text-morandi-primary">{TOURS_LABELS.QUICK_QUOTE}</span>
                  </div>
                  <button
                    onClick={handleCreateQuickQuote}
                    disabled={isCreatingQuickQuote}
                    className="p-1 text-morandi-primary hover:bg-morandi-primary/10 rounded transition-colors disabled:opacity-50"
                    title={TOURS_LABELS.ADD_1598}
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
                          onClick={() => handleViewQuote(quote, true)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <div className="text-morandi-primary truncate">
                            {stripHtml(quote.name) || TOURS_LABELS.UNNAMED}
                          </div>
                          <div className="text-morandi-gold font-medium text-[10px]">
                            {quote.total_amount
                              ? `$${quote.total_amount.toLocaleString()}`
                              : TOURS_LABELS.NOT_QUOTED}
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleViewQuote(quote, true)}
                            className="p-1 text-morandi-secondary hover:text-morandi-primary rounded"
                            title={TOURS_LABELS.LABEL_2903}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteQuote(e, quote)}
                            disabled={isDeletingQuote}
                            className="p-1 text-morandi-red/60 hover:text-morandi-red rounded disabled:opacity-50"
                            title={TOURS_LABELS.DELETE}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-morandi-secondary text-center py-4">
                      {TOURS_LABELS.LABEL_3885}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 行程表對話框 */}
      {tourProposalPackage && (
        <ItineraryDialog
          isOpen={timelineDialogOpen}
          onClose={handleCloseTimelineDialog}
          pkg={tourProposalPackage}
          onSave={handleSaveTimeline}
        />
      )}

      {/* 快速行程表對話框 */}
      {tourProposalPackage && (
        <PackageItineraryDialog
          isOpen={packageItineraryDialogOpen}
          onClose={() => setPackageItineraryDialogOpen(false)}
          pkg={tourProposalPackage}
          proposal={fakeProposal}
          onItineraryCreated={() => {
            refreshPackage()
          }}
        />
      )}

    </>
  )
}
