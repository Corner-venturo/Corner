'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Customer } from '@/types/customer.types'

interface ParsedMember {
  name: string
  name_en: string
  passport_number: string
  passport_expiry: string
  id_number: string
  birthday: string
  gender: string
}

interface QuickAddPreviewProps {
  show: boolean
  onClose: () => void
  pendingMember: ParsedMember | null
  matchedCustomers: Customer[]
  onSelectExisting: (customerId: string) => void
  onCreateNew: () => void
}

export function QuickAddPreview({
  show,
  onClose,
  pendingMember,
  matchedCustomers,
  onSelectExisting,
  onCreateNew,
}: QuickAddPreviewProps) {
  if (!show || !pendingMember) return null

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>發現相似的顧客</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 辨識結果 */}
          <div className="p-4 bg-status-info-bg border border-status-info/30 rounded-lg">
            <p className="text-sm font-medium mb-2">辨識結果：</p>
            <div className="text-sm space-y-1">
              <p>姓名：{pendingMember.name}</p>
              <p>護照：{pendingMember.passport_number || '無'}</p>
              <p>身分證：{pendingMember.id_number || '無'}</p>
              <p>生日：{pendingMember.birthday || '無'}</p>
            </div>
          </div>

          {/* 找到的相似顧客 */}
          <div>
            <p className="text-sm font-medium mb-2">找到 {matchedCustomers.length} 位相似顧客：</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {matchedCustomers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => onSelectExisting(customer.id)}
                  className="w-full p-3 text-left border border-morandi-border rounded-lg hover:bg-morandi-background transition-colors"
                >
                  <p className="font-medium">{customer.name}</p>
                  <div className="text-xs text-morandi-secondary space-y-1 mt-1">
                    <p>
                      身分證：{customer.national_id || '無'}
                      {customer.national_id === pendingMember.id_number && (
                        <span className="ml-2 text-status-success">✓ 相符</span>
                      )}
                    </p>
                    <p>
                      護照：{customer.passport_number || '無'}
                      {customer.passport_number === pendingMember.passport_number && (
                        <span className="ml-2 text-status-success">✓ 相符</span>
                      )}
                    </p>
                    <p>電話：{customer.phone || '無'}</p>
                    <p>Email：{customer.email || '無'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 建立新顧客選項 */}
          <button
            onClick={onCreateNew}
            className="w-full p-3 border-2 border-dashed border-morandi-border rounded-lg hover:bg-morandi-background transition-colors"
          >
            <p className="font-medium text-primary">+ 這是新的顧客，建立新資料</p>
          </button>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X size={16} />
            關閉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
