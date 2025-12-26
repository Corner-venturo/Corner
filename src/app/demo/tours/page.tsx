'use client'

import { useState, useMemo } from 'react'
import {
  MapPin,
  Calendar,
  FileText,
  BarChart3,
  FileCheck,
  AlertCircle,
  Archive,
  Users,
  Plane,
} from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { demoTours, formatCurrency, getStatusDisplay } from '@/lib/demo/demo-data'

// Demo 旅遊團列表類型
interface DemoTourRow {
  id: string
  tour_code: string
  tour_name: string
  destination: string
  country: string
  start_date: string
  end_date: string
  days: number
  status: 'draft' | 'published' | 'confirmed' | 'departed' | 'completed'
  price: number
  capacity: number
  enrolled: number
  cover_image: string
}

// 狀態對應到分頁
function getStatusTab(status: string): string {
  switch (status) {
    case 'draft':
      return '提案'
    case 'published':
      return '進行中'
    case 'confirmed':
      return '待結案'
    case 'departed':
    case 'completed':
      return '結案'
    default:
      return 'all'
  }
}

export default function DemoToursPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredTours = useMemo(() => {
    return demoTours.filter(tour => {
      const matchesSearch = !searchQuery ||
        tour.tour_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.tour_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.destination.toLowerCase().includes(searchQuery.toLowerCase())

      let matchesStatus = true
      if (statusFilter !== 'all') {
        const tourTab = getStatusTab(tour.status)
        matchesStatus = tourTab === statusFilter
      }
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter])

  // 統計數據
  const stats = useMemo(() => ({
    total: demoTours.length,
    confirmed: demoTours.filter(t => t.status === 'confirmed' || t.status === 'departed').length,
    published: demoTours.filter(t => t.status === 'published').length,
    totalEnrolled: demoTours.reduce((sum, t) => sum + t.enrolled, 0),
  }), [])

  // 表格欄位定義
  const tableColumns: TableColumn<DemoTourRow>[] = useMemo(
    () => [
      {
        key: 'tour_code',
        label: '團號',
        sortable: true,
        render: (_value, tour) => (
          <span className="text-xs text-morandi-secondary font-mono">{tour.tour_code}</span>
        ),
      },
      {
        key: 'tour_name',
        label: '行程名稱',
        sortable: true,
        render: (_value, tour) => (
          <div className="flex items-center gap-2">
            <img
              src={tour.cover_image}
              alt={tour.tour_name}
              className="w-10 h-10 rounded object-cover"
            />
            <div>
              <div className="text-sm font-medium text-morandi-primary">{tour.tour_name}</div>
              <div className="text-xs text-morandi-secondary flex items-center gap-1">
                <MapPin size={10} />
                {tour.destination}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'start_date',
        label: '出發日期',
        sortable: true,
        render: (_value, tour) => (
          <div className="text-xs text-morandi-primary flex items-center gap-1">
            <Calendar size={12} className="text-morandi-secondary" />
            {tour.start_date}
          </div>
        ),
      },
      {
        key: 'days',
        label: '天數',
        sortable: true,
        render: (_value, tour) => (
          <div className="text-xs text-morandi-secondary text-center">
            {tour.days} 天
          </div>
        ),
      },
      {
        key: 'enrolled',
        label: '報名狀況',
        sortable: true,
        render: (_value, tour) => {
          const percentage = Math.round((tour.enrolled / tour.capacity) * 100)
          return (
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    percentage >= 80 ? 'bg-status-success' :
                    percentage >= 50 ? 'bg-status-warning' : 'bg-status-info'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-morandi-secondary">
                {tour.enrolled}/{tour.capacity}
              </span>
            </div>
          )
        },
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
        render: (_value, tour) => {
          const status = getStatusDisplay(tour.status)
          return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
          )
        },
      },
      {
        key: 'price',
        label: '團費',
        sortable: true,
        render: (_value, tour) => (
          <div className="text-sm font-medium text-morandi-primary text-right">
            {formatCurrency(tour.price)}
          </div>
        ),
      },
    ],
    []
  )

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="旅遊團管理"
        icon={MapPin}
        breadcrumb={[
          { label: '首頁', href: '/demo' },
          { label: '旅遊團管理', href: '/demo/tours' },
        ]}
        showSearch={true}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜尋旅遊團..."
        tabs={[
          { value: 'all', label: '全部', icon: BarChart3 },
          { value: '提案', label: '提案', icon: FileText },
          { value: '進行中', label: '進行中', icon: Calendar },
          { value: '待結案', label: '待結案', icon: AlertCircle },
          { value: '結案', label: '結案', icon: FileCheck },
          { value: 'archived', label: '封存', icon: Archive },
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        onAdd={() => alert('DEMO 模式：新增旅遊團功能')}
        addLabel="新增旅遊團"
      />

      {/* 統計區 - 精簡版 */}
      <div className="px-4 py-2 bg-morandi-container/20 border-b border-border">
        <div className="flex items-center gap-6 text-xs text-morandi-secondary">
          <span>總行程：<strong className="text-morandi-primary">{stats.total}</strong> 個</span>
          <span>已成團：<strong className="text-status-success">{stats.confirmed}</strong> 個</span>
          <span>招募中：<strong className="text-status-info">{stats.published}</strong> 個</span>
          <span>總報名：<strong className="text-status-warning">{stats.totalEnrolled}</strong> 人</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <EnhancedTable
            columns={tableColumns}
            data={filteredTours}
            onRowClick={(tour) => alert(`DEMO 模式：查看旅遊團 ${tour.tour_name}`)}
          />
        </div>
      </div>
    </div>
  )
}
