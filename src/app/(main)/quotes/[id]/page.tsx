'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ParticipantCounts, SellingPrices, VersionRecord } from '@/features/quotes/types'
import type { Tour as TourType } from '@/types/tour.types'
import { useQuoteState } from '@/features/quotes/hooks/useQuoteState'
import { useCategoryOperations } from '@/features/quotes/hooks/useCategoryOperations'
import { useQuoteCalculations } from '@/features/quotes/hooks/useQuoteCalculations'
import { useQuoteActions } from '@/features/quotes/hooks/useQuoteActions'
import { useSyncOperations } from './hooks/useSyncOperations'
import { useItineraryStore } from '@/stores'
import { toast } from 'sonner'
import {
  QuoteHeader,
  CategorySection,
  SellingPriceSection,
  SaveVersionDialog,
  SyncToItineraryDialog,
  PrintableQuotation,
  QuickQuoteDetail,
  LinkTourDialog,
  ImportMealsDialog,
  ImportActivitiesDialog,
} from '@/features/quotes/components'
import type { MealDiff } from '@/features/quotes/components'
import type { CostItem } from '@/features/quotes/types'
import type { Itinerary, CreateInput, Tour } from '@/stores/types'
// TourType imported above from @/types/tour.types
import { EditingWarningBanner } from '@/components/EditingWarningBanner'

export default function QuoteDetailPage() {

  // Scroll handling refs (必須在任何條件判斷之前宣告)
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // State management hook
  const quoteState = useQuoteState()
  const {
    quote,
    relatedTour,
    isSpecialTour,
    isReadOnly,
    categories,
    setCategories,
    accommodationDays,
    setAccommodationDays,
    participantCounts,
    setParticipantCounts,
    groupSize,
    groupSizeForGuide,
    quoteName,
    setQuoteName,
    saveSuccess,
    setSaveSuccess,
    isSaveDialogOpen,
    setIsSaveDialogOpen,
    versionName,
    setVersionName,
    currentEditingVersion,
    setCurrentEditingVersion,
    sellingPrices,
    setSellingPrices,
    // 快速報價單相關
    quickQuoteItems,
    setQuickQuoteItems,
    quickQuoteCustomerInfo,
    setQuickQuoteCustomerInfo,
    // 砍次表相關
    tierPricings,
    setTierPricings,
    updateQuote,
    addTour,
    router,
  } = quoteState

  // Itinerary store for sync
  const { items: itineraries, update: updateItinerary } = useItineraryStore()

  // Sync operations hook
  const syncOps = useSyncOperations({
    quote: quote ?? null,
    categories,
    accommodationDays,
    setCategories,
    setAccommodationDays,
    itineraries,
    updateItinerary: updateItinerary as unknown as (id: string, data: Partial<Itinerary>) => Promise<void>,
    router,
  })

  // Category operations hook
  const categoryOps = useCategoryOperations({
    categories,
    setCategories,
    accommodationDays,
    setAccommodationDays,
    groupSize,
    groupSizeForGuide,
  })

  // Calculations hook
  const calculations = useQuoteCalculations({
    categories,
    participantCounts,
    sellingPrices,
  })
  const {
    accommodationSummary,
    accommodationTotal,
    updatedCategories,
    identityCosts,
    identityProfits,
    total_cost,
  } = calculations

  // Actions hook
  const actions = useQuoteActions({
    quote,
    updateQuote,
    addTour: addTour as unknown as (data: CreateInput<Tour>) => Promise<Tour | undefined>,
    router,
    updatedCategories,
    total_cost,
    groupSize,
    groupSizeForGuide,
    quoteName,
    accommodationDays,
    participantCounts,
    sellingPrices,
    versionName,
    currentEditingVersion,
    setSaveSuccess,
    setCategories,
    quickQuoteItems,
    quickQuoteCustomerInfo,
    tierPricings,
  })
  const { handleSave, handleSaveAsNewVersion, formatDateTime, handleFinalize, handleCreateTour, handleDeleteVersion } = actions

  // 切換顯示模式：'standard' 團體報價單 | 'quick' 快速報價單
  // 初始值根據 quote_type 設定（向後相容舊的快速報價單）
  const [viewMode, setViewMode] = React.useState<'standard' | 'quick'>(() =>
    quote?.quote_type === 'quick' ? 'quick' : 'standard'
  )

  // 同步到行程表 - 狀態
  const [isSyncDialogOpen, setIsSyncDialogOpen] = React.useState(false)
  const [syncDiffs, setSyncDiffs] = React.useState<MealDiff[]>([])
  const [syncItineraryTitle, setSyncItineraryTitle] = React.useState<string>('')

  // 開啟同步對話框
  const handleSyncToItinerary = useCallback(() => {
    if (!quote?.itinerary_id) {
      toast.error('此報價單沒有連結行程表')
      return
    }

    const result = syncOps.calculateSyncDiffs()
    if (!result) {
      toast.error('找不到連結的行程表')
      return
    }

    if (result.diffs.length === 0) {
      toast.info('沒有需要同步的變更')
      return
    }

    setSyncDiffs(result.diffs)
    setSyncItineraryTitle(result.itinerary.title || result.itinerary.tagline || '')
    setIsSyncDialogOpen(true)
  }, [quote, syncOps])

  // 確認同步
  const handleConfirmSync = useCallback(() => {
    syncOps.handleConfirmSync(syncDiffs)
  }, [syncOps, syncDiffs])

  // 載入特定版本
  const handleLoadVersion = useCallback(
    (versionIndex: number, versionData: VersionRecord) => {
      // 根據版本模式切換視圖
      const versionMode = versionData.mode || 'detailed'
      setViewMode(versionMode === 'simple' ? 'quick' : 'standard')

      if (versionMode === 'simple') {
        // 載入簡易模式資料
        if (versionData.quick_quote_items) {
          setQuickQuoteItems(versionData.quick_quote_items)
        }
        if (versionData.customer_name !== undefined) {
          setQuickQuoteCustomerInfo({
            customer_name: versionData.customer_name || '',
            contact_person: versionData.contact_person || '',
            contact_phone: versionData.contact_phone || '',
            contact_address: versionData.contact_address || '',
            tour_code: versionData.name || '', // 使用版本名稱作為團號
            handler_name: versionData.handler_name || 'William',
            issue_date: versionData.issue_date || new Date().toISOString().split('T')[0],
            received_amount: versionData.received_amount || 0,
            expense_description: versionData.expense_description || '',
          })
        }
      } else {
        // 載入詳細模式資料
        setCategories(versionData.categories || [])
        setAccommodationDays(versionData.accommodation_days || 0)
        if (versionData.participant_counts) {
          setParticipantCounts(versionData.participant_counts)
        }
        if (versionData.selling_prices) {
          setSellingPrices(versionData.selling_prices)
        }
      }

      // 記錄當前編輯的版本索引（-1 表示主版本，null 表示初始狀態）
      setCurrentEditingVersion(versionIndex === -1 ? null : versionIndex)
    },
    [setCategories, setAccommodationDays, setParticipantCounts, setSellingPrices, setCurrentEditingVersion, setViewMode, setQuickQuoteItems, setQuickQuoteCustomerInfo]
  )


  // 報價單預覽
  const [showQuotationPreview, setShowQuotationPreview] = React.useState(false)
  // 關聯旅遊團對話框
  const [showLinkTourDialog, setShowLinkTourDialog] = React.useState(false)
  // 匯入餐飲對話框
  const [showImportMealsDialog, setShowImportMealsDialog] = React.useState(false)
  // 匯入景點對話框
  const [showImportActivitiesDialog, setShowImportActivitiesDialog] = React.useState(false)

  // 處理狀態變更
  const handleStatusChange = React.useCallback((status: 'proposed' | 'approved', showLinkDialog?: boolean) => {
    if (!quote) return

    if (status === 'approved' && showLinkDialog) {
      // 成交時顯示關聯旅遊團對話框
      setShowLinkTourDialog(true)
    } else {
      // 直接更新狀態
      updateQuote(quote.id, { status })
    }
  }, [quote, updateQuote])

  // 處理新建旅遊團
  const handleCreateNewTour = React.useCallback(() => {
    if (!quote) return
    // 先更新狀態為進行中（綁定旅遊團後自動變更）
    updateQuote(quote.id, { status: '進行中' })
    // 呼叫原本的建立旅遊團功能
    handleCreateTour()
  }, [quote, updateQuote, handleCreateTour])

  // 處理關聯現有旅遊團
  const handleLinkExistingTour = React.useCallback(async (tour: { id: string; code: string }) => {
    if (!quote) return
    // 更新報價單狀態和關聯旅遊團（綁定後自動變更為進行中）
    await updateQuote(quote.id, {
      status: '進行中',
      tour_id: tour.id
    })
    // 更新旅遊團的 quote_id
    const { useTourStore } = await import('@/stores')
    useTourStore.getState().update(tour.id, { quote_id: quote.id })
    toast.success(`已關聯旅遊團：${tour.code}`)
  }, [quote, updateQuote])

  // 處理匯入餐飲
  const handleImportMeals = React.useCallback((items: CostItem[]) => {
    setCategories(prev => {
      const newCategories = [...prev]
      const mealsCategory = newCategories.find(cat => cat.id === 'meals')
      if (mealsCategory) {
        mealsCategory.items = [...mealsCategory.items, ...items]
        mealsCategory.total = mealsCategory.items.reduce((sum, item) => sum + (item.total || 0), 0)
      }
      return newCategories
    })
    toast.success(`已匯入 ${items.length} 筆餐飲`)
  }, [setCategories])

  // 處理匯入景點
  const handleImportActivities = React.useCallback((items: CostItem[]) => {
    setCategories(prev => {
      const newCategories = [...prev]
      const activitiesCategory = newCategories.find(cat => cat.id === 'activities')
      if (activitiesCategory) {
        activitiesCategory.items = [...activitiesCategory.items, ...items]
        activitiesCategory.total = activitiesCategory.items.reduce((sum, item) => sum + (item.total || 0), 0)
      }
      return newCategories
    })
    toast.success(`已匯入 ${items.length} 筆景點`)
  }, [setCategories])

  // 開啟匯入對話框（需要先有關聯的行程表）
  const handleOpenMealsImportDialog = React.useCallback(() => {
    if (!quote?.itinerary_id) {
      toast.error('此報價單沒有關聯的行程表')
      return
    }
    setShowImportMealsDialog(true)
  }, [quote])

  const handleOpenActivitiesImportDialog = React.useCallback(() => {
    if (!quote?.itinerary_id) {
      toast.error('此報價單沒有關聯的行程表')
      return
    }
    setShowImportActivitiesDialog(true)
  }, [quote])
  const [previewParticipantCounts, setPreviewParticipantCounts] =
    React.useState<ParticipantCounts | null>(null)
  const [previewSellingPrices, setPreviewSellingPrices] = React.useState<SellingPrices | null>(null)
  const [previewTierLabel, setPreviewTierLabel] = React.useState<string | undefined>(undefined)
  const [previewTierPricings, setPreviewTierPricings] = React.useState<
    Array<{
      participant_count: number
      selling_prices: SellingPrices
    }>
  >([])

  const handleGenerateQuotation = useCallback(
    (
      tierParticipantCounts?: ParticipantCounts,
      tierSellingPrices?: SellingPrices,
      tierLabel?: string,
      allTierPricings?: Array<{
        participant_count: number
        selling_prices: SellingPrices
      }>
    ) => {
      // 如果有傳入檻次表數據，使用檻次表數據；否則使用原始數據
      setPreviewParticipantCounts(tierParticipantCounts || null)
      setPreviewSellingPrices(tierSellingPrices || null)
      setPreviewTierLabel(tierLabel)
      setPreviewTierPricings(allTierPricings || [])
      setShowQuotationPreview(true)
    },
    []
  )

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleClosePreview = useCallback(() => {
    setShowQuotationPreview(false)
  }, [])

  // Scroll handling effect (必須在任何條件判斷之前)
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        scrollRef.current.classList.add('scrolling')

        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }

        scrollTimeoutRef.current = setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.classList.remove('scrolling')
          }
        }, 1000)
      }
    }

    const element = scrollRef.current
    if (element) {
      element.addEventListener('scroll', handleScroll)
      return () => element.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // 如果還在載入或報價單不存在，顯示載入中
  if (!quote) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morandi-gold mx-auto mb-4"></div>
          <p className="text-morandi-secondary">載入中...</p>
        </div>
      </div>
    )
  }

  // ✅ 如果是簡易模式（快速報價單），顯示簡易介面
  if (viewMode === 'quick') {
    return (
      <QuickQuoteDetail
        quote={{
          ...quote,
          // 合併快速報價單客戶資訊（團體報價的聯絡資訊會自動帶入）
          // 優先順序：quickQuoteCustomerInfo > quote.customer_name > quoteName（團體名稱）
          customer_name: quickQuoteCustomerInfo.customer_name || quote.customer_name || quoteName,
          contact_person: quickQuoteCustomerInfo.contact_person || quote.contact_person,
          contact_phone: quickQuoteCustomerInfo.contact_phone || quote.contact_phone,
          contact_address: quickQuoteCustomerInfo.contact_address || quote.contact_address,
          tour_code: quickQuoteCustomerInfo.tour_code || quote.tour_code,
          handler_name: quickQuoteCustomerInfo.handler_name || quote.handler_name,
          issue_date: quickQuoteCustomerInfo.issue_date || quote.issue_date,
          received_amount: quickQuoteCustomerInfo.received_amount || quote.received_amount,
          quick_quote_items: quickQuoteItems,
        }}
        onUpdate={async (data) => {
          // 更新快速報價單資料到同一個報價單
          await updateQuote(quote.id, data)
          // 同步更新本地狀態
          if (data.quick_quote_items) {
            setQuickQuoteItems(data.quick_quote_items)
          }
          if (data.customer_name !== undefined) {
            setQuickQuoteCustomerInfo(prev => ({ ...prev, ...data }))
          }
        }}
        // 傳入切換按鈕
        viewModeToggle={
          <button
            onClick={() => setViewMode('standard')}
            className="px-3 py-1.5 text-sm bg-morandi-container hover:bg-morandi-container/80 rounded-md transition-colors"
          >
            切換到團體報價單
          </button>
        }
      />
    )
  }

  return (
    <div className="w-full max-w-full space-y-6 pb-6">
      {/* 編輯衝突警告 */}
      <EditingWarningBanner
        resourceType="quote"
        resourceId={quote.id}
        resourceName="此報價單"
      />

      <QuoteHeader
        isSpecialTour={isSpecialTour}
        isReadOnly={isReadOnly}
        relatedTour={relatedTour as Tour | null}
        quote={quote as Parameters<typeof QuoteHeader>[0]['quote']}
        quoteName={quoteName}
        setQuoteName={setQuoteName}
        participantCounts={participantCounts}
        setParticipantCounts={setParticipantCounts}
        saveSuccess={saveSuccess}
        setIsSaveDialogOpen={setIsSaveDialogOpen}
        formatDateTime={formatDateTime}
        handleLoadVersion={handleLoadVersion}
        handleSave={handleSave}
        handleSaveAsNewVersion={() => setIsSaveDialogOpen(true)}
        handleFinalize={handleFinalize}
        handleCreateTour={handleCreateTour}
        handleGenerateQuotation={handleGenerateQuotation}
        handleDeleteVersion={handleDeleteVersion}
        handleSyncToItinerary={handleSyncToItinerary}
        handleSyncAccommodationFromItinerary={syncOps.handleSyncAccommodationFromItinerary}
        onSwitchToQuickQuote={() => setViewMode('quick')}
        onStatusChange={handleStatusChange}
        currentEditingVersion={currentEditingVersion}
        router={router}
        accommodationDays={accommodationDays}
        contactInfo={{
          contact_person: quote.contact_person || '',
          contact_phone: quote.contact_phone || '',
          contact_address: quote.contact_address || '',
        }}
        onContactInfoChange={(info) => {
          updateQuote(quote.id, {
            contact_person: info.contact_person,
            contact_phone: info.contact_phone,
            contact_address: info.contact_address,
          })
        }}
      />

      <div className="w-full pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 w-full">
          {/* 左側：成本計算表格 - 70% */}
          <div
            className={cn(
              'lg:col-span-7',
              isReadOnly && 'opacity-70 pointer-events-none select-none'
            )}
          >
            <div className="border border-border bg-card rounded-xl shadow-sm">
              <div ref={scrollRef} className="overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse">
                  <thead className="bg-morandi-container/50 border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-morandi-charcoal w-12 table-divider">
                        分類
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-morandi-charcoal w-70 table-divider">
                        項目
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-morandi-charcoal w-8 table-divider">
                        數量
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-morandi-charcoal w-28 table-divider">
                        單價
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-morandi-charcoal w-28 table-divider whitespace-nowrap">
                        小計
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-morandi-charcoal w-24">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(category => (
                      <CategorySection
                        key={category.id}
                        category={category}
                        accommodationTotal={accommodationTotal}
                        accommodationDays={accommodationDays}
                        isReadOnly={isReadOnly}
                        handleAddAccommodationDay={categoryOps.handleAddAccommodationDay}
                        handleAddRow={categoryOps.handleAddRow}
                        handleInsertItem={categoryOps.handleInsertItem}
                        handleAddGuideRow={categoryOps.handleAddGuideRow}
                        handleAddAdultTicket={categoryOps.handleAddAdultTicket}
                        handleAddChildTicket={categoryOps.handleAddChildTicket}
                        handleAddInfantTicket={categoryOps.handleAddInfantTicket}
                        handleAddLunchMeal={categoryOps.handleAddLunchMeal}
                        handleAddDinnerMeal={categoryOps.handleAddDinnerMeal}
                        handleAddActivity={categoryOps.handleAddActivity}
                        handleUpdateItem={categoryOps.handleUpdateItem}
                        handleRemoveItem={categoryOps.handleRemoveItem}
                        onOpenMealsImportDialog={handleOpenMealsImportDialog}
                        onOpenActivitiesImportDialog={handleOpenActivitiesImportDialog}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 右側：報價設定 - 30% */}
          <SellingPriceSection
            participantCounts={participantCounts}
            identityCosts={identityCosts}
            sellingPrices={sellingPrices}
            setSellingPrices={setSellingPrices}
            identityProfits={identityProfits}
            isReadOnly={isReadOnly}
            handleGenerateQuotation={handleGenerateQuotation}
            accommodationSummary={accommodationSummary}
            categories={categories}
            tierPricings={tierPricings}
            setTierPricings={setTierPricings}
          />
        </div>

      </div>

      {/* 另存新版本對話框 */}
      <SaveVersionDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        versionName={versionName}
        setVersionName={setVersionName}
        onSave={(note) => handleSaveAsNewVersion(note, setCurrentEditingVersion)}
      />

      {/* 同步到行程表對話框 */}
      <SyncToItineraryDialog
        isOpen={isSyncDialogOpen}
        onClose={() => setIsSyncDialogOpen(false)}
        onConfirm={handleConfirmSync}
        diffs={syncDiffs}
        itineraryTitle={syncItineraryTitle}
      />

      {/* 可列印的報價單 */}
      <PrintableQuotation
        quote={quote as unknown as Parameters<typeof PrintableQuotation>[0]['quote']}
        quoteName={quoteName}
        participantCounts={previewParticipantCounts || participantCounts}
        sellingPrices={previewSellingPrices || sellingPrices}
        categories={updatedCategories}
        totalCost={total_cost}
        isOpen={showQuotationPreview}
        onClose={handleClosePreview}
        onPrint={handlePrint}
        accommodationSummary={accommodationSummary}
        tierLabel={previewTierLabel}
        tierPricings={previewTierPricings}
      />

      {/* 關聯旅遊團對話框 */}
      <LinkTourDialog
        isOpen={showLinkTourDialog}
        onClose={() => setShowLinkTourDialog(false)}
        onCreateNew={handleCreateNewTour}
        onLinkExisting={handleLinkExistingTour}
      />

      {/* 匯入餐飲對話框 */}
      <ImportMealsDialog
        isOpen={showImportMealsDialog}
        onClose={() => setShowImportMealsDialog(false)}
        meals={syncOps.itineraryMealsData}
        onImport={handleImportMeals}
      />

      {/* 匯入景點對話框 */}
      <ImportActivitiesDialog
        isOpen={showImportActivitiesDialog}
        onClose={() => setShowImportActivitiesDialog(false)}
        activities={syncOps.itineraryActivitiesData}
        onImport={handleImportActivities}
      />
    </div>
  )
}
