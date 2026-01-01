/**
 * 顧客詳情對話框
 * 顯示顧客基本資料
 */
'use client'

import { Check, AlertTriangle, Mail, Phone } from 'lucide-react'
import { DateCell } from '@/components/table-cells'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Customer } from '@/types/customer.types'

interface CustomerDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  onEdit: (customer: Customer) => void
}

export function CustomerDetailDialog({
  open,
  onOpenChange,
  customer,
  onEdit,
}: CustomerDetailDialogProps) {
  if (!customer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {customer.name}
            {customer.is_vip && (
              <span className="text-xs bg-morandi-gold text-white px-2 py-0.5 rounded">VIP</span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-morandi-primary">電話</label>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-morandi-muted" />
                <span>{customer.phone || '-'}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-morandi-primary">Email</label>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-morandi-muted" />
                <span>{customer.email || '-'}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-morandi-primary">身分證號</label>
              <div className="font-mono">{customer.national_id || '-'}</div>
            </div>
            <div>
              <label className="text-xs text-morandi-primary">生日</label>
              <DateCell
                date={customer.date_of_birth}
                showIcon={false}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-morandi-primary">護照號碼</label>
              <div className="font-mono">{customer.passport_number || '-'}</div>
            </div>
            <div>
              <label className="text-xs text-morandi-primary">護照拼音</label>
              <div className="font-mono">{customer.passport_romanization || '-'}</div>
            </div>
            <div>
              <label className="text-xs text-morandi-primary">護照效期</label>
              <DateCell
                date={customer.passport_expiry_date}
                showIcon={false}
              />
            </div>
            <div>
              <label className="text-xs text-morandi-primary">驗證狀態</label>
              <div className="flex items-center gap-1">
                {customer.verification_status === 'verified' ? (
                  <>
                    <Check size={14} className="text-status-success" />
                    <span className="text-status-success">已驗證</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} className="text-status-warning" />
                    <span className="text-status-warning">待驗證</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* 飲食禁忌 - 獨立一行 */}
        <div className="py-2">
          <label className="text-xs text-morandi-primary">飲食禁忌</label>
          <div className={customer.dietary_restrictions ? 'text-morandi-gold bg-status-warning-bg px-2 py-1 rounded' : ''}>
            {customer.dietary_restrictions || '-'}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            關閉
          </Button>
          <Button
            onClick={() => {
              onEdit(customer)
              onOpenChange(false)
            }}
          >
            編輯資料
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
