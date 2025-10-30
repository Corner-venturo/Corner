import { useState, useMemo, useCallback } from 'react'
import { useDataFiltering } from './useDataFiltering'

/**
 * useListPageState 配置選項
 */
export interface UseListPageStateOptions<T> {
  // 數據源
  data: T[]

  // 過濾配置
  filterConfig?: {
    statusField?: keyof T
    searchFields?: (keyof T)[]
    defaultStatus?: string
  }

  // 排序配置
  sortConfig?: {
    defaultSortBy?: string
    defaultSortOrder?: 'asc' | 'desc'
  }

  // 分頁配置
  paginationConfig?: {
    pageSize?: number
    enabled?: boolean
  }

  // 展開配置
  expandable?: boolean
}

/**
 * useListPageState Hook 返回值
 */
export interface UseListPageStateReturn<T> {
  // 原始數據
  data: T[]

  // 處理後的數據
  filteredData: T[]
  sortedData: T[]
  displayData: T[]

  // 搜尋
  searchQuery: string
  setSearchQuery: (query: string) => void

  // 狀態過濾
  statusFilter: string
  setStatusFilter: (status: string) => void

  // 排序
  sortBy: string
  setSortBy: (field: string) => void
  sortOrder: 'asc' | 'desc'
  setSortOrder: (order: 'asc' | 'desc') => void
  handleSort: (field: string, order: 'asc' | 'desc') => void

  // 分頁
  currentPage: number
  setCurrentPage: (page: number) => void
  pageSize: number
  totalPages: number
  totalItems: number

  // 展開
  expandedRows: Set<string>
  toggleRow: (id: string) => void
  isExpanded: (id: string) => boolean
  expandAll: () => void
  collapseAll: () => void

  // 重置
  reset: () => void
}

/**
 * useListPageState - 統一的列表頁面狀態管理 Hook
 *
 * 整合搜尋、過濾、排序、分頁、展開等所有列表頁面常用功能
 *
 * @example
 * ```tsx
 * const listState = useListPageState({
 *   data: tours || [],
 *   filterConfig: {
 *     statusField: 'status',
 *     searchFields: ['name', 'code', 'location'],
 *     defaultStatus: 'all',
 *   },
 *   sortConfig: {
 *     defaultSortBy: 'departure_date',
 *     defaultSortOrder: 'desc',
 *   },
 *   paginationConfig: {
 *     pageSize: 20,
 *     enabled: true,
 *   },
 *   expandable: true,
 * });
 *
 * // 使用
 * <ListPageLayout
 *   data={listState.displayData}
 *   searchQuery={listState.searchQuery}
 *   onSearchChange={listState.setSearchQuery}
 *   {...otherProps}
 * />
 * ```
 */
export function useListPageState<T extends Record<string, any>>(
  options: UseListPageStateOptions<T>
): UseListPageStateReturn<T> {
  const { data, filterConfig, sortConfig, paginationConfig, expandable = false } = options

  // ========== 狀態管理 ==========
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(filterConfig?.defaultStatus || 'all')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState(sortConfig?.defaultSortBy || 'created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(sortConfig?.defaultSortOrder || 'desc')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // ========== 過濾數據 ==========
  const filteredData = useDataFiltering(data, statusFilter, searchQuery, {
    statusField: filterConfig?.statusField,
    searchFields: filterConfig?.searchFields,
  })

  // ========== 排序數據 ==========
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]

      // 處理 null/undefined
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return sortOrder === 'asc' ? 1 : -1
      if (bVal == null) return sortOrder === 'asc' ? -1 : 1

      // 處理日期
      if (aVal instanceof Date && bVal instanceof Date) {
        const diff = aVal.getTime() - bVal.getTime()
        return sortOrder === 'asc' ? diff : -diff
      }

      // 處理字串日期
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const aDate = new Date(aVal)
        const bDate = new Date(bVal)
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          const diff = aDate.getTime() - bDate.getTime()
          return sortOrder === 'asc' ? diff : -diff
        }
      }

      // 一般比較
      const order = sortOrder === 'asc' ? 1 : -1
      if (aVal < bVal) return -1 * order
      if (aVal > bVal) return 1 * order
      return 0
    })
  }, [filteredData, sortBy, sortOrder])

  // ========== 分頁數據 ==========
  const pageSize = paginationConfig?.pageSize || 20
  const paginatedData = useMemo(() => {
    if (!paginationConfig?.enabled) return sortedData

    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize, paginationConfig?.enabled])

  // ========== 展開/收合邏輯 ==========
  const toggleRow = useCallback((id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const isExpanded = useCallback((id: string) => expandedRows.has(id), [expandedRows])

  const expandAll = useCallback(() => {
    const allIds = new Set(paginatedData.map(item => item.id))
    setExpandedRows(allIds)
  }, [paginatedData])

  const collapseAll = useCallback(() => {
    setExpandedRows(new Set())
  }, [])

  // ========== 排序處理 ==========
  const handleSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortBy(field)
    setSortOrder(order)
    setCurrentPage(1) // 重置到第一頁
  }, [])

  // ========== 重置所有狀態 ==========
  const reset = useCallback(() => {
    setSearchQuery('')
    setStatusFilter(filterConfig?.defaultStatus || 'all')
    setCurrentPage(1)
    setSortBy(sortConfig?.defaultSortBy || 'created_at')
    setSortOrder(sortConfig?.defaultSortOrder || 'desc')
    setExpandedRows(new Set())
  }, [filterConfig, sortConfig])

  // ========== 計算分頁信息 ==========
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const totalItems = sortedData.length

  return {
    // 原始數據
    data,

    // 處理後的數據
    filteredData,
    sortedData,
    displayData: paginatedData,

    // 搜尋
    searchQuery,
    setSearchQuery,

    // 狀態過濾
    statusFilter,
    setStatusFilter,

    // 排序
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    handleSort,

    // 分頁
    currentPage,
    setCurrentPage,
    pageSize,
    totalPages,
    totalItems,

    // 展開
    expandedRows,
    toggleRow,
    isExpanded,
    expandAll,
    collapseAll,

    // 重置
    reset,
  }
}
