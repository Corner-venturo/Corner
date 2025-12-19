'use client'

import React, { useState } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { ShoppingCart, AlertCircle, CheckCircle, Clock, Shield, Wifi } from 'lucide-react'
import { SimpleOrderTable } from '@/components/orders/simple-order-table'
import type { Order } from '@/stores/types'

// DEMO 簡化的 Tour 類型（只包含訂單表格需要的欄位）
interface DemoTour {
  id: string
  code: string
  name: string
  departure_date: string
  return_date: string
  status: string
  created_at: string
  updated_at: string
}

// DEMO 假資料
const demoOrders: Order[] = [
  {
    id: 'o1',
    order_number: 'JP2501-01',
    code: 'JP2501',
    tour_id: 't1',
    tour_name: '北海道雪祭豪華5日',
    contact_person: '王大明',
    contact_phone: '0912-345-678',
    sales_person: '陳業務',
    assistant: '李助理',
    member_count: 2,
    total_amount: 117600,
    paid_amount: 117600,
    remaining_amount: 0,
    payment_status: 'paid',
    status: 'confirmed',
    notes: null,
    customer_id: null,
    created_at: '2024-12-15T10:00:00Z',
    updated_at: '2024-12-15T10:00:00Z',
  },
  {
    id: 'o2',
    order_number: 'JP2501-02',
    code: 'JP2501',
    tour_id: 't1',
    tour_name: '北海道雪祭豪華5日',
    contact_person: '李美玲',
    contact_phone: '0923-456-789',
    sales_person: '陳業務',
    assistant: '李助理',
    member_count: 4,
    total_amount: 235200,
    paid_amount: 120000,
    remaining_amount: 115200,
    payment_status: 'partial',
    status: 'confirmed',
    notes: null,
    customer_id: null,
    created_at: '2024-12-18T10:00:00Z',
    updated_at: '2024-12-18T10:00:00Z',
  },
  {
    id: 'o3',
    order_number: 'JP2502-01',
    code: 'JP2502',
    tour_id: 't2',
    tour_name: '京都賞櫻經典6日',
    contact_person: '張志豪',
    contact_phone: '0934-567-890',
    sales_person: '王業務',
    assistant: '陳助理',
    member_count: 2,
    total_amount: 125600,
    paid_amount: 62800,
    remaining_amount: 62800,
    payment_status: 'partial',
    status: 'pending',
    notes: null,
    customer_id: null,
    created_at: '2025-01-02T10:00:00Z',
    updated_at: '2025-01-02T10:00:00Z',
  },
  {
    id: 'o4',
    order_number: 'EU2503-01',
    code: 'EU2503',
    tour_id: 't3',
    tour_name: '瑞士阿爾卑斯山深度10日',
    contact_person: '陳雅琪',
    contact_phone: '0945-678-901',
    sales_person: '王業務',
    assistant: '李助理',
    member_count: 2,
    total_amount: 336000,
    paid_amount: 336000,
    remaining_amount: 0,
    payment_status: 'paid',
    status: 'confirmed',
    notes: null,
    customer_id: null,
    created_at: '2025-01-05T10:00:00Z',
    updated_at: '2025-01-05T10:00:00Z',
  },
  {
    id: 'o5',
    order_number: 'KR2504-01',
    code: 'KR2504',
    tour_id: 't4',
    tour_name: '首爾美食購物4日',
    contact_person: '林建宏',
    contact_phone: '0956-789-012',
    sales_person: '陳業務',
    assistant: '王助理',
    member_count: 3,
    total_amount: 86400,
    paid_amount: 0,
    remaining_amount: 86400,
    payment_status: 'unpaid',
    status: 'pending',
    notes: null,
    customer_id: null,
    created_at: '2025-01-10T10:00:00Z',
    updated_at: '2025-01-10T10:00:00Z',
  },
  {
    id: 'o6',
    order_number: 'JP2507-01',
    code: 'JP2507',
    tour_id: 't7',
    tour_name: '東京迪士尼親子5日',
    contact_person: '黃雅芬',
    contact_phone: '0967-890-123',
    sales_person: '王業務',
    assistant: '李助理',
    member_count: 4,
    total_amount: 211200,
    paid_amount: 100000,
    remaining_amount: 111200,
    payment_status: 'partial',
    status: 'confirmed',
    notes: null,
    customer_id: null,
    created_at: '2025-01-12T10:00:00Z',
    updated_at: '2025-01-12T10:00:00Z',
  },
]

const demoTours: DemoTour[] = [
  {
    id: 't1',
    code: 'JP2501',
    name: '北海道雪祭豪華5日',
    departure_date: '2025-02-05',
    return_date: '2025-02-09',
    status: 'confirmed',
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 't2',
    code: 'JP2502',
    name: '京都賞櫻經典6日',
    departure_date: '2025-03-28',
    return_date: '2025-04-02',
    status: 'open',
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 't3',
    code: 'EU2503',
    name: '瑞士阿爾卑斯山深度10日',
    departure_date: '2025-06-15',
    return_date: '2025-06-24',
    status: 'open',
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 't4',
    code: 'KR2504',
    name: '首爾美食購物4日',
    departure_date: '2025-01-25',
    return_date: '2025-01-28',
    status: 'departed',
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 't7',
    code: 'JP2507',
    name: '東京迪士尼親子5日',
    departure_date: '2025-04-05',
    return_date: '2025-04-09',
    status: 'confirmed',
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
]

export default function DemoOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOrders = demoOrders.filter(order => {
    let matchesFilter: boolean
    switch (statusFilter) {
      case 'all':
        matchesFilter = true
        break
      case 'visa-only':
        matchesFilter = order.tour_name?.includes('簽證專用團') ?? false
        break
      case 'sim-only':
        matchesFilter = order.tour_name?.includes('網卡專用團') ?? false
        break
      default:
        matchesFilter = order.payment_status === statusFilter
        break
    }

    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      !searchQuery ||
      (order.order_number || '').toLowerCase().includes(searchLower) ||
      order.code?.toLowerCase().includes(searchLower) ||
      order.tour_name?.toLowerCase().includes(searchLower) ||
      order.contact_person.toLowerCase().includes(searchLower)

    return matchesFilter && matchesSearch
  })

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="訂單管理"
        icon={ShoppingCart}
        breadcrumb={[
          { label: '首頁', href: '/demo' },
          { label: '訂單管理', href: '/demo/orders' },
        ]}
        showSearch={true}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜尋訂單..."
        tabs={[
          { value: 'all', label: '全部', icon: ShoppingCart },
          { value: 'unpaid', label: '未收款', icon: AlertCircle },
          { value: 'partial', label: '部分收款', icon: Clock },
          { value: 'paid', label: '已收款', icon: CheckCircle },
          { value: 'visa-only', label: '簽證專用', icon: Shield },
          { value: 'sim-only', label: '網卡專用', icon: Wifi },
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        onAdd={() => alert('DEMO 模式：新增訂單功能')}
        addLabel="新增訂單"
      />

      <div className="flex-1 overflow-auto flex flex-col">
        <SimpleOrderTable
          className="flex-1"
          orders={filteredOrders}
          tours={demoTours}
          showTourInfo={true}
        />
      </div>
    </div>
  )
}
