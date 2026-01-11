'use client'

import React, { useState, useCallback } from 'react'
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsiblePanelProps {
  title: string
  icon?: LucideIcon
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
  /** 是否在右側顯示徽章（例如項目數量） */
  badge?: number | string
  /** 控制展開狀態（受控模式） */
  isOpen?: boolean
  /** 展開狀態變更回調 */
  onOpenChange?: (isOpen: boolean) => void
  /** 展開時的最大高度，預設無限制 */
  maxHeight?: number
}

export function CollapsiblePanel({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
  className,
  badge,
  isOpen: controlledIsOpen,
  onOpenChange,
  maxHeight,
}: CollapsiblePanelProps) {
  // 支援受控與非受控模式
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen)
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen

  const handleToggle = useCallback(() => {
    const newState = !isOpen
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(newState)
    }
    onOpenChange?.(newState)
  }, [isOpen, controlledIsOpen, onOpenChange])

  return (
    <div className={cn(
      'border-b border-border/40',
      className
    )}>
      {/* Header - 可點擊展開/收合 */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors',
          'hover:bg-morandi-container/20'
        )}
      >
        {/* 展開/收合箭頭 */}
        <span className={cn(
          'transition-transform duration-200 flex-shrink-0',
          isOpen ? 'text-morandi-gold' : 'text-morandi-secondary'
        )}>
          {isOpen ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </span>

        {/* 圖標 */}
        {Icon && (
          <Icon size={14} className={cn(
            'flex-shrink-0 transition-colors',
            isOpen ? 'text-morandi-gold' : 'text-morandi-secondary'
          )} />
        )}

        {/* 標題 */}
        <span className={cn(
          'flex-1 text-xs font-medium truncate transition-colors',
          isOpen ? 'text-morandi-primary' : 'text-morandi-secondary'
        )}>
          {title}
        </span>

        {/* 徽章 */}
        {badge !== undefined && (
          <span className={cn(
            'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
            isOpen
              ? 'bg-morandi-gold/20 text-morandi-gold'
              : 'bg-morandi-container/50 text-morandi-secondary'
          )}>
            {badge}
          </span>
        )}
      </button>

      {/* Content - 展開時顯示全部內容 */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
        style={maxHeight ? { maxHeight: isOpen ? maxHeight : 0 } : undefined}
      >
        <div className="px-3 pb-3">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * 面板群組容器 - 用於管理多個 CollapsiblePanel
 */
interface CollapsiblePanelGroupProps {
  children: React.ReactNode
  className?: string
}

export function CollapsiblePanelGroup({
  children,
  className,
}: CollapsiblePanelGroupProps) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}
