'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { UI_DELAYS } from '@/lib/constants/timeouts'
import { logger } from '@/lib/utils/logger'
import { CostCategory, ParticipantCounts, SellingPrices } from '../types'
import type { Quote, QuoteVersion } from '@/stores/types'
import { QUOTE_HOOKS_LABELS } from '../constants/labels'

interface UseQuoteVersionProps {
  quote: Quote | null | undefined
  updateQuote: (id: string, data: Partial<Quote>) => void
  router: ReturnType<typeof useRouter>
  updatedCategories: CostCategory[]
  total_cost: number
  groupSize: number
  quoteName: string
  accommodationDays: number
  participantCounts: ParticipantCounts
  sellingPrices: SellingPrices
  setSaveSuccess: (value: boolean) => void
}

export const useQuoteVersion = ({
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
}: UseQuoteVersionProps) => {
  // 格式化時間
  const formatDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  // 轉為最終版本
  const handleFinalize = useCallback(() => {
    if (!quote) return

    // 先保存當前版本為新版本
    const existingVersions = quote.versions || []
    const maxVersion = existingVersions.reduce((max: number, v: QuoteVersion) =>
      Math.max(max, v.version || 0), 0
    )
    const newVersion = maxVersion + 1

    const finalizeVersionRecord: QuoteVersion = {
      id: Date.now().toString(),
      version: newVersion,
      mode: 'detailed', // 預設為詳細模式
      name: `最終版本 ${newVersion}`,
      categories: updatedCategories,
      total_cost,
      group_size: groupSize,
      accommodation_days: accommodationDays,
      participant_counts: participantCounts,
      selling_prices: sellingPrices,
      notes: '轉為最終版本前的狀態',
      created_at: new Date().toISOString(),
    }

    // 更新狀態為最終版本
    updateQuote(quote.id, {
      status: 'approved',
      categories: updatedCategories,
      total_cost,
      group_size: groupSize,
      name: quoteName,
      accommodation_days: accommodationDays,
      participant_counts: participantCounts,
      selling_prices: sellingPrices,
      versions: [...existingVersions, finalizeVersionRecord],
    })

    // 自動跳轉到旅遊團新增頁面，並帶上報價單ID
    router.push(`/tours?fromQuote=${quote.id}`)
  }, [
    quote,
    updateQuote,
    updatedCategories,
    total_cost,
    groupSize,
    quoteName,
    accommodationDays,
    participantCounts,
    sellingPrices,
    router,
  ])

  // 刪除版本
  const handleDeleteVersion = useCallback(
    (versionIndex: number) => {
      if (!quote || !quote.versions) return

      try {
        const existingVersions = [...quote.versions]
        existingVersions.splice(versionIndex, 1)

        updateQuote(quote.id, {
          versions: existingVersions,
        })

        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), UI_DELAYS.SUCCESS_MESSAGE)
      } catch (error) {
        logger.error('刪除版本失敗:', error)
      }
    },
    [quote, updateQuote, setSaveSuccess]
  )

  return {
    formatDateTime,
    handleFinalize,
    handleDeleteVersion,
  }
}
