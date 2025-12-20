'use client'

import { useState, useMemo } from 'react'
import { Building2, Plus, Pencil, Trash2, Search } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable, type Column } from '@/components/ui/enhanced-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useBankAccounts } from '../hooks'
import { BankAccountDialog } from './BankAccountDialog'
import { confirm } from '@/lib/ui/alert-dialog'
import { toast } from 'sonner'
import type { BankAccount } from '@/types/accounting.types'

export function BankAccountsPage() {
  const { items: bankAccounts, isLoading, create, update, delete: deleteAccount } = useBankAccounts()
  const [searchTerm, setSearchTerm] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)

  const filteredAccounts = useMemo(() => {
    if (!searchTerm) return bankAccounts
    const term = searchTerm.toLowerCase()
    return bankAccounts.filter(a =>
      a.name.toLowerCase().includes(term) ||
      a.bank_name?.toLowerCase().includes(term) ||
      a.account_number?.toLowerCase().includes(term)
    )
  }, [bankAccounts, searchTerm])

  const handleAdd = () => {
    setEditingAccount(null)
    setShowDialog(true)
  }

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account)
    setShowDialog(true)
  }

  const handleDelete = async (account: BankAccount) => {
    const confirmed = await confirm(
      `確定要刪除「${account.name}」嗎？`,
      {
        title: '刪除銀行帳戶',
        confirmText: '刪除',
        cancelText: '取消',
      }
    )

    if (confirmed) {
      try {
        await deleteAccount(account.id)
        toast.success('銀行帳戶已刪除')
      } catch {
        toast.error('刪除失敗')
      }
    }
  }

  const handleSave = async (data: Partial<BankAccount>) => {
    try {
      if (editingAccount) {
        await update(editingAccount.id, data)
        toast.success('銀行帳戶已更新')
      } else {
        await create(data as Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>)
        toast.success('銀行帳戶已新增')
      }
      setShowDialog(false)
    } catch {
      toast.error('儲存失敗')
    }
  }

  const columns: Column<BankAccount>[] = [
    {
      key: 'name',
      label: '帳戶名稱',
    },
    {
      key: 'bank_name',
      label: '銀行名稱',
      render: (value: unknown) => String(value) || '-',
    },
    {
      key: 'account_number',
      label: '帳號',
      render: (value: unknown) => (
        <span className="font-mono text-sm">{String(value) || '-'}</span>
      ),
    },
    {
      key: 'is_active',
      label: '狀態',
      width: '80px',
      render: (value: unknown) => (
        <Badge variant={value ? 'default' : 'outline'}>
          {value ? '啟用' : '停用'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      width: '100px',
      render: (_: unknown, row: BankAccount) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(row)}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(row)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="銀行帳戶管理"
        icon={Building2}
        badge={filteredAccounts.length}
        actions={
          <Button onClick={handleAdd} size="sm">
            <Plus size={16} className="mr-1" />
            新增帳戶
          </Button>
        }
      />

      <div className="p-4 border-b">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋帳戶名稱或銀行..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <EnhancedTable
          columns={columns}
          data={filteredAccounts}
          isLoading={isLoading}
          emptyMessage="尚無銀行帳戶資料"
        />
      </div>

      <BankAccountDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        account={editingAccount}
        onSave={handleSave}
      />
    </div>
  )
}
