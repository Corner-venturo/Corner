'use client'

import React from 'react'
import { DatePicker } from '@/components/ui/date-picker'

interface PickupSummaryProps {
  pickupDate: string
  onPickupDateChange: (date: string) => void
  pendingVisasCount: number
}

export function PickupSummary({
  pickupDate,
  onPickupDateChange,
  pendingVisasCount,
}: PickupSummaryProps) {
  return (
    <div className="space-y-4">
      {/* 取件日期 */}
      <div className="flex items-center gap-3 p-3 bg-morandi-container/20 rounded-lg">
        <label className="text-sm font-medium text-morandi-primary whitespace-nowrap">
          取件日期
        </label>
        <DatePicker
          value={pickupDate}
          onChange={onPickupDateChange}
          className="w-40"
          placeholder="選擇日期"
        />
      </div>

      {/* 待取件簽證提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          目前有 <span className="font-semibold">{pendingVisasCount}</span> 筆待取件簽證
        </p>
      </div>
    </div>
  )
}
