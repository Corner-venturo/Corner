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
import { TOUR_FILTERS } from '../constants'

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
      title={TOUR_FILTERS.page_title}
      icon={MapPin}
      breadcrumb={[
        { label: TOUR_FILTERS.breadcrumb_home, href: '/' },
        { label: TOUR_FILTERS.breadcrumb_tours, href: '/tours' },
      ]}
      showSearch={true}
      searchTerm={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder={TOUR_FILTERS.search_placeholder}
      tabs={[
        { value: 'all', label: TOUR_FILTERS.tab_all, icon: BarChart3 },
        { value: '提案', label: TOUR_FILTERS.tab_proposal, icon: FileText },
        { value: '進行中', label: TOUR_FILTERS.tab_active, icon: Calendar },
        { value: '結案', label: TOUR_FILTERS.tab_closed, icon: FileCheck },
        { value: '特殊團', label: TOUR_FILTERS.tab_special, icon: Star },
        { value: 'archived', label: TOUR_FILTERS.tab_archived, icon: Archive },
      ]}
      activeTab={activeTab}
      onTabChange={onTabChange}
      customActions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1.5">
              <Plus size={16} />
              {TOUR_FILTERS.add_button}
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onAddProposal} className="gap-2 cursor-pointer">
              <FileText size={16} className="text-morandi-gold" />
              <span>{TOUR_FILTERS.add_proposal}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddTour} className="gap-2 cursor-pointer">
              <Plane size={16} className="text-status-info" />
              <span>{TOUR_FILTERS.add_tour_direct}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    />
  )
}
