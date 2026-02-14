'use client'

/**
 * TreeView - 樹狀資料夾展開元件
 * 
 * 特點：
 * - 點擊展開/收合（不是點進去）
 * - 可以同時看到多個資料夾內容
 * - 支援拖曳移動
 * - 統一用於 Tour 檔案和資料管理
 */

import React, { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, Folder, File, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TreeItem {
  id: string
  name: string
  type: 'folder' | 'file'
  icon?: string | React.ReactNode
  children?: TreeItem[]
  childCount?: number
  // 載入子項目的回調（懶加載）
  onLoadChildren?: () => Promise<TreeItem[]>
  // 額外資料
  data?: Record<string, unknown>
}

interface TreeNodeProps {
  item: TreeItem
  level: number
  expanded: Set<string>
  selected: string | null
  onToggle: (id: string) => void
  onSelect: (item: TreeItem) => void
  onDoubleClick?: (item: TreeItem) => void
  onDragStart?: (e: React.DragEvent, item: TreeItem) => void
  onDrop?: (e: React.DragEvent, target: TreeItem) => void
  loadingIds: Set<string>
}

function TreeNode({
  item,
  level,
  expanded,
  selected,
  onToggle,
  onSelect,
  onDoubleClick,
  onDragStart,
  onDrop,
  loadingIds,
}: TreeNodeProps) {
  const isExpanded = expanded.has(item.id)
  const isSelected = selected === item.id
  const isLoading = loadingIds.has(item.id)
  const hasChildren = item.type === 'folder' && (item.children?.length || item.childCount || item.onLoadChildren)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(item)
    if (item.type === 'folder') {
      onToggle(item.id)
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDoubleClick?.(item)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (item.type === 'folder') {
      e.preventDefault()
      e.currentTarget.classList.add('bg-morandi-gold/10')
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-morandi-gold/10')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-morandi-gold/10')
    onDrop?.(e, item)
  }

  // 渲染圖示
  const renderIcon = () => {
    if (typeof item.icon === 'string') {
      return <span className="text-lg">{item.icon}</span>
    }
    if (React.isValidElement(item.icon)) {
      return item.icon
    }
    if (item.type === 'folder') {
      return <Folder size={18} className="text-morandi-gold" fill="currentColor" strokeWidth={1} />
    }
    return <File size={18} className="text-morandi-secondary" strokeWidth={1.5} />
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer select-none',
          'hover:bg-morandi-container/50 transition-colors',
          isSelected && 'bg-morandi-gold/10'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        draggable={!!onDragStart}
        onDragStart={(e) => onDragStart?.(e, item)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 拖曳把手 */}
        {onDragStart && (
          <GripVertical size={14} className="text-morandi-muted opacity-0 group-hover:opacity-100 cursor-grab" />
        )}
        
        {/* 展開/收合箭頭 */}
        <div className="w-4 h-4 flex items-center justify-center">
          {hasChildren ? (
            isLoading ? (
              <div className="w-3 h-3 border border-morandi-muted border-t-transparent rounded-full animate-spin" />
            ) : isExpanded ? (
              <ChevronDown size={14} className="text-morandi-muted" />
            ) : (
              <ChevronRight size={14} className="text-morandi-muted" />
            )
          ) : null}
        </div>

        {/* 圖示 */}
        <div className="w-5 h-5 flex items-center justify-center">
          {renderIcon()}
        </div>

        {/* 名稱 */}
        <span className={cn('flex-1 truncate text-sm', isSelected && 'font-medium')}>
          {item.name}
        </span>

        {/* 子項目數量 */}
        {item.type === 'folder' && item.childCount !== undefined && (
          <span className="text-xs text-morandi-muted">
            {item.childCount}
          </span>
        )}
      </div>

      {/* 子項目 */}
      {isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              level={level + 1}
              expanded={expanded}
              selected={selected}
              onToggle={onToggle}
              onSelect={onSelect}
              onDoubleClick={onDoubleClick}
              onDragStart={onDragStart}
              onDrop={onDrop}
              loadingIds={loadingIds}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface TreeViewProps {
  items: TreeItem[]
  className?: string
  onSelect?: (item: TreeItem) => void
  onDoubleClick?: (item: TreeItem) => void
  onMove?: (sourceId: string, targetId: string) => void
  /** 載入子項目的回調 */
  onLoadChildren?: (item: TreeItem) => Promise<TreeItem[]>
  /** 預設展開的資料夾 ID */
  defaultExpanded?: string[]
  /** 是否允許拖曳 */
  draggable?: boolean
}

export function TreeView({
  items,
  className,
  onSelect,
  onDoubleClick,
  onMove,
  onLoadChildren,
  defaultExpanded = [],
  draggable = false,
}: TreeViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(defaultExpanded))
  const [selected, setSelected] = useState<string | null>(null)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [dragSource, setDragSource] = useState<TreeItem | null>(null)

  // 更新 items 的 children（用於懶加載）
  const [itemsWithChildren, setItemsWithChildren] = useState<Map<string, TreeItem[]>>(new Map())

  const handleToggle = useCallback(async (id: string) => {
    const newExpanded = new Set(expanded)
    
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
      
      // 懶加載子項目
      const item = findItem(items, id)
      if (item && item.onLoadChildren && !item.children?.length) {
        setLoadingIds(prev => new Set(prev).add(id))
        try {
          const children = await item.onLoadChildren()
          setItemsWithChildren(prev => new Map(prev).set(id, children))
        } finally {
          setLoadingIds(prev => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
        }
      } else if (item && onLoadChildren && !item.children?.length) {
        setLoadingIds(prev => new Set(prev).add(id))
        try {
          const children = await onLoadChildren(item)
          setItemsWithChildren(prev => new Map(prev).set(id, children))
        } finally {
          setLoadingIds(prev => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
        }
      }
    }
    
    setExpanded(newExpanded)
  }, [expanded, items, onLoadChildren])

  const handleSelect = useCallback((item: TreeItem) => {
    setSelected(item.id)
    onSelect?.(item)
  }, [onSelect])

  const handleDragStart = useCallback((e: React.DragEvent, item: TreeItem) => {
    setDragSource(item)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, target: TreeItem) => {
    if (dragSource && target.type === 'folder' && dragSource.id !== target.id) {
      onMove?.(dragSource.id, target.id)
    }
    setDragSource(null)
  }, [dragSource, onMove])

  // 合併 items 和懶加載的 children
  const mergedItems = items.map(item => ({
    ...item,
    children: itemsWithChildren.get(item.id) || item.children,
  }))

  return (
    <div className={cn('py-2', className)}>
      {mergedItems.map((item) => (
        <TreeNode
          key={item.id}
          item={item}
          level={0}
          expanded={expanded}
          selected={selected}
          onToggle={handleToggle}
          onSelect={handleSelect}
          onDoubleClick={onDoubleClick}
          onDragStart={draggable ? handleDragStart : undefined}
          onDrop={draggable ? handleDrop : undefined}
          loadingIds={loadingIds}
        />
      ))}
    </div>
  )
}

// 輔助函數：在樹中找到項目
function findItem(items: TreeItem[], id: string): TreeItem | null {
  for (const item of items) {
    if (item.id === id) return item
    if (item.children) {
      const found = findItem(item.children, id)
      if (found) return found
    }
  }
  return null
}

export type { TreeViewProps }
