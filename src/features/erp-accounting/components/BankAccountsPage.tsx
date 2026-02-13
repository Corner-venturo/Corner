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
import { BANK_ACCOUNTS_PAGE_LABELS as L, BANK_ACCOUNT_DIALOG_LABELS as DL, CONFIRMATION_MESSAGES } from '../constants/labels'

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
      CONFIRMATION_MESSAGES.deleteBankAccount(account.name),
      {
        title: L.confirm_delete_title,
        confirmText: L.action_delete,
        cancelText: DL.btn_cancel,
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

  const handleSave = async (data: Partial<BankAccount>) => {
    try {
      if (editingAccount) {
        await update(editingAccount.id, data)
        toast.success(DL.toast_updated)
      } else {
        await create(data as Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>)
        toast.success(DL.toast_created)
      }
      setShowDialog(false)
    } catch {
      toast.error(DL.toast_save_failed)
    }
  }

  const columns: Column<BankAccount>[] = [
    {
      key: 'name',
      label: L.col_name,
    },
    {
      key: 'bank_name',
      label: L.col_bank,
      render: (value: unknown) => String(value) || '-',
    },
    {
      key: 'account_number',
      label: L.col_account_number,
      render: (value: unknown) => (
        <span className="font-mono text-sm">{String(value) || '-'}</span>
      ),
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
      label: '',
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
        title={L.page_title}
        icon={Building2}
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

      <BankAccountDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        account={editingAccount}
        onSave={handleSave}
      />
    </div>
  )
}
