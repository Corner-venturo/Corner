'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ParticipantCounts } from '@/features/quotes/types'
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
} from '@/features/quotes/components'

export default function QuoteDetailPage() {
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
    sellingPrices,
    setSellingPrices,
    selectedCity,
    availableCities,
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
    setSaveSuccess,
    setCategories,
    selectedCity,
    availableCities,
  })
  const { handleSaveVersion, formatDateTime, handleFinalize, handleCreateTour } = actions

  // 載入特定版本
  const handleLoadVersion = useCallback(
    (versionData: any) => {
      setCategories(versionData.categories)
      setAccommodationDays(versionData.accommodation_days || 0)
      if (versionData.participant_counts) {
        setParticipantCounts(versionData.participant_counts)
      }
      if (versionData.selling_prices) {
        setSellingPrices(versionData.selling_prices)
      }
    },
    [setCategories, setAccommodationDays, setParticipantCounts, setSellingPrices]
  )

  // 報價單預覽
  const [showQuotationPreview, setShowQuotationPreview] = React.useState(false)

  const handleGenerateQuotation = useCallback(() => {
    setShowQuotationPreview(true)
  }, [])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleClosePreview = useCallback(() => {
    setShowQuotationPreview(false)
  }, [])

  // Scroll handling
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

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

  return (
    <div className="w-full max-w-full space-y-6 pb-6">
      <QuoteHeader
        isSpecialTour={isSpecialTour}
        isReadOnly={isReadOnly}
        relatedTour={relatedTour}
        quote={quote}
        quoteName={quoteName}
        setQuoteName={setQuoteName}
        participantCounts={participantCounts}
        setParticipantCounts={setParticipantCounts}
        saveSuccess={saveSuccess}
        setIsSaveDialogOpen={setIsSaveDialogOpen}
        formatDateTime={formatDateTime}
        handleLoadVersion={handleLoadVersion}
        handleFinalize={handleFinalize}
        handleCreateTour={handleCreateTour}
        handleGenerateQuotation={handleGenerateQuotation}
        router={router}
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
          />
        </div>
      </div>

      {/* 保存版本對話框 */}
      <SaveVersionDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        versionName={versionName}
        setVersionName={setVersionName}
        onSave={handleSaveVersion}
      />

      {/* 可列印的報價單 */}
      <PrintableQuotation
        quote={quote}
        quoteName={quoteName}
        participantCounts={participantCounts}
        sellingPrices={sellingPrices}
        categories={updatedCategories}
        totalCost={total_cost}
        isOpen={showQuotationPreview}
        onClose={handleClosePreview}
        onPrint={handlePrint}
        accommodationSummary={accommodationSummary}
      />
    </div>
  )
}
