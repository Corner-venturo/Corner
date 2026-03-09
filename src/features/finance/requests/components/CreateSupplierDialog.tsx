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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createSupplier, invalidateSuppliers } from '@/data'
import { useWorkspaceId } from '@/lib/workspace-context'
import { alert } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import type { SupplierType } from '@/types/supplier.types'

interface CreateSupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultName?: string // 預設名稱（從 Combobox 輸入的文字）
  onSuccess?: (supplierId: string) => void // 成功建立後回傳 supplier_id
}

const SUPPLIER_TYPE_OPTIONS: { value: SupplierType; label: string }[] = [
  { value: 'hotel', label: '飯店' },
  { value: 'restaurant', label: '餐廳' },
  { value: 'transport', label: '交通' },
  { value: 'attraction', label: '景點' },
  { value: 'guide', label: '導遊' },
  { value: 'agency', label: '旅行社' },
  { value: 'ticketing', label: '票務' },
  { value: 'other', label: '其他' },
]

export function CreateSupplierDialog({
  open,
  onOpenChange,
  defaultName,
  onSuccess,
}: CreateSupplierDialogProps) {
  const workspaceId = useWorkspaceId()
  const [formData, setFormData] = useState({
    name: defaultName || '',
    type: 'other' as SupplierType,
    contact_person: '',
    phone: '',
    email: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // 當 defaultName 改變時更新 formData.name
  useEffect(() => {
    if (defaultName && defaultName !== formData.name) {
      setFormData(prev => ({ ...prev, name: defaultName }))
    }
  }, [defaultName])

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      void alert('請輸入供應商名稱', 'warning')
      return
    }

    setSubmitting(true)
    try {
      const result = await createSupplier({
        name: formData.name.trim(),
        code: formData.name.trim().substring(0, 10).toUpperCase(),
        type: formData.type,
        contact_person: formData.contact_person || null,
        phone: formData.phone || null,
        email: formData.email || null,
        notes: formData.notes || null,
        is_active: true,
        workspace_id: workspaceId,
      })

      if (result?.id) {
        await invalidateSuppliers()
        void alert('供應商建立成功', 'success')
        onSuccess?.(result.id)
        onOpenChange(false)

        // 重置表單
        setFormData({
          name: '',
          type: 'other',
          contact_person: '',
          phone: '',
          email: '',
          notes: '',
        })
      }
    } catch (error) {
      logger.error('Create supplier failed:', error)
      void alert('建立失敗，請稍後再試', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新增供應商</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 供應商名稱（必填） */}
          <div>
            <Label>
              供應商名稱 <span className="text-morandi-red">*</span>
            </Label>
            <Input
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例：台北君悅酒店"
              autoFocus
            />
          </div>

          {/* 類別 */}
          <div>
            <Label>類別</Label>
            <Select
              value={formData.type}
              onValueChange={value =>
                setFormData(prev => ({ ...prev, type: value as SupplierType }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPLIER_TYPE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 聯絡人 */}
          <div>
            <Label>聯絡人</Label>
            <Input
              value={formData.contact_person}
              onChange={e => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
              placeholder="例：王小明"
            />
          </div>

          {/* 電話 */}
          <div>
            <Label>電話</Label>
            <Input
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="例：02-2345-6789"
            />
          </div>

          {/* Email */}
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="例：contact@hotel.com"
            />
          </div>

          {/* 備註 */}
          <div>
            <Label>備註</Label>
            <Input
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="例：常用供應商"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '建立中...' : '確定'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
