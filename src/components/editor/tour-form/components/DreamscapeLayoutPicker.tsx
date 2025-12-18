'use client'

import React from 'react'
import { DreamscapeDayLayout } from '../types'
import { CircleDot, LayoutPanelLeft, ImageIcon, Layers } from 'lucide-react'

interface DreamscapeLayoutPickerProps {
  dayIndex: number
  currentLayout?: DreamscapeDayLayout
  onLayoutChange: (layout: DreamscapeDayLayout) => void
}

const layoutOptions: { value: DreamscapeDayLayout; icon: React.ReactNode; label: string; color: string }[] = [
  { value: 'blobLeft', icon: <CircleDot size={16} />, label: 'Blob 左', color: '#9370db' },
  { value: 'blobRight', icon: <LayoutPanelLeft size={16} />, label: 'Blob 右', color: '#ff7f50' },
  { value: 'fullHero', icon: <ImageIcon size={16} />, label: '全幅英雄', color: '#4a6fa5' },
  { value: 'glassCard', icon: <Layers size={16} />, label: '玻璃卡片', color: '#8da399' },
]

export function DreamscapeLayoutPicker({
  currentLayout = 'blobLeft',
  onLayoutChange,
}: DreamscapeLayoutPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-morandi-secondary">佈局：</span>
      <div className="flex items-center bg-morandi-container/30 rounded-lg p-0.5">
        {layoutOptions.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onLayoutChange(option.value)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all ${
              currentLayout === option.value
                ? 'bg-white shadow-sm'
                : 'hover:bg-white/50'
            }`}
            style={{
              color: currentLayout === option.value ? option.color : undefined,
            }}
            title={option.label}
          >
            {option.icon}
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
