'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Copy, Check } from 'lucide-react'
import { CreatedEmployeeInfo } from './types'
import { COMP_HR_LABELS } from '@/features/hr/constants/labels'

interface SuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  createdEmployee: CreatedEmployeeInfo | null
  copiedField: string | null
  onCopy: (text: string, field: string) => void
  onClose: () => void
}

export function SuccessDialog({
  open,
  onOpenChange,
  createdEmployee,
  copiedField,
  onCopy,
  onClose,
}: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent level={1} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-morandi-gold">✅ 員工創建成功</DialogTitle>
          <DialogDescription>{COMP_HR_LABELS.LABEL_4950}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-morandi-gold/5 border border-morandi-gold/20 rounded-xl p-6">
            <p className="text-sm text-morandi-primary mb-4">
              員工{' '}
              <span className="font-bold text-morandi-gold">{createdEmployee?.display_name}</span>{' '}
              {COMP_HR_LABELS.LABEL_7801}
            </p>

            <div className="space-y-3">
              {/* 員工編號 */}
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-morandi-muted mb-1.5">{COMP_HR_LABELS.LABEL_4929}</p>
                    <p className="font-mono text-base font-semibold text-morandi-primary">
                      {createdEmployee?.employee_number}
                    </p>
                  </div>
                  <button
                    onClick={() => onCopy(createdEmployee?.employee_number || '', 'number')}
                    className="ml-3 p-2 hover:bg-muted rounded-md transition-colors"
                    title={COMP_HR_LABELS.複製員工編號}
                  >
                    {copiedField === 'number' ? (
                      <Check size={20} className="text-morandi-gold" />
                    ) : (
                      <Copy size={20} className="text-morandi-secondary" />
                    )}
                  </button>
                </div>
              </div>

              {/* 登入 Email */}
              {createdEmployee?.email && (
                <div className="bg-card rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-morandi-muted mb-1.5">{COMP_HR_LABELS.LABEL_LOGIN_EMAIL}</p>
                      <p className="font-mono text-base font-semibold text-morandi-primary">
                        {createdEmployee.email}
                      </p>
                    </div>
                    <button
                      onClick={() => onCopy(createdEmployee.email, 'email')}
                      className="ml-3 p-2 hover:bg-muted rounded-md transition-colors"
                      title="複製 Email"
                    >
                      {copiedField === 'email' ? (
                        <Check size={20} className="text-morandi-gold" />
                      ) : (
                        <Copy size={20} className="text-morandi-secondary" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 預設密碼 */}
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-morandi-muted mb-1.5">{COMP_HR_LABELS.LABEL_9036}</p>
                    <p className="font-mono text-base font-semibold text-morandi-primary">
                      {createdEmployee?.password}
                    </p>
                  </div>
                  <button
                    onClick={() => onCopy(createdEmployee?.password || '', 'password')}
                    className="ml-3 p-2 hover:bg-muted rounded-md transition-colors"
                    title={COMP_HR_LABELS.複製密碼}
                  >
                    {copiedField === 'password' ? (
                      <Check size={20} className="text-morandi-gold" />
                    ) : (
                      <Copy size={20} className="text-morandi-secondary" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-morandi-primary bg-morandi-gold/5 border border-morandi-gold/20 rounded-lg p-3 flex items-start gap-2">
              <span className="text-base">💡</span>
              <span>{COMP_HR_LABELS.LABEL_4950_1}</span>
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-lg py-2.5"
          >
            {COMP_HR_LABELS.LABEL_6771}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
