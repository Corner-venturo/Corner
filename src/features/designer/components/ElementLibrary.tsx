'use client'

/**
 * 元素庫組件
 *
 * 提供預設圖案、線條、印章等設計元素快速插入
 */

import { useState } from 'react'
import {
  Minus,
  Circle,
  Square,
  Type,
  Star,
  Heart,
  ArrowRight,
  MoreHorizontal,
  Sparkles,
  Award,
  Frame,
  Camera,
  Plane,
  Compass,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAllStickers, getStickersByCategory, STICKER_CATEGORIES, type StickerDefinition } from './core/sticker-paths'
import type { StickerCategory } from './types'

interface ElementLibraryProps {
  onAddLine: (options?: { style?: 'solid' | 'dashed' | 'dotted'; arrow?: boolean }) => void
  onAddShape: (type: 'rectangle' | 'circle') => void
  onAddText: () => void
  onAddSticker: (stickerId: string, category: StickerCategory) => void
}

// 線條樣式選項
const LINE_OPTIONS = [
  { id: 'solid', name: '實線', icon: Minus, style: 'solid' as const, arrow: false },
  { id: 'dashed', name: '虛線', icon: MoreHorizontal, style: 'dashed' as const, arrow: false },
  { id: 'dotted', name: '點線', icon: MoreHorizontal, style: 'dotted' as const, arrow: false },
  { id: 'arrow', name: '箭頭', icon: ArrowRight, style: 'solid' as const, arrow: true },
]

// 基本形狀
const BASIC_SHAPES = [
  { id: 'rectangle', name: '矩形', icon: Square },
  { id: 'circle', name: '圓形', icon: Circle },
]

export function ElementLibrary({
  onAddLine,
  onAddShape,
  onAddText,
  onAddSticker,
}: ElementLibraryProps) {
  const [activeTab, setActiveTab] = useState('elements')

  // 取得所有貼紙分類
  const categories = Object.entries(STICKER_CATEGORIES) as [StickerCategory, string][]

  return (
    <div className="w-64 h-full bg-white border-r border-border flex flex-col">
      <div className="p-3 border-b border-border h-[42px] flex items-center">
        <h3 className="font-medium text-sm text-morandi-primary">元素庫</h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 mx-2 mt-2">
          <TabsTrigger value="elements" className="text-xs">基本</TabsTrigger>
          <TabsTrigger value="lines" className="text-xs">線條</TabsTrigger>
          <TabsTrigger value="stickers" className="text-xs">圖案</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          {/* 基本元素 */}
          <TabsContent value="elements" className="p-3 space-y-4">
            {/* 文字 */}
            <div>
              <h4 className="text-xs font-medium text-morandi-secondary mb-2">文字</h4>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={onAddText}
              >
                <Type size={16} />
                新增文字
              </Button>
            </div>

            {/* 形狀 */}
            <div>
              <h4 className="text-xs font-medium text-morandi-secondary mb-2">形狀</h4>
              <div className="grid grid-cols-2 gap-2">
                {BASIC_SHAPES.map((shape) => (
                  <Button
                    key={shape.id}
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-center gap-1 h-16"
                    onClick={() => onAddShape(shape.id as 'rectangle' | 'circle')}
                  >
                    <shape.icon size={20} className="text-morandi-gold" />
                    <span className="text-[10px]">{shape.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* 線條 */}
          <TabsContent value="lines" className="p-3">
            <h4 className="text-xs font-medium text-morandi-secondary mb-2">線條樣式</h4>
            <div className="grid grid-cols-2 gap-2">
              {LINE_OPTIONS.map((line) => (
                <Button
                  key={line.id}
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center gap-1 h-16"
                  onClick={() => onAddLine({ style: line.style, arrow: line.arrow })}
                >
                  <line.icon size={20} className="text-morandi-gold" />
                  <span className="text-[10px]">{line.name}</span>
                </Button>
              ))}
            </div>

            {/* 線條預覽 */}
            <div className="mt-4 p-3 bg-morandi-container/30 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t-2 border-morandi-gold" />
                <span className="text-[10px] text-morandi-secondary">實線</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t-2 border-dashed border-morandi-gold" />
                <span className="text-[10px] text-morandi-secondary">虛線</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t-2 border-dotted border-morandi-gold" />
                <span className="text-[10px] text-morandi-secondary">點線</span>
              </div>
            </div>
          </TabsContent>

          {/* 貼紙/圖案 */}
          <TabsContent value="stickers" className="p-3 space-y-4">
            {categories.map(([category, label]) => {
              const stickers = getStickersByCategory(category)
              if (stickers.length === 0) return null

              return (
                <div key={category}>
                  <h4 className="text-xs font-medium text-morandi-secondary mb-2 flex items-center gap-1">
                    {getCategoryIcon(category)}
                    {label}
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {stickers.map((sticker) => (
                      <StickerButton
                        key={sticker.id}
                        sticker={sticker}
                        onClick={() => onAddSticker(sticker.id, category)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

// 貼紙按鈕組件
function StickerButton({
  sticker,
  onClick,
}: {
  sticker: StickerDefinition
  onClick: () => void
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="flex flex-col items-center justify-center h-14 p-1 hover:border-morandi-gold"
      onClick={onClick}
      title={sticker.name}
    >
      <svg
        viewBox={`0 0 ${sticker.viewBox.width} ${sticker.viewBox.height}`}
        className="w-8 h-8"
        fill={sticker.defaultColor || '#c9aa7c'}
        stroke={sticker.defaultColor || '#c9aa7c'}
        strokeWidth="1"
      >
        <path d={sticker.path} />
      </svg>
    </Button>
  )
}

// 取得分類圖標
function getCategoryIcon(category: StickerCategory) {
  switch (category) {
    case 'divider':
      return <Minus size={12} />
    case 'frame':
      return <Frame size={12} />
    case 'decoration':
      return <Sparkles size={12} />
    case 'badge':
      return <Award size={12} />
    case 'stamp':
      return <Circle size={12} />
    default:
      return null
  }
}

// 快速插入工具列（精簡版）
export function QuickInsertBar({
  onAddLine,
  onAddShape,
  onAddText,
}: Omit<ElementLibraryProps, 'onAddSticker'>) {
  return (
    <div className="flex items-center gap-1 p-1 bg-white rounded-lg shadow-sm border border-border">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onAddText}
        title="新增文字"
      >
        <Type size={16} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onAddShape('rectangle')}
        title="新增矩形"
      >
        <Square size={16} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onAddShape('circle')}
        title="新增圓形"
      >
        <Circle size={16} />
      </Button>
      <div className="w-px h-4 bg-border mx-1" />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onAddLine()}
        title="新增線條"
      >
        <Minus size={16} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onAddLine({ arrow: true })}
        title="新增箭頭"
      >
        <ArrowRight size={16} />
      </Button>
    </div>
  )
}
