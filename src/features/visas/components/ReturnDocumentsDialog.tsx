'use client'

import { getTodayString } from '@/lib/utils/format-date'

import React from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { updateVisa } from '@/data'
import type { Visa } from '@/stores/types'
import { RETURN_DIALOG_LABELS as L } from '../constants/labels'

interface ReturnDocumentsDialogProps {
  open: boolean
  onClose: () => void
  selectedVisas: Visa[]
  onComplete: () => void
}

export function ReturnDocumentsDialog({
  open,
  onClose,
  selectedVisas,
  onComplete,
}: ReturnDocumentsDialogProps) {
  const [returnDate, setReturnDate] = React.useState('')
  const [returnNote, setReturnNote] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // 重置表單，預設今天日期
  React.useEffect(() => {
    if (open) {
      const today = getTodayString()
      setReturnDate(today)
      setReturnNote('')
    }
  }, [open])

  const handleSubmit = async () => {
    if (!returnDate) return
    setIsSubmitting(true)

    try {
      for (const visa of selectedVisas) {
        // 更新證件歸還時間，備註加到 note 欄位
        const existingNote = visa.notes || ''
        const newNote = returnNote
          ? existingNote
            ? `${existingNote}\n${L.note_prefix} ${returnNote}`
            : `${L.note_prefix} ${returnNote}`
          : existingNote

        await updateVisa(visa.id, {
          status: 'returned',
          documents_returned_date: returnDate,
          notes: newNote,
        })
      }

      onComplete()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={open => !open && onClose()}
      title={L.title}
      onSubmit={handleSubmit}
      onCancel={onClose}
      submitLabel={L.submit_label}
      submitDisabled={!returnDate}
      loading={isSubmitting}
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-morandi-primary">
            {L.return_date}
          </label>
          <DatePicker
            value={returnDate}
            onChange={(date) => setReturnDate(date)}
            className="mt-1"
            placeholder={L.placeholder_date}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-morandi-primary">
            {L.notes_label} <span className="text-xs text-morandi-secondary">{L.notes_optional}</span>
          </label>
          <Input
            value={returnNote}
            onChange={e => setReturnNote(e.target.value)}
            className="mt-1"
            placeholder={L.notes_placeholder}
          />
        </div>

        {/* 選中的簽證清單 */}
        <div className="border-t border-border pt-3">
          <label className="text-xs text-morandi-primary mb-2 block">
            {L.visa_count(selectedVisas.length)}
          </label>
          <div className="max-h-[150px] overflow-y-auto space-y-1">
            {selectedVisas.map(visa => (
              <div key={visa.id} className="text-sm text-morandi-primary flex justify-between">
                <span>{visa.applicant_name}</span>
                <span className="text-morandi-secondary">{visa.visa_type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FormDialog>
  )
}
