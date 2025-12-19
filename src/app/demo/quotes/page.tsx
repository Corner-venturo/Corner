'use client'

import { useState, useMemo } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import {
  Calculator,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Copy,
  Eye,
  Edit,
  Trash2,
  Send,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/demo/demo-data'

// Demo 報價單類型
interface DemoQuote {
  id: string
  code: string
  name: string
  customer_name: string
  destination: string
  travel_days: number
  pax: number
  total_amount: number
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'
  quote_type: 'standard' | 'quick'
  is_pinned: boolean
  handler_name: string
  created_at: string
  valid_until: string
}

// Demo 資料
const demoQuotes: DemoQuote[] = [
  {
    id: 'q1',
    code: 'QT-2501-001',
    name: '北海道雪祭 5 日遊報價',
    customer_name: '王大明',
    destination: '日本北海道',
    travel_days: 5,
    pax: 20,
    total_amount: 1176000,
    status: 'approved',
    quote_type: 'standard',
    is_pinned: true,
    handler_name: '陳業務',
    created_at: '2025-01-10',
    valid_until: '2025-02-10',
  },
  {
    id: 'q2',
    code: 'QT-2501-002',
    name: '京都賞櫻 6 日遊報價',
    customer_name: '李美玲',
    destination: '日本京都',
    travel_days: 6,
    pax: 16,
    total_amount: 1008000,
    status: 'sent',
    quote_type: 'standard',
    is_pinned: false,
    handler_name: '王業務',
    created_at: '2025-01-12',
    valid_until: '2025-02-12',
  },
  {
    id: 'q3',
    code: 'QT-2501-003',
    name: '瑞士深度 10 日遊報價',
    customer_name: '張志豪',
    destination: '瑞士',
    travel_days: 10,
    pax: 12,
    total_amount: 2016000,
    status: 'draft',
    quote_type: 'standard',
    is_pinned: false,
    handler_name: '陳業務',
    created_at: '2025-01-15',
    valid_until: '2025-02-15',
  },
  {
    id: 'q4',
    code: 'QQ-2501-001',
    name: '首爾快閃 4 日遊',
    customer_name: '林建宏',
    destination: '韓國首爾',
    travel_days: 4,
    pax: 8,
    total_amount: 230400,
    status: 'approved',
    quote_type: 'quick',
    is_pinned: false,
    handler_name: '王業務',
    created_at: '2025-01-16',
    valid_until: '2025-01-30',
  },
  {
    id: 'q5',
    code: 'QT-2501-004',
    name: '東京迪士尼親子 5 日',
    customer_name: '黃雅芬',
    destination: '日本東京',
    travel_days: 5,
    pax: 24,
    total_amount: 1267200,
    status: 'rejected',
    quote_type: 'standard',
    is_pinned: false,
    handler_name: '陳業務',
    created_at: '2025-01-08',
    valid_until: '2025-02-08',
  },
  {
    id: 'q6',
    code: 'QT-2501-005',
    name: '沖繩海島度假 4 日',
    customer_name: '周志明',
    destination: '日本沖繩',
    travel_days: 4,
    pax: 10,
    total_amount: 288000,
    status: 'expired',
    quote_type: 'standard',
    is_pinned: false,
    handler_name: '王業務',
    created_at: '2024-12-01',
    valid_until: '2024-12-31',
  },
]

// 狀態顯示設定
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-600', icon: <FileText size={12} /> },
  sent: { label: '已發送', color: 'bg-blue-100 text-blue-600', icon: <Send size={12} /> },
  approved: { label: '已核准', color: 'bg-green-100 text-green-600', icon: <CheckCircle size={12} /> },
  rejected: { label: '已拒絕', color: 'bg-red-100 text-red-600', icon: <XCircle size={12} /> },
  expired: { label: '已過期', color: 'bg-amber-100 text-amber-600', icon: <Clock size={12} /> },
}

export default function DemoQuotesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredQuotes = useMemo(() => {
    return demoQuotes.filter(quote => {
      const matchesSearch =
        !searchQuery ||
        quote.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quote.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quote.customer_name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter])

  // 統計
  const stats = useMemo(
    () => ({
      total: demoQuotes.length,
      approved: demoQuotes.filter(q => q.status === 'approved').length,
      pending: demoQuotes.filter(q => q.status === 'sent').length,
      totalAmount: demoQuotes.filter(q => q.status === 'approved').reduce((sum, q) => sum + q.total_amount, 0),
    }),
    []
  )

  // 表格欄位
  const tableColumns: TableColumn<DemoQuote>[] = useMemo(
    () => [
      {
        key: 'code',
        label: '報價編號',
        sortable: true,
        render: (_value, quote) => (
          <div className="flex items-center gap-2">
            {quote.is_pinned && <Star size={14} className="text-amber-500 fill-amber-500" />}
            <span className="text-xs font-mono text-morandi-secondary">{quote.code}</span>
            {quote.quote_type === 'quick' && (
              <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded">快速</span>
            )}
          </div>
        ),
      },
      {
        key: 'name',
        label: '報價名稱',
        sortable: true,
        render: (_value, quote) => (
          <div>
            <div className="text-sm font-medium text-morandi-primary">{quote.name}</div>
            <div className="text-xs text-morandi-secondary">{quote.destination} · {quote.travel_days} 天</div>
          </div>
        ),
      },
      {
        key: 'customer_name',
        label: '客戶',
        sortable: true,
        render: (_value, quote) => (
          <span className="text-sm text-morandi-primary">{quote.customer_name}</span>
        ),
      },
      {
        key: 'pax',
        label: '人數',
        sortable: true,
        render: (_value, quote) => (
          <span className="text-sm text-morandi-secondary">{quote.pax} 人</span>
        ),
      },
      {
        key: 'total_amount',
        label: '總金額',
        sortable: true,
        render: (_value, quote) => (
          <span className="text-sm font-medium text-morandi-primary">{formatCurrency(quote.total_amount)}</span>
        ),
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
        render: (_value, quote) => {
          const config = statusConfig[quote.status]
          return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
              {config.icon}
              {config.label}
            </span>
          )
        },
      },
      {
        key: 'handler_name',
        label: '負責人',
        sortable: true,
        render: (_value, quote) => (
          <span className="text-sm text-morandi-secondary">{quote.handler_name}</span>
        ),
      },
      {
        key: 'valid_until',
        label: '有效期限',
        sortable: true,
        render: (_value, quote) => (
          <span className="text-xs text-morandi-secondary">{quote.valid_until}</span>
        ),
      },
      {
        key: 'actions',
        label: '操作',
        sortable: false,
        render: (_value, quote) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); alert(`DEMO：預覽 ${quote.name}`) }}>
              <Eye size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); alert(`DEMO：編輯 ${quote.name}`) }}>
              <Edit size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); alert(`DEMO：複製 ${quote.name}`) }}>
              <Copy size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); alert(`DEMO：刪除 ${quote.name}`) }}>
              <Trash2 size={14} />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="報價單管理"
        icon={Calculator}
        breadcrumb={[
          { label: '首頁', href: '/demo' },
          { label: '報價單管理', href: '/demo/quotes' },
        ]}
        showSearch={true}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜尋報價單..."
        tabs={[
          { value: 'all', label: '全部', icon: BarChart3 },
          { value: 'draft', label: '草稿', icon: FileText },
          { value: 'sent', label: '已發送', icon: Send },
          { value: 'approved', label: '已核准', icon: CheckCircle },
          { value: 'rejected', label: '已拒絕', icon: XCircle },
          { value: 'expired', label: '已過期', icon: Clock },
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        onAdd={() => alert('DEMO 模式：新增報價單')}
        addLabel="新增報價單"
      />

      {/* 統計區 */}
      <div className="px-4 py-2 bg-morandi-container/20 border-b border-border">
        <div className="flex items-center gap-6 text-xs text-morandi-secondary">
          <span>總報價：<strong className="text-morandi-primary">{stats.total}</strong> 份</span>
          <span>已核准：<strong className="text-green-600">{stats.approved}</strong> 份</span>
          <span>待確認：<strong className="text-blue-600">{stats.pending}</strong> 份</span>
          <span>核准金額：<strong className="text-morandi-gold">{formatCurrency(stats.totalAmount)}</strong></span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <EnhancedTable
            columns={tableColumns}
            data={filteredQuotes}
            onRowClick={(quote) => alert(`DEMO 模式：查看報價單 ${quote.name}`)}
          />
        </div>
      </div>
    </div>
  )
}
