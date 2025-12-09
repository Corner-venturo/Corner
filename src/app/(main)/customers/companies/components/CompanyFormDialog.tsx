/**
 * 企業客戶表單對話框（新增/編輯）
 */

'use client'

import { useState, useEffect } from 'react'
import { FormDialog } from '@/components/dialog'
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
import type { Company } from '@/stores'
import type { CreateCompanyData } from '@/types/company.types'
import { PAYMENT_METHOD_LABELS, PAYMENT_TERMS_OPTIONS } from '@/types/company.types'
import { alert } from '@/lib/ui/alert-dialog'

interface CompanyFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateCompanyData) => Promise<void>
  workspaceId: string
  company?: Company // 編輯模式時傳入
}

export function CompanyFormDialog({
  isOpen,
  onClose,
  onSubmit,
  workspaceId,
  company,
}: CompanyFormDialogProps) {
  const [formData, setFormData] = useState<CreateCompanyData>({
    workspace_id: workspaceId,
    company_name: '',
    tax_id: null,
    phone: null,
    email: null,
    website: null,
    invoice_title: null,
    invoice_address: null,
    invoice_email: null,
    payment_terms: 30,
    payment_method: 'transfer',
    credit_limit: 0,
    bank_name: null,
    bank_account: null,
    bank_branch: null,
    registered_address: null,
    mailing_address: null,
    vip_level: 0,
    note: null,
  })

  // 編輯模式：填入現有資料
  useEffect(() => {
    if (company) {
      setFormData({
        workspace_id: company.workspace_id,
        company_name: company.company_name,
        tax_id: company.tax_id,
        phone: company.phone,
        email: company.email,
        website: company.website,
        invoice_title: company.invoice_title,
        invoice_address: company.invoice_address,
        invoice_email: company.invoice_email,
        payment_terms: company.payment_terms,
        payment_method: company.payment_method,
        credit_limit: company.credit_limit,
        bank_name: company.bank_name,
        bank_account: company.bank_account,
        bank_branch: company.bank_branch,
        registered_address: company.registered_address,
        mailing_address: company.mailing_address,
        vip_level: company.vip_level,
        note: company.note,
      })
    } else {
      // 重置表單
      setFormData({
        workspace_id: workspaceId,
        company_name: '',
        tax_id: null,
        phone: null,
        email: null,
        website: null,
        invoice_title: null,
        invoice_address: null,
        invoice_email: null,
        payment_terms: 30,
        payment_method: 'transfer',
        credit_limit: 0,
        bank_name: null,
        bank_account: null,
        bank_branch: null,
        registered_address: null,
        mailing_address: null,
        vip_level: 0,
        note: null,
      })
    }
  }, [company, workspaceId])

  const handleSubmit = async () => {
    if (!formData.company_name.trim()) {
      await alert('請輸入企業名稱', 'warning')
      return
    }

    await onSubmit(formData)
    onClose()
  }

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      title={company ? '編輯企業客戶' : '新增企業客戶'}
      subtitle={company ? `編輯 ${company.company_name}` : '新增企業客戶資料'}
      onSubmit={handleSubmit}
      submitLabel={company ? '儲存' : '新增'}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* 基本資訊 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-morandi-primary border-b pb-2">基本資訊</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="company_name">
                企業名稱 <span className="text-morandi-red">*</span>
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="請輸入企業名稱"
              />
            </div>

            <div>
              <Label htmlFor="tax_id">統一編號</Label>
              <Input
                id="tax_id"
                value={formData.tax_id || ''}
                onChange={e => setFormData({ ...formData, tax_id: e.target.value || null })}
                placeholder="12345678"
                maxLength={8}
              />
            </div>

            <div>
              <Label htmlFor="vip_level">VIP 等級</Label>
              <Select
                value={formData.vip_level.toString()}
                onValueChange={value => setFormData({ ...formData, vip_level: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">普通客戶</SelectItem>
                  <SelectItem value="1">VIP 1</SelectItem>
                  <SelectItem value="2">VIP 2</SelectItem>
                  <SelectItem value="3">VIP 3</SelectItem>
                  <SelectItem value="4">VIP 4</SelectItem>
                  <SelectItem value="5">VIP 5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="phone">聯絡電話</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value || null })}
                placeholder="02-1234-5678"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value || null })}
                placeholder="contact@company.com"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="website">網站</Label>
              <Input
                id="website"
                value={formData.website || ''}
                onChange={e => setFormData({ ...formData, website: e.target.value || null })}
                placeholder="https://www.company.com"
              />
            </div>
          </div>
        </div>

        {/* 付款資訊 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-morandi-primary border-b pb-2">付款資訊</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_method">付款方式</Label>
              <Select
                value={formData.payment_method}
                onValueChange={value =>
                  setFormData({
                    ...formData,
                    payment_method: value as 'transfer' | 'cash' | 'check' | 'credit_card',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment_terms">付款期限</Label>
              <Select
                value={formData.payment_terms.toString()}
                onValueChange={value =>
                  setFormData({ ...formData, payment_terms: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="credit_limit">信用額度 (NT$)</Label>
              <Input
                id="credit_limit"
                type="number"
                value={formData.credit_limit}
                onChange={e =>
                  setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* 發票資訊 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-morandi-primary border-b pb-2">發票資訊</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="invoice_title">發票抬頭</Label>
              <Input
                id="invoice_title"
                value={formData.invoice_title || ''}
                onChange={e =>
                  setFormData({ ...formData, invoice_title: e.target.value || null })
                }
                placeholder="請輸入發票抬頭"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="invoice_address">發票地址</Label>
              <Input
                id="invoice_address"
                value={formData.invoice_address || ''}
                onChange={e =>
                  setFormData({ ...formData, invoice_address: e.target.value || null })
                }
                placeholder="請輸入發票地址"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="invoice_email">發票 Email</Label>
              <Input
                id="invoice_email"
                type="email"
                value={formData.invoice_email || ''}
                onChange={e =>
                  setFormData({ ...formData, invoice_email: e.target.value || null })
                }
                placeholder="invoice@company.com"
              />
            </div>
          </div>
        </div>

        {/* 備註 */}
        <div>
          <Label htmlFor="note">備註</Label>
          <Textarea
            id="note"
            value={formData.note || ''}
            onChange={e => setFormData({ ...formData, note: e.target.value || null })}
            placeholder="其他備註資訊..."
            rows={3}
          />
        </div>
      </div>
    </FormDialog>
  )
}
