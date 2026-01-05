'use client'

import React, { useState, useEffect } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
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
  const [submitting, setSubmitting] = useState(false)

  // 初始化表單資料
  useEffect(() => {
    if (mode === 'edit' && proposal) {
      setTitle(proposal.title || '')
    } else {
      setTitle('')
    }
  }, [mode, proposal, open])

  // 處理提交
  const handleSubmit = async () => {
    if (!title.trim()) {
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({ title: title.trim() })
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
      maxWidth="md"
    >
      <div>
        <label className="text-sm font-medium text-morandi-primary mb-2 block">
          提案名稱 <span className="text-morandi-red">*</span>
        </label>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="例如：2026 泰北清邁家族旅遊"
          autoFocus
        />
      </div>
    </FormDialog>
  )
}
