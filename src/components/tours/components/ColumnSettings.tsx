'use client'

import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { VisibleColumns } from '../types'

interface ColumnSettingsProps {
  visibleColumns: VisibleColumns
  onVisibilityChange: (key: keyof VisibleColumns, value: boolean) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

const columnOptions = [
  { key: 'passport_name' as const, label: '護照拼音' },
  { key: 'birth_date' as const, label: '生日' },
  { key: 'gender' as const, label: '性別' },
  { key: 'passport_number' as const, label: '護照號碼' },
  { key: 'dietary' as const, label: '飲食禁忌' },
  { key: 'room' as const, label: '分房' },
  { key: 'vehicle' as const, label: '分車' },
  { key: 'notes' as const, label: '備註' },
]

export function ColumnSettings({
  visibleColumns,
  onVisibilityChange,
  open,
  onOpenChange,
}: ColumnSettingsProps) {
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onOpenChange(!open)}
      >
        <Eye size={16} className="mr-1" />
        顯示欄位
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-morandi-gold/20 rounded-lg shadow-lg p-3 z-50 min-w-[140px]">
          <div className="text-xs font-medium text-morandi-secondary mb-2">選擇顯示欄位</div>
          {columnOptions.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-2 py-1 cursor-pointer hover:bg-morandi-container/20 px-1 rounded"
            >
              <input
                type="checkbox"
                checked={visibleColumns[key]}
                onChange={(e) => onVisibilityChange(key, e.target.checked)}
                className="rounded border-morandi-gold/40"
              />
              <span className="text-xs">{label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
