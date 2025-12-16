'use client'

import { useState, useMemo } from 'react'
import { BookOpen, Plus, Pencil, Trash2, Search } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable, type Column } from '@/components/ui/enhanced-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAccounts } from '../hooks'
import { AccountDialog } from './AccountDialog'
import { confirm } from '@/lib/ui/alert-dialog'
import { toast } from 'sonner'
import type { Account, AccountType } from '@/types/accounting.types'

const typeConfig: Record<AccountType, { label: string; color: string }> = {
  asset: { label: '資產', color: 'bg-blue-100 text-blue-800' },
  liability: { label: '負債', color: 'bg-red-100 text-red-800' },
  revenue: { label: '收入', color: 'bg-green-100 text-green-800' },
  expense: { label: '費用', color: 'bg-orange-100 text-orange-800' },
  cost: { label: '成本', color: 'bg-purple-100 text-purple-800' },
}

export function AccountsPage() {
  const { items: accounts, isLoading, create, update, delete: deleteAccount } = useAccounts()
  const [searchTerm, setSearchTerm] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  const filteredAccounts = useMemo(() => {
    if (!searchTerm) return accounts
    const term = searchTerm.toLowerCase()
    return accounts.filter(a =>
      a.code.toLowerCase().includes(term) ||
      a.name.toLowerCase().includes(term)
    )
  }, [accounts, searchTerm])

  const handleAdd = () => {
    setEditingAccount(null)
    setShowDialog(true)
  }

  const handleEdit = (account: Account) => {
    if (account.is_system_locked) {
      toast.error('系統科目不可編輯')
      return
    }
    setEditingAccount(account)
    setShowDialog(true)
  }

  const handleDelete = async (account: Account) => {
    if (account.is_system_locked) {
      toast.error('系統科目不可刪除')
      return
    }

    const confirmed = await confirm({
      title: '刪除科目',
      description: `確定要刪除科目「${account.code} ${account.name}」嗎？`,
      confirmText: '刪除',
      cancelText: '取消',
    })

    if (confirmed) {
      try {
        await deleteAccount(account.id)
        toast.success('科目已刪除')
      } catch {
        toast.error('刪除失敗')
      }
    }
  }

  const handleSave = async (data: Partial<Account>) => {
    try {
      if (editingAccount) {
        await update(editingAccount.id, data)
        toast.success('科目已更新')
      } else {
        await create(data as Omit<Account, 'id' | 'created_at' | 'updated_at'>)
        toast.success('科目已新增')
      }
      setShowDialog(false)
    } catch {
      toast.error('儲存失敗')
    }
  }

  const columns: Column<Account>[] = [
    {
      key: 'code',
      title: '科目代碼',
      width: 120,
      render: (value) => (
        <span className="font-mono">{value}</span>
      ),
    },
    {
      key: 'name',
      title: '科目名稱',
    },
    {
      key: 'account_type',
      title: '類型',
      width: 100,
      render: (value: AccountType) => {
        const config = typeConfig[value]
        return (
          <span className={`px-2 py-1 rounded text-xs ${config.color}`}>
            {config.label}
          </span>
        )
      },
    },
    {
      key: 'is_system_locked',
      title: '系統科目',
      width: 100,
      render: (value) => value ? <Badge variant="secondary">系統</Badge> : null,
    },
    {
      key: 'is_active',
      title: '狀態',
      width: 80,
      render: (value) => (
        <Badge variant={value ? 'default' : 'outline'}>
          {value ? '啟用' : '停用'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 100,
      render: (_, row) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(row)}
            disabled={row.is_system_locked}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(row)}
            disabled={row.is_system_locked}
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
        title="科目表管理"
        icon={BookOpen}
        badge={filteredAccounts.length}
        actions={
          <Button onClick={handleAdd} size="sm">
            <Plus size={16} className="mr-1" />
            新增科目
          </Button>
        }
      />

      <div className="p-4 border-b">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋科目代碼或名稱..."
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
          emptyMessage="尚無科目資料"
        />
      </div>

      <AccountDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        account={editingAccount}
        onSave={handleSave}
      />
    </div>
  )
}
