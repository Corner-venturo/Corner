'use client'

import React, { useState } from 'react'
import { FormDialog } from '@/components/dialog'
import { Combobox } from '@/components/ui/combobox'
import { Textarea } from '@/components/ui/textarea'
import type { Proposal, ArchiveReason } from '@/types/proposal.types'
import { ARCHIVE_REASON_CONFIG } from '@/types/proposal.types'
import { PROPOSAL_LABELS } from '../constants'

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
      title={PROPOSAL_LABELS.archiveDialog.title}
      onSubmit={handleSubmit}
      submitLabel={PROPOSAL_LABELS.archiveDialog.submitLabel}
      loading={submitting}
      maxWidth="md"
    >
      <div className="space-y-4">
        <p className="text-morandi-secondary">
          {PROPOSAL_LABELS.archiveDialog.confirmMessage(proposal?.title)}
        </p>

        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            {PROPOSAL_LABELS.archiveDialog.reasonLabel} <span className="text-morandi-red">{PROPOSAL_LABELS.required}</span>
          </label>
          <Combobox
            value={reason}
            onChange={value => setReason(value as ArchiveReason)}
            options={reasonOptions}
            placeholder={PROPOSAL_LABELS.archiveDialog.reasonPlaceholder}
          />
        </div>

        {reason === 'other' && (
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              {PROPOSAL_LABELS.archiveDialog.customReasonLabel} <span className="text-morandi-red">{PROPOSAL_LABELS.required}</span>
            </label>
            <Textarea
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder={PROPOSAL_LABELS.archiveDialog.customReasonPlaceholder}
              rows={3}
            />
          </div>
        )}
      </div>
    </FormDialog>
  )
}
