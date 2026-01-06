'use client'

/**
 * Smart Guides Component
 * 智慧參考線組件 - 顯示對齊輔助線
 */

import React from 'react'
import type { SnapGuide } from './types'

interface SmartGuidesProps {
  guides: SnapGuide[]
  canvasWidth: number
  canvasHeight: number
}

export function SmartGuides({ guides, canvasWidth, canvasHeight }: SmartGuidesProps) {
  // 根據類型決定顏色
  const getGuideColor = (type: SnapGuide['type']) => {
    switch (type) {
      case 'center':
        return '#c9aa7c' // morandi-gold
      case 'edge':
        return '#0ea5e9' // sky-500
      case 'spacing':
        return '#22c55e' // green-500
      default:
        return '#0ea5e9'
    }
  }

  // 去重：相同位置和方向的參考線只顯示一條
  const uniqueGuides = guides.reduce<SnapGuide[]>((acc, guide) => {
    const exists = acc.some(
      (g) => g.direction === guide.direction && Math.abs(g.position - guide.position) < 1
    )
    if (!exists) {
      acc.push(guide)
    }
    return acc
  }, [])

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-50"
      width={canvasWidth}
      height={canvasHeight}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* 虛線模式 */}
        <pattern
          id="dash-pattern-gold"
          patternUnits="userSpaceOnUse"
          width="8"
          height="1"
        >
          <rect width="4" height="1" fill="#c9aa7c" />
        </pattern>
        <pattern
          id="dash-pattern-blue"
          patternUnits="userSpaceOnUse"
          width="8"
          height="1"
        >
          <rect width="4" height="1" fill="#0ea5e9" />
        </pattern>
        <pattern
          id="dash-pattern-green"
          patternUnits="userSpaceOnUse"
          width="8"
          height="1"
        >
          <rect width="4" height="1" fill="#22c55e" />
        </pattern>
      </defs>

      {uniqueGuides.map((guide, index) => {
        const color = getGuideColor(guide.type)
        const key = `${guide.direction}-${guide.position}-${index}`

        if (guide.direction === 'vertical') {
          return (
            <g key={key}>
              {/* 主線 */}
              <line
                x1={guide.position}
                y1={-10}
                x2={guide.position}
                y2={canvasHeight + 10}
                stroke={color}
                strokeWidth={1}
                strokeDasharray={guide.type === 'center' ? '4 4' : '2 2'}
                opacity={0.8}
              />
              {/* 頂部端點 */}
              <circle
                cx={guide.position}
                cy={-5}
                r={3}
                fill={color}
              />
              {/* 底部端點 */}
              <circle
                cx={guide.position}
                cy={canvasHeight + 5}
                r={3}
                fill={color}
              />
            </g>
          )
        } else {
          return (
            <g key={key}>
              {/* 主線 */}
              <line
                x1={-10}
                y1={guide.position}
                x2={canvasWidth + 10}
                y2={guide.position}
                stroke={color}
                strokeWidth={1}
                strokeDasharray={guide.type === 'center' ? '4 4' : '2 2'}
                opacity={0.8}
              />
              {/* 左側端點 */}
              <circle
                cx={-5}
                cy={guide.position}
                r={3}
                fill={color}
              />
              {/* 右側端點 */}
              <circle
                cx={canvasWidth + 5}
                cy={guide.position}
                r={3}
                fill={color}
              />
            </g>
          )
        }
      })}

      {/* 交叉點高亮 */}
      {uniqueGuides
        .filter((g) => g.direction === 'vertical')
        .map((vGuide) =>
          uniqueGuides
            .filter((g) => g.direction === 'horizontal')
            .map((hGuide, i) => (
              <circle
                key={`cross-${vGuide.position}-${hGuide.position}-${i}`}
                cx={vGuide.position}
                cy={hGuide.position}
                r={4}
                fill="white"
                stroke="#c9aa7c"
                strokeWidth={2}
              />
            ))
        )}
    </svg>
  )
}
