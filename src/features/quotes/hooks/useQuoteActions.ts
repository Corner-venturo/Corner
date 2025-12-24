'use client'

import { useRouter } from 'next/navigation'
import { CostCategory, ParticipantCounts, SellingPrices, TierPricing } from '../types'
import type { Quote, Tour } from '@/stores/types'
import type { CreateInput } from '@/stores/core/types'
import type { QuickQuoteItem } from '@/types/quote.types'
import { useQuoteSave } from './useQuoteSave'
import { useQuoteVersion } from './useQuoteVersion'
import { useQuoteTour } from './useQuoteTour'
import { useQuoteGroupCostUpdate } from './useQuoteGroupCostUpdate'

interface QuickQuoteCustomerInfo {
  customer_name: string
  contact_phone: string
  contact_address: string
  tour_code: string
  handler_name: string
  issue_date: string
  received_amount: number
  expense_description: string
}

interface UseQuoteActionsProps {
  quote: Quote | null | undefined
  updateQuote: (id: string, data: Partial<Quote>) => void
  addTour: (data: CreateInput<Tour>) => Promise<Tour | undefined>
  router: ReturnType<typeof useRouter>
  updatedCategories: CostCategory[]
  total_cost: number
  groupSize: number
  groupSizeForGuide: number
  quoteName: string
  accommodationDays: number
  participantCounts: ParticipantCounts
  sellingPrices: SellingPrices
  versionName: string
  currentEditingVersion: number | null
  setSaveSuccess: (value: boolean) => void
  setCategories: React.Dispatch<React.SetStateAction<CostCategory[]>>
  // 快速報價單相關
  quickQuoteItems?: QuickQuoteItem[]
  quickQuoteCustomerInfo?: QuickQuoteCustomerInfo
  // 砍次表相關
  tierPricings?: TierPricing[]
}

export const useQuoteActions = ({
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
  quickQuoteItems,
  quickQuoteCustomerInfo,
  tierPricings,
}: UseQuoteActionsProps) => {
  // 使用分離的 hooks
  const { handleSave, handleSaveAsNewVersion } = useQuoteSave({
    quote,
    updateQuote,
    updatedCategories,
    total_cost,
    groupSize,
    quoteName,
    accommodationDays,
    participantCounts,
    sellingPrices,
    versionName,
    currentEditingVersion,
    setSaveSuccess,
    quickQuoteItems,
    quickQuoteCustomerInfo,
    tierPricings,
  })

  const { formatDateTime, handleFinalize, handleDeleteVersion } = useQuoteVersion({
    quote,
    updateQuote,
    router,
    updatedCategories,
    total_cost,
    groupSize,
    quoteName,
    accommodationDays,
    participantCounts,
    sellingPrices,
    setSaveSuccess,
  })

  const { handleCreateTour } = useQuoteTour({
    quote,
    updateQuote,
    addTour,
    router,
    updatedCategories,
    total_cost,
    groupSize,
    quoteName,
    accommodationDays,
    participantCounts,
    sellingPrices,
  })

  // 團體成本自動更新
  useQuoteGroupCostUpdate({
    groupSize,
    groupSizeForGuide,
    setCategories,
  })

  return {
    handleSave,
    handleSaveAsNewVersion,
    formatDateTime,
    handleFinalize,
    handleCreateTour,
    handleDeleteVersion,
  }
}
