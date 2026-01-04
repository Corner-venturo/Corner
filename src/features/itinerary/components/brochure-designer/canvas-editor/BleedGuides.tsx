'use client'

/**
 * Bleed & Safety Margin Guides
 * 出血線和安全邊距參考線組件
 *
 * A5 尺寸: 148mm x 210mm (559px x 794px @ 96dpi)
 * 出血 (Bleed): 3mm = 約 11px
 * 安全邊距 (Safety): 5mm = 約 19px
 */

import React from 'react'

interface BleedGuidesProps {
  width?: number   // 畫布寬度 (px)，預設 A5_WIDTH
  height?: number  // 畫布高度 (px)，預設 A5_HEIGHT
  bleedMargin?: number    // 出血邊距 (px)
  safetyMargin?: number   // 安全邊距 (px)
  showBleed?: boolean
  showSafety?: boolean
  showCenter?: boolean
  zoom?: number
}

// A5 尺寸常數
const A5_WIDTH = 559
const A5_HEIGHT = 794
const BLEED_MARGIN = 11  // 3mm ≈ 11px
const SAFETY_MARGIN = 19 // 5mm ≈ 19px

export function BleedGuides({
  width = A5_WIDTH,
  height = A5_HEIGHT,
  bleedMargin = BLEED_MARGIN,
  safetyMargin = SAFETY_MARGIN,
  showBleed = true,
  showSafety = true,
  showCenter = true,
  zoom = 1,
}: BleedGuidesProps) {
  const scaledWidth = width * zoom
  const scaledHeight = height * zoom
  const scaledBleed = bleedMargin * zoom
  const scaledSafety = safetyMargin * zoom

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
      {/* 出血線（紅色虛線） - 在頁面外圍 */}
      {showBleed && (
        <div
          className="absolute"
          style={{
            left: -scaledBleed,
            top: -scaledBleed,
            width: scaledWidth + scaledBleed * 2,
            height: scaledHeight + scaledBleed * 2,
            border: '1px dashed #ef4444',
            pointerEvents: 'none',
          }}
        >
          {/* 出血標籤 */}
          <span
            className="absolute text-[9px] text-red-500 bg-white/80 px-1 rounded"
            style={{
              top: -16,
              left: 0,
              transform: `scale(${1 / zoom})`,
              transformOrigin: 'bottom left',
            }}
          >
            出血線 (3mm)
          </span>
        </div>
      )}

      {/* 安全邊距線（綠色虛線） - 在頁面內部 */}
      {showSafety && (
        <div
          className="absolute"
          style={{
            left: scaledSafety,
            top: scaledSafety,
            width: scaledWidth - scaledSafety * 2,
            height: scaledHeight - scaledSafety * 2,
            border: '1px dashed #22c55e',
            pointerEvents: 'none',
          }}
        >
          {/* 安全邊距標籤 */}
          <span
            className="absolute text-[9px] text-green-600 bg-white/80 px-1 rounded"
            style={{
              bottom: -16,
              right: 0,
              transform: `scale(${1 / zoom})`,
              transformOrigin: 'top right',
            }}
          >
            安全區 (5mm)
          </span>
        </div>
      )}

      {/* 中心線（金色虛線） */}
      {showCenter && (
        <>
          {/* 水平中線 */}
          <div
            className="absolute w-full"
            style={{
              top: scaledHeight / 2,
              left: 0,
              height: 0,
              borderTop: '1px dashed #c9aa7c',
              opacity: 0.6,
            }}
          />
          {/* 垂直中線 */}
          <div
            className="absolute h-full"
            style={{
              left: scaledWidth / 2,
              top: 0,
              width: 0,
              borderLeft: '1px dashed #c9aa7c',
              opacity: 0.6,
            }}
          />
          {/* 中心點 */}
          <div
            className="absolute w-2 h-2 bg-morandi-gold rounded-full"
            style={{
              left: scaledWidth / 2 - 4,
              top: scaledHeight / 2 - 4,
              opacity: 0.6,
            }}
          />
        </>
      )}

      {/* 角落標記 - 出血裁切標記 */}
      {showBleed && (
        <>
          {/* 左上角 */}
          <svg
            className="absolute"
            style={{ left: -scaledBleed - 8, top: -scaledBleed - 8 }}
            width={16}
            height={16}
            viewBox="0 0 16 16"
          >
            <path d="M0 8 L8 8 M8 0 L8 8" stroke="#ef4444" strokeWidth={0.5} fill="none" />
          </svg>
          {/* 右上角 */}
          <svg
            className="absolute"
            style={{ right: -scaledBleed - 8, top: -scaledBleed - 8 }}
            width={16}
            height={16}
            viewBox="0 0 16 16"
          >
            <path d="M8 8 L16 8 M8 0 L8 8" stroke="#ef4444" strokeWidth={0.5} fill="none" />
          </svg>
          {/* 左下角 */}
          <svg
            className="absolute"
            style={{ left: -scaledBleed - 8, bottom: -scaledBleed - 8 }}
            width={16}
            height={16}
            viewBox="0 0 16 16"
          >
            <path d="M0 8 L8 8 M8 8 L8 16" stroke="#ef4444" strokeWidth={0.5} fill="none" />
          </svg>
          {/* 右下角 */}
          <svg
            className="absolute"
            style={{ right: -scaledBleed - 8, bottom: -scaledBleed - 8 }}
            width={16}
            height={16}
            viewBox="0 0 16 16"
          >
            <path d="M8 8 L16 8 M8 8 L8 16" stroke="#ef4444" strokeWidth={0.5} fill="none" />
          </svg>
        </>
      )}
    </div>
  )
}

// 參考線控制面板
interface GuideControlsProps {
  showBleed: boolean
  showSafety: boolean
  showCenter: boolean
  onToggleBleed: () => void
  onToggleSafety: () => void
  onToggleCenter: () => void
}

export function GuideControls({
  showBleed,
  showSafety,
  showCenter,
  onToggleBleed,
  onToggleSafety,
  onToggleCenter,
}: GuideControlsProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        onClick={onToggleBleed}
        className={`flex items-center gap-1 px-2 py-1 rounded ${
          showBleed ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
        }`}
      >
        <span className="w-2 h-0.5 border-t border-dashed border-current" />
        出血線
      </button>
      <button
        onClick={onToggleSafety}
        className={`flex items-center gap-1 px-2 py-1 rounded ${
          showSafety ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
        }`}
      >
        <span className="w-2 h-0.5 border-t border-dashed border-current" />
        安全區
      </button>
      <button
        onClick={onToggleCenter}
        className={`flex items-center gap-1 px-2 py-1 rounded ${
          showCenter ? 'bg-morandi-gold/20 text-morandi-gold' : 'bg-gray-100 text-gray-500'
        }`}
      >
        <span className="w-2 h-0.5 border-t border-dashed border-current" />
        中線
      </button>
    </div>
  )
}

export { A5_WIDTH, A5_HEIGHT, BLEED_MARGIN, SAFETY_MARGIN }
