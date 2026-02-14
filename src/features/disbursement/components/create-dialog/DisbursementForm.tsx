/**
 * DisbursementForm
 * 出納單表單區塊（出帳日期、出納單號、狀態篩選）
 */

'use client'

import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DISBURSEMENT_LABELS } from '../../constants/labels'

// 狀態選項
const STATUS_OPTIONS = [
  { value: 'all', label: DISBURSEMENT_LABELS.全部狀態 },
  { value: 'pending', label: DISBURSEMENT_LABELS.請款中 },
  { value: 'approved', label: DISBURSEMENT_LABELS.已核准 },
  { value: 'confirmed', label: DISBURSEMENT_LABELS.已確認 },
]

interface DisbursementFormProps {
  disbursementDate: string
  statusFilter: string
  onDateChange: (date: string) => void
  onStatusChange: (status: string) => void
}

export function DisbursementForm({
  disbursementDate,
  statusFilter,
  onDateChange,
  onStatusChange,
}: DisbursementFormProps) {
  return (
    <>
      {/* 第一列：出帳日期、出納單號 */}
      <div className="grid grid-cols-2 gap-4 flex-shrink-0">
        <div className="space-y-1">
          <label className="text-sm text-morandi-muted">{DISBURSEMENT_LABELS.LABEL_3745}</label>
          <div className="flex items-center gap-2">
            <DatePicker
              value={disbursementDate}
              onChange={onDateChange}
              className="flex-1"
              placeholder={DISBURSEMENT_LABELS.選擇日期}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-morandi-muted">{DISBURSEMENT_LABELS.出納單號}</label>
          <Input
            value={DISBURSEMENT_LABELS.自動產生_2}
            disabled
            className="bg-morandi-background/50"
          />
        </div>
      </div>

      {/* 第二列：狀態篩選 */}
      <div className="space-y-1 flex-shrink-0">
        <label className="text-sm text-morandi-muted">{DISBURSEMENT_LABELS.狀態}</label>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={DISBURSEMENT_LABELS.選擇狀態} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  )
}
