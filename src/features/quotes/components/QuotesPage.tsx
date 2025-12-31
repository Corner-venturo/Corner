/**
 * QuotesPage - 報價單管理（以團為主）
 * 顯示旅遊團列表，點擊開啟報價單管理懸浮視窗
 */

'use client'

import React, { useState, useMemo } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable } from '@/components/ui/enhanced-table'
import { Calculator, FileText, Calendar, MapPin, Users, LayoutList, CheckCircle, XCircle } from 'lucide-react'
import { DocumentVersionPicker } from '@/components/documents'
import { useTourStore, useQuoteStore } from '@/stores'
import type { Tour } from '@/stores/types'
import { cn } from '@/lib/utils'

// 狀態篩選（只顯示有報價單的團）
const STATUS_TABS = [
  { value: 'all', label: '全部', icon: LayoutList },
]

export const QuotesPage: React.FC = () => {
  const { items: tours, loading: toursLoading, fetchAll: fetchTours } = useTourStore()
  const { items: quotes, loading: quotesLoading, fetchAll: fetchQuotes } = useQuoteStore()

  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null)

  // 載入資料
  React.useEffect(() => {
    fetchTours()
    fetchQuotes()
  }, [fetchTours, fetchQuotes])

  // 計算每個團的報價單數量
  const tourQuoteCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    quotes.forEach(quote => {
      if (quote.tour_id) {
        counts[quote.tour_id] = (counts[quote.tour_id] || 0) + 1
      }
    })
    return counts
  }, [quotes])

  // 篩選旅遊團（只顯示有報價單的團）
  const filteredTours = useMemo(() => {
    // 只顯示有報價單的團
    let result = tours.filter(tour => (tourQuoteCounts[tour.id] || 0) > 0)

    // 搜尋篩選
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(tour =>
        tour.code?.toLowerCase().includes(term) ||
        tour.name?.toLowerCase().includes(term) ||
        tour.location?.toLowerCase().includes(term)
      )
    }

    // 按出發日期排序（最近的在前）
    result.sort((a, b) => {
      const dateA = a.departure_date ? new Date(a.departure_date).getTime() : 0
      const dateB = b.departure_date ? new Date(b.departure_date).getTime() : 0
      return dateB - dateA
    })

    return result
  }, [tours, searchTerm, tourQuoteCounts])

  // 表格欄位定義
  const columns = [
    {
      key: 'code',
      label: '團號',
      width: '140px',
      render: (_: unknown, row: Tour) => (
        <span className="font-mono text-sm text-morandi-gold font-medium">
          {row.code}
        </span>
      ),
    },
    {
      key: 'name',
      label: '團名',
      render: (_: unknown, row: Tour) => (
        <div className="flex items-center gap-2">
          <span className="text-sm text-morandi-primary truncate">
            {row.name || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'location',
      label: '目的地',
      width: '120px',
      render: (_: unknown, row: Tour) => (
        <div className="flex items-center gap-1 text-sm text-morandi-secondary">
          <MapPin size={14} />
          <span>{row.location || '-'}</span>
        </div>
      ),
    },
    {
      key: 'departure_date',
      label: '出發日期',
      width: '120px',
      render: (_: unknown, row: Tour) => (
        <div className="flex items-center gap-1 text-sm text-morandi-secondary">
          <Calendar size={14} />
          <span>
            {row.departure_date
              ? new Date(row.departure_date).toLocaleDateString('zh-TW')
              : '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'max_participants',
      label: '人數',
      width: '80px',
      render: (_: unknown, row: Tour) => (
        <div className="flex items-center gap-1 text-sm text-morandi-secondary">
          <Users size={14} />
          <span>{row.max_participants || '-'}</span>
        </div>
      ),
    },
    {
      key: 'quote_count',
      label: '報價單',
      width: '100px',
      render: (_: unknown, row: Tour) => {
        const count = tourQuoteCounts[row.id] || 0
        return (
          <div className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            count > 0
              ? 'bg-morandi-gold/10 text-morandi-gold'
              : 'bg-morandi-container/50 text-morandi-secondary'
          )}>
            <FileText size={12} />
            <span>{count} 份</span>
          </div>
        )
      },
    },
  ]

  const loading = toursLoading || quotesLoading

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="報價單管理"
        icon={Calculator}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '報價單管理', href: '/quotes' },
        ]}
        tabs={STATUS_TABS}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        showSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋團號、團名..."
      />

      <div className="flex-1 overflow-hidden">
        <EnhancedTable
          columns={columns}
          data={filteredTours as Tour[]}
          loading={loading}
          emptyMessage="尚無報價單資料"
          onRowClick={(row) => setSelectedTour(row as Tour)}
          rowClassName={() => "cursor-pointer hover:bg-morandi-gold/5"}
        />
      </div>

      {/* 報價單管理懸浮視窗 */}
      {selectedTour && (
        <DocumentVersionPicker
          isOpen={!!selectedTour}
          onClose={() => setSelectedTour(null)}
          tour={selectedTour}
        />
      )}
    </div>
  )
}
