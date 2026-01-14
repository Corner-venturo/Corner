'use client'

/**
 * 字體選擇器組件
 *
 * 支援常用中文字體和 Google Fonts
 */

import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// 可用字體列表
const FONTS = [
  // 中文字體
  { name: 'Noto Sans TC', label: '思源黑體', category: '中文' },
  { name: 'Noto Serif TC', label: '思源宋體', category: '中文' },
  { name: 'LXGW WenKai TC', label: '霞鶩文楷', category: '中文' },
  { name: 'Taipei Sans TC', label: '台北黑體', category: '中文' },
  // 英文字體
  { name: 'Inter', label: 'Inter', category: '英文' },
  { name: 'Roboto', label: 'Roboto', category: '英文' },
  { name: 'Open Sans', label: 'Open Sans', category: '英文' },
  { name: 'Lato', label: 'Lato', category: '英文' },
  { name: 'Montserrat', label: 'Montserrat', category: '英文' },
  { name: 'Playfair Display', label: 'Playfair Display', category: '裝飾' },
  { name: 'Dancing Script', label: 'Dancing Script', category: '手寫' },
]

// 字體大小選項
const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72, 96]

interface FontPickerProps {
  fontFamily: string
  fontSize: number
  onFontFamilyChange: (font: string) => void
  onFontSizeChange: (size: number) => void
}

export function FontPicker({
  fontFamily,
  fontSize,
  onFontFamilyChange,
  onFontSizeChange,
}: FontPickerProps) {
  const [fontOpen, setFontOpen] = useState(false)
  const [sizeOpen, setSizeOpen] = useState(false)

  const currentFont = FONTS.find((f) => f.name === fontFamily) || FONTS[0]

  // 按類別分組字體
  const fontsByCategory = FONTS.reduce(
    (acc, font) => {
      if (!acc[font.category]) {
        acc[font.category] = []
      }
      acc[font.category].push(font)
      return acc
    },
    {} as Record<string, typeof FONTS>
  )

  return (
    <div className="flex items-center gap-2">
      {/* 字體選擇 */}
      <Popover open={fontOpen} onOpenChange={setFontOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[140px] justify-between h-8 text-xs"
          >
            <span className="truncate" style={{ fontFamily: currentFont.name }}>
              {currentFont.label}
            </span>
            <ChevronDown size={14} className="ml-1 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <div className="max-h-[300px] overflow-auto">
            {Object.entries(fontsByCategory).map(([category, fonts]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-medium text-morandi-secondary bg-morandi-container/30">
                  {category}
                </div>
                {fonts.map((font) => (
                  <button
                    key={font.name}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-morandi-container/50 transition-colors',
                      fontFamily === font.name && 'bg-morandi-container/50'
                    )}
                    style={{ fontFamily: font.name }}
                    onClick={() => {
                      onFontFamilyChange(font.name)
                      setFontOpen(false)
                    }}
                  >
                    {fontFamily === font.name && <Check size={14} className="text-morandi-gold" />}
                    {fontFamily !== font.name && <div className="w-[14px]" />}
                    <span>{font.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* 字體大小選擇 */}
      <Popover open={sizeOpen} onOpenChange={setSizeOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[70px] justify-between h-8 text-xs"
          >
            <span>{fontSize}px</span>
            <ChevronDown size={14} className="ml-1 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[80px] p-0" align="start">
          <div className="max-h-[200px] overflow-auto">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                className={cn(
                  'w-full flex items-center justify-center gap-1 px-2 py-1.5 text-sm hover:bg-morandi-container/50 transition-colors',
                  fontSize === size && 'bg-morandi-container/50'
                )}
                onClick={() => {
                  onFontSizeChange(size)
                  setSizeOpen(false)
                }}
              >
                {fontSize === size && <Check size={12} className="text-morandi-gold" />}
                <span>{size}px</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// 字體粗細選擇器
interface FontWeightPickerProps {
  fontWeight: string
  onChange: (weight: string) => void
}

const FONT_WEIGHTS = [
  { value: 'normal', label: '正常' },
  { value: 'bold', label: '粗體' },
  { value: '100', label: '極細' },
  { value: '300', label: '細' },
  { value: '500', label: '中等' },
  { value: '700', label: '粗' },
  { value: '900', label: '極粗' },
]

export function FontWeightPicker({ fontWeight, onChange }: FontWeightPickerProps) {
  const [open, setOpen] = useState(false)
  const currentWeight = FONT_WEIGHTS.find((w) => w.value === fontWeight) || FONT_WEIGHTS[0]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[80px] justify-between h-8 text-xs"
        >
          <span>{currentWeight.label}</span>
          <ChevronDown size={14} className="ml-1 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[100px] p-0" align="start">
        <div className="max-h-[200px] overflow-auto">
          {FONT_WEIGHTS.map((weight) => (
            <button
              key={weight.value}
              className={cn(
                'w-full flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-morandi-container/50 transition-colors',
                fontWeight === weight.value && 'bg-morandi-container/50'
              )}
              style={{ fontWeight: weight.value }}
              onClick={() => {
                onChange(weight.value)
                setOpen(false)
              }}
            >
              {fontWeight === weight.value && <Check size={12} className="text-morandi-gold" />}
              <span>{weight.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// 文字對齊選擇器
interface TextAlignPickerProps {
  textAlign: string
  onChange: (align: string) => void
}

export function TextAlignPicker({ textAlign, onChange }: TextAlignPickerProps) {
  const alignments = [
    { value: 'left', label: '靠左' },
    { value: 'center', label: '置中' },
    { value: 'right', label: '靠右' },
    { value: 'justify', label: '兩端' },
  ]

  return (
    <div className="flex items-center gap-0.5 border rounded-md">
      {alignments.map((align) => (
        <button
          key={align.value}
          className={cn(
            'px-2 py-1 text-xs transition-colors',
            textAlign === align.value
              ? 'bg-morandi-gold text-white'
              : 'hover:bg-morandi-container/50'
          )}
          onClick={() => onChange(align.value)}
          title={align.label}
        >
          {align.label}
        </button>
      ))}
    </div>
  )
}
