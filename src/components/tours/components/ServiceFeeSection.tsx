'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TourDepartureData } from '@/types/tour-departure.types'

interface ServiceFeeSectionProps {
  data: TourDepartureData | null
  isEditing: boolean
  serviceFee: number
  setData: (setter: (prev: TourDepartureData | null) => TourDepartureData | null) => void
}

const formatMoney = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return '-'
  return amount.toLocaleString('zh-TW')
}

export function ServiceFeeSection({ data, isEditing, serviceFee, setData }: ServiceFeeSectionProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-morandi-primary mb-4">服務費用設定</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label className="text-sm text-morandi-primary">領隊服務費（每人）</Label>
          {isEditing ? (
            <Input
              type="number"
              value={data?.service_fee_per_person || 0}
              onChange={e => setData(prev => ({ ...prev!, service_fee_per_person: parseInt(e.target.value) || 0 }))}
              className="mt-1"
            />
          ) : (
            <p className="mt-1 text-morandi-primary">{formatMoney(data?.service_fee_per_person)}</p>
          )}
        </div>
        <div>
          <Label className="text-sm text-morandi-primary">服務費小計</Label>
          <p className="mt-1 font-semibold text-morandi-gold">{formatMoney(serviceFee)}</p>
        </div>
        <div>
          <Label className="text-sm text-morandi-primary">零用金</Label>
          {isEditing ? (
            <Input
              type="number"
              value={data?.petty_cash || 0}
              onChange={e => setData(prev => ({ ...prev!, petty_cash: parseInt(e.target.value) || 0 }))}
              className="mt-1"
            />
          ) : (
            <p className="mt-1 text-morandi-primary">{formatMoney(data?.petty_cash)}</p>
          )}
        </div>
      </div>
    </div>
  )
}
