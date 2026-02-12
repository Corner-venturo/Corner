/**
 * 重置密碼對話框
 * 管理員重置顧客會員密碼
 */
'use client'

import { useState } from 'react'
import { Key, Check, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { confirm } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import type { Customer } from '@/types/customer.types'
import { RESET_PASSWORD_LABELS as L } from '../constants/labels'

interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  customer,
}: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const handleClose = () => {
    setNewPassword('')
    onOpenChange(false)
  }

  const handleReset = async () => {
    if (!customer?.email || !newPassword) {
      toast.error(L.toast_enter_password)
      return
    }

    if (newPassword.length < 6) {
      toast.error(L.toast_min_length)
      return
    }

    const confirmed = await confirm(
      L.confirm_msg(customer.name),
      {
        title: L.confirm_title,
        confirmText: L.confirm_text,
        cancelText: L.btn_cancel,
      }
    )

    if (!confirmed) return

    setIsResetting(true)
    try {
      const res = await fetch('/api/auth/admin-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customer.email,
          new_password: newPassword,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || L.toast_failed)
      }

      toast.success(L.toast_success)
      handleClose()
    } catch (error) {
      logger.error('Reset password error:', error)
      toast.error(error instanceof Error ? error.message : L.toast_failed)
    } finally {
      setIsResetting(false)
    }
  }

  if (!customer) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent level={1} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key size={20} className="text-morandi-gold" />
            {L.title}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <p className="text-sm text-morandi-secondary mb-2">
              {L.resetting_for} <span className="font-medium text-morandi-primary">{customer.name}</span> {L.reset_password_suffix}
            </p>
            <p className="text-xs text-morandi-secondary">
              {L.account_label}{customer.email || L.no_email}
            </p>
          </div>

          {customer.email ? (
            <div>
              <label className="text-xs font-medium text-morandi-primary">{L.label_new_password}</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={L.placeholder_password}
                className="mt-1"
              />
            </div>
          ) : (
            <div className="p-3 bg-status-warning-bg border border-status-warning/30 rounded-lg">
              <p className="text-sm text-status-warning">
                {L.no_email_warning}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={handleClose} className="gap-2">
            <X size={16} />
            {L.btn_cancel}
          </Button>
          <Button
            onClick={handleReset}
            disabled={!customer.email || !newPassword || isResetting}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
          >
            <Check size={16} />
            {isResetting ? L.btn_resetting : L.btn_confirm}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
