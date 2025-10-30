/**
 * Hook for quotes data fetching and CRUD operations
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuotes } from './useQuotes'
import { useTourStore, useRegionStoreNew } from '@/stores'
import { logger } from '@/lib/utils/logger'

export const useQuotesData = () => {
  const router = useRouter()
  const { quotes, addQuote, updateQuote, deleteQuote, duplicateQuote, loadQuotes } = useQuotes()
  const { items: tours } = useTourStore()
  const { countries, cities, fetchAll: fetchRegions, getCitiesByCountry } = useRegionStoreNew()

  // 載入報價單資料 - 只在首次載入時執行
  useEffect(() => {
    const timer = setTimeout(() => {
      loadQuotes()
      fetchRegions()
    }, 100)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只執行一次，避免無限循環

  const handleDuplicateQuote = async (quote_id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    try {
      const duplicated = await duplicateQuote(quote_id)
      if (duplicated && (duplicated as unknown).id) {
        router.push(`/quotes/${(duplicated as unknown).id}`)
      } else {
        alert('複製報價單失敗，請重試')
      }
    } catch (error) {
      logger.error('❌ 複製報價單失敗:', error)
      alert('複製報價單失敗，請重試')
    }
  }

  const handleTogglePin = async (quoteId: string, isPinned: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    await updateQuote(quoteId, { is_pinned: !isPinned })
  }

  const handleDeleteQuote = async (quoteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    await deleteQuote(quoteId)
  }

  const handleQuoteClick = (quoteId: string) => {
    router.push(`/quotes/${quoteId}`)
  }

  return {
    // Data
    quotes,
    tours,
    countries,
    cities,
    getCitiesByCountry,

    // Actions
    addQuote,
    updateQuote,
    deleteQuote,
    handleDuplicateQuote,
    handleTogglePin,
    handleDeleteQuote,
    handleQuoteClick,
  }
}
