'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import type { Proposal, ProposalPackage, CreatePackageData } from '@/types/proposal.types'

interface PackageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  proposalId: string
  proposal: Proposal
  package?: ProposalPackage | null
  onSubmit: (data: CreatePackageData | Partial<CreatePackageData>) => Promise<void>
}

interface FormData {
  version_name: string
  destination: string
  start_date: string
  end_date: string
  days: number | null
  nights: number | null
  group_size: number | null
  notes: string
}

export function PackageDialog({
  open,
  onOpenChange,
  mode,
  proposalId,
  proposal,
  package: pkg,
  onSubmit,
}: PackageDialogProps) {
  const initialFormData: FormData = useMemo(() => ({
    version_name: '',
    destination: proposal.destination || '',
    start_date: proposal.expected_start_date || '',
    end_date: proposal.expected_end_date || '',
    days: null,
    nights: null,
    group_size: proposal.group_size || null,
    notes: '',
  }), [proposal])

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)

  // 初始化表單資料
  useEffect(() => {
    if (mode === 'edit' && pkg) {
      setFormData({
        version_name: pkg.version_name || '',
        destination: pkg.destination || '',
        start_date: pkg.start_date || '',
        end_date: pkg.end_date || '',
        days: pkg.days || null,
        nights: pkg.nights || null,
        group_size: pkg.group_size || null,
        notes: pkg.notes || '',
      })
    } else {
      setFormData(initialFormData)
    }
  }, [mode, pkg, open, initialFormData])

  // 計算天數和晚數
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date)
      const end = new Date(formData.end_date)
      const diffTime = end.getTime() - start.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

      if (diffDays > 0) {
        setFormData(prev => ({
          ...prev,
          days: diffDays,
          nights: diffDays - 1,
        }))
      }
    }
  }, [formData.start_date, formData.end_date])

  // 處理提交
  const handleSubmit = async () => {
    if (!formData.version_name.trim()) {
      return
    }

    setSubmitting(true)
    try {
      const data: CreatePackageData | Partial<CreatePackageData> = {
        proposal_id: proposalId,
        version_name: formData.version_name.trim(),
        destination: formData.destination.trim() || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        days: formData.days || undefined,
        nights: formData.nights || undefined,
        group_size: formData.group_size || undefined,
        notes: formData.notes.trim() || undefined,
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
      title={mode === 'create' ? '新增團體套件' : '編輯團體套件'}
      onSubmit={handleSubmit}
      submitLabel={mode === 'create' ? '建立' : '儲存'}
      loading={submitting}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            版本名稱 <span className="text-morandi-red">*</span>
          </label>
          <Input
            value={formData.version_name}
            onChange={e =>
              setFormData(prev => ({ ...prev, version_name: e.target.value }))
            }
            placeholder="例如：方案A - 經濟版"
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              出發日期
            </label>
            <DatePicker
              value={formData.start_date}
              onChange={date =>
                setFormData(prev => ({ ...prev, start_date: date || '' }))
              }
              placeholder="選擇日期"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              回程日期
            </label>
            <DatePicker
              value={formData.end_date}
              onChange={date =>
                setFormData(prev => ({ ...prev, end_date: date || '' }))
              }
              placeholder="選擇日期"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              天數
            </label>
            <Input
              type="number"
              min={1}
              value={formData.days || ''}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  days: e.target.value ? parseInt(e.target.value, 10) : null,
                  nights: e.target.value
                    ? parseInt(e.target.value, 10) - 1
                    : null,
                }))
              }
              placeholder="天"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              晚數
            </label>
            <Input
              type="number"
              min={0}
              value={formData.nights || ''}
              readOnly
              className="bg-morandi-container/30"
              placeholder="晚"
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

        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            備註
          </label>
          <Textarea
            value={formData.notes}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="套件相關備註..."
            rows={3}
          />
        </div>
      </div>
    </FormDialog>
  )
}
