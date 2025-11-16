/**
 * 顧客管理頁面（完整重構版）
 *
 * 整合功能：
 * 1. cornerERP 的護照資訊管理（拼音、效期）
 * 2. Venturo 的 VIP 系統和客戶來源
 * 3. 進階搜尋對話框
 * 4. 搜尋條件持久化
 */

'use client'

import { useState, useMemo, useEffect } from 'react'
import { Mail, Phone, MapPin, CreditCard, Search, X, Plus, Edit } from 'lucide-react'

import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { Input } from '@/components/ui/input'
import {
  CustomerSearchDialog,
  CustomerSearchParams,
} from '@/components/customers/customer-search-dialog'
import { useCustomerStore } from '@/stores'
import { useRealtimeForCustomers } from '@/hooks/use-realtime-hooks'
import type { Customer } from '@/types/customer.types'

const STORAGE_KEY = 'customerSearchParams'

export default function CustomersPage() {
  // ✅ Realtime 訂閱
  useRealtimeForCustomers()

  const { items: customers, create: addCustomer, fetchAll: fetchCustomers } = useCustomerStore()

  // 載入資料
  useEffect(() => {
    fetchCustomers()
  }, [])

  // 搜尋狀態
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [searchParams, setSearchParams] = useState<CustomerSearchParams>(() => {
    // 從 localStorage 讀取儲存的搜尋參數
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  // 新增顧客對話框
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    passport_number: '',
    passport_romanization: '',
    passport_expiry_date: '',
    national_id: '',
    date_of_birth: '',
  })

  // 當搜尋參數改變時，保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searchParams))
    }
  }, [searchParams])

  // 進階搜尋篩選
  const filteredCustomers = useMemo(() => {
    let result = customers

    // 基本搜尋（姓名、身份證號、護照號碼）
    if (searchParams.query) {
      const query = searchParams.query.toLowerCase()
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.national_id?.toLowerCase().includes(query) ||
          c.passport_number?.toLowerCase().includes(query)
      )
    }

    // 電話
    if (searchParams.phone) {
      result = result.filter(c => c.phone?.includes(searchParams.phone!))
    }

    // Email
    if (searchParams.email) {
      result = result.filter(c =>
        c.email?.toLowerCase().includes(searchParams.email!.toLowerCase())
      )
    }

    // 護照拼音
    if (searchParams.passport_romanization) {
      result = result.filter(c =>
        c.passport_romanization
          ?.toLowerCase()
          .includes(searchParams.passport_romanization!.toLowerCase())
      )
    }

    // 城市
    if (searchParams.city) {
      result = result.filter(c => c.city?.toLowerCase().includes(searchParams.city!.toLowerCase()))
    }

    // VIP 狀態
    if (searchParams.is_vip !== undefined) {
      result = result.filter(c => c.is_vip === searchParams.is_vip)
    }

    // VIP 等級
    if (searchParams.vip_level) {
      result = result.filter(c => c.vip_level === searchParams.vip_level)
    }

    // 客戶來源
    if (searchParams.source) {
      result = result.filter(c => c.source === searchParams.source)
    }

    // 護照效期範圍
    if (searchParams.passport_expiry_start) {
      result = result.filter(
        c => c.passport_expiry_date && c.passport_expiry_date >= searchParams.passport_expiry_start!
      )
    }
    if (searchParams.passport_expiry_end) {
      result = result.filter(
        c => c.passport_expiry_date && c.passport_expiry_date <= searchParams.passport_expiry_end!
      )
    }

    return result
  }, [customers, searchParams])

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) return

    await addCustomer({
      ...newCustomer,
      code: '', // 由 Store 自動生成
      is_vip: false,
      is_active: true,
      total_spent: 0,
    } as any)

    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      address: '',
      passport_number: '',
      passport_romanization: '',
      passport_expiry_date: '',
      national_id: '',
      date_of_birth: '',
    })
    setIsAddDialogOpen(false)
  }

  const handleSearch = (params: CustomerSearchParams) => {
    setSearchParams(params)
  }

  const handleClearSearch = () => {
    setSearchParams({})
  }

  const hasActiveFilters = Object.keys(searchParams).length > 0

  // 表格欄位定義
  const tableColumns: TableColumn[] = useMemo(
    () => [
      {
        key: 'name',
        label: '基本資訊',
        sortable: true,
        render: (_value, customer: Customer) => (
          <div>
            <div className="text-sm font-medium text-morandi-primary">{customer.name}</div>
            {customer.english_name && (
              <div className="text-xs text-morandi-secondary">{customer.english_name}</div>
            )}
            <div className="text-xs text-morandi-secondary">ID: {customer.code}</div>
          </div>
        ),
      },
      {
        key: 'contact',
        label: '聯絡方式',
        sortable: false,
        render: (_value, customer: Customer) => (
          <div className="space-y-1">
            {customer.phone && (
              <div className="flex items-center text-xs text-morandi-primary">
                <Phone size={12} className="mr-1" />
                {customer.phone}
              </div>
            )}
            {customer.email && (
              <div className="flex items-center text-xs text-morandi-secondary">
                <Mail size={12} className="mr-1" />
                {customer.email}
              </div>
            )}
            {customer.city && (
              <div className="flex items-center text-xs text-morandi-secondary">
                <MapPin size={12} className="mr-1" />
                {customer.city}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'passport',
        label: '護照資訊',
        sortable: false,
        render: (_value, customer: Customer) => (
          <div className="space-y-1">
            {customer.passport_romanization && (
              <div className="text-xs text-morandi-primary font-mono">
                {customer.passport_romanization}
              </div>
            )}
            {customer.passport_number && (
              <div className="text-xs text-morandi-secondary">號碼: {customer.passport_number}</div>
            )}
            {customer.passport_expiry_date && (
              <div className="text-xs text-morandi-secondary">
                效期: {new Date(customer.passport_expiry_date).toLocaleDateString('zh-TW')}
              </div>
            )}
            {!customer.passport_romanization &&
              !customer.passport_number &&
              !customer.passport_expiry_date && (
                <div className="text-xs text-morandi-secondary italic">未填寫</div>
              )}
          </div>
        ),
      },
      {
        key: 'identity',
        label: '身份證號 / 生日',
        sortable: false,
        render: (_value, customer: Customer) => (
          <div className="space-y-1">
            {customer.national_id && (
              <div className="text-xs text-morandi-primary font-mono">{customer.national_id}</div>
            )}
            {customer.date_of_birth && (
              <div className="text-xs text-morandi-secondary">
                🎂 {new Date(customer.date_of_birth).toLocaleDateString('zh-TW')}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'vip',
        label: 'VIP 狀態',
        sortable: true,
        render: (_value, customer: Customer) => (
          <div className="space-y-1">
            {customer.is_vip ? (
              <>
                <div className="flex items-center text-xs text-morandi-gold font-medium">
                  <CreditCard size={12} className="mr-1" />
                  VIP
                </div>
                {customer.vip_level && (
                  <div className="text-xs text-morandi-secondary capitalize">
                    {customer.vip_level === 'bronze' && '銅卡'}
                    {customer.vip_level === 'silver' && '銀卡'}
                    {customer.vip_level === 'gold' && '金卡'}
                    {customer.vip_level === 'platinum' && '白金卡'}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-morandi-secondary">一般顧客</div>
            )}
          </div>
        ),
      },
      {
        key: 'stats',
        label: '消費統計',
        sortable: true,
        render: (_value, customer: Customer) => (
          <div className="space-y-1">
            <div className="text-xs text-morandi-primary font-medium">
              NT$ {(customer.total_spent || 0).toLocaleString()}
            </div>
            {customer.total_orders && customer.total_orders > 0 && (
              <div className="text-xs text-morandi-secondary">{customer.total_orders} 筆訂單</div>
            )}
          </div>
        ),
      },
    ],
    []
  )

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader title="顧客管理">
        <div className="flex items-center gap-2">
          {/* 搜尋按鈕區域 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdvancedSearchOpen(true)}
            className="gap-2"
          >
            <Search size={16} />
            <span className="hidden sm:inline">進階搜尋</span>
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSearch}
              className="gap-2 text-morandi-red"
            >
              <X size={16} />
              <span className="hidden sm:inline">清除條件</span>
            </Button>
          )}

          {/* 新增顧客按鈕 */}
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
            size="sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">新增顧客</span>
          </Button>
        </div>
      </ResponsiveHeader>

      {/* 搜尋條件提示 */}
      {hasActiveFilters && (
        <div className="px-4 py-2 bg-morandi-container/20 border-b border-border">
          <div className="text-xs text-morandi-secondary">
            已套用 {Object.keys(searchParams).length} 個篩選條件 | 顯示 {filteredCustomers.length} /{' '}
            {customers.length} 位顧客
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <EnhancedTable
            columns={tableColumns}
            data={filteredCustomers}
            onRowClick={handleRowClick}
            actions={(customer: Customer) => (
              <Button
                variant="outline"
                size="sm"
                className="p-1 hover:bg-morandi-gold/10 rounded transition-colors"
                title="編輯顧客"
                onClick={() => router.push(`/customers/${customer.id}`)}
              >
                <Edit size={14} className="text-morandi-gold" />
              </Button>
            )}
          />
        </div>
      </div>

      {/* 進階搜尋對話框 */}
      <CustomerSearchDialog
        open={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        onSearch={handleSearch}
        initialValues={searchParams}
      />

      {/* 新增顧客對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增顧客</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* 基本資訊 */}
            <div>
              <h3 className="text-sm font-semibold text-morandi-primary mb-3">基本資訊</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-morandi-primary">姓名 *</label>
                  <Input
                    value={newCustomer.name}
                    onChange={e => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="輸入顧客姓名"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">電話 *</label>
                  <Input
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="輸入聯絡電話"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">Email</label>
                  <Input
                    type="email"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="輸入 Email 地址"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">地址</label>
                  <Input
                    value={newCustomer.address}
                    onChange={e => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="輸入地址"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* 護照資訊 */}
            <div>
              <h3 className="text-sm font-semibold text-morandi-primary mb-3">護照資訊</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-morandi-primary">
                    護照拼音（姓氏/名字）
                  </label>
                  <Input
                    value={newCustomer.passport_romanization}
                    onChange={e =>
                      setNewCustomer(prev => ({
                        ...prev,
                        passport_romanization: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="例如：WANG/XIAOMING"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">護照號碼</label>
                  <Input
                    value={newCustomer.passport_number}
                    onChange={e =>
                      setNewCustomer(prev => ({ ...prev, passport_number: e.target.value }))
                    }
                    placeholder="輸入護照號碼"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">護照效期</label>
                  <Input
                    type="date"
                    value={newCustomer.passport_expiry_date}
                    onChange={e =>
                      setNewCustomer(prev => ({
                        ...prev,
                        passport_expiry_date: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">身份證字號</label>
                  <Input
                    value={newCustomer.national_id}
                    onChange={e =>
                      setNewCustomer(prev => ({ ...prev, national_id: e.target.value }))
                    }
                    placeholder="輸入身份證字號"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">出生日期</label>
                  <Input
                    type="date"
                    value={newCustomer.date_of_birth}
                    onChange={e =>
                      setNewCustomer(prev => ({ ...prev, date_of_birth: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleAddCustomer}
                disabled={!newCustomer.name.trim() || !newCustomer.phone.trim()}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                新增
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
