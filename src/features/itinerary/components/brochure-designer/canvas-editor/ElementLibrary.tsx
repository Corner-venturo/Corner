'use client'

/**
 * Element Library Component
 * 元素庫面板 - 提供可添加的元素（積木）
 */

import React, { useState } from 'react'
import {
  Type,
  Image,
  Square,
  Circle,
  Triangle,
  Minus,
  Sparkles,
  Stamp,
  Sticker,
  Frame,
  Award,
  ArrowRight,
  SeparatorHorizontal,
  MapPin,
  Plane,
  Building2,
  Calendar,
  Plus,
  Upload,
  Search,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ElementType, DecorationCategory } from './types'

interface ElementLibraryProps {
  onAddText: () => void
  onAddRectangle: () => void
  onAddCircle: () => void
  onAddTriangle: () => void
  onAddLine: () => void
  onAddImage: () => void
  onAddDecoration: (category: DecorationCategory, assetId: string) => void
  onAddSpotCard: () => void
  onAddItineraryItem: () => void
  onAddFlightInfo: () => void
  onAddAccommodationCard: () => void
  onAddDayHeader: () => void
  onUploadAsset: () => void
}

// 基礎元素
const BASIC_ELEMENTS = [
  { type: 'text' as const, icon: Type, label: '文字', description: '添加標題或內文' },
  { type: 'rectangle' as const, icon: Square, label: '矩形', description: '基本矩形' },
  { type: 'circle' as const, icon: Circle, label: '圓形', description: '基本圓形' },
  { type: 'triangle' as const, icon: Triangle, label: '三角形', description: '基本三角形' },
  { type: 'line' as const, icon: Minus, label: '線條', description: '直線或分隔線' },
]

// 裝飾元素分類
const DECORATION_CATEGORIES = [
  { id: 'stamp' as DecorationCategory, icon: Stamp, label: '印章', count: 12 },
  { id: 'sticker' as DecorationCategory, icon: Sticker, label: '貼紙', count: 24 },
  { id: 'frame' as DecorationCategory, icon: Frame, label: '相框', count: 8 },
  { id: 'ribbon' as DecorationCategory, icon: Award, label: '緞帶', count: 6 },
  { id: 'arrow' as DecorationCategory, icon: ArrowRight, label: '箭頭', count: 10 },
  { id: 'divider' as DecorationCategory, icon: SeparatorHorizontal, label: '分隔線', count: 15 },
]

// 複合元素（預設區塊）
const COMPOUND_ELEMENTS = [
  { type: 'spot-card' as const, icon: MapPin, label: '景點卡片', description: '景點名稱+圖片+說明' },
  { type: 'itinerary-item' as const, icon: Calendar, label: '行程項目', description: '日期+標題+活動' },
  { type: 'flight-info' as const, icon: Plane, label: '航班資訊', description: '航班號碼+時間+城市' },
  { type: 'accommodation-card' as const, icon: Building2, label: '住宿卡片', description: '飯店+地址+入住時間' },
]

// 示範裝飾素材
const SAMPLE_DECORATIONS: Record<DecorationCategory, Array<{ id: string; name: string; thumbnail: string }>> = {
  stamp: [
    { id: 'stamp-1', name: '日式印章', thumbnail: '/assets/decorations/stamp-1.svg' },
    { id: 'stamp-2', name: '櫻花印章', thumbnail: '/assets/decorations/stamp-2.svg' },
    { id: 'stamp-3', name: '富士山印章', thumbnail: '/assets/decorations/stamp-3.svg' },
  ],
  sticker: [
    { id: 'sticker-1', name: '櫻花', thumbnail: '/assets/decorations/sticker-1.svg' },
    { id: 'sticker-2', name: '鳥居', thumbnail: '/assets/decorations/sticker-2.svg' },
    { id: 'sticker-3', name: '達摩', thumbnail: '/assets/decorations/sticker-3.svg' },
  ],
  frame: [
    { id: 'frame-1', name: '和風相框', thumbnail: '/assets/decorations/frame-1.svg' },
    { id: 'frame-2', name: '圓形相框', thumbnail: '/assets/decorations/frame-2.svg' },
  ],
  ribbon: [
    { id: 'ribbon-1', name: '紅色緞帶', thumbnail: '/assets/decorations/ribbon-1.svg' },
    { id: 'ribbon-2', name: '金色緞帶', thumbnail: '/assets/decorations/ribbon-2.svg' },
  ],
  arrow: [
    { id: 'arrow-1', name: '簡約箭頭', thumbnail: '/assets/decorations/arrow-1.svg' },
    { id: 'arrow-2', name: '圓角箭頭', thumbnail: '/assets/decorations/arrow-2.svg' },
  ],
  divider: [
    { id: 'divider-1', name: '點線分隔', thumbnail: '/assets/decorations/divider-1.svg' },
    { id: 'divider-2', name: '波浪分隔', thumbnail: '/assets/decorations/divider-2.svg' },
  ],
  pattern: [],
}

type TabType = 'basic' | 'decoration' | 'compound' | 'upload'

export function ElementLibrary({
  onAddText,
  onAddRectangle,
  onAddCircle,
  onAddTriangle,
  onAddLine,
  onAddImage,
  onAddDecoration,
  onAddSpotCard,
  onAddItineraryItem,
  onAddFlightInfo,
  onAddAccommodationCard,
  onAddDayHeader,
  onUploadAsset,
}: ElementLibraryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basic')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<DecorationCategory | null>(null)

  const handleBasicElementClick = (type: string) => {
    switch (type) {
      case 'text':
        onAddText()
        break
      case 'rectangle':
        onAddRectangle()
        break
      case 'circle':
        onAddCircle()
        break
      case 'triangle':
        onAddTriangle()
        break
      case 'line':
        onAddLine()
        break
    }
  }

  const handleCompoundElementClick = (type: string) => {
    switch (type) {
      case 'spot-card':
        onAddSpotCard()
        break
      case 'itinerary-item':
        onAddItineraryItem()
        break
      case 'flight-info':
        onAddFlightInfo()
        break
      case 'accommodation-card':
        onAddAccommodationCard()
        break
      case 'day-header':
        onAddDayHeader()
        break
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-border">
      {/* 標題 */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-morandi-primary flex items-center gap-2">
          <Sparkles size={16} className="text-morandi-gold" />
          元素庫
        </h3>
      </div>

      {/* 搜尋 */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-morandi-secondary" />
          <Input
            placeholder="搜尋元素..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* 分頁標籤 */}
      <div className="flex border-b border-border">
        {[
          { id: 'basic' as TabType, label: '基礎' },
          { id: 'decoration' as TabType, label: '裝飾' },
          { id: 'compound' as TabType, label: '區塊' },
          { id: 'upload' as TabType, label: '上傳' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={cn(
              'flex-1 py-2 text-xs font-medium transition-colors',
              activeTab === tab.id
                ? 'text-morandi-gold border-b-2 border-morandi-gold'
                : 'text-morandi-secondary hover:text-morandi-primary'
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 內容區 */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* 基礎元素 */}
        {activeTab === 'basic' && (
          <div className="space-y-3">
            {/* 圖片按鈕 */}
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-auto py-3"
              onClick={onAddImage}
            >
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Image size={16} className="text-green-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">添加圖片</div>
                <div className="text-xs text-morandi-secondary">上傳或選擇圖片</div>
              </div>
            </Button>

            {/* 基本形狀 */}
            <div>
              <h4 className="text-xs font-medium text-morandi-secondary mb-2">基本形狀</h4>
              <div className="grid grid-cols-3 gap-2">
                {BASIC_ELEMENTS.map((element) => (
                  <button
                    key={element.type}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-lg border border-border',
                      'hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors'
                    )}
                    onClick={() => handleBasicElementClick(element.type)}
                    title={element.description}
                  >
                    <element.icon size={20} className="text-morandi-secondary" />
                    <span className="text-[10px] text-morandi-secondary">{element.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 裝飾元素 */}
        {activeTab === 'decoration' && (
          <div className="space-y-2">
            {DECORATION_CATEGORIES.map((category) => (
              <div key={category.id} className="border border-border rounded-lg overflow-hidden">
                <button
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left',
                    'hover:bg-slate-50 transition-colors',
                    expandedCategory === category.id && 'bg-slate-50'
                  )}
                  onClick={() =>
                    setExpandedCategory(expandedCategory === category.id ? null : category.id)
                  }
                >
                  <category.icon size={16} className="text-morandi-gold" />
                  <span className="text-sm font-medium flex-1">{category.label}</span>
                  <span className="text-xs text-morandi-secondary">{category.count}</span>
                  <ChevronRight
                    size={14}
                    className={cn(
                      'transition-transform',
                      expandedCategory === category.id && 'rotate-90'
                    )}
                  />
                </button>

                {/* 展開的素材列表 */}
                {expandedCategory === category.id && (
                  <div className="grid grid-cols-3 gap-2 p-2 border-t border-border bg-slate-50">
                    {SAMPLE_DECORATIONS[category.id].map((asset) => (
                      <button
                        key={asset.id}
                        className={cn(
                          'aspect-square rounded-lg border border-border bg-white',
                          'hover:border-morandi-gold hover:shadow-sm transition-all',
                          'flex items-center justify-center'
                        )}
                        onClick={() => onAddDecoration(category.id, asset.id)}
                        title={asset.name}
                      >
                        <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                          <category.icon size={14} className="text-slate-400" />
                        </div>
                      </button>
                    ))}
                    {SAMPLE_DECORATIONS[category.id].length === 0 && (
                      <div className="col-span-3 py-4 text-center text-xs text-morandi-secondary">
                        即將推出更多素材
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 複合元素（預製區塊） */}
        {activeTab === 'compound' && (
          <div className="space-y-2">
            {COMPOUND_ELEMENTS.map((element) => (
              <button
                key={element.type}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border border-border',
                  'hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors text-left'
                )}
                onClick={() => handleCompoundElementClick(element.type)}
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <element.icon size={18} className="text-morandi-gold" />
                </div>
                <div>
                  <div className="text-sm font-medium">{element.label}</div>
                  <div className="text-xs text-morandi-secondary">{element.description}</div>
                </div>
              </button>
            ))}

            <div className="pt-2 border-t border-border">
              <p className="text-[10px] text-morandi-secondary text-center">
                區塊可以拆解為獨立元素進行編輯
              </p>
            </div>
          </div>
        )}

        {/* 上傳素材 */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div
              className={cn(
                'border-2 border-dashed border-border rounded-xl p-6',
                'flex flex-col items-center justify-center gap-3',
                'hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors cursor-pointer'
              )}
              onClick={onUploadAsset}
            >
              <div className="w-12 h-12 rounded-full bg-morandi-gold/10 flex items-center justify-center">
                <Upload size={20} className="text-morandi-gold" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">上傳素材</div>
                <div className="text-xs text-morandi-secondary mt-1">
                  PNG, SVG, JPG (最大 5MB)
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-morandi-secondary">
                上傳的素材將存入公司素材庫
              </p>
              <p className="text-xs text-morandi-secondary">
                所有同事都可以使用
              </p>
            </div>

            {/* 最近上傳 */}
            <div>
              <h4 className="text-xs font-medium text-morandi-secondary mb-2">最近上傳</h4>
              <div className="text-center py-8 text-xs text-morandi-secondary">
                尚無上傳的素材
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
