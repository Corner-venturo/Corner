'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface DesignerSidebarProps {
  children: React.ReactNode
  className?: string
  /** 側邊欄位置 */
  position?: 'left' | 'right'
  /** 側邊欄標題 */
  title?: string
}

/**
 * 設計器側邊欄容器
 * 用於包裝 CollapsiblePanel 群組，提供統一的樣式和滾動行為
 */
export function DesignerSidebar({
  children,
  className,
  position = 'left',
  title,
}: DesignerSidebarProps) {
  return (
    <aside
      className={cn(
        'flex-none overflow-y-auto bg-background flex flex-col',
        position === 'left' ? 'border-r border-border' : 'border-l border-border',
        position === 'left' ? 'w-[320px]' : 'w-[280px]',
        className
      )}
    >
      {/* 可選標題區 */}
      {title && (
        <div className="px-4 py-3 border-b border-border/50 bg-morandi-container/10 flex-shrink-0">
          <h2 className="text-sm font-semibold text-morandi-primary">{title}</h2>
        </div>
      )}

      {/* 面板內容區 - 可滾動 */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </aside>
  )
}

/**
 * 側邊欄區段分隔線
 */
export function SidebarDivider({ className }: { className?: string }) {
  return (
    <div className={cn('h-px bg-border/50 my-1', className)} />
  )
}

/**
 * 側邊欄區段標題（用於在 CollapsiblePanel 之外顯示分類標題）
 */
interface SidebarSectionTitleProps {
  children: React.ReactNode
  className?: string
}

export function SidebarSectionTitle({ children, className }: SidebarSectionTitleProps) {
  return (
    <div className={cn('px-3 py-2 text-[10px] uppercase tracking-wider text-morandi-muted font-semibold', className)}>
      {children}
    </div>
  )
}
