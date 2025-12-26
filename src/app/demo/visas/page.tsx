'use client'

import { useState, useMemo } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import {
  Stamp,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  Edit,
  Upload,
  Download,
  BarChart3,
  User,
  Plane,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Demo 簽證類型
interface DemoVisa {
  id: string
  customer_name: string
  passport_no: string
  nationality: string
  destination: string
  visa_type: string
  tour_code: string
  tour_name: string
  apply_date: string
  expected_date: string
  status: 'pending' | 'submitted' | 'processing' | 'approved' | 'rejected' | 'returned'
  handler_name: string
  notes: string
}

// Demo 資料
const demoVisas: DemoVisa[] = [
  {
    id: 'v1',
    customer_name: '王大明',
    passport_no: '310XXXXXX',
    nationality: '台灣',
    destination: '日本',
    visa_type: '觀光簽證',
    tour_code: 'JP2501',
    tour_name: '北海道雪祭 5 日',
    apply_date: '2025-01-10',
    expected_date: '2025-01-25',
    status: 'approved',
    handler_name: '陳助理',
    notes: '已核發',
  },
  {
    id: 'v2',
    customer_name: '李美玲',
    passport_no: '310XXXXXX',
    nationality: '台灣',
    destination: '日本',
    visa_type: '觀光簽證',
    tour_code: 'JP2501',
    tour_name: '北海道雪祭 5 日',
    apply_date: '2025-01-10',
    expected_date: '2025-01-25',
    status: 'approved',
    handler_name: '陳助理',
    notes: '已核發',
  },
  {
    id: 'v3',
    customer_name: '張志豪',
    passport_no: '310XXXXXX',
    nationality: '台灣',
    destination: '越南',
    visa_type: '電子簽證',
    tour_code: 'VN2502',
    tour_name: '越南峴港 5 日',
    apply_date: '2025-01-12',
    expected_date: '2025-01-20',
    status: 'processing',
    handler_name: '王助理',
    notes: '送件中',
  },
  {
    id: 'v4',
    customer_name: '黃雅芬',
    passport_no: '310XXXXXX',
    nationality: '台灣',
    destination: '印度',
    visa_type: '電子簽證',
    tour_code: 'IN2503',
    tour_name: '印度金三角 8 日',
    apply_date: '2025-01-15',
    expected_date: '2025-02-01',
    status: 'submitted',
    handler_name: '陳助理',
    notes: '資料已送出',
  },
  {
    id: 'v5',
    customer_name: '林建宏',
    passport_no: '310XXXXXX',
    nationality: '台灣',
    destination: '澳洲',
    visa_type: 'ETA 電子簽證',
    tour_code: 'AU2504',
    tour_name: '澳洲雪梨 7 日',
    apply_date: '2025-01-08',
    expected_date: '2025-01-15',
    status: 'rejected',
    handler_name: '王助理',
    notes: '護照效期不足',
  },
  {
    id: 'v6',
    customer_name: '周志明',
    passport_no: '310XXXXXX',
    nationality: '台灣',
    destination: '美國',
    visa_type: 'ESTA',
    tour_code: 'US2505',
    tour_name: '美西經典 10 日',
    apply_date: '2025-01-18',
    expected_date: '2025-02-10',
    status: 'pending',
    handler_name: '陳助理',
    notes: '等待客戶補件',
  },
  {
    id: 'v7',
    customer_name: '陳怡君',
    passport_no: '310XXXXXX',
    nationality: '台灣',
    destination: '中國',
    visa_type: '台胞證',
    tour_code: 'CN2506',
    tour_name: '北京上海 6 日',
    apply_date: '2025-01-05',
    expected_date: '2025-01-12',
    status: 'returned',
    handler_name: '王助理',
    notes: '照片不符規格',
  },
]

// 狀態顯示設定
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待處理', color: 'bg-muted text-morandi-secondary', icon: <Clock size={12} /> },
  submitted: { label: '已送件', color: 'bg-status-info-bg text-status-info', icon: <FileText size={12} /> },
  processing: { label: '審核中', color: 'bg-status-warning-bg text-status-warning', icon: <Clock size={12} /> },
  approved: { label: '已核發', color: 'bg-status-success-bg text-status-success', icon: <CheckCircle size={12} /> },
  rejected: { label: '已拒絕', color: 'bg-status-danger-bg text-status-danger', icon: <XCircle size={12} /> },
  returned: { label: '已退件', color: 'bg-status-warning-bg text-status-warning', icon: <RotateCcw size={12} /> },
}

export default function DemoVisasPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredVisas = useMemo(() => {
    return demoVisas.filter(visa => {
      const matchesSearch =
        !searchQuery ||
        visa.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visa.tour_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visa.destination.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || visa.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter])

  // 統計
  const stats = useMemo(
    () => ({
      total: demoVisas.length,
      approved: demoVisas.filter(v => v.status === 'approved').length,
      processing: demoVisas.filter(v => ['submitted', 'processing'].includes(v.status)).length,
      pending: demoVisas.filter(v => ['pending', 'returned'].includes(v.status)).length,
    }),
    []
  )

  // 表格欄位
  const tableColumns: TableColumn<DemoVisa>[] = useMemo(
    () => [
      {
        key: 'customer_name',
        label: '旅客',
        sortable: true,
        render: (_value, visa) => (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-morandi-muted flex items-center justify-center">
              <User size={14} className="text-morandi-secondary" />
            </div>
            <div>
              <div className="text-sm font-medium text-morandi-primary">{visa.customer_name}</div>
              <div className="text-xs text-morandi-secondary">{visa.passport_no}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'destination',
        label: '目的地',
        sortable: true,
        render: (_value, visa) => (
          <div className="flex items-center gap-1.5">
            <Plane size={12} className="text-morandi-gold" />
            <span className="text-sm text-morandi-primary">{visa.destination}</span>
          </div>
        ),
      },
      {
        key: 'visa_type',
        label: '簽證類型',
        sortable: true,
        render: (_value, visa) => (
          <span className="text-sm text-morandi-secondary">{visa.visa_type}</span>
        ),
      },
      {
        key: 'tour_code',
        label: '關聯團號',
        sortable: true,
        render: (_value, visa) => (
          <div>
            <div className="text-xs font-mono text-morandi-secondary">{visa.tour_code}</div>
            <div className="text-xs text-morandi-secondary truncate max-w-[120px]">{visa.tour_name}</div>
          </div>
        ),
      },
      {
        key: 'apply_date',
        label: '申請日期',
        sortable: true,
        render: (_value, visa) => (
          <div className="flex items-center gap-1 text-sm text-morandi-secondary">
            <Calendar size={12} />
            {visa.apply_date}
          </div>
        ),
      },
      {
        key: 'expected_date',
        label: '預計取件',
        sortable: true,
        render: (_value, visa) => (
          <span className="text-sm text-morandi-primary">{visa.expected_date}</span>
        ),
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
        render: (_value, visa) => {
          const config = statusConfig[visa.status]
          return (
            <div className="flex flex-col gap-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color} w-fit`}>
                {config.icon}
                {config.label}
              </span>
              {visa.notes && (
                <span className="text-xs text-morandi-secondary">{visa.notes}</span>
              )}
            </div>
          )
        },
      },
      {
        key: 'handler_name',
        label: '處理人',
        sortable: true,
        render: (_value, visa) => (
          <span className="text-sm text-morandi-secondary">{visa.handler_name}</span>
        ),
      },
      {
        key: 'actions',
        label: '操作',
        sortable: false,
        render: (_value, visa) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); alert(`DEMO：查看 ${visa.customer_name} 的簽證`) }}>
              <Eye size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); alert(`DEMO：編輯 ${visa.customer_name} 的簽證`) }}>
              <Edit size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); alert(`DEMO：上傳文件`) }}>
              <Upload size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); alert(`DEMO：下載文件`) }}>
              <Download size={14} />
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
        title="簽證管理"
        icon={Stamp}
        breadcrumb={[
          { label: '首頁', href: '/demo' },
          { label: '簽證管理', href: '/demo/visas' },
        ]}
        showSearch={true}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜尋簽證..."
        tabs={[
          { value: 'all', label: '全部', icon: BarChart3 },
          { value: 'pending', label: '待處理', icon: Clock },
          { value: 'submitted', label: '已送件', icon: FileText },
          { value: 'processing', label: '審核中', icon: Clock },
          { value: 'approved', label: '已核發', icon: CheckCircle },
          { value: 'rejected', label: '已拒絕', icon: XCircle },
          { value: 'returned', label: '已退件', icon: RotateCcw },
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        onAdd={() => alert('DEMO 模式：新增簽證申請')}
        addLabel="新增簽證"
      />

      {/* 統計區 */}
      <div className="px-4 py-2 bg-morandi-container/20 border-b border-border">
        <div className="flex items-center gap-6 text-xs text-morandi-secondary">
          <span>總申請：<strong className="text-morandi-primary">{stats.total}</strong> 件</span>
          <span>已核發：<strong className="text-green-600">{stats.approved}</strong> 件</span>
          <span>處理中：<strong className="text-amber-600">{stats.processing}</strong> 件</span>
          <span>待處理：<strong className="text-morandi-secondary">{stats.pending}</strong> 件</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <EnhancedTable
            columns={tableColumns}
            data={filteredVisas}
            onRowClick={(visa) => alert(`DEMO 模式：查看 ${visa.customer_name} 的簽證詳情`)}
          />
        </div>
      </div>
    </div>
  )
}
