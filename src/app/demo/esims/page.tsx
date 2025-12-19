'use client'

import { useState, useMemo } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import {
  Smartphone,
  Wifi,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  Edit,
  Mail,
  Copy,
  BarChart3,
  User,
  Plane,
  Calendar,
  Signal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/demo/demo-data'

// Demo eSIM 類型
interface DemoEsim {
  id: string
  customer_name: string
  phone: string
  destination: string
  product_name: string
  data_amount: string
  validity_days: number
  tour_code: string
  tour_name: string
  departure_date: string
  status: 'pending' | 'ordered' | 'sent' | 'activated' | 'expired' | 'cancelled'
  price: number
  qr_code: boolean
  handler_name: string
  created_at: string
}

// Demo 資料
const demoEsims: DemoEsim[] = [
  {
    id: 'e1',
    customer_name: '王大明',
    phone: '0912-345-678',
    destination: '日本',
    product_name: 'Docomo 5G 日本網卡',
    data_amount: '無限流量',
    validity_days: 5,
    tour_code: 'JP2501',
    tour_name: '北海道雪祭 5 日',
    departure_date: '2025-02-05',
    status: 'activated',
    price: 590,
    qr_code: true,
    handler_name: '陳助理',
    created_at: '2025-01-10',
  },
  {
    id: 'e2',
    customer_name: '李美玲',
    phone: '0923-456-789',
    destination: '日本',
    product_name: 'Docomo 5G 日本網卡',
    data_amount: '無限流量',
    validity_days: 5,
    tour_code: 'JP2501',
    tour_name: '北海道雪祭 5 日',
    departure_date: '2025-02-05',
    status: 'sent',
    price: 590,
    qr_code: true,
    handler_name: '陳助理',
    created_at: '2025-01-10',
  },
  {
    id: 'e3',
    customer_name: '張志豪',
    phone: '0934-567-890',
    destination: '韓國',
    product_name: 'KT 韓國 4G 網卡',
    data_amount: '每日 2GB',
    validity_days: 4,
    tour_code: 'KR2504',
    tour_name: '首爾美食購物 4 日',
    departure_date: '2025-01-25',
    status: 'activated',
    price: 450,
    qr_code: true,
    handler_name: '王助理',
    created_at: '2025-01-08',
  },
  {
    id: 'e4',
    customer_name: '黃雅芬',
    phone: '0945-678-901',
    destination: '泰國',
    product_name: 'AIS 泰國 4G 網卡',
    data_amount: '每日 3GB',
    validity_days: 5,
    tour_code: 'TH2508',
    tour_name: '曼谷芭達雅歡樂 5 日',
    departure_date: '2025-02-20',
    status: 'ordered',
    price: 380,
    qr_code: false,
    handler_name: '陳助理',
    created_at: '2025-01-18',
  },
  {
    id: 'e5',
    customer_name: '林建宏',
    phone: '0956-789-012',
    destination: '歐洲',
    product_name: '歐洲多國 eSIM',
    data_amount: '10GB',
    validity_days: 10,
    tour_code: 'EU2503',
    tour_name: '瑞士阿爾卑斯山深度 10 日',
    departure_date: '2025-06-15',
    status: 'pending',
    price: 890,
    qr_code: false,
    handler_name: '王助理',
    created_at: '2025-01-15',
  },
  {
    id: 'e6',
    customer_name: '周志明',
    phone: '0967-890-123',
    destination: '日本',
    product_name: 'SoftBank 日本網卡',
    data_amount: '每日 1GB',
    validity_days: 6,
    tour_code: 'JP2502',
    tour_name: '京都賞櫻經典 6 日',
    departure_date: '2025-03-28',
    status: 'pending',
    price: 520,
    qr_code: false,
    handler_name: '陳助理',
    created_at: '2025-01-12',
  },
  {
    id: 'e7',
    customer_name: '陳怡君',
    phone: '0978-901-234',
    destination: '日本',
    product_name: 'Docomo 5G 日本網卡',
    data_amount: '無限流量',
    validity_days: 5,
    tour_code: 'JP2507',
    tour_name: '東京迪士尼親子 5 日',
    departure_date: '2025-04-05',
    status: 'cancelled',
    price: 590,
    qr_code: false,
    handler_name: '王助理',
    created_at: '2025-01-16',
  },
]

// 狀態顯示設定
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待處理', color: 'bg-gray-100 text-gray-600', icon: <Clock size={12} /> },
  ordered: { label: '已訂購', color: 'bg-blue-100 text-blue-600', icon: <Wifi size={12} /> },
  sent: { label: '已發送', color: 'bg-purple-100 text-purple-600', icon: <Send size={12} /> },
  activated: { label: '已啟用', color: 'bg-green-100 text-green-600', icon: <CheckCircle size={12} /> },
  expired: { label: '已過期', color: 'bg-amber-100 text-amber-600', icon: <Clock size={12} /> },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-600', icon: <XCircle size={12} /> },
}

export default function DemoEsimsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredEsims = useMemo(() => {
    return demoEsims.filter(esim => {
      const matchesSearch =
        !searchQuery ||
        esim.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        esim.tour_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        esim.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        esim.product_name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || esim.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter])

  // 統計
  const stats = useMemo(
    () => ({
      total: demoEsims.length,
      activated: demoEsims.filter(e => e.status === 'activated').length,
      pending: demoEsims.filter(e => ['pending', 'ordered'].includes(e.status)).length,
      totalRevenue: demoEsims.filter(e => !['cancelled'].includes(e.status)).reduce((sum, e) => sum + e.price, 0),
    }),
    []
  )

  // 表格欄位
  const tableColumns: TableColumn<DemoEsim>[] = useMemo(
    () => [
      {
        key: 'customer_name',
        label: '旅客',
        sortable: true,
        render: (_value, esim) => (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-morandi-muted flex items-center justify-center">
              <User size={14} className="text-morandi-secondary" />
            </div>
            <div>
              <div className="text-sm font-medium text-morandi-primary">{esim.customer_name}</div>
              <div className="text-xs text-morandi-secondary">{esim.phone}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'destination',
        label: '目的地',
        sortable: true,
        render: (_value, esim) => (
          <div className="flex items-center gap-1.5">
            <Plane size={12} className="text-morandi-gold" />
            <span className="text-sm text-morandi-primary">{esim.destination}</span>
          </div>
        ),
      },
      {
        key: 'product_name',
        label: '產品',
        sortable: true,
        render: (_value, esim) => (
          <div>
            <div className="text-sm text-morandi-primary">{esim.product_name}</div>
            <div className="flex items-center gap-2 text-xs text-morandi-secondary">
              <span className="flex items-center gap-1">
                <Signal size={10} />
                {esim.data_amount}
              </span>
              <span>· {esim.validity_days} 天</span>
            </div>
          </div>
        ),
      },
      {
        key: 'tour_code',
        label: '關聯團號',
        sortable: true,
        render: (_value, esim) => (
          <div>
            <div className="text-xs font-mono text-morandi-secondary">{esim.tour_code}</div>
            <div className="text-xs text-morandi-secondary truncate max-w-[120px]">{esim.tour_name}</div>
          </div>
        ),
      },
      {
        key: 'departure_date',
        label: '出發日期',
        sortable: true,
        render: (_value, esim) => (
          <div className="flex items-center gap-1 text-sm text-morandi-secondary">
            <Calendar size={12} />
            {esim.departure_date}
          </div>
        ),
      },
      {
        key: 'price',
        label: '價格',
        sortable: true,
        render: (_value, esim) => (
          <span className="text-sm font-medium text-morandi-primary">{formatCurrency(esim.price)}</span>
        ),
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
        render: (_value, esim) => {
          const config = statusConfig[esim.status]
          return (
            <div className="flex flex-col gap-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color} w-fit`}>
                {config.icon}
                {config.label}
              </span>
              {esim.qr_code && (
                <span className="text-xs text-green-600">QR Code 已生成</span>
              )}
            </div>
          )
        },
      },
      {
        key: 'handler_name',
        label: '處理人',
        sortable: true,
        render: (_value, esim) => (
          <span className="text-sm text-morandi-secondary">{esim.handler_name}</span>
        ),
      },
      {
        key: 'actions',
        label: '操作',
        sortable: false,
        render: (_value, esim) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); alert(`DEMO：查看 ${esim.customer_name} 的網卡`) }}>
              <Eye size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); alert(`DEMO：編輯 ${esim.customer_name} 的網卡`) }}>
              <Edit size={14} />
            </Button>
            {esim.qr_code && (
              <>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); alert(`DEMO：發送 QR Code 給 ${esim.customer_name}`) }}>
                  <Mail size={14} />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); alert(`DEMO：複製安裝連結`) }}>
                  <Copy size={14} />
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
        title="網卡管理"
        icon={Smartphone}
        breadcrumb={[
          { label: '首頁', href: '/demo' },
          { label: '網卡管理', href: '/demo/esims' },
        ]}
        showSearch={true}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜尋網卡..."
        tabs={[
          { value: 'all', label: '全部', icon: BarChart3 },
          { value: 'pending', label: '待處理', icon: Clock },
          { value: 'ordered', label: '已訂購', icon: Wifi },
          { value: 'sent', label: '已發送', icon: Send },
          { value: 'activated', label: '已啟用', icon: CheckCircle },
          { value: 'cancelled', label: '已取消', icon: XCircle },
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        onAdd={() => alert('DEMO 模式：新增網卡訂單')}
        addLabel="新增網卡"
      />

      {/* 統計區 */}
      <div className="px-4 py-2 bg-morandi-container/20 border-b border-border">
        <div className="flex items-center gap-6 text-xs text-morandi-secondary">
          <span>總訂單：<strong className="text-morandi-primary">{stats.total}</strong> 筆</span>
          <span>已啟用：<strong className="text-green-600">{stats.activated}</strong> 筆</span>
          <span>待處理：<strong className="text-gray-600">{stats.pending}</strong> 筆</span>
          <span>總營收：<strong className="text-morandi-gold">{formatCurrency(stats.totalRevenue)}</strong></span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <EnhancedTable
            columns={tableColumns}
            data={filteredEsims}
            onRowClick={(esim) => alert(`DEMO 模式：查看 ${esim.customer_name} 的網卡詳情`)}
          />
        </div>
      </div>
    </div>
  )
}
