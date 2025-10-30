'use client'

import { useState, useMemo } from 'react'
import type { Visa } from '@/stores/types'

/**
 * 簽證篩選邏輯 Hook
 * 負責狀態篩選和選擇管理
 */
export function useVisasFilters(visas: Visa[]) {
  const [activeTab, setActiveTab] = useState('all')
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  // 根據 tab 篩選簽證
  const filteredVisas = useMemo(() => {
    return activeTab === 'all' ? visas : visas.filter(v => v.status === activeTab)
  }, [visas, activeTab])

  return {
    activeTab,
    setActiveTab,
    selectedRows,
    setSelectedRows,
    filteredVisas,
  }
}
