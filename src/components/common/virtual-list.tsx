/**
 * VENTURO 5.0 - 虛擬列表組件
 *
 * 核心概念：只渲染可視區域的項目
 * 100 筆資料 → 只渲染 8-10 個 DOM 節點
 *
 * 效能提升：
 * - 減少 DOM 節點數量 90%+
 * - 減少記憶體使用
 * - 提升滾動流暢度
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface VirtualListProps<T> {
  /** 資料陣列 */
  items: T[]
  /** 每個項目的高度（px） */
  itemHeight: number
  /** 可視區域高度（px） */
  height: number
  /** 渲染項目的函數 */
  renderItem: (item: T, index: number) => React.ReactNode
  /** 額外渲染的緩衝項目數量（上下各加幾個） */
  overscan?: number
  /** 自訂 className */
  className?: string
  /** 載入更多的回調（無限滾動） */
  onLoadMore?: () => void
  /** 是否正在載入 */
  isLoading?: boolean
  /** 載入指示器 */
  loadingIndicator?: React.ReactNode
}

export function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  overscan = 3,
  className,
  onLoadMore,
  isLoading = false,
  loadingIndicator,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 計算可視範圍
  const totalHeight = items.length * itemHeight
  const visibleCount = Math.ceil(height / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2)

  // 可見項目
  const visibleItems = items.slice(startIndex, endIndex + 1)

  // 處理滾動
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      setScrollTop(target.scrollTop)

      // 檢查是否接近底部（觸發載入更多）
      if (onLoadMore && !isLoading) {
        const bottomDistance = target.scrollHeight - target.scrollTop - target.clientHeight
        if (bottomDistance < itemHeight * 5) {
          onLoadMore()
        }
      }
    },
    [onLoadMore, isLoading, itemHeight]
  )

  // 自動滾動到頂部（當資料變化時）
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
      setScrollTop(0)
    }
  }, [items.length])

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      {/* 總高度佔位符 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 渲染可見項目 */}
        {visibleItems.map((item, i) => {
          const index = startIndex + i
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: index * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
            >
              {renderItem(item, index)}
            </div>
          )
        })}

        {/* 載入指示器 */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: items.length * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
            className="flex items-center justify-center"
          >
            {loadingIndicator || (
              <div className="flex items-center gap-2 text-morandi-muted">
                <div className="w-4 h-4 border-2 border-morandi-gold border-t-transparent rounded-full animate-spin" />
                <span>載入中...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 虛擬網格組件（二維虛擬化）
 */
interface VirtualGridProps<T> extends Omit<VirtualListProps<T>, 'itemHeight'> {
  /** 每個項目的寬度（px） */
  itemWidth: number
  /** 每個項目的高度（px） */
  itemHeight: number
  /** 每列顯示幾個 */
  columns: number
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  columns,
  height,
  renderItem,
  overscan = 3,
  className,
  onLoadMore,
  isLoading = false,
  loadingIndicator,
}: VirtualGridProps<T>) {
  // 將一維陣列轉換為二維陣列（每列 columns 個）
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns))
  }

  return (
    <VirtualList
      items={rows}
      itemHeight={itemHeight}
      height={height}
      overscan={overscan}
      className={className}
      onLoadMore={onLoadMore}
      isLoading={isLoading}
      loadingIndicator={loadingIndicator}
      renderItem={(row, rowIndex) => (
        <div className="flex gap-4">
          {row.map((item, colIndex) => {
            const index = rowIndex * columns + colIndex
            return (
              <div key={index} style={{ width: itemWidth }}>
                {renderItem(item, index)}
              </div>
            )
          })}
        </div>
      )}
    />
  )
}
