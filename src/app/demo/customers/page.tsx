'use client'

import { useState, useMemo } from 'react'
import { Users, Search, Plus, Crown, Star, Award, CreditCard } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { demoCustomers, formatCurrency, getStatusDisplay } from '@/lib/demo/demo-data'

// 擴展 demo 客戶資料以符合表格需求
interface DemoCustomerRow {
  id: string
  code: string
  name: string
  english_name: string
  phone: string
  email: string
  passport_number: string
  passport_expiry: string
  birthday: string
  gender: 'M' | 'F'
  nationality: string
  total_orders: number
  total_spent: number
  last_trip: string
  vip_level: 'normal' | 'silver' | 'gold' | 'platinum'
}

// 為 demo 客戶添加 code
const customersWithCode: DemoCustomerRow[] = demoCustomers.map((c, index) => ({
  ...c,
  code: `C${String(index + 1).padStart(4, '0')}`,
}))

export default function DemoCustomersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [vipFilter, setVipFilter] = useState('all')

  const filteredCustomers = useMemo(() => {
    return customersWithCode.filter(customer => {
      const matchesSearch = !searchQuery ||
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.english_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.passport_number?.includes(searchQuery)

      const matchesVip = vipFilter === 'all' || customer.vip_level === vipFilter
      return matchesSearch && matchesVip
    })
  }, [searchQuery, vipFilter])

  const totalSpent = demoCustomers.reduce((sum, c) => sum + c.total_spent, 0)
  const totalOrders = demoCustomers.reduce((sum, c) => sum + c.total_orders, 0)

  // 表格欄位定義
  const tableColumns: TableColumn<DemoCustomerRow>[] = useMemo(
    () => [
      {
        key: 'code',
        label: '編號',
        sortable: true,
        render: (_value, customer) => (
          <div className="flex items-center gap-2">
            <span className="text-xs text-morandi-secondary font-mono">{customer.code}</span>
            {customer.vip_level !== 'normal' && (
              <span className="text-xs text-amber-600">
                {customer.vip_level === 'platinum' ? '💎' : customer.vip_level === 'gold' ? '⭐' : '🥈'}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'name',
        label: '中文姓名',
        sortable: true,
        render: (_value, customer) => (
          <div className="text-sm font-medium text-morandi-primary">{customer.name}</div>
        ),
      },
      {
        key: 'english_name',
        label: '護照拼音',
        sortable: false,
        render: (_value, customer) => (
          <div className="text-xs text-morandi-primary font-mono">
            {customer.english_name || '-'}
          </div>
        ),
      },
      {
        key: 'phone',
        label: '電話',
        sortable: false,
        render: (_value, customer) => (
          <div className="text-xs text-morandi-primary">
            {customer.phone || '-'}
          </div>
        ),
      },
      {
        key: 'passport_number',
        label: '護照號碼',
        sortable: false,
        render: (_value, customer) => (
          <div className="text-xs text-morandi-primary font-mono">
            {customer.passport_number || '-'}
          </div>
        ),
      },
      {
        key: 'passport_expiry',
        label: '護照效期',
        sortable: false,
        render: (_value, customer) => (
          <div className="text-xs text-morandi-secondary">
            {customer.passport_expiry || '-'}
          </div>
        ),
      },
      {
        key: 'birthday',
        label: '生日',
        sortable: false,
        render: (_value, customer) => (
          <div className="text-xs text-morandi-secondary">
            {customer.birthday || '-'}
          </div>
        ),
      },
      {
        key: 'total_orders',
        label: '訂單數',
        sortable: true,
        render: (_value, customer) => (
          <div className="text-xs text-morandi-primary text-center">
            {customer.total_orders} 次
          </div>
        ),
      },
      {
        key: 'total_spent',
        label: '消費總額',
        sortable: true,
        render: (_value, customer) => (
          <div className="text-xs text-green-600 font-medium">
            {formatCurrency(customer.total_spent)}
          </div>
        ),
      },
      {
        key: 'vip_level',
        label: 'VIP',
        sortable: true,
        render: (_value, customer) => {
          const vipStatus = getStatusDisplay(customer.vip_level)
          return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${vipStatus.color}`}>
              {vipStatus.label}
            </span>
          )
        },
      },
    ],
    []
  )

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="顧客管理"
        icon={Users}
        breadcrumb={[
          { label: '首頁', href: '/demo' },
          { label: '顧客管理', href: '/demo/customers' },
        ]}
        showSearch={true}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜尋顧客..."
        tabs={[
          { value: 'all', label: '全部', icon: Users },
          { value: 'platinum', label: '白金卡', icon: Crown },
          { value: 'gold', label: '金卡', icon: Star },
          { value: 'silver', label: '銀卡', icon: Award },
          { value: 'normal', label: '一般', icon: CreditCard },
        ]}
        activeTab={vipFilter}
        onTabChange={setVipFilter}
        onAdd={() => alert('DEMO 模式：新增顧客功能')}
        addLabel="新增顧客"
      />

      {/* 統計區 - 精簡版 */}
      <div className="px-4 py-2 bg-morandi-container/20 border-b border-border">
        <div className="flex items-center gap-6 text-xs text-morandi-secondary">
          <span>總顧客：<strong className="text-morandi-primary">{demoCustomers.length}</strong> 位</span>
          <span>VIP：<strong className="text-status-warning">{demoCustomers.filter(c => c.vip_level !== 'normal').length}</strong> 位</span>
          <span>總消費：<strong className="text-status-success">{formatCurrency(totalSpent)}</strong></span>
          <span>總訂單：<strong className="text-status-info">{totalOrders}</strong> 筆</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <EnhancedTable
            columns={tableColumns}
            data={filteredCustomers}
            onRowClick={(customer) => alert(`DEMO 模式：查看顧客 ${customer.name}`)}
          />
        </div>
      </div>
    </div>
  )
}
