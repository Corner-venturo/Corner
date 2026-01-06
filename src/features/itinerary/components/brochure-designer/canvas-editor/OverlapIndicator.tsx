'use client'

/**
 * Overlap Indicator Component
 * 元素重疊提示組件 - 當元素重疊時顯示紅色警告
 */

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import type { OverlapInfo, CanvasElement } from './types'
import { cn } from '@/lib/utils'

interface OverlapIndicatorProps {
  overlaps: OverlapInfo[]
  elements: CanvasElement[]
}

export function OverlapIndicator({ overlaps, elements }: OverlapIndicatorProps) {
  if (overlaps.length === 0) return null

  // 找出所有重疊的元素 ID
  const overlappingIds = new Set<string>()
  overlaps.forEach((overlap) => {
    overlappingIds.add(overlap.element1Id)
    overlappingIds.add(overlap.element2Id)
  })

  // 找出重疊元素的位置
  const overlappingElements = elements.filter((el) => overlappingIds.has(el.id))

  // 計算重疊區域的邊界
  const getBoundingBox = () => {
    if (overlappingElements.length === 0) return null

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    overlappingElements.forEach((el) => {
      minX = Math.min(minX, el.x)
      minY = Math.min(minY, el.y)
      maxX = Math.max(maxX, el.x + el.width)
      maxY = Math.max(maxY, el.y + el.height)
    })

    return { minX, minY, maxX, maxY }
  }

  const bbox = getBoundingBox()

  return (
    <>
      {/* 為每個重疊元素添加紅色邊框 */}
      {overlappingElements.map((el) => (
        <div
          key={`overlap-${el.id}`}
          className="absolute pointer-events-none z-40"
          style={{
            left: el.x - 2,
            top: el.y - 2,
            width: el.width + 4,
            height: el.height + 4,
            border: '2px solid #ef4444',
            borderRadius: 4,
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
          }}
        />
      ))}

      {/* 重疊區域高亮 */}
      {overlaps.map((overlap, index) => {
        const el1 = elements.find((e) => e.id === overlap.element1Id)
        const el2 = elements.find((e) => e.id === overlap.element2Id)

        if (!el1 || !el2) return null

        // 計算重疊區域
        const overlapLeft = Math.max(el1.x, el2.x)
        const overlapTop = Math.max(el1.y, el2.y)
        const overlapRight = Math.min(el1.x + el1.width, el2.x + el2.width)
        const overlapBottom = Math.min(el1.y + el1.height, el2.y + el2.height)

        if (overlapLeft >= overlapRight || overlapTop >= overlapBottom) return null

        return (
          <div
            key={`overlap-area-${index}`}
            className="absolute pointer-events-none z-30"
            style={{
              left: overlapLeft,
              top: overlapTop,
              width: overlapRight - overlapLeft,
              height: overlapBottom - overlapTop,
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px dashed #ef4444',
            }}
          />
        )
      })}

      {/* 警告提示 */}
      {bbox && (
        <div
          className={cn(
            'absolute z-50 flex items-center gap-1.5 px-2 py-1',
            'bg-red-500 text-white text-xs font-medium rounded-full shadow-lg',
            'animate-pulse'
          )}
          style={{
            left: bbox.maxX + 8,
            top: bbox.minY,
          }}
        >
          <AlertTriangle size={12} />
          <span>
            {overlaps.length} 個重疊
          </span>
        </div>
      )}

      {/* 底部重疊詳情 */}
      {overlaps.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 z-50">
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 shadow-sm">
            <div className="flex items-center gap-2 text-red-600 text-xs font-medium mb-1">
              <AlertTriangle size={14} />
              元素重疊警告
            </div>
            <div className="text-red-500 text-[10px] space-y-0.5">
              {overlaps.slice(0, 3).map((overlap, i) => {
                const el1 = elements.find((e) => e.id === overlap.element1Id)
                const el2 = elements.find((e) => e.id === overlap.element2Id)
                return (
                  <div key={i}>
                    「{el1?.name || '元素'}」與「{el2?.name || '元素'}」重疊 {Math.round(overlap.overlapPercent)}%
                  </div>
                )
              })}
              {overlaps.length > 3 && (
                <div className="text-red-400">...還有 {overlaps.length - 3} 個重疊</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
