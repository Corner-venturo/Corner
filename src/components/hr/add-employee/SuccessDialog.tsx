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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-600">✅ 員工創建成功</DialogTitle>
          <DialogDescription>員工資料已成功建立，請記錄以下登入資訊</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <p className="text-sm text-morandi-primary mb-4">
              員工{' '}
              <span className="font-bold text-morandi-gold">{createdEmployee?.display_name}</span>{' '}
              已成功創建！
            </p>

            <div className="space-y-3">
              {/* 員工編號 */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-morandi-muted mb-1.5">員工編號</p>
                    <p className="font-mono text-base font-semibold text-morandi-primary">
                      {createdEmployee?.employee_number}
                    </p>
                  </div>
                  <button
                    onClick={() => onCopy(createdEmployee?.employee_number || '', 'number')}
                    className="ml-3 p-2 hover:bg-gray-100 rounded-md transition-colors"
                    title="複製員工編號"
                  >
                    {copiedField === 'number' ? (
                      <Check size={20} className="text-green-600" />
                    ) : (
                      <Copy size={20} className="text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* 預設密碼 */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-morandi-muted mb-1.5">預設密碼</p>
                    <p className="font-mono text-base font-semibold text-morandi-primary">
                      {createdEmployee?.password}
                    </p>
                  </div>
                  <button
                    onClick={() => onCopy(createdEmployee?.password || '', 'password')}
                    className="ml-3 p-2 hover:bg-gray-100 rounded-md transition-colors"
                    title="複製密碼"
                  >
                    {copiedField === 'password' ? (
                      <Check size={20} className="text-green-600" />
                    ) : (
                      <Copy size={20} className="text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <span className="text-base">💡</span>
              <span>請提醒員工首次登入後更改密碼</span>
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-morandi-gold hover:bg-morandi-gold/90 text-white rounded-lg py-2.5"
          >
            完成
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
