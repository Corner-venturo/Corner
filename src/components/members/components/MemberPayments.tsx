'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Customer } from '@/types/customer.types'
import { MEMBERS_LABELS } from './constants/labels'

interface MemberPaymentsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: Customer[]
  matchType: 'name' | 'id_number'
  pendingMemberData: { name?: string | null; id_number?: string | null } | null
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
      <DialogContent level={1} className="max-w-4xl p-0">
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
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{MEMBERS_LABELS.LABEL_658}</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{MEMBERS_LABELS.LABEL_841}</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{MEMBERS_LABELS.LABEL_8408}</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{MEMBERS_LABELS.LABEL_5147}</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{MEMBERS_LABELS.LABEL_8658}</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{MEMBERS_LABELS.LABEL_2195}</th>
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
                    {customer.passport_name || '-'}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{customer.national_id || '-'}</td>
                  <td className="px-3 py-3 font-mono text-xs">{customer.passport_number || '-'}</td>
                  <td className="px-3 py-3">{customer.birth_date || '-'}</td>
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
          <p className="text-xs text-muted-foreground">{MEMBERS_LABELS.SELECT_4661}</p>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {MEMBERS_LABELS.LABEL_5836}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
