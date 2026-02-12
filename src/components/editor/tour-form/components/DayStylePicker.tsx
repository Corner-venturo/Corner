'use client'

import React, { useState } from 'react'
import { DailyItinerary, DayDisplayStyle } from '../types'
import { DayTemplateEditor } from './DayTemplateEditor'
import { Image, Images, LayoutGrid, GitBranch, Eye } from 'lucide-react'
import { COMP_EDITOR_LABELS } from '../../constants/labels'

interface DayStylePickerProps {
  dayIndex: number
  dayData: DailyItinerary
  currentStyle: DayDisplayStyle
  onStyleChange: (style: DayDisplayStyle) => void
  onDayUpdate: (updatedDay: DailyItinerary) => void
  departureDate?: string
}

const styleOptions: { value: DayDisplayStyle; icon: React.ReactNode; label: string; color: string }[] = [
  { value: 'single-image', icon: <Image size={16} />, label: COMP_EDITOR_LABELS.單張大圖, color: '#c76d54' },
  { value: 'multi-image', icon: <Images size={16} />, label: COMP_EDITOR_LABELS.多圖輪播, color: '#8da399' },
  { value: 'card-grid', icon: <LayoutGrid size={16} />, label: COMP_EDITOR_LABELS.卡片網格, color: '#B8A99A' },
  { value: 'timeline', icon: <GitBranch size={16} />, label: COMP_EDITOR_LABELS.時間軸, color: '#4a6fa5' },
]

export function DayStylePicker({
  dayIndex,
  dayData,
  currentStyle,
  onStyleChange,
  onDayUpdate,
  departureDate,
}: DayStylePickerProps) {
  const [showEditor, setShowEditor] = useState(false)
  const [previewStyle, setPreviewStyle] = useState<DayDisplayStyle>(currentStyle)

  const handleStyleClick = (style: DayDisplayStyle) => {
    setPreviewStyle(style)
    onStyleChange(style)
  }

  const handlePreviewClick = () => {
    setShowEditor(true)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* 風格選擇按鈕 */}
        <div className="flex items-center bg-morandi-container/30 rounded-lg p-0.5">
          {styleOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleStyleClick(option.value)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all ${
                currentStyle === option.value
                  ? 'bg-card shadow-sm'
                  : 'hover:bg-card/50'
              }`}
              style={{
                color: currentStyle === option.value ? option.color : undefined,
              }}
              title={option.label}
            >
              {option.icon}
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          ))}
        </div>

        {/* 預覽編輯按鈕 */}
        <button
          type="button"
          onClick={handlePreviewClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-morandi-gold text-white rounded-lg text-xs hover:bg-morandi-gold-hover transition-colors"
        >
          <Eye size={14} />
          預覽編輯
        </button>
      </div>

      {/* 模板編輯浮動視窗 */}
      <DayTemplateEditor
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        dayData={dayData}
        dayIndex={dayIndex}
        departureDate={departureDate}
        onSave={onDayUpdate}
        style={previewStyle}
      />
    </>
  )
}
