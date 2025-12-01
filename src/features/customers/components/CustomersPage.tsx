'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable } from '@/components/ui/enhanced-table'
import { useCustomerStore } from '@/stores'
import { Customer } from '@/types/customer.types'
import { Users, UserPlus, UserCheck, UserX } from 'lucide-react'
import { useDialog } from '@/hooks/useDialog'
import { CustomerForm } from './CustomerForm'
import { getCustomerTableColumns } from './CustomerTableColumns'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const STATUS_TABS = [
  { key: 'all', label: '全部', icon: Users },
  { key: 'verified', label: '已驗證', icon: UserCheck },
  { key: 'unverified', label: '待驗證', icon: UserX },
]

export function CustomersPage() {
  const router = useRouter()
  const { dialog, openDialog, closeDialog } = useDialog()
  const { items: customers, create, update, remove } = useCustomerStore()

  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter customers by tab
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesTab =
        activeTab === 'all' ||
        customer.verification_status === activeTab

      const matchesSearch =
        !searchQuery ||
        customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesTab && matchesSearch
    })
  }, [customers, activeTab, searchQuery])

  // Stats for tabs
  const tabStats = useMemo(() => {
    return {
      all: customers.length,
      verified: customers.filter(c => c.verification_status === 'verified').length,
      unverified: customers.filter(c => c.verification_status === 'unverified').length,
    }
  }, [customers])

  const handleAdd = () => {
    openDialog('add')
  }

  const handleEdit = (customer: Customer) => {
    openDialog('edit', customer)
  }

  const handleDelete = async (id: string) => {
    if (confirm('確定要刪除這位客戶嗎？')) {
      await remove(id)
      toast.success('客戶已刪除')
    }
  }

  const handleFormSubmit = async (data: Partial<Customer>) => {
    try {
      if (dialog.data) {
        await update(dialog.data.id, data)
        toast.success('客戶資料已更新')
      } else {
        await create(data as Customer)
        toast.success('客戶已新增')
      }
      closeDialog()
    } catch (error) {
      toast.error('操作失敗')
      console.error(error)
    }
  }

  const columns = getCustomerTableColumns(handleEdit, handleDelete)

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="客戶管理"
        description="管理所有客戶資料"
        tabs={STATUS_TABS.map(tab => ({
          key: tab.key,
          label: tab.label,
          count: tabStats[tab.key as keyof typeof tabStats],
          icon: tab.icon,
        }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchPlaceholder="搜尋客戶姓名、編號、電話..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          <Button onClick={handleAdd}>
            <UserPlus className="mr-2 h-4 w-4" />
            新增客戶
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <EnhancedTable
          data={filteredCustomers}
          columns={columns}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(column) => {
            if (sortBy === column) {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
            } else {
              setSortBy(column)
              setSortOrder('asc')
            }
          }}
          pageSize={20}
        />
      </div>

      {dialog.open && (
        <CustomerForm
          open={dialog.open}
          onClose={closeDialog}
          customer={dialog.data}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  )
}
