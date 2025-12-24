'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Customer } from '@/types/customer.types'

interface MemberPaymentsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: Customer[]
  matchType: 'name' | 'id_number'
  pendingMemberData: { name?: string; id_number?: string } | null
  onSelectCustomer: (customer: Customer) => void
  onCancel: () => void
}

export function MemberPayments({
  open,
  onOpenChange,
  customers,
  matchType,
  pendingMemberData,
  onSelectCustomer,
  onCancel,
}: MemberPaymentsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base">
            {matchType === 'name'
              ? `找到 ${customers.length} 位相似顧客「${pendingMemberData?.name}」`
              : `找到 ${customers.length} 位相同身分證「${pendingMemberData?.id_number}」`}
          </DialogTitle>
        </DialogHeader>

        {/* 橫向表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-y">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">姓名</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">英文拼音</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">身分證</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">護照號碼</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">生日</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">性別</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => onSelectCustomer(customer)}
                  className="border-b hover:bg-primary/5 cursor-pointer transition-colors"
                >
                  <td className="px-3 py-3 font-medium text-primary">{customer.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {customer.passport_romanization || '-'}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{customer.national_id || '-'}</td>
                  <td className="px-3 py-3 font-mono text-xs">{customer.passport_number || '-'}</td>
                  <td className="px-3 py-3">{customer.date_of_birth || '-'}</td>
                  <td className="px-3 py-3">
                    {customer.gender === 'M' ? '男' : customer.gender === 'F' ? '女' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 底部操作 */}
        <div className="flex justify-between items-center p-3 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground">點擊列即可選擇該顧客資料</p>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            取消，手動輸入
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
