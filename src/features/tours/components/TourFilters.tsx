'use client'

import React from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import {
  Calendar,
  FileText,
  MapPin,
  BarChart3,
  FileCheck,
  Archive,
  Star,
} from 'lucide-react'

interface TourFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeTab: string
  onTabChange: (tab: string) => void
  onAdd: () => void
}

export const TourFilters: React.FC<TourFiltersProps> = ({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  onAdd,
}) => {
  return (
    <ResponsiveHeader
      title="旅遊團管理"
      icon={MapPin}
      breadcrumb={[
        { label: '首頁', href: '/' },
        { label: '旅遊團管理', href: '/tours' },
      ]}
      showSearch={true}
      searchTerm={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="搜尋旅遊團..."
      onAdd={onAdd}
      addLabel="新增提案"
      tabs={[
        { value: 'all', label: '全部', icon: BarChart3 },
        { value: '提案', label: '提案', icon: FileText },
        { value: '進行中', label: '進行中', icon: Calendar },
        { value: '結案', label: '結案', icon: FileCheck },
        { value: '特殊團', label: '特殊團', icon: Star },
        { value: 'archived', label: '封存', icon: Archive },
      ]}
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  )
}
