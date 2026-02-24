'use client'

import React from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  FileCheck,
  MapPin,
  BarChart3,
  Archive,
  Star,
  Plus,
  Plane,
} from 'lucide-react'
import { TOUR_FILTERS } from '../constants'

interface TourFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeTab: string
  onTabChange: (tab: string) => void
  onAddTour: () => void
}

export const TourFilters: React.FC<TourFiltersProps> = ({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
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
        { value: '待出發', label: TOUR_FILTERS.tab_active, icon: Calendar },
        { value: '已結團', label: TOUR_FILTERS.tab_closed, icon: FileCheck },
        { value: '特殊團', label: TOUR_FILTERS.tab_special, icon: Star },
        { value: 'archived', label: TOUR_FILTERS.tab_archived, icon: Archive },
      ]}
      activeTab={activeTab}
      onTabChange={onTabChange}
      customActions={
        <Button
          onClick={onAddTour}
          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1.5"
        >
          <Plus size={16} />
          {TOUR_FILTERS.add_tour_direct}
        </Button>
      }
    />
  )
}
