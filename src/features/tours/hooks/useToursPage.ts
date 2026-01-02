'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tour } from '@/stores/types'
import { PageRequest } from '@/core/types/common'
import { useTourPageState } from './useTourPageState'
import { useTours } from './useTours-advanced'

interface UseToursPageReturn {
  // Data
  tours: Tour[]
  filteredTours: Tour[]
  loading: boolean

  // Pagination & Sorting
  currentPage: number
  setCurrentPage: (page: number) => void
  sortBy: string
  setSortBy: (field: string) => void
  sortOrder: 'asc' | 'desc'
  setSortOrder: (order: 'asc' | 'desc') => void
  handleSortChange: (field: string, order: 'asc' | 'desc') => void

  // Filtering & Search
  activeStatusTab: string
  setActiveStatusTab: (tab: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Row Expansion
  expandedRows: string[]
  toggleRowExpand: (id: string) => void

  // State
  state: ReturnType<typeof useTourPageState>

  // Actions
  actions: ReturnType<typeof useTours>['actions']

  // Helpers
  getStatusColor: (status: string) => string
  handleRowClick: (row: unknown) => void
}

export function useToursPage(): UseToursPageReturn {
  const router = useRouter()
  const searchParams = useSearchParams()

  const state = useTourPageState()
  const {
    currentPage,
    setCurrentPage,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    expandedRows,
    activeStatusTab,
    setActiveStatusTab,
    searchQuery,
    setSearchQuery,
    toggleRowExpand,
    setActiveTab,
    getStatusColor,
    setSelectedTour,
  } = state

  // Build PageRequest parameters
  const pageRequest: PageRequest = useMemo(
    () => ({
      page: currentPage,
      pageSize: 20,
      search: '',
      sortBy,
      sortOrder,
    }),
    [currentPage, sortBy, sortOrder]
  )

  // Use tours hook
  const { data: tours, loading, actions } = useTours(pageRequest)

  // Filter tours by status and search query
  const filteredTours = useMemo(() => {
    return (tours || []).filter(tour => {
      const searchLower = searchQuery.toLowerCase()
      const searchMatch =
        !searchQuery ||
        tour.name.toLowerCase().includes(searchLower) ||
        tour.code.toLowerCase().includes(searchLower) ||
        (tour.location || '').toLowerCase().includes(searchLower) ||
        (tour.status || '').toLowerCase().includes(searchLower) ||
        tour.description?.toLowerCase().includes(searchLower)

      // 封存分頁：只顯示已結團的（不含特殊團）
      if (activeStatusTab === 'archived') {
        return tour.closing_status === 'closed' && tour.status !== '特殊團' && searchMatch
      }

      // 特殊團分頁：只顯示特殊團
      if (activeStatusTab === '特殊團') {
        return tour.status === '特殊團' && searchMatch
      }

      // 其他分頁：排除已結團的和特殊團
      const notClosed = tour.closing_status !== 'closed'
      const notSpecial = tour.status !== '特殊團'
      const statusMatch = activeStatusTab === 'all' || tour.status === activeStatusTab

      return notClosed && notSpecial && statusMatch && searchMatch
    })
  }, [tours, activeStatusTab, searchQuery])

  const handleSortChange = useCallback(
    (field: string, order: 'asc' | 'desc') => {
      setSortBy(field)
      setSortOrder(order)
      setCurrentPage(1)
    },
    [setSortBy, setSortOrder, setCurrentPage]
  )

  const handleRowClick = useCallback(
    (row: unknown) => {
      const tour = row as Tour
      setSelectedTour(tour)
    },
    [setSelectedTour]
  )

  // Handle navigation from quote
  useEffect(() => {
    const highlightId = searchParams.get('highlight')

    if (highlightId) {
      toggleRowExpand(highlightId)
      setActiveTab(highlightId, 'tasks')
    }
  }, [searchParams, toggleRowExpand, setActiveTab])

  return {
    tours: tours || [],
    filteredTours,
    loading,
    currentPage,
    setCurrentPage,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    handleSortChange,
    activeStatusTab,
    setActiveStatusTab,
    searchQuery,
    setSearchQuery,
    expandedRows,
    toggleRowExpand,
    state,
    actions,
    getStatusColor,
    handleRowClick,
  }
}
