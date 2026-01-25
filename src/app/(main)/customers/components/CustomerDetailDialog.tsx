/**
 * 顧客詳情對話框
 * 顯示顧客基本資料（左邊護照照片，右邊資料）
 */
'use client'

import { Check, AlertTriangle, Mail, Phone, X, ImageOff } from 'lucide-react'
import Image from 'next/image'
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
      <DialogContent level={1} className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {customer.name}
            {customer.is_vip && (
              <span className="text-xs bg-morandi-gold text-white px-2 py-0.5 rounded">VIP</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* 主要內容區：左邊照片，右邊資料 */}
        <div className="flex gap-6 py-4">
          {/* 左側：護照照片 */}
          <div className="w-64 flex-shrink-0">
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-morandi-background border border-morandi-border">
              {customer.passport_image_url ? (
                <Image
                  src={customer.passport_image_url}
                  alt={`${customer.name} 護照照片`}
                  width={256}
                  height={341}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-morandi-muted">
                  <ImageOff size={48} className="mb-2" />
                  <span className="text-sm">尚無護照照片</span>
                </div>
              )}
            </div>
          </div>

          {/* 右側：資料欄位 */}
          <div className="flex-1 space-y-4">
            {/* 基本資料 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-morandi-muted">電話</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone size={14} className="text-morandi-muted" />
                  <span className="text-morandi-primary">{customer.phone || '-'}</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-morandi-muted">Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail size={14} className="text-morandi-muted" />
                  <span className="text-morandi-primary text-sm break-all">{customer.email || '-'}</span>
                </div>
              </div>
            </div>

            {/* 護照資料 */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-morandi-primary mb-3">護照資料</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-morandi-muted">護照號碼</label>
                  <div className="font-mono text-morandi-primary mt-1">{customer.passport_number || '-'}</div>
                </div>
                <div>
                  <label className="text-xs text-morandi-muted">護照拼音</label>
                  <div className="font-mono text-morandi-primary mt-1">{customer.passport_name || '-'}</div>
                </div>
                <div>
                  <label className="text-xs text-morandi-muted">護照效期</label>
                  <div className="mt-1">
                    <DateCell
                      date={customer.passport_expiry}
                      showIcon={false}
                      className="text-morandi-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-morandi-muted">驗證狀態</label>
                  <div className="flex items-center gap-1 mt-1">
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

            {/* 身分資料 */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-morandi-primary mb-3">身分資料</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-morandi-muted">身分證號</label>
                  <div className="font-mono text-morandi-primary mt-1">{customer.national_id || '-'}</div>
                </div>
                <div>
                  <label className="text-xs text-morandi-muted">生日</label>
                  <div className="mt-1">
                    <DateCell
                      date={customer.birth_date}
                      showIcon={false}
                      className="text-morandi-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 飲食禁忌 */}
            <div className="border-t pt-4">
              <label className="text-xs text-morandi-muted">飲食禁忌</label>
              <div className={`mt-1 ${customer.dietary_restrictions ? 'text-morandi-gold bg-status-warning-bg px-2 py-1 rounded inline-block' : 'text-morandi-primary'}`}>
                {customer.dietary_restrictions || '-'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
            <X size={16} />
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
