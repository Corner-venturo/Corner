'use client'

import { useState } from 'react'
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBankAccounts } from '../hooks'
import { BankAccountDialog } from './BankAccountDialog'
import { confirm } from '@/lib/ui/alert-dialog'
import { toast } from 'sonner'
import type { BankAccount } from '@/types/accounting.types'
import { BANK_ACCOUNTS_PAGE_LABELS as L, BANK_ACCOUNT_DIALOG_LABELS as DL, CONFIRMATION_MESSAGES } from '../constants/labels'

export function BankAccountsPage() {
  const { items: bankAccounts, isLoading, create, update, delete: deleteAccount } = useBankAccounts()
  const [showDialog, setShowDialog] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)

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

  const columns = [
    {
      key: 'name' as const,
      label: L.col_name,
    },
    {
      key: 'bank_name' as const,
      label: L.col_bank,
      render: (value: unknown) => String(value) || '-',
    },
    {
      key: 'account_number' as const,
      label: L.col_account_number,
      render: (value: unknown) => (
        <span className="font-mono text-sm">{String(value) || '-'}</span>
      ),
    },
    {
      key: 'is_active' as const,
      label: L.col_status,
      width: '80px',
      render: (value: unknown) => (
        <Badge variant={value ? 'default' : 'outline'}>
          {value ? L.status_active : L.status_inactive}
        </Badge>
      ),
    },
  ]

  return (
    <>
      <ListPageLayout<BankAccount>
        title={L.page_title}
        icon={Building2}
        data={bankAccounts}
        loading={isLoading}
        columns={columns}
        searchFields={['name', 'bank_name', 'account_number']}
        searchPlaceholder={L.search_placeholder}
        badge={bankAccounts.length}
        emptyMessage={L.empty_message}
        headerActions={
          <Button onClick={handleAdd} size="sm">
            <Plus size={16} className="mr-1" />
            {L.btn_add}
          </Button>
        }
        renderActions={(row: BankAccount) => (
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
        )}
      />

      <BankAccountDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        account={editingAccount}
        onSave={handleSave}
      />
    </>
  )
}
