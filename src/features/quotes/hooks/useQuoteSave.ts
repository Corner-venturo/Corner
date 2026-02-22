'use client'

import { useCallback } from 'react'
import { UI_DELAYS } from '@/lib/constants/timeouts'
import { logger } from '@/lib/utils/logger'
import { CostCategory, ParticipantCounts, SellingPrices, TierPricing } from '../types'
import type { Quote } from '@/stores/types'
import type { QuickQuoteItem } from '@/types/quote.types'
import { syncHotelsFromQuoteToItinerary } from '../services/quoteItinerarySync'

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

interface UseQuoteSaveProps {
  quote: Quote | null | undefined
  updateQuote: (id: string, data: Partial<Quote>) => void
  updatedCategories: CostCategory[]
  total_cost: number
  groupSize: number
  quoteName: string
  accommodationDays: number
  participantCounts: ParticipantCounts
  sellingPrices: SellingPrices
  setSaveSuccess: (value: boolean) => void
  quickQuoteItems?: QuickQuoteItem[]
  quickQuoteCustomerInfo?: QuickQuoteCustomerInfo
  tierPricings?: TierPricing[]
}

export const useQuoteSave = ({
  quote,
  updateQuote,
  updatedCategories,
  total_cost,
  groupSize,
  quoteName,
  accommodationDays,
  participantCounts,
  sellingPrices,
  setSaveSuccess,
  quickQuoteItems,
  quickQuoteCustomerInfo,
  tierPricings,
}: UseQuoteSaveProps) => {
  // 直接儲存到報價單主欄位
  const handleSave = useCallback(
    () => {
      if (!quote) {
        logger.error('[handleSave] quote 為 undefined，無法儲存')
        return
      }

      try {
        // 快速報價單資料
        const quickQuoteData = quickQuoteCustomerInfo ? {
          customer_name: quickQuoteCustomerInfo.customer_name,
          contact_phone: quickQuoteCustomerInfo.contact_phone,
          contact_address: quickQuoteCustomerInfo.contact_address,
          tour_code: quickQuoteCustomerInfo.tour_code,
          handler_name: quickQuoteCustomerInfo.handler_name,
          issue_date: quickQuoteCustomerInfo.issue_date,
          received_amount: quickQuoteCustomerInfo.received_amount,
          expense_description: quickQuoteCustomerInfo.expense_description,
          quick_quote_items: quickQuoteItems || [],
        } : {}

        // 砍次表資料
        const tierPricingsData = tierPricings || []

        updateQuote(quote.id, {
          name: quoteName,
          categories: updatedCategories,
          total_cost,
          group_size: groupSize,
          accommodation_days: accommodationDays,
          participant_counts: participantCounts,
          selling_prices: sellingPrices,
          tier_pricings: tierPricingsData,
          ...quickQuoteData,
        })

        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), UI_DELAYS.SUCCESS_MESSAGE)

        // 同步飯店到行程表
        const accommodationItems = updatedCategories
          .find(cat => cat.id === 'accommodation')?.items || []
        if (accommodationItems.length > 0) {
          syncHotelsFromQuoteToItinerary(quote.id, accommodationItems)
            .then(result => {
              if (!result.success && result.message !== '無關聯行程表，跳過同步') {
                logger.warn('飯店同步到行程表:', result.message)
              }
            })
            .catch(err => logger.error('飯店同步錯誤:', err))
        }
      } catch (error) {
        logger.error('儲存失敗:', error)
      }
    },
    [
      quote,
      updatedCategories,
      total_cost,
      groupSize,
      quoteName,
      accommodationDays,
      participantCounts,
      sellingPrices,
      updateQuote,
      setSaveSuccess,
      quickQuoteItems,
      quickQuoteCustomerInfo,
      tierPricings,
    ]
  )

  return {
    handleSave,
  }
}
