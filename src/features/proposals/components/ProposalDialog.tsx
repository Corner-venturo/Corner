'use client'

import React, { useState, useEffect } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Combobox } from '@/components/ui/combobox'
import { DatePicker } from '@/components/ui/date-picker'
import { Switch } from '@/components/ui/switch'
import type {
  Proposal,
  CreateProposalData,
  UpdateProposalData,
} from '@/types/proposal.types'
import type { Customer } from '@/stores/types'

interface ProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  proposal?: Proposal | null
  customers: Customer[]
  onSubmit: (data: CreateProposalData | UpdateProposalData) => Promise<void>
}

interface FormData {
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  title: string
  description: string
  notes: string
  destination: string
  expected_start_date: string
  expected_end_date: string
  flexible_dates: boolean
  group_size: number | null
}

const initialFormData: FormData = {
  customer_id: '',
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  title: '',
  description: '',
  notes: '',
  destination: '',
  expected_start_date: '',
  expected_end_date: '',
  flexible_dates: false,
  group_size: null,
}

export function ProposalDialog({
  open,
  onOpenChange,
  mode,
  proposal,
  customers,
  onSubmit,
}: ProposalDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)

  // 初始化表單資料
  useEffect(() => {
    if (mode === 'edit' && proposal) {
      setFormData({
        customer_id: proposal.customer_id || '',
        customer_name: proposal.customer_name || '',
        customer_email: proposal.customer_email || '',
        customer_phone: proposal.customer_phone || '',
        title: proposal.title || '',
        description: proposal.description || '',
        notes: proposal.notes || '',
        destination: proposal.destination || '',
        expected_start_date: proposal.expected_start_date || '',
        expected_end_date: proposal.expected_end_date || '',
        flexible_dates: proposal.flexible_dates || false,
        group_size: proposal.group_size || null,
      })
    } else {
      setFormData(initialFormData)
    }
  }, [mode, proposal, open])

  // 當選擇客戶時，自動填入客戶資訊
  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        customer_name: customer.name || '',
        customer_email: customer.email || '',
        customer_phone: customer.phone || '',
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
      }))
    }
  }

  // 處理提交
  const handleSubmit = async () => {
    if (!formData.customer_name.trim()) {
      return
    }
    if (!formData.title.trim()) {
      return
    }

    setSubmitting(true)
    try {
      const data: CreateProposalData | UpdateProposalData = {
        customer_id: formData.customer_id || undefined,
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email.trim() || undefined,
        customer_phone: formData.customer_phone.trim() || undefined,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        destination: formData.destination.trim() || undefined,
        expected_start_date: formData.expected_start_date || undefined,
        expected_end_date: formData.expected_end_date || undefined,
        flexible_dates: formData.flexible_dates,
        group_size: formData.group_size || undefined,
      }
      await onSubmit(data)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? '新增提案' : '編輯提案'}
      onSubmit={handleSubmit}
      submitLabel={mode === 'create' ? '建立' : '儲存'}
      loading={submitting}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* 客戶資訊區塊 */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-morandi-primary border-b border-border pb-2">
            客戶資訊
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                選擇現有客戶
              </label>
              <Combobox
                value={formData.customer_id}
                onChange={handleCustomerSelect}
                options={customers.map(c => ({
                  value: c.id,
                  label: `${c.name}${c.phone ? ` (${c.phone})` : ''}`,
                }))}
                placeholder="搜尋客戶..."
                showSearchIcon
                emptyMessage="找不到客戶"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                客戶名稱 <span className="text-morandi-red">*</span>
              </label>
              <Input
                value={formData.customer_name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, customer_name: e.target.value }))
                }
                placeholder="輸入客戶名稱"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                Email
              </label>
              <Input
                type="email"
                value={formData.customer_email}
                onChange={e =>
                  setFormData(prev => ({ ...prev, customer_email: e.target.value }))
                }
                placeholder="customer@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                電話
              </label>
              <Input
                value={formData.customer_phone}
                onChange={e =>
                  setFormData(prev => ({ ...prev, customer_phone: e.target.value }))
                }
                placeholder="0912-345-678"
              />
            </div>
          </div>
        </div>

        {/* 提案資訊區塊 */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-morandi-primary border-b border-border pb-2">
            提案資訊
          </h3>

          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              提案名稱 <span className="text-morandi-red">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="例如：2026 泰北清邁家族旅遊"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              目的地
            </label>
            <Input
              value={formData.destination}
              onChange={e =>
                setFormData(prev => ({ ...prev, destination: e.target.value }))
              }
              placeholder="例如：泰國清邁"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                預計出發日期
              </label>
              <DatePicker
                value={formData.expected_start_date}
                onChange={date =>
                  setFormData(prev => ({ ...prev, expected_start_date: date || '' }))
                }
                placeholder="選擇日期"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                預計回程日期
              </label>
              <DatePicker
                value={formData.expected_end_date}
                onChange={date =>
                  setFormData(prev => ({ ...prev, expected_end_date: date || '' }))
                }
                placeholder="選擇日期"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                預計人數
              </label>
              <Input
                type="number"
                min={1}
                value={formData.group_size || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    group_size: e.target.value ? parseInt(e.target.value, 10) : null,
                  }))
                }
                placeholder="人數"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.flexible_dates}
              onCheckedChange={checked =>
                setFormData(prev => ({ ...prev, flexible_dates: checked }))
              }
            />
            <label className="text-sm text-morandi-primary">日期可彈性調整</label>
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              提案說明
            </label>
            <Textarea
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="提案的詳細說明..."
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              內部備註
            </label>
            <Textarea
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="內部備註（不會顯示給客戶）..."
              rows={2}
            />
          </div>
        </div>
      </div>
    </FormDialog>
  )
}
