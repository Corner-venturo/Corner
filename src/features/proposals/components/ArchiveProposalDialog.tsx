'use client'

import React, { useState } from 'react'
import { FormDialog } from '@/components/dialog'
import { Combobox } from '@/components/ui/combobox'
import { Textarea } from '@/components/ui/textarea'
import type { Proposal, ArchiveReason } from '@/types/proposal.types'
import { ARCHIVE_REASON_CONFIG } from '@/types/proposal.types'

interface ArchiveProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposal: Proposal | null
  onConfirm: (reason: string) => Promise<void>
}

export function ArchiveProposalDialog({
  open,
  onOpenChange,
  proposal,
  onConfirm,
}: ArchiveProposalDialogProps) {
  const [reason, setReason] = useState<ArchiveReason | ''>('')
  const [customReason, setCustomReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason) return

    setSubmitting(true)
    try {
      const finalReason = reason === 'other' ? customReason.trim() : reason
      await onConfirm(finalReason)
      setReason('')
      setCustomReason('')
    } finally {
      setSubmitting(false)
    }
  }

  const reasonOptions = Object.entries(ARCHIVE_REASON_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }))

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="封存提案"
      onSubmit={handleSubmit}
      submitLabel="確認封存"
      loading={submitting}
      maxWidth="md"
    >
      <div className="space-y-4">
        <p className="text-morandi-secondary">
          確定要封存提案「{proposal?.title}」嗎？封存後將無法繼續編輯。
        </p>

        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            封存原因 <span className="text-morandi-red">*</span>
          </label>
          <Combobox
            value={reason}
            onChange={value => setReason(value as ArchiveReason)}
            options={reasonOptions}
            placeholder="請選擇封存原因..."
          />
        </div>

        {reason === 'other' && (
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              說明 <span className="text-morandi-red">*</span>
            </label>
            <Textarea
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="請說明封存原因..."
              rows={3}
            />
          </div>
        )}
      </div>
    </FormDialog>
  )
}
