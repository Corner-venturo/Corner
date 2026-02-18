'use client'
/**
 * 區塊包裝器
 *
 * 為每個區塊提供標題、控制按鈕和收合功能
 */


import { useState, ReactNode } from 'react'
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Trash2,
  GripVertical,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AnyBlock, BlockType } from '../types'
import { BLOCK_CONFIGS, getBlockLabel, getBlockIcon } from '../types'

// 圖示映射（避免動態 import 類型問題）
import {
  Image,
  Plane,
  Star,
  MapPin,
  Users,
  Building,
  Calendar,
  DollarSign,
  Tag,
  HelpCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ElementType> = {
  Image,
  Plane,
  Star,
  MapPin,
  Users,
  Building,
  Calendar,
  DollarSign,
  Tag,
  HelpCircle,
  AlertCircle,
  XCircle,
}

interface BlockWrapperProps {
  block: AnyBlock
  isSelected?: boolean
  isFirst?: boolean
  isLast?: boolean
  onSelect?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onToggleVisibility?: () => void
  onRemove?: () => void
  children: ReactNode
}

export function BlockWrapper({
  block,
  isSelected = false,
  isFirst = false,
  isLast = false,
  onSelect,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  onRemove,
  children,
}: BlockWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(block.meta.collapsed ?? false)

  const config = BLOCK_CONFIGS[block.meta.type]
  const label = getBlockLabel(block.meta.type)
  const iconName = getBlockIcon(block.meta.type)
  const IconComponent = ICON_MAP[iconName]

  return (
    <div
      className={`
        border rounded-lg bg-card transition-all
        ${isSelected ? 'border-morandi-gold ring-1 ring-morandi-gold/20' : 'border-border'}
        ${!block.meta.visible ? 'opacity-60' : ''}
      `}
      onClick={onSelect}
    >
      {/* 區塊標題列 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-morandi-container/30">
        {/* 拖曳手柄 */}
        {config.canReorder && (
          <GripVertical
            size={14}
            className="text-morandi-secondary/50 cursor-grab active:cursor-grabbing"
          />
        )}

        {/* 圖示與標籤 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {IconComponent && <IconComponent size={14} className="text-morandi-gold shrink-0" />}
          <span className="text-sm font-medium text-morandi-primary truncate">{label}</span>
          {!block.meta.visible && (
            <span className="text-xs text-morandi-secondary">(隱藏)</span>
          )}
        </div>

        {/* 控制按鈕 */}
        <div className="flex items-center gap-0.5">
          {/* 上移 */}
          {config.canReorder && !isFirst && (
            <Button
              variant="ghost"
              size="icon" aria-label="Button"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                onMoveUp?.()
              }}
            >
              <ChevronUp size={14} />
            </Button>
          )}

          {/* 下移 */}
          {config.canReorder && !isLast && (
            <Button
              variant="ghost"
              size="icon" aria-label="Button"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                onMoveDown?.()
              }}
            >
              <ChevronDown size={14} />
            </Button>
          )}

          {/* 顯示/隱藏 */}
          <Button
            variant="ghost"
            size="icon" aria-label="Toggle menu"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              onToggleVisibility?.()
            }}
          >
            {block.meta.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </Button>

          {/* 刪除 */}
          {config.canRemove && (
            <Button
              variant="ghost"
              size="icon" aria-label="Delete"
              className="h-6 w-6 text-status-danger hover:text-status-danger hover:bg-status-danger-bg"
              onClick={(e) => {
                e.stopPropagation()
                onRemove?.()
              }}
            >
              <Trash2 size={14} />
            </Button>
          )}

          {/* 收合 */}
          <Button
            variant="ghost"
            size="icon" aria-label="Button"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              setIsCollapsed(!isCollapsed)
            }}
          >
            <ChevronRight
              size={14}
              className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
            />
          </Button>
        </div>
      </div>

      {/* 區塊內容 */}
      {!isCollapsed && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  )
}
