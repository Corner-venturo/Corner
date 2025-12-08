'use client'

import React from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { useVisaStore } from '@/stores'
import type { Visa } from '@/stores/types'

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

  const updateVisa = useVisaStore(state => state.update)

  // 重置表單，預設今天日期
  React.useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split('T')[0]
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
        const existingNote = visa.note || ''
        const newNote = returnNote
          ? existingNote
            ? `${existingNote}\n[證件歸還] ${returnNote}`
            : `[證件歸還] ${returnNote}`
          : existingNote

        await updateVisa(visa.id, {
          documents_returned_date: returnDate,
          note: newNote,
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
      title="證件歸還"
      onSubmit={handleSubmit}
      onCancel={onClose}
      submitLabel="確認歸還"
      submitDisabled={!returnDate}
      loading={isSubmitting}
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-morandi-primary">
            歸還時間
          </label>
          <Input
            type="date"
            value={returnDate}
            onChange={e => setReturnDate(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-morandi-primary">
            備註 <span className="text-xs text-morandi-secondary">(選填)</span>
          </label>
          <Input
            value={returnNote}
            onChange={e => setReturnNote(e.target.value)}
            className="mt-1"
            placeholder="例如：寄送、自取..."
          />
        </div>

        {/* 選中的簽證清單 */}
        <div className="border-t border-border pt-3">
          <label className="text-xs text-morandi-secondary mb-2 block">
            共 {selectedVisas.length} 筆簽證
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
