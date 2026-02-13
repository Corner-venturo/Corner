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
import { DESIGNER_LABELS } from '../constants/labels'

// 可用字體列表
const FONTS = [
  // 中文字體 - 黑體系列
  { name: 'Noto Sans TC', label: DESIGNER_LABELS.思源黑體, category: DESIGNER_LABELS.中文黑體 },
  { name: 'Taipei Sans TC', label: DESIGNER_LABELS.台北黑體, category: DESIGNER_LABELS.中文黑體 },
  { name: 'Cubic', label: DESIGNER_LABELS.俐方體, category: DESIGNER_LABELS.中文黑體 },
  // 中文字體 - 宋體/明體系列
  { name: 'Noto Serif TC', label: DESIGNER_LABELS.思源宋體, category: DESIGNER_LABELS.中文宋體 },
  { name: 'Zhi Mang Xing', label: DESIGNER_LABELS.芫荽明體, category: DESIGNER_LABELS.中文宋體 },
  // 中文字體 - 書法/手寫
  { name: 'LXGW WenKai TC', label: DESIGNER_LABELS.霞鶩文楷, category: DESIGNER_LABELS.中文手寫 },
  { name: 'Ma Shan Zheng', label: DESIGNER_LABELS.馬善政楷書, category: DESIGNER_LABELS.中文手寫 },
  { name: 'Zhi Mang Xing', label: DESIGNER_LABELS.芝麻行書, category: DESIGNER_LABELS.中文手寫 },
  { name: 'Liu Jian Mao Cao', label: DESIGNER_LABELS.流建毛草, category: DESIGNER_LABELS.中文手寫 },
  { name: 'Long Cang', label: DESIGNER_LABELS.龍藏, category: DESIGNER_LABELS.中文手寫 },
  // 中文字體 - 圓體/可愛
  { name: 'Zen Maru Gothic', label: DESIGNER_LABELS.禪丸黑體, category: DESIGNER_LABELS.中文圓體 },
  // 日文字體（旅遊手冊常用）
  { name: 'Noto Sans JP', label: DESIGNER_LABELS.思源黑體JP, category: DESIGNER_LABELS.日文 },
  { name: 'Noto Serif JP', label: DESIGNER_LABELS.思源宋體JP, category: DESIGNER_LABELS.日文 },
  { name: 'Zen Kaku Gothic New', label: DESIGNER_LABELS.禪角黑體, category: DESIGNER_LABELS.日文 },
  { name: 'Shippori Mincho', label: DESIGNER_LABELS.汐風明朝, category: DESIGNER_LABELS.日文 },
  { name: 'Kosugi Maru', label: DESIGNER_LABELS.小杉丸, category: DESIGNER_LABELS.日文 },
  // 英文字體 - 無襯線
  { name: 'Inter', label: 'Inter', category: DESIGNER_LABELS.英文無襯線 },
  { name: 'Roboto', label: 'Roboto', category: DESIGNER_LABELS.英文無襯線 },
  { name: 'Open Sans', label: 'Open Sans', category: DESIGNER_LABELS.英文無襯線 },
  { name: 'Lato', label: 'Lato', category: DESIGNER_LABELS.英文無襯線 },
  { name: 'Montserrat', label: 'Montserrat', category: DESIGNER_LABELS.英文無襯線 },
  { name: 'Poppins', label: 'Poppins', category: DESIGNER_LABELS.英文無襯線 },
  { name: 'Quicksand', label: 'Quicksand', category: DESIGNER_LABELS.英文無襯線 },
  // 英文字體 - 襯線
  { name: 'Playfair Display', label: 'Playfair Display', category: DESIGNER_LABELS.英文襯線 },
  { name: 'Merriweather', label: 'Merriweather', category: DESIGNER_LABELS.英文襯線 },
  { name: 'Libre Baskerville', label: 'Libre Baskerville', category: DESIGNER_LABELS.英文襯線 },
  { name: 'Cormorant Garamond', label: 'Cormorant', category: DESIGNER_LABELS.英文襯線 },
  // 英文字體 - 手寫/裝飾
  { name: 'Dancing Script', label: 'Dancing Script', category: DESIGNER_LABELS.英文手寫 },
  { name: 'Pacifico', label: 'Pacifico', category: DESIGNER_LABELS.英文手寫 },
  { name: 'Great Vibes', label: 'Great Vibes', category: DESIGNER_LABELS.英文手寫 },
  { name: 'Caveat', label: 'Caveat', category: DESIGNER_LABELS.英文手寫 },
  { name: 'Satisfy', label: 'Satisfy', category: DESIGNER_LABELS.英文手寫 },
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
  { value: 'normal', label: DESIGNER_LABELS.正常 },
  { value: 'bold', label: DESIGNER_LABELS.粗體 },
  { value: '100', label: DESIGNER_LABELS.極細 },
  { value: '300', label: DESIGNER_LABELS.細 },
  { value: '500', label: DESIGNER_LABELS.中等 },
  { value: '700', label: DESIGNER_LABELS.粗 },
  { value: '900', label: DESIGNER_LABELS.極粗 },
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
    { value: 'left', label: DESIGNER_LABELS.靠左 },
    { value: 'center', label: DESIGNER_LABELS.置中 },
    { value: 'right', label: DESIGNER_LABELS.靠右 },
    { value: 'justify', label: DESIGNER_LABELS.兩端 },
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
