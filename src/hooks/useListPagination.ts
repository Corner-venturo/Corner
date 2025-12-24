import { useState, useMemo } from 'react'

/**
 * 分頁配置選項
 */
export interface PaginationConfig {
  pageSize?: number
  enabled?: boolean
}

/**
 * useListPagination Hook 返回值
 */
export interface UseListPaginationReturn<T> {
  // 分頁狀態
  currentPage: number
  setCurrentPage: (page: number) => void
  pageSize: number
  totalPages: number
  totalItems: number

  // 分頁後的數據
  paginatedData: T[]

  // 重置分頁
  resetPagination: () => void
}

/**
 * useListPagination - 列表頁面分頁邏輯
 *
 * 管理分頁狀態和數據切分
 *
 * @example
 * ```tsx
 * const pagination = useListPagination(sortedData, {
 *   pageSize: 20,
 *   enabled: true,
 * });
 * ```
 */
export function useListPagination<T>(
  data: T[],
  paginationConfig?: PaginationConfig
): UseListPaginationReturn<T> {
  // ========== 狀態管理 ==========
  const [currentPage, setCurrentPage] = useState(1)

  // ========== 分頁配置 ==========
  const pageSize = paginationConfig?.pageSize || 20
  const enabled = paginationConfig?.enabled ?? true

  // ========== 分頁數據 ==========
  const paginatedData = useMemo(() => {
    if (!enabled) return data

    const start = (currentPage - 1) * pageSize
    return data.slice(start, start + pageSize)
  }, [data, currentPage, pageSize, enabled])

  // ========== 計算分頁信息 ==========
  const totalPages = Math.ceil(data.length / pageSize)
  const totalItems = data.length

  // ========== 重置分頁 ==========
  const resetPagination = () => {
    setCurrentPage(1)
  }

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    resetPagination,
  }
}
