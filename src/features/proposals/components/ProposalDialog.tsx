'use client'

import React, { useState, useEffect } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import type {
  Proposal,
  CreateProposalData,
  UpdateProposalData,
} from '@/types/proposal.types'

interface ProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  proposal?: Proposal | null
  onSubmit: (data: CreateProposalData | UpdateProposalData) => Promise<void>
}

export function ProposalDialog({
  open,
  onOpenChange,
  mode,
  proposal,
  onSubmit,
}: ProposalDialogProps) {
  const [title, setTitle] = useState('')
  const [expectedStartDate, setExpectedStartDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 初始化表單資料
  useEffect(() => {
    if (mode === 'edit' && proposal) {
      setTitle(proposal.title || '')
      setExpectedStartDate(proposal.expected_start_date || '')
    } else {
      setTitle('')
      setExpectedStartDate('')
    }
  }, [mode, proposal, open])

  // 處理提交
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim() || undefined,
        expected_start_date: expectedStartDate || undefined,
      })
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
      maxWidth="sm"
    >
      <div className="space-y-4">
        {/* 提案名稱 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            提案名稱
          </label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="例如：2026 泰北清邁家族旅遊"
            autoFocus
          />
        </div>

        {/* 預計出發日期 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            預計出發日期（選填）
          </label>
          <DatePicker
            value={expectedStartDate}
            onChange={date => setExpectedStartDate(date || '')}
            placeholder="選擇日期"
          />
        </div>
      </div>
    </FormDialog>
  )
}
