'use client'

import { Eye, EyeOff, RotateCcw } from 'lucide-react'
import { VisibleColumns } from '../types'
import { cn } from '@/lib/utils'

interface ColumnSettingsProps {
  visibleColumns: VisibleColumns
  onVisibilityChange: (key: keyof VisibleColumns, value: boolean) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const columnOptions: Array<{ key: keyof VisibleColumns; label: string; color: string }> = [
  { key: 'passport_name', label: '護照拼音', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'birth_date', label: '生日', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'gender', label: '性別', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { key: 'passport_number', label: '護照號碼', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { key: 'dietary', label: '飲食禁忌', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'room', label: '分房', color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'vehicle', label: '分車', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { key: 'notes', label: '備註', color: 'bg-violet-100 text-violet-700 border-violet-200' },
]

export function ColumnSettings({
  visibleColumns,
  onVisibilityChange,
}: ColumnSettingsProps) {
  const hiddenCount = columnOptions.filter(({ key }) => !visibleColumns[key]).length
  const allVisible = hiddenCount === 0

  const handleShowAll = () => {
    columnOptions.forEach(({ key }) => {
      if (!visibleColumns[key]) {
        onVisibilityChange(key, true)
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-morandi-secondary mr-1 flex items-center gap-1">
        <Eye size={14} />
        欄位:
      </span>
      {columnOptions.map(({ key, label, color }) => {
        const isVisible = visibleColumns[key]
        return (
          <button
            key={key}
            onClick={() => onVisibilityChange(key, !isVisible)}
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium border transition-all',
              isVisible
                ? color
                : 'bg-gray-100 text-gray-400 border-gray-200 line-through'
            )}
            title={isVisible ? `隱藏「${label}」` : `顯示「${label}」`}
          >
            {isVisible ? (
              label
            ) : (
              <span className="flex items-center gap-1">
                <EyeOff size={10} />
                {label}
              </span>
            )}
          </button>
        )
      })}
      {!allVisible && (
        <button
          onClick={handleShowAll}
          className="px-2 py-0.5 rounded-full text-xs font-medium bg-morandi-gold/10 text-morandi-gold border border-morandi-gold/30 hover:bg-morandi-gold/20 transition-all flex items-center gap-1"
          title="顯示全部欄位"
        >
          <RotateCcw size={10} />
          全部顯示
        </button>
      )}
    </div>
  )
}
