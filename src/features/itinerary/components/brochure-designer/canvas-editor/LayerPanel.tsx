'use client'

/**
 * Layer Panel Component
 * 圖層管理面板 - 管理元素的層級、可見性、鎖定狀態
 */

import React, { useCallback } from 'react'
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Type,
  Image,
  Square,
  Circle,
  Sparkles,
  MapPin,
  Plane,
  Building2,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CanvasElement, ElementType } from './types'

interface LayerPanelProps {
  elements: CanvasElement[]
  selectedIds: string[]
  onSelect: (id: string) => void
  onMultiSelect: (ids: string[]) => void
  onToggleVisibility: (id: string) => void
  onToggleLock: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onBringForward: (id: string) => void
  onSendBackward: (id: string) => void
  onBringToFront: (id: string) => void
  onSendToBack: (id: string) => void
  onRename: (id: string, newName: string) => void
}

// 元素類型對應的圖標
const ELEMENT_ICONS: Record<ElementType, React.ComponentType<{ size?: number; className?: string }>> = {
  text: Type,
  image: Image,
  shape: Square,
  decoration: Sparkles,
  icon: Circle,
  'spot-card': MapPin,
  'itinerary-item': Calendar,
  'flight-info': Plane,
  'accommodation-card': Building2,
  'day-header': Calendar,
}

// 元素類型對應的顏色
const ELEMENT_COLORS: Record<ElementType, string> = {
  text: 'text-blue-500',
  image: 'text-green-500',
  shape: 'text-purple-500',
  decoration: 'text-pink-500',
  icon: 'text-orange-500',
  'spot-card': 'text-teal-500',
  'itinerary-item': 'text-cyan-500',
  'flight-info': 'text-sky-500',
  'accommodation-card': 'text-indigo-500',
  'day-header': 'text-amber-500',
}

export function LayerPanel({
  elements,
  selectedIds,
  onSelect,
  onMultiSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onDuplicate,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onRename,
}: LayerPanelProps) {
  // 按 zIndex 降序排列（最上層在最前面）
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex)

  const handleClick = useCallback((e: React.MouseEvent, id: string) => {
    if (e.shiftKey) {
      // Shift+點擊：多選
      if (selectedIds.includes(id)) {
        onMultiSelect(selectedIds.filter((i) => i !== id))
      } else {
        onMultiSelect([...selectedIds, id])
      }
    } else {
      // 單選
      onSelect(id)
    }
  }, [selectedIds, onSelect, onMultiSelect])

  const selectedElement = selectedIds.length === 1
    ? elements.find((el) => el.id === selectedIds[0])
    : null

  return (
    <div className="flex flex-col h-full bg-white border-l border-border">
      {/* 標題 */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Layers size={16} className="text-morandi-gold" />
        <h3 className="text-sm font-semibold text-morandi-primary">圖層</h3>
        <span className="ml-auto text-xs text-morandi-secondary">
          {elements.length} 個元素
        </span>
      </div>

      {/* 快速操作工具列 */}
      {selectedIds.length > 0 && (
        <div className="px-2 py-2 border-b border-border flex items-center gap-1 bg-slate-50">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => selectedElement && onBringToFront(selectedElement.id)}
            title="移到最上層"
            disabled={!selectedElement}
          >
            <ChevronsUp size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => selectedElement && onBringForward(selectedElement.id)}
            title="上移一層"
            disabled={!selectedElement}
          >
            <ChevronUp size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => selectedElement && onSendBackward(selectedElement.id)}
            title="下移一層"
            disabled={!selectedElement}
          >
            <ChevronDown size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => selectedElement && onSendToBack(selectedElement.id)}
            title="移到最下層"
            disabled={!selectedElement}
          >
            <ChevronsDown size={14} />
          </Button>

          <div className="w-px h-4 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => selectedElement && onDuplicate(selectedElement.id)}
            title="複製"
            disabled={!selectedElement}
          >
            <Copy size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => selectedElement && onDelete(selectedElement.id)}
            title="刪除"
            disabled={!selectedElement}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )}

      {/* 圖層列表 */}
      <div className="flex-1 overflow-y-auto">
        {sortedElements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-morandi-secondary">
            <Layers size={32} className="opacity-30 mb-2" />
            <p className="text-sm">尚無元素</p>
            <p className="text-xs opacity-70">從左側面板添加元素</p>
          </div>
        ) : (
          <div className="py-1">
            {sortedElements.map((element) => {
              const Icon = ELEMENT_ICONS[element.type] || Square
              const isSelected = selectedIds.includes(element.id)
              const colorClass = ELEMENT_COLORS[element.type] || 'text-slate-500'

              return (
                <div
                  key={element.id}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-morandi-gold/10 border-l-2 border-l-morandi-gold'
                      : 'hover:bg-slate-50 border-l-2 border-l-transparent',
                    !element.visible && 'opacity-50',
                    element.locked && 'bg-slate-100'
                  )}
                  onClick={(e) => handleClick(e, element.id)}
                >
                  {/* 類型圖標 */}
                  <div className={cn('flex-shrink-0', colorClass)}>
                    <Icon size={14} />
                  </div>

                  {/* 名稱 */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={element.name}
                      onChange={(e) => onRename(element.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        'w-full bg-transparent text-xs truncate',
                        'focus:outline-none focus:bg-white focus:px-1 focus:py-0.5 focus:rounded',
                        'border border-transparent focus:border-morandi-gold/30',
                        isSelected ? 'text-morandi-primary font-medium' : 'text-morandi-secondary'
                      )}
                    />
                  </div>

                  {/* 操作按鈕 */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className={cn(
                        'p-1 rounded hover:bg-slate-200 transition-colors',
                        !element.visible && 'text-morandi-secondary'
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleVisibility(element.id)
                      }}
                      title={element.visible ? '隱藏' : '顯示'}
                    >
                      {element.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button
                      className={cn(
                        'p-1 rounded hover:bg-slate-200 transition-colors',
                        element.locked && 'text-morandi-gold'
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleLock(element.id)
                      }}
                      title={element.locked ? '解鎖' : '鎖定'}
                    >
                      {element.locked ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 底部資訊 */}
      {selectedIds.length > 1 && (
        <div className="px-3 py-2 border-t border-border bg-slate-50">
          <p className="text-xs text-morandi-secondary">
            已選取 {selectedIds.length} 個元素
          </p>
        </div>
      )}
    </div>
  )
}
