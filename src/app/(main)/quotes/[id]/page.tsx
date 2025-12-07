'use client'

import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { ParticipantCounts, SellingPrices, VersionRecord } from '@/features/quotes/types'
import type { Tour } from '@/types/tour.types'
import { useQuoteState } from '@/features/quotes/hooks/useQuoteState'
import { useCategoryOperations } from '@/features/quotes/hooks/useCategoryOperations'
import { useQuoteCalculations } from '@/features/quotes/hooks/useQuoteCalculations'
import { useQuoteActions } from '@/features/quotes/hooks/useQuoteActions'
import {
  QuoteHeader,
  CategorySection,
  SellingPriceSection,
  SaveVersionDialog,
  PrintableQuotation,
  QuickQuoteDetail,
} from '@/features/quotes/components'

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
    updateQuote,
    addTour,
    router,
  } = quoteState

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
    addTour,
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
  })
  const { handleSave, handleSaveAsNewVersion, formatDateTime, handleFinalize, handleCreateTour, handleDeleteVersion } = actions

  // 建立行程表
  const handleCreateItinerary = useCallback(() => {
    if (!quote) return

    // 從報價單分類中提取資料
    const extractMeals = () => {
      const mealsCategory = categories.find(cat => cat.id === 'meals')
      if (!mealsCategory || mealsCategory.items.length === 0) return []

      return mealsCategory.items.map(item => {
        // 解析名稱格式：「Day 1 午餐 - 餐廳名稱」
        const nameMatch = item.name.match(/Day\s*(\d+)\s*(早餐|午餐|晚餐)\s*-?\s*(.*)/)
        if (nameMatch) {
          return {
            day: parseInt(nameMatch[1]),
            type: nameMatch[2],
            name: nameMatch[3].trim() || item.description || '',
            note: item.notes || '',
          }
        }
        return {
          day: 1,
          type: '午餐',
          name: item.name || item.description || '',
          note: item.notes || '',
        }
      })
    }

    const extractHotels = () => {
      const accommodationCategory = categories.find(cat => cat.id === 'accommodation')
      if (!accommodationCategory || accommodationCategory.items.length === 0) return []

      return accommodationCategory.items.map(item => {
        const nameMatch = item.name.match(/Day\s*(\d+)(?:-\d+)?\s*住宿/)
        return {
          day: nameMatch ? parseInt(nameMatch[1]) : 1,
          name: item.description || item.name.replace(/Day\s*\d+(?:-\d+)?\s*住宿\s*-?\s*/, '').trim(),
          note: item.notes || '',
        }
      })
    }

    const extractActivities = () => {
      const activitiesCategory = categories.find(cat => cat.id === 'activities')
      if (!activitiesCategory || activitiesCategory.items.length === 0) return []

      return activitiesCategory.items.map(item => {
        const nameMatch = item.name.match(/Day\s*(\d+)\s*-?\s*(.*)/)
        if (nameMatch) {
          return {
            day: parseInt(nameMatch[1]),
            title: nameMatch[2].trim(),
            description: item.description || item.notes || '',
          }
        }
        return {
          day: 1,
          title: item.name,
          description: item.description || item.notes || '',
        }
      })
    }

    const meals = extractMeals()
    const hotels = extractHotels()
    const activities = extractActivities()
    const days = accommodationDays > 0 ? accommodationDays + 1 : 5

    // 建立 URL 參數
    const params = new URLSearchParams()
    params.set('from_quote', 'true')
    params.set('quote_id', quote.id)
    params.set('quote_name', quote.name || '')
    params.set('days', days.toString())

    if (meals.length > 0) {
      params.set('meals', JSON.stringify(meals))
    }
    if (hotels.length > 0) {
      params.set('hotels', JSON.stringify(hotels))
    }
    if (activities.length > 0) {
      params.set('activities', JSON.stringify(activities))
    }

    router.push(`/itinerary/new?${params.toString()}`)
  }, [quote, categories, accommodationDays, router])

  // 載入特定版本
  const handleLoadVersion = useCallback(
    (versionIndex: number, versionData: VersionRecord) => {
      setCategories(versionData.categories || [])
      setAccommodationDays(versionData.accommodation_days || 0)
      if (versionData.participant_counts) {
        setParticipantCounts(versionData.participant_counts)
      }
      if (versionData.selling_prices) {
        setSellingPrices(versionData.selling_prices)
      }
      // 記錄當前編輯的版本索引（-1 表示主版本，null 表示初始狀態）
      setCurrentEditingVersion(versionIndex === -1 ? null : versionIndex)
    },
    [setCategories, setAccommodationDays, setParticipantCounts, setSellingPrices, setCurrentEditingVersion]
  )


  // 報價單預覽
  const [showQuotationPreview, setShowQuotationPreview] = React.useState(false)
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

  // ✅ 如果是快速報價單，顯示快速報價單介面
  if (quote.quote_type === 'quick') {
    return <QuickQuoteDetail quote={quote} onUpdate={(data) => updateQuote(quote.id, data)} />
  }

  return (
    <div className="w-full max-w-full space-y-6 pb-6">
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
        handleCreateItinerary={handleCreateItinerary}
        currentEditingVersion={currentEditingVersion}
        router={router}
        accommodationDays={accommodationDays}
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
                  <thead className="bg-morandi-container/40 border-b border-border/60">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-morandi-primary w-12 table-divider">
                        分類
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-morandi-primary w-70 table-divider">
                        項目
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-morandi-primary w-8 table-divider">
                        數量
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-morandi-primary w-28 table-divider">
                        單價
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-morandi-primary w-28 table-divider whitespace-nowrap">
                        小計
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-morandi-primary w-24">
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
                        handleUpdateItem={categoryOps.handleUpdateItem}
                        handleRemoveItem={categoryOps.handleRemoveItem}
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
    </div>
  )
}
