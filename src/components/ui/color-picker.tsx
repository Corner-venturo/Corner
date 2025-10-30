'use client'

import { morandiColors } from '@/stores/timebox-store'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
}

export default function ColorPicker({ value, onChange, className = '' }: ColorPickerProps) {
  return (
    <div className={className}>
      {/* 顏色選擇面板 - 直接展開 */}
      <div className="grid grid-cols-4 gap-2">
        {morandiColors.map(color => (
          <button
            key={color.value}
            type="button"
            onClick={() => onChange(color.value)}
            className={`w-12 h-12 rounded-lg transition-transform hover:scale-105 ${
              color.value === value
                ? 'ring-2 ring-gray-600 ring-offset-2'
                : 'border border-gray-200'
            }`}
            style={{ backgroundColor: color.value }}
            title={color.name}
          >
            <span className="sr-only">{color.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
