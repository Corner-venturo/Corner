'use client'

/**
 * Document Renderer
 * 統一文件渲染引擎 - 確保預覽和編輯模式的一致性
 *
 * 核心原則：
 * 1. Single Source of Truth - 所有渲染都基於 PageSchema
 * 2. WYSIWYG - 預覽和編輯使用相同的渲染邏輯
 * 3. 雙向同步 - Canvas 變更同步回 Schema
 */

import React, { useCallback, useMemo } from 'react'
import type { PageSchema, BrochureSettings } from '../schema/types'
import type { CanvasElement } from '../canvas-editor/types'
import { ElementsRenderer } from './ElementRenderers'

// ============================================================================
// 類型定義
// ============================================================================

interface PageRendererProps {
  /** 頁面 Schema */
  page: PageSchema

  /** 頁面設定 */
  settings?: BrochureSettings

  /** 縮放比例 */
  scale?: number

  /** 是否顯示出血區域 */
  showBleed?: boolean

  /** 選中的元素 ID */
  selectedElementId?: string

  /** 元素點擊事件 */
  onElementClick?: (element: CanvasElement) => void

  /** 額外的 className */
  className?: string

  /** 是否為編輯模式（顯示選擇框等） */
  isEditMode?: boolean
}

// ============================================================================
// 預設設定
// ============================================================================

const DEFAULT_SETTINGS: BrochureSettings = {
  pageSize: { width: 559, height: 794 },
  bleed: { top: 3, right: 3, bottom: 3, left: 3 },
  theme: {
    primaryColor: '#0d9488',
    accentColor: '#f97316',
    fontFamily: 'Noto Sans TC',
  },
}

// ============================================================================
// 頁面渲染器
// ============================================================================

export const PageRenderer: React.FC<PageRendererProps> = ({
  page,
  settings = DEFAULT_SETTINGS,
  scale = 1,
  showBleed = false,
  selectedElementId,
  onElementClick,
  className = '',
  isEditMode = false,
}) => {
  const { pageSize, bleed } = settings

  // 計算實際尺寸
  const totalWidth = showBleed
    ? pageSize.width + bleed.left + bleed.right
    : pageSize.width

  const totalHeight = showBleed
    ? pageSize.height + bleed.top + bleed.bottom
    : pageSize.height

  // 容器樣式
  const containerStyle: React.CSSProperties = useMemo(() => ({
    position: 'relative',
    width: totalWidth * scale,
    height: totalHeight * scale,
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
  }), [totalWidth, totalHeight, scale])

  // 內容區域樣式（考慮出血區域偏移）
  const contentStyle: React.CSSProperties = useMemo(() => ({
    position: 'absolute',
    left: showBleed ? bleed.left : 0,
    top: showBleed ? bleed.top : 0,
    width: pageSize.width,
    height: pageSize.height,
    overflow: 'hidden',
  }), [showBleed, bleed, pageSize])

  // 出血區域指示器
  const bleedIndicator = showBleed && (
    <>
      {/* 上 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: bleed.top,
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          borderBottom: '1px dashed rgba(255, 0, 0, 0.3)',
        }}
      />
      {/* 下 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: bleed.bottom,
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          borderTop: '1px dashed rgba(255, 0, 0, 0.3)',
        }}
      />
      {/* 左 */}
      <div
        style={{
          position: 'absolute',
          top: bleed.top,
          left: 0,
          width: bleed.left,
          height: pageSize.height,
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          borderRight: '1px dashed rgba(255, 0, 0, 0.3)',
        }}
      />
      {/* 右 */}
      <div
        style={{
          position: 'absolute',
          top: bleed.top,
          right: 0,
          width: bleed.right,
          height: pageSize.height,
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          borderLeft: '1px dashed rgba(255, 0, 0, 0.3)',
        }}
      />
    </>
  )

  return (
    <div
      className={className}
      style={containerStyle}
      data-page-id={page.id}
      data-page-type={page.type}
    >
      {bleedIndicator}
      <div style={contentStyle}>
        <ElementsRenderer
          elements={page.elements}
          selectedElementId={isEditMode ? selectedElementId : undefined}
          onElementClick={isEditMode ? onElementClick : undefined}
        />
      </div>
    </div>
  )
}

// ============================================================================
// 多頁面渲染器（用於預覽列表）
// ============================================================================

interface PagesPreviewProps {
  /** 頁面列表 */
  pages: PageSchema[]

  /** 頁面設定 */
  settings?: BrochureSettings

  /** 縮放比例 */
  scale?: number

  /** 當前選中的頁面 ID */
  currentPageId?: string

  /** 頁面點擊事件 */
  onPageClick?: (pageId: string) => void

  /** 頁面間距 */
  gap?: number

  /** 排列方向 */
  direction?: 'horizontal' | 'vertical'
}

export const PagesPreview: React.FC<PagesPreviewProps> = ({
  pages,
  settings = DEFAULT_SETTINGS,
  scale = 0.2,
  currentPageId,
  onPageClick,
  gap = 16,
  direction = 'vertical',
}) => {
  const containerStyle: React.CSSProperties = useMemo(() => ({
    display: 'flex',
    flexDirection: direction === 'horizontal' ? 'row' : 'column',
    gap,
    padding: gap,
  }), [direction, gap])

  return (
    <div style={containerStyle}>
      {pages.map((page, index) => (
        <div
          key={page.id}
          onClick={() => onPageClick?.(page.id)}
          style={{
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            transform: page.id === currentPageId ? 'scale(1.02)' : 'scale(1)',
            boxShadow: page.id === currentPageId
              ? '0 0 0 3px #0d9488, 0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              : undefined,
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <PageRenderer
            page={page}
            settings={settings}
            scale={scale}
          />
          <div
            style={{
              padding: '4px 8px',
              backgroundColor: page.id === currentPageId ? '#0d9488' : '#f1f5f9',
              color: page.id === currentPageId ? '#ffffff' : '#64748b',
              fontSize: 10,
              textAlign: 'center',
              transition: 'background-color 0.2s, color 0.2s',
            }}
          >
            {index + 1}. {page.name}
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// 雙頁預覽器（用於左右對開預覽）
// ============================================================================

interface SpreadPreviewProps {
  /** 左頁 */
  leftPage?: PageSchema | null

  /** 右頁 */
  rightPage?: PageSchema | null

  /** 頁面設定 */
  settings?: BrochureSettings

  /** 縮放比例 */
  scale?: number

  /** 間距 */
  gap?: number
}

export const SpreadPreview: React.FC<SpreadPreviewProps> = ({
  leftPage,
  rightPage,
  settings = DEFAULT_SETTINGS,
  scale = 0.5,
  gap = 2,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap,
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      {leftPage ? (
        <PageRenderer page={leftPage} settings={settings} scale={scale} />
      ) : (
        <div
          style={{
            width: settings.pageSize.width * scale,
            height: settings.pageSize.height * scale,
            backgroundColor: '#f8fafc',
            border: '1px dashed #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            fontSize: 12,
          }}
        >
          無左頁
        </div>
      )}
      {rightPage ? (
        <PageRenderer page={rightPage} settings={settings} scale={scale} />
      ) : (
        <div
          style={{
            width: settings.pageSize.width * scale,
            height: settings.pageSize.height * scale,
            backgroundColor: '#f8fafc',
            border: '1px dashed #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            fontSize: 12,
          }}
        >
          無右頁
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 匯出
// ============================================================================

export { ElementsRenderer, ElementRenderer } from './ElementRenderers'
