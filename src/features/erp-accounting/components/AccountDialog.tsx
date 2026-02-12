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
import { X, Save } from 'lucide-react'
import type { Account, AccountType, AccountFormData } from '@/types/accounting.types'
import { ACCOUNT_DIALOG_LABELS as L, ACCOUNTS_PAGE_LABELS } from '../constants/labels'

interface AccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: Account | null
  onSave: (data: AccountFormData) => Promise<void>
}

const accountTypes: { value: AccountType; label: string }[] = [
  { value: 'asset', label: ACCOUNTS_PAGE_LABELS.type_asset },
  { value: 'liability', label: ACCOUNTS_PAGE_LABELS.type_liability },
  { value: 'revenue', label: ACCOUNTS_PAGE_LABELS.type_revenue },
  { value: 'expense', label: ACCOUNTS_PAGE_LABELS.type_expense },
  { value: 'cost', label: ACCOUNTS_PAGE_LABELS.type_cost },
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
      <DialogContent level={1}>
        <DialogHeader>
          <DialogTitle>{account ? L.title_edit : L.title_add}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{L.label_code} *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder={L.placeholder_code}
              />
            </div>
            <div className="space-y-2">
              <Label>{L.label_type} *</Label>
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
            <Label>{L.label_name} *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={L.placeholder_name}
            />
          </div>

          <div className="space-y-2">
            <Label>{L.label_description}</Label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
              placeholder={L.placeholder_description}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>{L.label_active}</Label>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="gap-1" onClick={() => onOpenChange(false)}>
            <X size={16} />
            {L.btn_cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.code || !formData.name}
            className="gap-1"
          >
            <Save size={16} />
            {isSubmitting ? L.btn_saving : L.btn_save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
