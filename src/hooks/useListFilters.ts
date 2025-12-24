import { useState, useMemo } from 'react'
import { useDataFiltering } from './useDataFiltering'

/**
 * 篩選配置選項
 */
export interface FilterConfig<T> {
  statusField?: keyof T
  searchFields?: (keyof T)[]
  defaultStatus?: string
}

/**
 * useListFilters Hook 返回值
 */
export interface UseListFiltersReturn<T> {
  // 搜尋
  searchQuery: string
  setSearchQuery: (query: string) => void

  // 狀態過濾
  statusFilter: string
  setStatusFilter: (status: string) => void

  // 處理後的數據
  filteredData: T[]

  // 重置篩選
  resetFilters: () => void
}

/**
 * useListFilters - 列表頁面篩選邏輯
 *
 * 管理搜尋和狀態過濾功能
 *
 * @example
 * ```tsx
 * const filters = useListFilters({
 *   data: tours || [],
 *   filterConfig: {
 *     statusField: 'status',
 *     searchFields: ['name', 'code', 'location'],
 *     defaultStatus: 'all',
 *   },
 * });
 * ```
 */
export function useListFilters<T extends Record<string, any>>(
  data: T[],
  filterConfig?: FilterConfig<T>
): UseListFiltersReturn<T> {
  // ========== 狀態管理 ==========
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(filterConfig?.defaultStatus || 'all')

  // ========== 過濾數據 ==========
  const filteredData = useDataFiltering(data, statusFilter, searchQuery, {
    statusField: filterConfig?.statusField,
    searchFields: filterConfig?.searchFields,
  })

  // ========== 重置篩選 ==========
  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter(filterConfig?.defaultStatus || 'all')
  }

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredData,
    resetFilters,
  }
}
