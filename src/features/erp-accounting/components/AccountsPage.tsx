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
import { ACCOUNTS_PAGE_LABELS as L, ACCOUNT_DIALOG_LABELS, CONFIRMATION_MESSAGES } from '../constants/labels'

const typeConfig: Record<AccountType, { label: string; color: string }> = {
  asset: { label: L.type_asset, color: 'bg-status-info-bg text-status-info' },
  liability: { label: L.type_liability, color: 'bg-status-danger-bg text-status-danger' },
  equity: { label: L.type_equity, color: 'bg-teal-50 text-teal-600' },
  revenue: { label: L.type_revenue, color: 'bg-status-success-bg text-status-success' },
  expense: { label: L.type_expense, color: 'bg-status-warning-bg text-status-warning' },
  cost: { label: L.type_cost, color: 'bg-purple-50 text-purple-600' },
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
      toast.error(L.error_system_locked)
      return
    }
    setEditingAccount(account)
    setShowDialog(true)
  }

  const handleDelete = async (account: Account) => {
    if (account.is_system_locked) {
      toast.error(L.error_system_locked)
      return
    }

    const confirmed = await confirm(
      CONFIRMATION_MESSAGES.deleteAccount(account.code, account.name),
      {
        title: L.confirm_delete_title,
        confirmText: L.action_delete,
        cancelText: ACCOUNT_DIALOG_LABELS.btn_cancel,
      }
    )

    if (confirmed) {
      try {
        await deleteAccount(account.id)
        toast.success(L.toast_deleted)
      } catch {
        toast.error(L.toast_delete_failed)
      }
    }
  }

  const handleSave = async (data: Partial<Account>) => {
    try {
      if (editingAccount) {
        await update(editingAccount.id, data)
        toast.success(ACCOUNT_DIALOG_LABELS.toast_updated)
      } else {
        await create(data as Omit<Account, 'id' | 'created_at' | 'updated_at'>)
        toast.success(ACCOUNT_DIALOG_LABELS.toast_created)
      }
      setShowDialog(false)
    } catch {
      toast.error(ACCOUNT_DIALOG_LABELS.toast_save_failed)
    }
  }

  const columns: Column<Account>[] = [
    {
      key: 'code',
      label: L.col_code,
      width: '120px',
      render: (value: unknown) => (
        <span className="font-mono">{String(value)}</span>
      ),
    },
    {
      key: 'name',
      label: L.col_name,
    },
    {
      key: 'account_type',
      label: L.col_type,
      width: '100px',
      render: (value: unknown) => {
        const config = typeConfig[value as AccountType]
        return (
          <span className={`px-2 py-1 rounded text-xs ${config.color}`}>
            {config.label}
          </span>
        )
      },
    },
    {
      key: 'is_system_locked',
      label: L.col_system,
      width: '100px',
      render: (value: unknown) => value ? <Badge variant="secondary">{L.system_yes}</Badge> : null,
    },
    {
      key: 'is_active',
      label: L.col_status,
      width: '80px',
      render: (value: unknown) => (
        <Badge variant={value ? 'default' : 'outline'}>
          {value ? L.status_active : L.status_inactive}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: L.col_status,
      width: '100px',
      render: (_: unknown, row: Account) => (
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
        title={L.page_title}
        icon={BookOpen}
        badge={filteredAccounts.length}
        actions={
          <Button onClick={handleAdd} size="sm">
            <Plus size={16} className="mr-1" />
            {L.btn_add}
          </Button>
        }
      />

      <div className="p-4 border-b">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={L.search_placeholder}
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
          emptyMessage={L.empty_message}
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
