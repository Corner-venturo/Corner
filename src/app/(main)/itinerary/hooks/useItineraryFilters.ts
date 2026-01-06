'use client'

import { useMemo } from 'react'
import type { Itinerary } from '@/stores/types'
import { stripHtml } from '@/lib/utils/string-utils'

interface UseItineraryFiltersProps {
  itineraries: Itinerary[]
  statusFilter: string
  searchTerm: string
  authorFilter: string
  userId?: string
  isSuperAdmin: boolean
  isItineraryClosed: (itinerary: Itinerary) => boolean
}

export function useItineraryFilters({
  itineraries,
  statusFilter,
  searchTerm,
  authorFilter,
  userId,
  isSuperAdmin,
  isItineraryClosed,
}: UseItineraryFiltersProps) {
  const filteredItineraries = useMemo(() => {
    let filtered = itineraries

    switch (statusFilter) {
      case '提案':
        // 提案狀態不受出發日期影響，只檢查 closed_at
        filtered = filtered.filter(
          item => item.status === '提案' && !item.closed_at && !item.archived_at && !item.is_template
        )
        break
      case '進行中':
        // 進行中狀態不受出發日期影響，只檢查 closed_at
        filtered = filtered.filter(
          item => item.status === '進行中' && !item.closed_at && !item.archived_at && !item.is_template
        )
        break
      case '公司範例':
        filtered = filtered.filter(item => item.is_template && !item.archived_at)
        break
      case '結案':
        filtered = filtered.filter(item => isItineraryClosed(item) && !item.archived_at)
        break
      default:
        filtered = filtered.filter(item => !item.archived_at && !item.is_template)
    }

    const effectiveAuthorFilter = authorFilter === '__mine__' ? userId : authorFilter
    if (effectiveAuthorFilter && effectiveAuthorFilter !== 'all') {
      filtered = filtered.filter(item => item.created_by === effectiveAuthorFilter)
    }

    if (isSuperAdmin) {
      const workspaceFilter = typeof window !== 'undefined' ? localStorage.getItem('itinerary_workspace_filter') : null
      if (workspaceFilter && workspaceFilter !== 'all') {
        filtered = filtered.filter(item => (item as Itinerary & { workspace_id?: string }).workspace_id === workspaceFilter)
      }
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        item =>
          stripHtml(item.title).toLowerCase().includes(searchLower) ||
          item.country.toLowerCase().includes(searchLower) ||
          item.city.toLowerCase().includes(searchLower) ||
          item.tour_code?.toLowerCase().includes(searchLower) ||
          item.status.toLowerCase().includes(searchLower) ||
          stripHtml(item.description).toLowerCase().includes(searchLower)
      )
    }

    // 未綁定團的行程排在前面
    filtered = filtered.sort((a, b) => {
      const aLinked = !!a.tour_id
      const bLinked = !!b.tour_id
      if (aLinked && !bLinked) return 1
      if (!aLinked && bLinked) return -1
      return 0
    })

    return filtered
  }, [itineraries, statusFilter, searchTerm, isItineraryClosed, authorFilter, userId, isSuperAdmin])

  return { filteredItineraries }
}
