/**
 * Hook for quotes data fetching and CRUD operations
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuotes } from './useQuotes'
import { useTourStore, useRegionsStore, useItineraryStore } from '@/stores'
import { logger } from '@/lib/utils/logger'
import { DELETE_QUOTE_PASSWORD } from '@/lib/constants/workspace-settings'
import { confirm, alertSuccess, alertError } from '@/lib/ui/alert-dialog'

export const useQuotesData = () => {
  const router = useRouter()
  const { quotes, addQuote, updateQuote, deleteQuote, duplicateQuote, loadQuotes } = useQuotes()
  const { items: tours, fetchAll: fetchTours } = useTourStore()
  const { countries, cities, fetchAll: fetchRegions, getCitiesByCountry } = useRegionsStore()
  const { items: itineraries, update: updateItinerary } = useItineraryStore()

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

  const handleRejectQuote = async (quoteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    const quote = quotes.find(q => q.id === quoteId)
    if (!quote) return

    // 檢查是否有關聯的行程表
    const linkedItinerary = quote.itinerary_id
      ? itineraries.find(i => i.id === quote.itinerary_id)
      : null
    const hasLinkedItinerary = !!linkedItinerary && !linkedItinerary.archived_at

    let syncAction: 'sync' | 'unlink' | 'cancel' = 'cancel'

    if (hasLinkedItinerary) {
      // 有關聯行程表，詢問處理方式
      const result = await confirm(
        `此報價單有關聯的行程表「${linkedItinerary.title}」。\n\n請選擇作廢方式：\n• 同步封存：行程表也一併封存\n• 僅作廢報價單：斷開關聯，行程表保留`,
        {
          type: 'warning',
          title: '作廢報價單',
          confirmText: '同步封存',
          cancelText: '取消',
          showThirdOption: true,
          thirdOptionText: '僅作廢報價單',
        }
      )

      if (result === true) {
        syncAction = 'sync'
      } else if (result === 'third') {
        syncAction = 'unlink'
      } else {
        return // 取消操作
      }
    } else {
      // 沒有關聯行程表，直接確認
      const confirmed = await confirm('確定要作廢這個報價單嗎？', {
        type: 'warning',
        title: '作廢報價單',
      })
      if (!confirmed) return
      syncAction = 'sync'
    }

    try {
      // 作廢報價單
      await updateQuote(quoteId, { status: 'rejected' as const })

      if (hasLinkedItinerary && linkedItinerary) {
        if (syncAction === 'sync') {
          // 同步封存行程表
          const archivedAt = new Date().toISOString()
          await updateItinerary(linkedItinerary.id, { archived_at: archivedAt })
          await alertSuccess('已作廢報價單並封存行程表！')
        } else if (syncAction === 'unlink') {
          // 斷開關聯
          await updateQuote(quoteId, { itinerary_id: undefined })
          await alertSuccess('已作廢報價單！行程表已斷開關聯並保留。')
        }
      } else {
        await alertSuccess('已作廢報價單！')
      }
    } catch (error) {
      logger.error('❌ 作廢報價單失敗:', error)
      await alertError('作廢失敗，請稍後再試')
    }
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
    handleRejectQuote,
  }
}
