/**
 * 顧客管理頁面（重構版）
 *
 * 使用模組化組件和 Hooks：
 * - useCustomerSearch: 搜尋與篩選
 * - CustomerAddDialog: 新增顧客（手動 + OCR）
 * - CustomerVerifyDialog: 驗證/編輯顧客
 * - CustomerDetailDialog: 顧客詳情
 * - ResetPasswordDialog: 重置密碼
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import { Search, X, Plus, AlertTriangle, Edit, Trash2, Users } from 'lucide-react'
import { formatPassportExpiryWithStatus } from '@/lib/utils/passport-expiry'
import { DateCell } from '@/components/table-cells'

import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import {
  CustomerSearchDialog,
  CustomerSearchParams,
} from '@/components/customers/customer-search-dialog'
import { useCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/data'
import type { Customer, CreateCustomerData } from '@/types/customer.types'
import { confirm } from '@/lib/ui/alert-dialog'
import { supabase } from '@/lib/supabase/client'
import { syncPassportImageToMembers } from '@/lib/utils/sync-passport-image'
import { useRouter } from 'next/navigation'

// 本地組件和 Hooks
import { useCustomerSearch, useCustomerVerify } from './hooks'
import {
  CustomerAddDialog,
  CustomerVerifyDialog,
  CustomerDetailDialog,
  ResetPasswordDialog,
} from './components'

export default function CustomersPage() {
  const router = useRouter()
  const { items: customers } = useCustomers()
  const addCustomer = createCustomer

  // 搜尋 Hook
  const {
    searchParams,
    setSearchParams,
    filteredCustomers,
    hasActiveFilters,
    clearFilters,
  } = useCustomerSearch(customers)

  // 驗證 Hook
  const customerVerify = useCustomerVerify({
    onSuccess: () => {
      // 驗證成功後重新載入客戶資料（由 store 自動處理）
    },
  })

  // 對話框狀態
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // 處理點擊行
  const handleRowClick = useCallback(async (customer: Customer) => {
    // 如果顧客沒有護照圖片，嘗試從關聯的 order_members 取得
    let passportImageUrl = customer.passport_image_url
    if (!passportImageUrl) {
      try {
        const { data: member } = await supabase
          .from('order_members')
          .select('passport_image_url')
          .eq('customer_id', customer.id)
          .not('passport_image_url', 'is', null)
          .limit(1)
          .single()

        if (member?.passport_image_url) {
          passportImageUrl = member.passport_image_url
          // 同時更新顧客的護照圖片並同步到其他成員（背景執行）
          void (async () => {
            await supabase
              .from('customers')
              .update({ passport_image_url: passportImageUrl })
              .eq('id', customer.id)
            await syncPassportImageToMembers(customer.id, passportImageUrl)
          })()
        }
      } catch {
        // 找不到關聯的訂單成員，忽略錯誤
      }
    }

    setSelectedCustomer({
      ...customer,
      passport_image_url: passportImageUrl,
    })
    setIsDetailDialogOpen(true)
  }, [])

  // 處理刪除
  const handleDelete = useCallback(async (customer: Customer) => {
    // 先檢查是否有訂單成員關聯
    const { data: linkedMembers } = await supabase
      .from('order_members')
      .select('id, order_id, orders!inner(code, tour_name)')
      .eq('customer_id', customer.id)
      .limit(5)

    if (linkedMembers && linkedMembers.length > 0) {
      const orderInfo = linkedMembers.map(m => {
        const order = m.orders as { code?: string; tour_name?: string } | null
        return order?.code || order?.tour_name || '未知訂單'
      }).join('、')

      const goToOrder = await confirm(
        `此顧客已被以下訂單使用：${orderInfo}\n\n請先到訂單中移除該成員後，再刪除顧客。`,
        {
          title: '無法刪除顧客',
          type: 'warning',
          confirmText: '前往訂單',
          cancelText: '取消',
        }
      )

      if (goToOrder) {
        router.push('/orders')
      }
      return
    }

    const confirmed = await confirm(`確定要刪除顧客「${customer.name}」嗎？`, {
      title: '刪除顧客',
      type: 'warning',
    })
    if (confirmed) {
      deleteCustomer(customer.id)
    }
  }, [deleteCustomer, router])

  // 表格欄位定義
  const tableColumns: TableColumn<Customer>[] = useMemo(
    () => [
      {
        key: 'code',
        label: '編號',
        sortable: true,
        render: (_value, customer: Customer) => (
          <div className="flex items-center gap-2">
            <span className="text-xs text-morandi-secondary font-mono">{customer.code}</span>
            {customer.verification_status === 'unverified' && (
              <span className="text-xs text-status-warning font-medium">⚠️</span>
            )}
          </div>
        ),
      },
      {
        key: 'name',
        label: '中文姓名',
        sortable: true,
        render: (_value, customer: Customer) => (
          <div className="text-sm font-medium text-morandi-primary">{customer.name}</div>
        ),
      },
      {
        key: 'passport_name',
        label: '護照拼音',
        sortable: false,
        render: (_value, customer: Customer) => (
          <div className="text-xs text-morandi-primary font-mono">
            {customer.passport_name || '-'}
          </div>
        ),
      },
      {
        key: 'phone',
        label: '電話',
        sortable: false,
        render: (_value, customer: Customer) => (
          <div className="text-xs text-morandi-primary">{customer.phone || '-'}</div>
        ),
      },
      {
        key: 'passport_number',
        label: '護照號碼',
        sortable: false,
        render: (_value, customer: Customer) => (
          <div className="text-xs text-morandi-primary font-mono">
            {customer.passport_number || '-'}
          </div>
        ),
      },
      {
        key: 'passport_expiry',
        label: '護照效期',
        sortable: false,
        render: (_value, customer: Customer) => {
          const expiryInfo = formatPassportExpiryWithStatus(customer.passport_expiry)
          return (
            <div className={`text-xs ${expiryInfo.className || 'text-morandi-secondary'}`}>
              <DateCell
                date={customer.passport_expiry}
                showIcon={false}
                className={`text-xs ${expiryInfo.className || 'text-morandi-secondary'}`}
              />
              {expiryInfo.statusLabel && (
                <span className="ml-1 text-[10px] font-medium">({expiryInfo.statusLabel})</span>
              )}
            </div>
          )
        },
      },
      {
        key: 'national_id',
        label: '身分證號',
        sortable: false,
        render: (_value, customer: Customer) => (
          <div className="text-xs text-morandi-primary font-mono">{customer.national_id || '-'}</div>
        ),
      },
      {
        key: 'birth_date',
        label: '生日',
        sortable: false,
        render: (_value, customer: Customer) => (
          <DateCell
            date={customer.birth_date}
            showIcon={false}
            className="text-xs text-morandi-secondary"
          />
        ),
      },
      {
        key: 'dietary_restrictions',
        label: '飲食禁忌',
        sortable: false,
        render: (_value, customer: Customer) => (
          <div className={`text-xs ${customer.dietary_restrictions ? 'text-morandi-gold bg-status-warning-bg px-1.5 py-0.5 rounded' : 'text-morandi-secondary'}`}>
            {customer.dietary_restrictions || '-'}
          </div>
        ),
      },
      {
        key: 'vip',
        label: 'VIP',
        sortable: true,
        render: (_value, customer: Customer) => (
          <div className="text-xs text-morandi-secondary">
            {customer.is_vip ? (
              <span className="text-morandi-gold font-medium">VIP</span>
            ) : (
              '一般'
            )}
          </div>
        ),
      },
    ],
    []
  )

  // 處理新增顧客
  const handleAddCustomer = useCallback(async (data: {
    name: string
    email: string
    phone: string
    address: string
    passport_number: string
    passport_name: string
    passport_expiry: string
    national_id: string
    birth_date: string
  }) => {
    // 將空字串日期欄位轉換為 null，避免 PostgreSQL 日期格式錯誤
    const cleanedData = {
      ...data,
      passport_expiry: data.passport_expiry || null,
      birth_date: data.birth_date || null,
    }
    await (addCustomer as (data: CreateCustomerData) => Promise<Customer>)({
      ...cleanedData,
      is_vip: false,
      is_active: true,
      total_spent: 0,
      verification_status: 'unverified',
    } as CreateCustomerData)
  }, [addCustomer])


  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader title="顧客管理">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/customer-groups')}
            className="gap-2"
          >
            <Users size={16} />
            <span className="hidden sm:inline">群組</span>
          </Button>

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
              onClick={clearFilters}
              className="gap-2 text-morandi-red"
            >
              <X size={16} />
              <span className="hidden sm:inline">清除條件</span>
            </Button>
          )}

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
              <div className="flex items-center gap-1">
                {customer.verification_status === 'unverified' && customer.passport_image_url && (
                  <button
                    className="p-1 text-status-warning hover:text-status-warning hover:bg-status-warning-bg rounded transition-colors"
                    title="驗證顧客資料"
                    onClick={(e) => {
                      e.stopPropagation()
                      customerVerify.openDialog(customer)
                    }}
                  >
                    <AlertTriangle size={14} />
                  </button>
                )}
                <button
                  className="p-1 text-morandi-secondary hover:text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors"
                  title="編輯顧客"
                  onClick={(e) => {
                    e.stopPropagation()
                    customerVerify.openDialog(customer)
                  }}
                >
                  <Edit size={14} />
                </button>
                <button
                  className="p-1 text-morandi-secondary hover:text-status-danger hover:bg-status-danger-bg rounded transition-colors"
                  title="刪除顧客"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(customer)
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          />
        </div>
      </div>

      {/* 進階搜尋對話框 */}
      <CustomerSearchDialog
        open={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        onSearch={setSearchParams}
        initialValues={searchParams}
      />

      {/* 新增顧客對話框 */}
      <CustomerAddDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        customers={customers}
        onAddCustomer={handleAddCustomer}
        updateCustomer={updateCustomer as unknown as (id: string, data: Partial<Customer>) => Promise<void>}
        addCustomer={addCustomer as (data: Partial<Customer>) => Promise<Customer>}
      />

      {/* 驗證/編輯對話框 */}
      <CustomerVerifyDialog
        open={customerVerify.isOpen}
        onOpenChange={(open) => {
          if (!open) customerVerify.closeDialog()
        }}
        customer={customerVerify.customer}
        onUpdate={updateCustomer as unknown as (id: string, data: Partial<Customer>) => Promise<void>}
      />

      {/* 顧客詳情對話框 */}
      <CustomerDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        customer={selectedCustomer}
        onEdit={(customer) => {
          setIsDetailDialogOpen(false)
          customerVerify.openDialog(customer)
        }}
      />

      {/* 重置密碼對話框 */}
      <ResetPasswordDialog
        open={isResetPasswordDialogOpen}
        onOpenChange={setIsResetPasswordDialogOpen}
        customer={selectedCustomer}
      />
    </div>
  )
}
