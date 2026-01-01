'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAccounts } from '../hooks'
import { X, Save } from 'lucide-react'
import type { BankAccount } from '@/types/accounting.types'

interface BankAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: BankAccount | null
  onSave: (data: Partial<BankAccount>) => Promise<void>
}

interface FormData {
  name: string
  bank_name: string
  account_number: string
  account_id: string | null
  is_active: boolean
}

export function BankAccountDialog({
  open,
  onOpenChange,
  account,
  onSave,
}: BankAccountDialogProps) {
  const { items: accounts } = useAccounts()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    bank_name: '',
    account_number: '',
    account_id: null,
    is_active: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 篩選銀行存款類科目
  const bankAccountOptions = accounts.filter(a =>
    a.account_type === 'asset' && (a.code.startsWith('110') || a.code.startsWith('111'))
  )

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        bank_name: account.bank_name || '',
        account_number: account.account_number || '',
        account_id: account.account_id,
        is_active: account.is_active,
      })
    } else {
      setFormData({
        name: '',
        bank_name: '',
        account_number: '',
        account_id: null,
        is_active: true,
      })
    }
  }, [account, open])

  const handleSubmit = async () => {
    if (!formData.name) return

    setIsSubmitting(true)
    try {
      await onSave({
        name: formData.name,
        bank_name: formData.bank_name || null,
        account_number: formData.account_number || null,
        account_id: formData.account_id,
        is_active: formData.is_active,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? '編輯銀行帳戶' : '新增銀行帳戶'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>帳戶名稱 *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="如：合庫西門分行"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>銀行名稱</Label>
              <Input
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="如：合作金庫"
              />
            </div>
            <div className="space-y-2">
              <Label>銀行帳號</Label>
              <Input
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                placeholder="如：0026800123456"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>對應會計科目</Label>
            <Select
              value={formData.account_id || '__none__'}
              onValueChange={(value) => setFormData({ ...formData, account_id: value === '__none__' ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇科目" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">不指定</SelectItem>
                {bankAccountOptions.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.code} {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              選擇此銀行帳戶對應的會計科目，用於自動過帳
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label>啟用狀態</Label>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="gap-1" onClick={() => onOpenChange(false)}>
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name}
            className="gap-1"
          >
            <Save size={16} />
            {isSubmitting ? '儲存中...' : '儲存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
