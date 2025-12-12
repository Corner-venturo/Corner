/**
 * Customer Search Hook
 * 管理顧客搜尋狀態和過濾邏輯
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import type { Customer } from '@/types/customer.types'
import type { CustomerSearchParams } from '@/components/customers/customer-search-dialog'

const STORAGE_KEY = 'customerSearchParams'

export function useCustomerSearch(customers: Customer[]) {
  // 搜尋參數狀態（從 localStorage 初始化）
  const [searchParams, setSearchParams] = useState<CustomerSearchParams>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  // 當搜尋參數改變時，保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searchParams))
    }
  }, [searchParams])

  // 進階搜尋篩選
  const filteredCustomers = useMemo(() => {
    let result = customers

    // 基本搜尋（姓名、身份證號、護照號碼）
    if (searchParams.query) {
      const query = searchParams.query.toLowerCase()
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.national_id?.toLowerCase().includes(query) ||
          c.passport_number?.toLowerCase().includes(query)
      )
    }

    // 電話
    if (searchParams.phone) {
      result = result.filter(c => c.phone?.includes(searchParams.phone!))
    }

    // Email
    if (searchParams.email) {
      result = result.filter(c =>
        c.email?.toLowerCase().includes(searchParams.email!.toLowerCase())
      )
    }

    // 護照拼音
    if (searchParams.passport_romanization) {
      result = result.filter(c =>
        c.passport_romanization
          ?.toLowerCase()
          .includes(searchParams.passport_romanization!.toLowerCase())
      )
    }

    // 城市
    if (searchParams.city) {
      result = result.filter(c => c.city?.toLowerCase().includes(searchParams.city!.toLowerCase()))
    }

    // VIP 狀態
    if (searchParams.is_vip !== undefined) {
      result = result.filter(c => c.is_vip === searchParams.is_vip)
    }

    // VIP 等級
    if (searchParams.vip_level) {
      result = result.filter(c => c.vip_level === searchParams.vip_level)
    }

    // 客戶來源
    if (searchParams.source) {
      result = result.filter(c => c.source === searchParams.source)
    }

    // 護照效期範圍
    if (searchParams.passport_expiry_start) {
      result = result.filter(
        c => c.passport_expiry_date && c.passport_expiry_date >= searchParams.passport_expiry_start!
      )
    }
    if (searchParams.passport_expiry_end) {
      result = result.filter(
        c => c.passport_expiry_date && c.passport_expiry_date <= searchParams.passport_expiry_end!
      )
    }

    // 排序：未驗證的在最上面，其他按編號降序
    result = result.sort((a, b) => {
      // 先按驗證狀態排序：unverified 優先
      const aUnverified = a.verification_status !== 'verified'
      const bUnverified = b.verification_status !== 'verified'
      if (aUnverified && !bUnverified) return -1
      if (!aUnverified && bUnverified) return 1
      // 同狀態下按編號降序（新的在前面）
      return (b.code || '').localeCompare(a.code || '')
    })

    return result
  }, [customers, searchParams])

  // 更新搜尋參數
  const handleSearch = useCallback((params: CustomerSearchParams) => {
    setSearchParams(params)
  }, [])

  // 清除搜尋條件
  const handleClearSearch = useCallback(() => {
    setSearchParams({})
  }, [])

  // 是否有啟用的篩選條件
  const hasActiveFilters = Object.keys(searchParams).length > 0

  return {
    searchParams,
    setSearchParams,
    filteredCustomers,
    handleSearch,
    handleClearSearch,
    clearFilters: handleClearSearch,
    hasActiveFilters,
  }
}
