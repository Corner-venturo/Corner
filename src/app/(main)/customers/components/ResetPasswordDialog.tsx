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
      toast.error('請輸入新密碼')
      return
    }

    if (newPassword.length < 6) {
      toast.error('密碼至少需要 6 個字元')
      return
    }

    const confirmed = await confirm(
      `確定要將 ${customer.name} 的密碼重置為新密碼嗎？`,
      {
        title: '確認重置密碼',
        confirmText: '確認重置',
        cancelText: '取消',
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
        throw new Error(result.error || '重置密碼失敗')
      }

      toast.success('密碼已重置成功')
      handleClose()
    } catch (error) {
      logger.error('Reset password error:', error)
      toast.error(error instanceof Error ? error.message : '重置密碼失敗')
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
            重置會員密碼
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <p className="text-sm text-morandi-secondary mb-2">
              正在為 <span className="font-medium text-morandi-primary">{customer.name}</span> 重置密碼
            </p>
            <p className="text-xs text-morandi-secondary">
              會員帳號：{customer.email || '無 Email'}
            </p>
          </div>

          {customer.email ? (
            <div>
              <label className="text-xs font-medium text-morandi-primary">新密碼</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="請輸入新密碼（至少 6 個字元）"
                className="mt-1"
              />
            </div>
          ) : (
            <div className="p-3 bg-status-warning-bg border border-status-warning/30 rounded-lg">
              <p className="text-sm text-status-warning">
                此顧客沒有設定 Email，無法重置密碼。請先在顧客資料中填寫 Email。
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={handleClose} className="gap-2">
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={handleReset}
            disabled={!customer.email || !newPassword || isResetting}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
          >
            <Check size={16} />
            {isResetting ? '重置中...' : '確認重置'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
