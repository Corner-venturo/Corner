/**
 * SuppliersDialog - 簡化版供應商對話框（名稱、類別、出帳帳號）
 */

'use client'

import React from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSupplierCategoryStore } from '@/stores'

type SupplierFormData = {
  name: string
  category_id: string
  bank_name: string
  bank_account: string
  note: string
}

interface SuppliersDialogProps {
  isOpen: boolean
  onClose: () => void
  formData: SupplierFormData
  onFormFieldChange: <K extends keyof SupplierFormData>(
    field: K,
    value: SupplierFormData[K]
  ) => void
  onSubmit: () => void
}

export const SuppliersDialog: React.FC<SuppliersDialogProps> = ({
  isOpen,
  onClose,
  formData,
  onFormFieldChange,
  onSubmit,
}) => {
  const { items: categories } = useSupplierCategoryStore()

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      title="新增供應商"
      subtitle="請填寫供應商基本資訊"
      onSubmit={onSubmit}
      submitLabel="新增供應商"
      submitDisabled={
        !formData.name || !formData.category_id || !formData.bank_name || !formData.bank_account
      }
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* 供應商名稱和類別 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">
              供應商名稱 <span className="text-morandi-red">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={e => onFormFieldChange('name', e.target.value)}
              placeholder="輸入供應商名稱"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-primary">
              類別 <span className="text-morandi-red">*</span>
            </label>
            <Select
              value={formData.category_id}
              onValueChange={value => onFormFieldChange('category_id', value)}
            >
              <SelectTrigger className="mt-1 border-morandi-container/30">
                <SelectValue placeholder="選擇類別" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter(cat => cat.is_active)
                  .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                  .map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon && <span className="mr-2">{category.icon}</span>}
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 出帳帳號資訊 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">
              銀行名稱 <span className="text-morandi-red">*</span>
            </label>
            <Input
              value={formData.bank_name}
              onChange={e => onFormFieldChange('bank_name', e.target.value)}
              placeholder="例如：國泰世華銀行"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-primary">
              銀行帳號 <span className="text-morandi-red">*</span>
            </label>
            <Input
              value={formData.bank_account}
              onChange={e => onFormFieldChange('bank_account', e.target.value)}
              placeholder="請輸入完整帳號"
              className="mt-1"
            />
          </div>
        </div>

        {/* 備註 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">備註</label>
          <Textarea
            value={formData.note}
            onChange={e => onFormFieldChange('note', e.target.value)}
            placeholder="供應商備註資訊（選填）"
            rows={3}
            className="mt-1"
          />
        </div>
      </div>
    </FormDialog>
  )
}
