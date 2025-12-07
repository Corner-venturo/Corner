/**
 * Hook for quotes data fetching and CRUD operations
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuotes } from './useQuotes'
import { useTourStore, useRegionsStore } from '@/stores'
import { logger } from '@/lib/utils/logger'
import { DELETE_QUOTE_PASSWORD } from '@/lib/constants/workspace-settings'

export const useQuotesData = () => {
  const router = useRouter()
  const { quotes, addQuote, updateQuote, deleteQuote, duplicateQuote, loadQuotes } = useQuotes()
  const { items: tours, fetchAll: fetchTours } = useTourStore()
  const { countries, cities, fetchAll: fetchRegions, getCitiesByCountry } = useRegionsStore()

  // 載入報價單資料 - 只在首次載入時執行
  useEffect(() => {
    const timer = setTimeout(() => {
      loadQuotes()
      // ✅ 載入 tours（報價單需要關聯旅遊團）
      if (tours.length === 0) {
        fetchTours()
      }
      // ✅ 移除自動載入 regions（改為在打開對話框時才載入）
      // fetchRegions()
    }, 100)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只執行一次，避免無限循環

  const handleDuplicateQuote = async (quote_id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    try {
      const duplicated = await duplicateQuote(quote_id)
      if (duplicated && 'id' in duplicated && duplicated.id) {
        router.push(`/quotes/${duplicated.id}`)
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

    // 找到報價單資訊用於顯示
    const quote = quotes.find(q => q.id === quoteId)
    const quoteName = quote ? `${quote.code} - ${quote.name}` : quoteId

    // 需要輸入密碼確認
    const password = prompt(
      '⚠️ 刪除報價單需要密碼確認\n\n' +
        `即將刪除：${quoteName}\n` +
        '此操作無法復原，請輸入密碼：'
    )

    // 使用者取消
    if (password === null) {
      return
    }

    // 驗證密碼
    if (password !== DELETE_QUOTE_PASSWORD) {
      alert('❌ 密碼錯誤')
      return
    }

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
