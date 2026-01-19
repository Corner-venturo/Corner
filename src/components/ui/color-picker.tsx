'use client'

import { useState, useCallback } from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import { Palette, Pipette } from 'lucide-react'
import { cn } from '@/lib/utils'

// 莫蘭迪配色選項
const morandiColors = [
  { name: '柔霧粉', value: '#E2C4C4' },
  { name: '晨露綠', value: '#C4D6C4' },
  { name: '雲石灰', value: '#D4D4D4' },
  { name: '奶茶棕', value: '#D6C4B8' },
  { name: '薰衣草', value: '#D0C4D6' },
  { name: '杏仁黃', value: '#E0D6B8' },
  { name: '海霧藍', value: '#C4D0D6' },
  { name: '珊瑚橘', value: '#E0C8B8' },
  { name: '鼠尾草', value: '#B8C8B8' },
  { name: '暮色紫', value: '#C4B8D0' },
  { name: '燕麥米', value: '#D6D0C4' },
  { name: '石墨藍', value: '#B8C4D0' },
  { name: '楓葉紅', value: '#D0B8B8' },
  { name: '苔蘚綠', value: '#B8C4B8' },
  { name: '砂岩褐', value: '#C8B8B0' },
  { name: '月光白', value: '#E8E8E8' },
]

// 基本配色（黑白灰 + 主色）
const basicColors = [
  { name: '純黑', value: '#000000' },
  { name: '深灰', value: '#4A4A4A' },
  { name: '灰色', value: '#808080' },
  { name: '淺灰', value: '#CCCCCC' },
  { name: '純白', value: '#FFFFFF' },
  { name: '金色', value: '#C9AA7C' },
  { name: '深金', value: '#B8996B' },
  { name: '棕色', value: '#8B7355' },
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
  showCustomPicker?: boolean
}

export default function ColorPicker({
  value,
  onChange,
  className = '',
  showCustomPicker = true,
}: ColorPickerProps) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset')

  const handleColorClick = useCallback(
    (colorValue: string) => {
      onChange(colorValue)
    },
    [onChange]
  )

  return (
    <div className={cn('space-y-3', className)}>
      {/* 模式切換 */}
      {showCustomPicker && (
        <div className="flex gap-1 p-1 bg-morandi-container/30 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('preset')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-xs transition-colors',
              mode === 'preset'
                ? 'bg-white shadow-sm text-morandi-primary'
                : 'text-morandi-secondary hover:text-morandi-primary'
            )}
          >
            <Palette size={12} />
            預設色
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-xs transition-colors',
              mode === 'custom'
                ? 'bg-white shadow-sm text-morandi-primary'
                : 'text-morandi-secondary hover:text-morandi-primary'
            )}
          >
            <Pipette size={12} />
            自訂色
          </button>
        </div>
      )}

      {mode === 'preset' ? (
        <div className="space-y-3">
          {/* 基本配色 */}
          <div>
            <p className="text-[10px] text-morandi-secondary mb-1.5">基本</p>
            <div className="grid grid-cols-8 gap-1">
              {basicColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleColorClick(color.value)}
                  className={cn(
                    'w-6 h-6 rounded transition-transform hover:scale-110',
                    color.value === value
                      ? 'ring-2 ring-morandi-gold ring-offset-1'
                      : 'border border-border'
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  <span className="sr-only">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 莫蘭迪配色 */}
          <div>
            <p className="text-[10px] text-morandi-secondary mb-1.5">莫蘭迪</p>
            <div className="grid grid-cols-8 gap-1">
              {morandiColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleColorClick(color.value)}
                  className={cn(
                    'w-6 h-6 rounded transition-transform hover:scale-110',
                    color.value === value
                      ? 'ring-2 ring-morandi-gold ring-offset-1'
                      : 'border border-border'
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  <span className="sr-only">{color.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* react-colorful 顏色選擇器 */}
          <div className="color-picker-container">
            <HexColorPicker color={value} onChange={onChange} />
          </div>

          {/* Hex 輸入框 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-morandi-secondary">HEX</span>
            <div className="flex-1 flex items-center gap-1 px-2 py-1 border border-border rounded bg-white">
              <span className="text-xs text-morandi-secondary">#</span>
              <HexColorInput
                color={value}
                onChange={onChange}
                className="flex-1 text-xs bg-transparent outline-none uppercase"
                prefixed={false}
              />
            </div>
            <div
              className="w-6 h-6 rounded border border-border"
              style={{ backgroundColor: value }}
            />
          </div>
        </div>
      )}

      {/* 當前顏色預覽 */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <span className="text-[10px] text-morandi-secondary">當前顏色:</span>
        <div
          className="w-8 h-4 rounded border border-border"
          style={{ backgroundColor: value }}
        />
        <span className="text-[10px] text-morandi-secondary uppercase">{value}</span>
      </div>

      <style jsx global>{`
        .color-picker-container .react-colorful {
          width: 100%;
          height: 150px;
        }
        .color-picker-container .react-colorful__saturation {
          border-radius: 8px 8px 0 0;
        }
        .color-picker-container .react-colorful__hue {
          height: 16px;
          border-radius: 0 0 8px 8px;
        }
        .color-picker-container .react-colorful__pointer {
          width: 16px;
          height: 16px;
        }
      `}</style>
    </div>
  )
}
