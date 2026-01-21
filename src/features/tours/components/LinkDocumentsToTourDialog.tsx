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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  FileText,
  Calculator,
  Loader2,
  ExternalLink,
  Unlink,
  Eye,
  Zap,
  Clock,
} from 'lucide-react'
import { useQuotes, useTours, useOrders, createQuote, updateQuote, invalidateQuotes, useProposalPackage } from '@/data'
import { DEFAULT_CATEGORIES } from '@/features/quotes/constants'
import type { Tour, Quote } from '@/stores/types'
import type { ProposalPackage, TimelineItineraryData } from '@/types/proposal.types'
import { logger } from '@/lib/utils/logger'
import { stripHtml } from '@/lib/utils/string-utils'
import { supabase } from '@/lib/supabase/client'
import { dynamicFrom } from '@/lib/supabase/typed-client'
import { syncTimelineToQuote } from '@/lib/utils/itinerary-quote-sync'
import { TimelineItineraryDialog } from '@/features/proposals/components/TimelineItineraryDialog'
import { PackageItineraryDialog } from '@/features/proposals/components/PackageItineraryDialog'
import { toast } from 'sonner'
import type { Proposal } from '@/types/proposal.types'

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
  const { items: tours } = useTours()

  // 訂單（用於取得業務人員）
  const { items: orders } = useOrders()

  // Proposal Package（只取單筆，避免載入所有 80+ 筆資料）
  const { item: fetchedPackage, refresh: refreshPackage } = useProposalPackage(tour.proposal_package_id || null)

  // 報價單狀態
  const [isCreatingStandardQuote, setIsCreatingStandardQuote] = useState(false)
  const [isCreatingQuickQuote, setIsCreatingQuickQuote] = useState(false)
  const [isUnlinkingQuote, setIsUnlinkingQuote] = useState(false)

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

  // 取得 tour 關聯的第一筆訂單的業務人員
  const tourSalesPerson = useMemo(() => {
    const firstOrder = orders.find(o => o.tour_id === tour.id)
    return firstOrder?.sales_person || null
  }, [orders, tour.id])

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
      // 不傳入 code，讓 createEntityHook 自動從資料庫查詢生成（避免前端快取不完整導致 code 重複）
      const newQuote = await createQuote({
        name: tour.name,
        quote_type: 'standard',
        status: 'draft',
        tour_id: tour.id,
        categories: DEFAULT_CATEGORIES,
        group_size: tour.max_participants || 20,
        // 從訂單取得業務人員
        handler_name: tourSalesPerson || undefined,
      } as Parameters<typeof createQuote>[0])

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
      // 不傳入 code，讓 createEntityHook 自動從資料庫查詢生成（避免前端快取不完整導致 code 重複）
      const newQuote = await createQuote({
        name: tour.name,
        quote_type: 'quick',
        status: 'draft',
        tour_id: tour.id,
        customer_name: tour.name,
        tour_code: tour.code || '',
        issue_date: new Date().toISOString().split('T')[0],
        group_size: tour.max_participants || 20,
        // 從訂單取得業務人員
        handler_name: tourSalesPerson || undefined,
      } as Parameters<typeof createQuote>[0])

      logger.log('[handleCreateQuickQuote] 建立的報價單:', {
        id: newQuote?.id,
        code: newQuote?.code,
        quote_type: newQuote?.quote_type,
      })

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
      // SWR 自動 revalidate
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
        version_name: tour.name || '行程版本',
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
        toast.error('建立行程表失敗')
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
      toast.error('建立行程表失敗')
      return null
    } finally {
      setIsCreatingPackage(false)
    }
  }

  // 選擇行程表類型（快速行程表）
  const handleSelectTimelineItinerary = async () => {
    const pkg = await getOrCreatePackageForTour()
    if (pkg) {
      setTimelineDialogOpen(true)
    }
  }

  // 選擇行程表類型（快速行程表 - PackageItineraryDialog）
  const handleSelectSimpleItinerary = async () => {
    const pkg = await getOrCreatePackageForTour()
    if (pkg) {
      setPackageItineraryDialogOpen(true)
    }
  }

  // 選擇行程表類型（網頁行程表）
  const handleSelectWebItinerary = async () => {
    onClose()
    router.push(`/itinerary/new?tour_id=${tour.id}`)
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

  // 自動鎖定行程表到旅遊團
  const autoLockItineraryToTour = useCallback(async (itineraryId?: string) => {
    // 如果旅遊團已有 locked_at，表示已經鎖定過，不再處理
    if (tour.locked_at) return

    try {
      const updateData: Record<string, unknown> = {
        locked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // 如果有 itineraries 表的記錄 ID，也設定 locked_itinerary_id
      if (itineraryId) {
        updateData.locked_itinerary_id = itineraryId
      }

      const { error } = await supabase
        .from('tours')
        .update(updateData)
        .eq('id', tour.id)

      if (error) {
        logger.error('自動鎖定行程表失敗:', error)
      } else {
        logger.log('已自動鎖定行程表到旅遊團:', { tourId: tour.id, itineraryId })
        toast.success('已自動鎖定行程表')
      }
    } catch (err) {
      logger.error('自動鎖定行程表錯誤:', err)
    }
  }, [tour.id, tour.locked_at])

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

      // 自動鎖定（如果是第一個行程表）
      await autoLockItineraryToTour()

      refreshPackage()
    } catch (error) {
      logger.error('儲存時間軸資料失敗:', error)
      throw error
    }
  }, [tourProposalPackage, refreshPackage, autoLockItineraryToTour])

  // 主對話框開啟時，子對話框應關閉
  const mainDialogOpen = isOpen && !timelineDialogOpen && !packageItineraryDialogOpen

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
              <div className="flex flex-col p-3 rounded-lg border border-morandi-container bg-card overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-morandi-container/50 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-morandi-gold" />
                    <span className="font-medium text-sm text-morandi-primary">行程</span>
                  </div>
                  {/* 新增行程表下拉選單 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        disabled={isCreatingPackage}
                        className="p-1 text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors disabled:opacity-50"
                        title="新增行程表"
                      >
                        {isCreatingPackage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onClick={handleSelectTimelineItinerary}
                        className="gap-2 cursor-pointer"
                      >
                        <Clock size={16} className="text-morandi-gold" />
                        <span>時間軸行程表</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleSelectSimpleItinerary}
                        className="gap-2 cursor-pointer"
                      >
                        <Zap size={16} className="text-morandi-gold" />
                        <span>快速行程表</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleSelectWebItinerary}
                        className="gap-2 cursor-pointer"
                      >
                        <FileText size={16} className="text-morandi-secondary" />
                        <span>網頁行程表</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex-1 overflow-auto mt-2">
                  {hasTimelineData ? (
                    // 已有時間軸行程表
                    <button
                      onClick={handleOpenItineraryDialog}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-morandi-gold/5 transition-colors text-left"
                    >
                      <Clock className="w-3.5 h-3.5 text-morandi-gold" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-morandi-primary">時間軸行程表</div>
                        <div className="text-[10px] text-morandi-secondary">
                          {(tourProposalPackage?.timeline_data as TimelineItineraryData)?.days?.length || 0} 天
                        </div>
                      </div>
                    </button>
                  ) : itineraryType === 'simple' ? (
                    // 已有快速行程表
                    <button
                      onClick={handleOpenItineraryDialog}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-morandi-gold/5 transition-colors text-left"
                    >
                      <Zap className="w-3.5 h-3.5 text-morandi-gold" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-morandi-primary">快速行程表</div>
                        <div className="text-[10px] text-morandi-secondary">
                          點擊編輯
                        </div>
                      </div>
                    </button>
                  ) : tourProposalPackage?.itinerary_id ? (
                    // 已有網頁行程表
                    <button
                      onClick={() => {
                        onClose()
                        const itineraryId = tourProposalPackage?.itinerary_id
                        if (itineraryId) {
                          router.push(`/itinerary/new?itinerary_id=${itineraryId}`)
                        } else {
                          router.push(`/itinerary/new?tour_id=${tour.id}`)
                        }
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-morandi-gold/5 transition-colors text-left"
                    >
                      <FileText className="w-3.5 h-3.5 text-morandi-secondary" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-morandi-primary">網頁行程表</div>
                        <div className="text-[10px] text-morandi-secondary">
                          點擊編輯
                        </div>
                      </div>
                    </button>
                  ) : (
                    // 尚未建立行程表
                    <div className="text-xs text-morandi-secondary text-center py-4">
                      點擊 + 選擇行程表類型
                    </div>
                  )}
                </div>
              </div>

              {/* ========== 報價 ========== */}
              <div className="flex flex-col p-3 rounded-lg border border-morandi-container bg-card overflow-hidden">
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
              <div className="flex flex-col p-3 rounded-lg border border-morandi-container bg-card overflow-hidden">
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

      {/* 快速行程表對話框 */}
      {tourProposalPackage && (
        <PackageItineraryDialog
          isOpen={packageItineraryDialogOpen}
          onClose={() => setPackageItineraryDialogOpen(false)}
          pkg={tourProposalPackage}
          proposal={fakeProposal}
          onItineraryCreated={(itineraryId?: string) => {
            refreshPackage()
            // 自動鎖定（如果是第一個行程表）
            autoLockItineraryToTour(itineraryId)
          }}
        />
      )}

    </>
  )
}
