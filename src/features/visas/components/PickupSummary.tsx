'use client'

import React from 'react'
import { DatePicker } from '@/components/ui/date-picker'
import { PICKUP_SUMMARY_LABELS as L } from '../constants/labels'

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
          {L.pickup_date}
        </label>
        <DatePicker
          value={pickupDate}
          onChange={onPickupDateChange}
          className="w-40"
          placeholder={L.placeholder_date}
        />
      </div>

      {/* 待取件簽證提示 */}
      <div className="bg-status-info-bg border border-status-info/30 rounded-lg p-3">
        <p className="text-sm text-morandi-primary">
          {L.pending_prefix} <span className="font-semibold">{pendingVisasCount}</span> {L.pending_suffix}
        </p>
      </div>
    </div>
  )
}
