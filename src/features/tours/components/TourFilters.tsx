'use client'

import React, { useState } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  FileText,
  MapPin,
  BarChart3,
  FileCheck,
  Archive,
  Star,
  Plus,
  Plane,
  ChevronDown,
} from 'lucide-react'

interface TourFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeTab: string
  onTabChange: (tab: string) => void
  onAddProposal: () => void
  onAddTour: () => void
}

export const TourFilters: React.FC<TourFiltersProps> = ({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  onAddProposal,
  onAddTour,
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
      customActions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1.5">
              <Plus size={16} />
              新增
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onAddProposal} className="gap-2 cursor-pointer">
              <FileText size={16} className="text-morandi-gold" />
              <span>新增提案</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddTour} className="gap-2 cursor-pointer">
              <Plane size={16} className="text-status-info" />
              <span>直接開團</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    />
  )
}
