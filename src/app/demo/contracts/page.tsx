'use client'

import { useState, useMemo } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import {
  FileSignature,
  FileText,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Mail,
  Download,
  BarChart3,
  Plane,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/demo/demo-data'

// Demo 合約類型
interface DemoContract {
  id: string
  tour_code: string
  tour_name: string
  destination: string
  departure_date: string
  return_date: string
  contract_status: 'none' | 'draft' | 'sent' | 'signed' | 'expired'
  total_orders: number
  total_pax: number
  total_amount: number
  signed_count: number
  created_at: string
}

// Demo 資料
const demoContracts: DemoContract[] = [
  {
    id: 'c1',
    tour_code: 'JP2501',
    tour_name: '北海道雪祭豪華 5 日',
    destination: '日本北海道',
    departure_date: '2025-02-05',
    return_date: '2025-02-09',
    contract_status: 'signed',
    total_orders: 6,
    total_pax: 18,
    total_amount: 1058400,
    signed_count: 6,
    created_at: '2025-01-05',
  },
  {
    id: 'c2',
    tour_code: 'JP2502',
    tour_name: '京都賞櫻經典 6 日',
    destination: '日本京都',
    departure_date: '2025-03-28',
    return_date: '2025-04-02',
    contract_status: 'sent',
    total_orders: 4,
    total_pax: 10,
    total_amount: 628000,
    signed_count: 2,
    created_at: '2025-01-10',
  },
  {
    id: 'c3',
    tour_code: 'EU2503',
    tour_name: '瑞士阿爾卑斯山深度 10 日',
    destination: '瑞士',
    departure_date: '2025-06-15',
    return_date: '2025-06-24',
    contract_status: 'draft',
    total_orders: 3,
    total_pax: 6,
    total_amount: 1008000,
    signed_count: 0,
    created_at: '2025-01-12',
  },
  {
    id: 'c4',
    tour_code: 'KR2504',
    tour_name: '首爾美食購物 4 日',
    destination: '韓國首爾',
    departure_date: '2025-01-25',
    return_date: '2025-01-28',
    contract_status: 'signed',
    total_orders: 5,
    total_pax: 12,
    total_amount: 345600,
    signed_count: 5,
    created_at: '2025-01-02',
  },
  {
    id: 'c5',
    tour_code: 'JP2507',
    tour_name: '東京迪士尼親子 5 日',
    destination: '日本東京',
    departure_date: '2025-04-05',
    return_date: '2025-04-09',
    contract_status: 'sent',
    total_orders: 8,
    total_pax: 24,
    total_amount: 1267200,
    signed_count: 5,
    created_at: '2025-01-15',
  },
  {
    id: 'c6',
    tour_code: 'TH2508',
    tour_name: '曼谷芭達雅歡樂 5 日',
    destination: '泰國曼谷',
    departure_date: '2025-02-20',
    return_date: '2025-02-24',
    contract_status: 'none',
    total_orders: 2,
    total_pax: 4,
    total_amount: 115200,
    signed_count: 0,
    created_at: '2025-01-18',
  },
]

// 狀態顯示設定
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  none: { label: '未建立', color: 'bg-gray-100 text-gray-500', icon: <FileText size={12} /> },
  draft: { label: '草稿', color: 'bg-amber-100 text-amber-600', icon: <FileText size={12} /> },
  sent: { label: '待簽署', color: 'bg-blue-100 text-blue-600', icon: <Send size={12} /> },
  signed: { label: '已簽署', color: 'bg-green-100 text-green-600', icon: <CheckCircle size={12} /> },
  expired: { label: '已過期', color: 'bg-red-100 text-red-600', icon: <Clock size={12} /> },
}

export default function DemoContractsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredContracts = useMemo(() => {
    return demoContracts.filter(contract => {
      const matchesSearch =
        !searchQuery ||
        contract.tour_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.tour_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.destination.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || contract.contract_status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter])

  // 統計
  const stats = useMemo(
    () => ({
      total: demoContracts.filter(c => c.contract_status !== 'none').length,
      signed: demoContracts.filter(c => c.contract_status === 'signed').length,
      pending: demoContracts.filter(c => c.contract_status === 'sent').length,
      totalPax: demoContracts.reduce((sum, c) => sum + c.total_pax, 0),
    }),
    []
  )

  // 表格欄位
  const tableColumns: TableColumn<DemoContract>[] = useMemo(
    () => [
      {
        key: 'tour_code',
        label: '團號',
        sortable: true,
        render: (_value, contract) => (
          <div className="flex items-center gap-2">
            <Plane size={14} className="text-morandi-gold" />
            <span className="text-xs font-mono text-morandi-secondary">{contract.tour_code}</span>
          </div>
        ),
      },
      {
        key: 'tour_name',
        label: '團名',
        sortable: true,
        render: (_value, contract) => (
          <div>
            <div className="text-sm font-medium text-morandi-primary">{contract.tour_name}</div>
            <div className="text-xs text-morandi-secondary">{contract.destination}</div>
          </div>
        ),
      },
      {
        key: 'departure_date',
        label: '出發日期',
        sortable: true,
        render: (_value, contract) => (
          <div className="text-sm text-morandi-primary">
            {contract.departure_date}
            <span className="text-xs text-morandi-secondary ml-1">
              ~ {contract.return_date}
            </span>
          </div>
        ),
      },
      {
        key: 'total_orders',
        label: '訂單數',
        sortable: true,
        render: (_value, contract) => (
          <span className="text-sm text-morandi-primary">{contract.total_orders} 筆</span>
        ),
      },
      {
        key: 'total_pax',
        label: '人數',
        sortable: true,
        render: (_value, contract) => (
          <div className="flex items-center gap-1 text-sm text-morandi-primary">
            <Users size={12} className="text-morandi-secondary" />
            {contract.total_pax} 人
          </div>
        ),
      },
      {
        key: 'total_amount',
        label: '總金額',
        sortable: true,
        render: (_value, contract) => (
          <span className="text-sm font-medium text-morandi-primary">{formatCurrency(contract.total_amount)}</span>
        ),
      },
      {
        key: 'contract_status',
        label: '合約狀態',
        sortable: true,
        render: (_value, contract) => {
          const config = statusConfig[contract.contract_status]
          return (
            <div className="flex flex-col gap-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color} w-fit`}>
                {config.icon}
                {config.label}
              </span>
              {contract.contract_status === 'sent' && (
                <span className="text-xs text-morandi-secondary">
                  已簽 {contract.signed_count}/{contract.total_orders}
                </span>
              )}
            </div>
          )
        },
      },
      {
        key: 'actions',
        label: '操作',
        sortable: false,
        render: (_value, contract) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); alert(`DEMO：預覽合約 ${contract.tour_name}`) }}>
              <Eye size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); alert(`DEMO：編輯合約 ${contract.tour_name}`) }}>
              <Edit size={14} />
            </Button>
            {contract.contract_status !== 'none' && (
              <>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); alert(`DEMO：發送合約 ${contract.tour_name}`) }}>
                  <Mail size={14} />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); alert(`DEMO：下載合約 ${contract.tour_name}`) }}>
                  <Download size={14} />
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    []
  )

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="合約管理"
        icon={FileSignature}
        breadcrumb={[
          { label: '首頁', href: '/demo' },
          { label: '合約管理', href: '/demo/contracts' },
        ]}
        showSearch={true}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜尋合約..."
        tabs={[
          { value: 'all', label: '全部', icon: BarChart3 },
          { value: 'none', label: '未建立', icon: AlertCircle },
          { value: 'draft', label: '草稿', icon: FileText },
          { value: 'sent', label: '待簽署', icon: Send },
          { value: 'signed', label: '已簽署', icon: CheckCircle },
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        onAdd={() => alert('DEMO 模式：建立合約')}
        addLabel="建立合約"
      />

      {/* 統計區 */}
      <div className="px-4 py-2 bg-morandi-container/20 border-b border-border">
        <div className="flex items-center gap-6 text-xs text-morandi-secondary">
          <span>總合約：<strong className="text-morandi-primary">{stats.total}</strong> 份</span>
          <span>已簽署：<strong className="text-green-600">{stats.signed}</strong> 份</span>
          <span>待簽署：<strong className="text-blue-600">{stats.pending}</strong> 份</span>
          <span>總人數：<strong className="text-morandi-gold">{stats.totalPax}</strong> 人</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <EnhancedTable
            columns={tableColumns}
            data={filteredContracts}
            onRowClick={(contract) => alert(`DEMO 模式：查看合約 ${contract.tour_name}`)}
          />
        </div>
      </div>
    </div>
  )
}
