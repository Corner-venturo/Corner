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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { Account, AccountType, AccountFormData } from '@/types/accounting.types'

interface AccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: Account | null
  onSave: (data: AccountFormData) => Promise<void>
}

const accountTypes: { value: AccountType; label: string }[] = [
  { value: 'asset', label: '資產' },
  { value: 'liability', label: '負債' },
  { value: 'revenue', label: '收入' },
  { value: 'expense', label: '費用' },
  { value: 'cost', label: '成本' },
]

export function AccountDialog({
  open,
  onOpenChange,
  account,
  onSave,
}: AccountDialogProps) {
  const [formData, setFormData] = useState<AccountFormData>({
    code: '',
    name: '',
    account_type: 'asset',
    parent_id: null,
    description: null,
    is_active: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (account) {
      setFormData({
        code: account.code,
        name: account.name,
        account_type: account.account_type,
        parent_id: account.parent_id,
        description: account.description,
        is_active: account.is_active,
      })
    } else {
      setFormData({
        code: '',
        name: '',
        account_type: 'asset',
        parent_id: null,
        description: null,
        is_active: true,
      })
    }
  }, [account, open])

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) return

    setIsSubmitting(true)
    try {
      await onSave(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? '編輯科目' : '新增科目'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>科目代碼 *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="如：1100"
              />
            </div>
            <div className="space-y-2">
              <Label>科目類型 *</Label>
              <Select
                value={formData.account_type}
                onValueChange={(value: AccountType) => setFormData({ ...formData, account_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>科目名稱 *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="如：銀行存款"
            />
          </div>

          <div className="space-y-2">
            <Label>說明</Label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
              placeholder="科目說明..."
              rows={2}
            />
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.code || !formData.name}
          >
            {isSubmitting ? '儲存中...' : '儲存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
