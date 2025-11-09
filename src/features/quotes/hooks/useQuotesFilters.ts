/**
 * Hook for filtering and searching quotes
 */

'use client'

import { useMemo } from 'react'
import { Quote } from '@/stores/types'

interface UseQuotesFiltersParams {
  quotes: Quote[]
  statusFilter: string
  searchTerm: string
  authorFilter?: string
}

export const useQuotesFilters = ({
  quotes,
  statusFilter,
  searchTerm,
  authorFilter,
}: UseQuotesFiltersParams) => {
  const filteredQuotes = useMemo(() => {
    return (
      quotes
        .filter(quote => {
          const matchesStatus = statusFilter === 'all' || quote.status === statusFilter

          // 搜尋 - 搜尋所有文字欄位
          const searchLower = searchTerm.toLowerCase()
          const matchesSearch =
            !searchTerm ||
            quote.name?.toLowerCase().includes(searchLower) ||
            quote.quote_number?.toLowerCase().includes(searchLower) ||
            quote.status?.toLowerCase().includes(searchLower)

          // 作者篩選
          const matchesAuthor =
            !authorFilter ||
            authorFilter === 'all' ||
            quote.created_by_name === authorFilter ||
            quote.handler_name === authorFilter

          return matchesStatus && matchesSearch && matchesAuthor
        })
        // 排序：置頂的報價單排在最前面
        .sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          // 同樣是置頂或都不是置頂，按建立時間排序
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
    )
  }, [quotes, statusFilter, searchTerm, authorFilter])

  return { filteredQuotes }
}
