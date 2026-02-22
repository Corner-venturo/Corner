'use client'

/**
 * QuoteDetailEmbed - 可嵌入的報價單詳情元件
 *
 * 用於：
 * 1. 報價單頁面 /quotes/[id]
 * 2. 旅遊團報價單分頁
 *
 * 接收 quoteId 作為 prop，而不是從 URL 讀取
 */

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ParticipantCounts, SellingPrices, CostCategory, CostItem } from '@/features/quotes/types'
import type { Tour } from '@/types/tour.types'
import { useQuotes } from '@/features/quotes/hooks/useQuotes'
import { useQuote as useQuoteDetail } from '@/data'
import { useCategoryOperations } from '@/features/quotes/hooks/useCategoryOperations'
import { useQuoteCalculations } from '@/features/quotes/hooks/useQuoteCalculations'
import { useQuoteActions } from '@/features/quotes/hooks/useQuoteActions'
import { useToursSlim, useItineraries, updateItinerary, createTour } from '@/data'
import { useAuthStore } from '@/stores'
import { toast } from 'sonner'
import type { QuoteConfirmationStatus } from '@/types/quote.types'
import {
  QuoteHeader,
  CategorySection,
  SellingPriceSection,
  SyncToItineraryDialog,
  PrintableQuotation,
  LinkTourDialog,
  ImportMealsDialog,
  ImportActivitiesDialog,
  LocalPricingDialog,
} from '@/features/quotes/components'
import type { LocalTier } from '@/features/quotes/components/LocalPricingDialog'
import { Loader2 } from 'lucide-react'
import type { MealDiff } from '@/features/quotes/components'
import type { Itinerary, CreateInput } from '@/stores/types'
import { EditingWarningBanner } from '@/components/EditingWarningBanner'
import {
  calculateTierParticipantCounts,
  calculateTierCosts,
  calculateIdentityProfits,
  generateUniqueId,
} from '@/features/quotes/utils/priceCalculations'
import { costCategories, TierPricing } from '@/features/quotes/types'
import { QUOTE_DETAIL_EMBED_LABELS } from '../constants/labels';
import { QUOTE_COMPONENT_LABELS } from '../constants/labels'

interface QuoteDetailEmbedProps {
  quoteId: string
  /** 是否顯示 header（在分頁模式下可能要隱藏） */
  showHeader?: boolean
}

export function QuoteDetailEmbed({ quoteId, showHeader = true }: QuoteDetailEmbedProps) {
  const router = useRouter()
  const { updateQuote } = useQuotes()
  const { item: quote, loading: quoteLoading } = useQuoteDetail(quoteId)
  const { items: tours } = useToursSlim()
  const { items: itineraries } = useItineraries()
  const { user } = useAuthStore()

  // Scroll handling refs
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // 檢查是否為特殊團報價單
  const relatedTour = quote?.tour_id ? tours.find(t => t.id === quote.tour_id) : null
  const isSpecialTour = relatedTour?.status === QUOTE_DETAIL_EMBED_LABELS.特殊團
  const isReadOnly = isSpecialTour

  // State
  const [categories, setCategories] = useState<CostCategory[]>([])
  const [accommodationDays, setAccommodationDays] = useState(0)
  const [participantCounts, setParticipantCounts] = useState<ParticipantCounts>({
    adult: 0,
    child_with_bed: 0,
    child_no_bed: 0,
    single_room: 0,
    infant: 0,
  })
  const [quoteName, setQuoteName] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [sellingPrices, setSellingPrices] = useState<SellingPrices>({
    adult: 0,
    child_with_bed: 0,
    child_no_bed: 0,
    single_room: 0,
    infant: 0,
  })
  const [tierPricings, setTierPricings] = useState<TierPricing[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)

  // 初始化資料
  useEffect(() => {
    if (quote && !hasLoaded) {
      setCategories(
        (quote.categories && quote.categories.length > 0)
          ? quote.categories.map(cat => ({
              ...cat,
              total: cat.items.reduce((sum: number, item: CostItem) => sum + (item.total || 0), 0),
            }))
          : costCategories
      )
      setAccommodationDays(quote.accommodation_days || 0)
      setParticipantCounts(quote.participant_counts || {
        adult: quote.group_size || 20,
        child_with_bed: 0,
        child_no_bed: 0,
        single_room: 0,
        infant: 0,
      })
      setQuoteName(quote.name || '')
      setSellingPrices(quote.selling_prices || {
        adult: 0,
        child_with_bed: 0,
        child_no_bed: 0,
        single_room: 0,
        infant: 0,
      })
      setTierPricings(quote.tier_pricings || [])
      setHasLoaded(true)
    }
  }, [quote, hasLoaded])

  // Group size calculations
  const groupSize = useMemo(() => {
    return (participantCounts.adult || 0) +
      (participantCounts.child_with_bed || 0) +
      (participantCounts.child_no_bed || 0) +
      (participantCounts.single_room || 0)
  }, [participantCounts])

  const groupSizeForGuide = useMemo(() => {
    return (participantCounts.adult || 0) +
      (participantCounts.child_with_bed || 0) +
      (participantCounts.child_no_bed || 0) +
      (participantCounts.single_room || 0) +
      (participantCounts.infant || 0)
  }, [participantCounts])

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
    quote: quote || null,
    updateQuote,
    addTour: createTour as unknown as (data: CreateInput<Tour>) => Promise<Tour | undefined>,
    router,
    updatedCategories,
    total_cost,
    groupSize,
    groupSizeForGuide,
    quoteName,
    accommodationDays,
    participantCounts,
    sellingPrices,
    setSaveSuccess,
    setCategories,
    tierPricings,
  })
  const { handleSave, handleCreateTour } = actions

  // 同步到行程表 - 狀態
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false)
  const [syncDiffs, setSyncDiffs] = useState<MealDiff[]>([])
  const [syncItineraryTitle, setSyncItineraryTitle] = useState<string>('')

  // 報價單預覽
  const [showQuotationPreview, setShowQuotationPreview] = useState(false)
  const [showLinkTourDialog, setShowLinkTourDialog] = useState(false)
  const [showImportMealsDialog, setShowImportMealsDialog] = useState(false)
  const [showImportActivitiesDialog, setShowImportActivitiesDialog] = useState(false)
  const [showLocalPricingDialog, setShowLocalPricingDialog] = useState(false)

  const [previewParticipantCounts, setPreviewParticipantCounts] = useState<ParticipantCounts | null>(null)
  const [previewSellingPrices, setPreviewSellingPrices] = useState<SellingPrices | null>(null)
  const [previewTierLabel, setPreviewTierLabel] = useState<string | undefined>(undefined)
  const [previewTierPricings, setPreviewTierPricings] = useState<Array<{
    participant_count: number
    selling_prices: SellingPrices
  }>>([])

  // 處理確認狀態變更
  const handleConfirmationStatusChange = useCallback(async (status: QuoteConfirmationStatus) => {
    if (!quote) return
    try {
      await updateQuote(quote.id, { confirmation_status: status })
    } catch {
      toast.error(QUOTE_DETAIL_EMBED_LABELS.更新狀態失敗_請稍後再試)
    }
  }, [quote, updateQuote])

  // 處理狀態變更
  const handleStatusChange = useCallback((status: 'proposed' | 'approved', showLinkDialog?: boolean) => {
    if (!quote) return
    if (status === 'approved' && showLinkDialog) {
      setShowLinkTourDialog(true)
    } else {
      updateQuote(quote.id, { status })
    }
  }, [quote, updateQuote])

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

  // Sync operations (simplified)
  const handleSyncToItinerary = useCallback(() => {
    toast.info(QUOTE_DETAIL_EMBED_LABELS.同步功能開發中)
  }, [])

  const handleSyncAccommodationFromItinerary = useCallback(() => {
    toast.info('同步功能開發中')
  }, [])

  // Import handlers
  const handleImportMeals = useCallback((items: CostItem[]) => {
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
  }, [])

  const handleImportActivities = useCallback((items: CostItem[]) => {
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
  }, [])

  const handleOpenMealsImportDialog = useCallback(() => {
    if (!quote?.itinerary_id) {
      toast.error(QUOTE_DETAIL_EMBED_LABELS.此報價單沒有關聯的行程表)
      return
    }
    setShowImportMealsDialog(true)
  }, [quote])

  const handleOpenActivitiesImportDialog = useCallback(() => {
    if (!quote?.itinerary_id) {
      toast.error('此報價單沒有關聯的行程表')
      return
    }
    setShowImportActivitiesDialog(true)
  }, [quote])

  // 計算總人數
  const totalParticipants = useMemo(() => {
    return (participantCounts.adult || 0) +
           (participantCounts.child_with_bed || 0) +
           (participantCounts.child_no_bed || 0) +
           (participantCounts.single_room || 0)
  }, [participantCounts])

  // Local pricing handler
  const handleLocalPricingConfirm = useCallback((tiers: LocalTier[], _matchedTierIndex: number) => {
    const sortedTiers = [...tiers].sort((a, b) => a.participants - b.participants)
    let currentTierIdx = 0
    for (let i = 0; i < sortedTiers.length; i++) {
      if (sortedTiers[i].participants <= totalParticipants) {
        currentTierIdx = i
      }
    }
    const currentLocalPrice = sortedTiers[currentTierIdx]?.unitPrice || 0

    const newTierPricings = sortedTiers.map((tier, index) => {
      const participantCount = index === 0 ? totalParticipants : tier.participants
      const localUnitPrice = index === 0 ? currentLocalPrice : tier.unitPrice
      const newCounts = calculateTierParticipantCounts(participantCount, participantCounts)
      const baseCosts = calculateTierCosts(categories, newCounts, participantCounts)
      const newCosts = {
        adult: baseCosts.adult + localUnitPrice,
        child_with_bed: baseCosts.child_with_bed + localUnitPrice,
        child_no_bed: baseCosts.child_no_bed + localUnitPrice,
        single_room: baseCosts.single_room + localUnitPrice,
        infant: baseCosts.infant,
      }
      return {
        id: generateUniqueId(),
        participant_count: participantCount,
        participant_counts: newCounts,
        identity_costs: newCosts,
        selling_prices: { ...sellingPrices },
        identity_profits: calculateIdentityProfits(sellingPrices, newCosts),
      }
    })

    setCategories(prev => {
      const newCategories = [...prev]
      const groupTransportCategory = newCategories.find(cat => cat.id === 'group-transport')
      if (groupTransportCategory) {
        groupTransportCategory.items = groupTransportCategory.items.filter(
          item => !item.name.startsWith(QUOTE_DETAIL_EMBED_LABELS.Local_報價)
        )
        const newItem: CostItem = {
          id: `local-${Date.now()}`,
          name: 'Local 報價',
          quantity: 1,
          unit_price: currentLocalPrice,
          total: 0,
          note: `目前適用: $${currentLocalPrice.toLocaleString()}/人 | ${sortedTiers.map(t => `${t.participants}人=$${t.unitPrice.toLocaleString()}`).join(' / ')}`,
        }
        groupTransportCategory.items.push(newItem)
      }
      return newCategories
    })

    setTierPricings(newTierPricings)
    toast.success(`Local 報價已套用，產生 ${newTierPricings.length} 個檻次`)
  }, [totalParticipants, participantCounts, categories, sellingPrices])

  // Scroll handling effect
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

  // Loading state
  if (quoteLoading || !hasLoaded || !quote) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-morandi-gold mx-auto mb-4" />
          <p className="text-morandi-secondary">{QUOTE_DETAIL_EMBED_LABELS.LOADING_6912}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full space-y-6 pb-6">
      {/* 編輯衝突警告 */}
      <EditingWarningBanner
        resourceType="quote"
        resourceId={quote.id}
        resourceName={QUOTE_DETAIL_EMBED_LABELS.此報價單}
      />

      {showHeader && (
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
          handleSave={handleSave}
          handleCreateTour={handleCreateTour}
          handleGenerateQuotation={handleGenerateQuotation}
          handleSyncToItinerary={handleSyncToItinerary}
          handleSyncAccommodationFromItinerary={handleSyncAccommodationFromItinerary}
          onStatusChange={handleStatusChange}
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
          staffId={user?.id}
          staffName={user?.name || user?.email}
          onConfirmationStatusChange={handleConfirmationStatusChange}
        />
      )}

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
                        {QUOTE_DETAIL_EMBED_LABELS.LABEL_2257}
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-morandi-charcoal w-70 table-divider">
                        {QUOTE_DETAIL_EMBED_LABELS.LABEL_7325}
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-morandi-charcoal w-20 table-divider">
                        {QUOTE_DETAIL_EMBED_LABELS.QUANTITY}
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-morandi-charcoal w-28 table-divider">
                        {QUOTE_DETAIL_EMBED_LABELS.LABEL_9413}
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-morandi-charcoal w-28 table-divider whitespace-nowrap">
                        {QUOTE_DETAIL_EMBED_LABELS.LABEL_832}
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-morandi-charcoal w-24">
                        {QUOTE_DETAIL_EMBED_LABELS.ACTIONS}
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
                        handleAddTransportRow={categoryOps.handleAddTransportRow}
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
                        onOpenLocalPricingDialog={category.id === 'group-transport' ? () => setShowLocalPricingDialog(true) : undefined}
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
            setParticipantCounts={setParticipantCounts}
            identityCosts={identityCosts}
            sellingPrices={sellingPrices}
            setSellingPrices={setSellingPrices}
            identityProfits={identityProfits}
            isReadOnly={isReadOnly}
            handleSave={handleSave}
            handleGenerateQuotation={handleGenerateQuotation}
            accommodationSummary={accommodationSummary}
            categories={categories}
            tierPricings={tierPricings}
            setTierPricings={setTierPricings}
          />
        </div>
      </div>

      {/* Dialogs */}
      <SyncToItineraryDialog
        isOpen={isSyncDialogOpen}
        onClose={() => setIsSyncDialogOpen(false)}
        onConfirm={() => {}}
        diffs={syncDiffs}
        itineraryTitle={syncItineraryTitle}
      />

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

      <LinkTourDialog
        isOpen={showLinkTourDialog}
        onClose={() => setShowLinkTourDialog(false)}
        onCreateNew={() => {
          if (quote) {
            updateQuote(quote.id, { status: '待出發' })
            handleCreateTour()
          }
        }}
        onLinkExisting={async (tour) => {
          if (quote) {
            await updateQuote(quote.id, { status: '待出發', tour_id: tour.id })
            const { updateTour } = await import('@/data')
            await updateTour(tour.id, { quote_id: quote.id })
            toast.success(`已關聯旅遊團：${tour.code}`)
          }
        }}
      />

      <ImportMealsDialog
        isOpen={showImportMealsDialog}
        onClose={() => setShowImportMealsDialog(false)}
        meals={[]}
        onImport={handleImportMeals}
      />

      <ImportActivitiesDialog
        isOpen={showImportActivitiesDialog}
        onClose={() => setShowImportActivitiesDialog(false)}
        activities={[]}
        onImport={handleImportActivities}
      />

      <LocalPricingDialog
        isOpen={showLocalPricingDialog}
        onClose={() => setShowLocalPricingDialog(false)}
        totalParticipants={totalParticipants}
        onConfirm={handleLocalPricingConfirm}
      />
    </div>
  )
}
