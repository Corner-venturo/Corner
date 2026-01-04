'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  MapPin,
  Sticker,
  Image,
  Layers,
  Search,
  Plus,
  Clock,
  Star,
  ChevronRight,
  GripVertical,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAttractionStore } from '@/stores/attraction-store'
import type { Attraction } from '@/features/attractions/types'
import type { BrochureElement, BrochurePage } from './types'

type TabType = 'attractions' | 'stickers' | 'library' | 'layers'

interface AssetPanelProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onAddAttraction: (attraction: Attraction) => void
  onAddSticker: (stickerId: string) => void
  onAddImage: (imageUrl: string) => void
  // 圖層相關
  currentPage: BrochurePage | null
  selectedElementIds: string[]
  onSelectElement: (id: string) => void
  onToggleVisibility: (id: string) => void
  onToggleLock: (id: string) => void
  onReorderElement: (id: string, direction: 'up' | 'down') => void
}

const TABS = [
  { id: 'attractions' as TabType, label: '景點', icon: MapPin },
  { id: 'stickers' as TabType, label: '貼紙', icon: Sticker },
  { id: 'library' as TabType, label: '圖庫', icon: Image },
  { id: 'layers' as TabType, label: '圖層', icon: Layers },
]

// 預設貼紙分類
const STICKER_CATEGORIES = [
  {
    id: 'stamps',
    name: '印章',
    stickers: [
      { id: 'stamp-japan', name: '日本印章', src: '/stickers/stamp-japan.png' },
      { id: 'stamp-korea', name: '韓國印章', src: '/stickers/stamp-korea.png' },
      { id: 'stamp-passport', name: '護照章', src: '/stickers/stamp-passport.png' },
    ],
  },
  {
    id: 'decorations',
    name: '裝飾',
    stickers: [
      { id: 'deco-sakura', name: '櫻花', src: '/stickers/deco-sakura.png' },
      { id: 'deco-maple', name: '楓葉', src: '/stickers/deco-maple.png' },
      { id: 'deco-wave', name: '海浪', src: '/stickers/deco-wave.png' },
    ],
  },
  {
    id: 'icons',
    name: '圖標',
    stickers: [
      { id: 'icon-plane', name: '飛機', src: '/stickers/icon-plane.png' },
      { id: 'icon-hotel', name: '飯店', src: '/stickers/icon-hotel.png' },
      { id: 'icon-food', name: '美食', src: '/stickers/icon-food.png' },
    ],
  },
]

export function AssetPanel({
  activeTab,
  onTabChange,
  onAddAttraction,
  onAddSticker,
  onAddImage,
  currentPage,
  selectedElementIds,
  onSelectElement,
  onToggleVisibility,
  onToggleLock,
  onReorderElement,
}: AssetPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { items: attractions } = useAttractionStore()

  // 篩選景點
  const filteredAttractions = useMemo(() => {
    if (!searchQuery) return attractions.slice(0, 50)
    const query = searchQuery.toLowerCase()
    return attractions
      .filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.name_en?.toLowerCase().includes(query) ||
          a.category?.toLowerCase().includes(query)
      )
      .slice(0, 50)
  }, [attractions, searchQuery])

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Tab 切換 */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors',
              activeTab === tab.id
                ? 'text-morandi-gold border-b-2 border-morandi-gold'
                : 'text-morandi-secondary hover:text-morandi-primary'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 內容區域 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'attractions' && (
          <AttractionsTab
            attractions={filteredAttractions}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAdd={onAddAttraction}
          />
        )}
        {activeTab === 'stickers' && (
          <StickersTab onAdd={onAddSticker} />
        )}
        {activeTab === 'library' && (
          <LibraryTab onAdd={onAddImage} />
        )}
        {activeTab === 'layers' && (
          <LayersTab
            elements={currentPage?.elements || []}
            selectedIds={selectedElementIds}
            onSelect={onSelectElement}
            onToggleVisibility={onToggleVisibility}
            onToggleLock={onToggleLock}
            onReorder={onReorderElement}
          />
        )}
      </div>
    </div>
  )
}

// 景點分頁
function AttractionsTab({
  attractions,
  searchQuery,
  onSearchChange,
  onAdd,
}: {
  attractions: Attraction[]
  searchQuery: string
  onSearchChange: (query: string) => void
  onAdd: (attraction: Attraction) => void
}) {
  return (
    <div className="h-full flex flex-col">
      {/* 搜尋 */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-morandi-secondary" />
          <Input
            placeholder="搜尋景點..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* 景點列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {attractions.length === 0 ? (
            <p className="text-sm text-morandi-secondary text-center py-8">
              {searchQuery ? '找不到符合的景點' : '尚無景點資料'}
            </p>
          ) : (
            attractions.map((attraction) => (
              <AttractionItem
                key={attraction.id}
                attraction={attraction}
                onAdd={() => onAdd(attraction)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function AttractionItem({
  attraction,
  onAdd,
}: {
  attraction: Attraction
  onAdd: () => void
}) {
  return (
    <div className="group flex items-center gap-2 p-2 rounded-lg hover:bg-morandi-container/50 transition-colors">
      {/* 縮圖 */}
      <div className="w-12 h-12 rounded-lg bg-morandi-container overflow-hidden flex-shrink-0">
        {attraction.thumbnail ? (
          <img
            src={attraction.thumbnail}
            alt={attraction.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin size={16} className="text-morandi-secondary" />
          </div>
        )}
      </div>

      {/* 資訊 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-morandi-primary truncate">
          {attraction.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-morandi-secondary">
          {attraction.duration_minutes && (
            <span className="flex items-center gap-0.5">
              <Clock size={10} />
              {attraction.duration_minutes}分
            </span>
          )}
          {attraction.category && (
            <span className="truncate">{attraction.category}</span>
          )}
        </div>
      </div>

      {/* 添加按鈕 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onAdd}
      >
        <Plus size={16} />
      </Button>
    </div>
  )
}

// 貼紙分頁
function StickersTab({ onAdd }: { onAdd: (stickerId: string) => void }) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('stamps')

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-2">
        {STICKER_CATEGORIES.map((category) => (
          <div key={category.id} className="mb-2">
            {/* 分類標題 */}
            <button
              onClick={() =>
                setExpandedCategory(expandedCategory === category.id ? null : category.id)
              }
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-morandi-container/50 transition-colors"
            >
              <span className="text-sm font-medium text-morandi-primary">
                {category.name}
              </span>
              <ChevronRight
                size={16}
                className={cn(
                  'text-morandi-secondary transition-transform',
                  expandedCategory === category.id && 'rotate-90'
                )}
              />
            </button>

            {/* 貼紙網格 */}
            {expandedCategory === category.id && (
              <div className="grid grid-cols-3 gap-2 p-2">
                {category.stickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    onClick={() => onAdd(sticker.id)}
                    className="aspect-square rounded-lg border border-border hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors p-2"
                    title={sticker.name}
                  >
                    <div className="w-full h-full bg-morandi-container/30 rounded flex items-center justify-center">
                      <Sticker size={20} className="text-morandi-secondary" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// 圖庫分頁
function LibraryTab({ onAdd }: { onAdd: (imageUrl: string) => void }) {
  const handleUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const url = URL.createObjectURL(file)
        onAdd(url)
      }
    }
    input.click()
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={handleUpload}
        >
          <Plus size={14} />
          上傳圖片
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-morandi-secondary text-center">
          從本機上傳圖片<br />
          或從景點資料庫選擇
        </p>
      </div>
    </div>
  )
}

// 圖層分頁
function LayersTab({
  elements,
  selectedIds,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onReorder,
}: {
  elements: BrochureElement[]
  selectedIds: string[]
  onSelect: (id: string) => void
  onToggleVisibility: (id: string) => void
  onToggleLock: (id: string) => void
  onReorder: (id: string, direction: 'up' | 'down') => void
}) {
  // 按 zIndex 排序（高的在上面）
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex)

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-2 space-y-1">
        {sortedElements.length === 0 ? (
          <p className="text-sm text-morandi-secondary text-center py-8">
            尚無元素
          </p>
        ) : (
          sortedElements.map((element) => (
            <div
              key={element.id}
              onClick={() => onSelect(element.id)}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                selectedIds.includes(element.id)
                  ? 'bg-morandi-gold/10 border border-morandi-gold'
                  : 'hover:bg-morandi-container/50 border border-transparent'
              )}
            >
              <GripVertical size={14} className="text-morandi-secondary cursor-move" />

              {/* 圖標 */}
              <div className="w-6 h-6 rounded bg-morandi-container flex items-center justify-center flex-shrink-0">
                {getElementIcon(element.type)}
              </div>

              {/* 名稱 */}
              <span className="flex-1 text-sm truncate">
                {element.name || getElementTypeName(element.type)}
              </span>

              {/* 操作按鈕 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleVisibility(element.id)
                }}
                className="p-1 hover:bg-morandi-container rounded"
              >
                {element.visible ? (
                  <Eye size={14} className="text-morandi-secondary" />
                ) : (
                  <EyeOff size={14} className="text-morandi-secondary" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleLock(element.id)
                }}
                className="p-1 hover:bg-morandi-container rounded"
              >
                {element.locked ? (
                  <Lock size={14} className="text-morandi-gold" />
                ) : (
                  <Unlock size={14} className="text-morandi-secondary" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function getElementIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    text: <span className="text-[10px] font-bold">T</span>,
    image: <Image size={12} />,
    shape: <div className="w-3 h-3 bg-morandi-secondary rounded-md" />,
    'attraction-card': <MapPin size={12} />,
    sticker: <Sticker size={12} />,
  }
  return icons[type] || <div className="w-3 h-3 bg-morandi-secondary rounded" />
}

function getElementTypeName(type: string): string {
  const names: Record<string, string> = {
    text: '文字',
    image: '圖片',
    shape: '形狀',
    'attraction-card': '景點卡片',
    'flight-info': '航班資訊',
    accommodation: '住宿資訊',
    'day-header': '日期標題',
    sticker: '貼紙',
  }
  return names[type] || type
}
