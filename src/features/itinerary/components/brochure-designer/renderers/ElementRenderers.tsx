'use client'

/**
 * Element Renderers
 * 統一的元素渲染器，用於 DOM 預覽模式
 *
 * 設計原則：
 * 1. 每個元素類型對應一個渲染器
 * 2. 渲染器輸出純 React 組件（用於預覽）
 * 3. 樣式盡可能與 Canvas 渲染一致
 */

import React from 'react'
import Image from 'next/image'
import type {
  CanvasElement,
  TextElement,
  ImageElement,
  ShapeElement,
} from '../canvas-editor/types'

// ============================================================================
// 共用樣式工具
// ============================================================================

/** 取得基礎定位樣式 */
function getBaseStyles(element: CanvasElement): React.CSSProperties {
  return {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    opacity: element.opacity,
    pointerEvents: element.locked ? 'none' : 'auto',
    visibility: element.visible ? 'visible' : 'hidden',
  }
}

// ============================================================================
// 文字元素渲染器
// ============================================================================

interface TextRendererProps {
  element: TextElement
  onClick?: (element: TextElement) => void
  isSelected?: boolean
}

export const TextRenderer: React.FC<TextRendererProps> = ({
  element,
  onClick,
  isSelected,
}) => {
  const { style } = element

  const textStyles: React.CSSProperties = {
    ...getBaseStyles(element),
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    textAlign: style.textAlign,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    color: style.color,
    textDecoration: style.textDecoration,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflow: 'hidden',
    // 選中時的邊框
    outline: isSelected ? '2px solid #0d9488' : undefined,
    outlineOffset: isSelected ? 2 : undefined,
  }

  return (
    <div
      style={textStyles}
      onClick={() => onClick?.(element)}
      data-element-id={element.id}
      data-element-name={element.name}
      data-element-type="text"
    >
      {element.content}
    </div>
  )
}

// ============================================================================
// 圖片元素渲染器
// ============================================================================

interface ImageRendererProps {
  element: ImageElement
  onClick?: (element: ImageElement) => void
  isSelected?: boolean
}

export const ImageRenderer: React.FC<ImageRendererProps> = ({
  element,
  onClick,
  isSelected,
}) => {
  const containerStyles: React.CSSProperties = {
    ...getBaseStyles(element),
    overflow: 'hidden',
    borderRadius: 0,
    outline: isSelected ? '2px solid #0d9488' : undefined,
    outlineOffset: isSelected ? 2 : undefined,
  }

  // 處理不同的 objectFit 模式
  const objectFit = element.objectFit || 'cover'

  // 檢查是否為有效的圖片 URL
  const isValidSrc = element.src && (
    element.src.startsWith('http') ||
    element.src.startsWith('/') ||
    element.src.startsWith('data:')
  )

  return (
    <div
      style={containerStyles}
      onClick={() => onClick?.(element)}
      data-element-id={element.id}
      data-element-name={element.name}
      data-element-type="image"
    >
      {isValidSrc ? (
        <Image
          src={element.src}
          alt={element.name}
          fill
          style={{
            objectFit,
            filter: getImageFilters(element),
          }}
          unoptimized={element.src.startsWith('data:')}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            fontSize: 12,
          }}
        >
          無圖片
        </div>
      )}
    </div>
  )
}

/** 取得圖片濾鏡 CSS */
function getImageFilters(element: ImageElement): string {
  const { filters } = element
  if (!filters) return 'none'

  const filterParts: string[] = []

  if (filters.brightness !== 0) {
    filterParts.push(`brightness(${1 + filters.brightness / 100})`)
  }
  if (filters.contrast !== 0) {
    filterParts.push(`contrast(${1 + filters.contrast / 100})`)
  }
  if (filters.saturation !== 0) {
    filterParts.push(`saturate(${1 + filters.saturation / 100})`)
  }
  if (filters.blur > 0) {
    filterParts.push(`blur(${filters.blur}px)`)
  }

  return filterParts.length > 0 ? filterParts.join(' ') : 'none'
}

// ============================================================================
// 形狀元素渲染器
// ============================================================================

interface ShapeRendererProps {
  element: ShapeElement
  onClick?: (element: ShapeElement) => void
  isSelected?: boolean
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({
  element,
  onClick,
  isSelected,
}) => {
  const shapeStyles: React.CSSProperties = {
    ...getBaseStyles(element),
    backgroundColor: element.fill || 'transparent',
    border: element.strokeWidth > 0
      ? `${element.strokeWidth}px solid ${element.stroke || 'transparent'}`
      : undefined,
    borderRadius: element.cornerRadius || 0,
    // 處理漸層
    background: element.gradient
      ? getGradientCSS(element)
      : element.fill,
    outline: isSelected ? '2px solid #0d9488' : undefined,
    outlineOffset: isSelected ? 2 : undefined,
  }

  return (
    <div
      style={shapeStyles}
      onClick={() => onClick?.(element)}
      data-element-id={element.id}
      data-element-name={element.name}
      data-element-type="shape"
    />
  )
}

/** 取得漸層 CSS */
function getGradientCSS(element: ShapeElement): string {
  if (!element.gradient) return element.fill || 'transparent'

  const { type, angle = 180, colorStops } = element.gradient

  if (type === 'linear' && colorStops && colorStops.length >= 2) {
    const stops = colorStops
      .map(stop => `${stop.color} ${stop.offset * 100}%`)
      .join(', ')
    return `linear-gradient(${angle}deg, ${stops})`
  }

  return element.fill || 'transparent'
}

// ============================================================================
// 統一元素渲染器
// ============================================================================

interface ElementRendererProps {
  element: CanvasElement
  onClick?: (element: CanvasElement) => void
  isSelected?: boolean
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  onClick,
  isSelected,
}) => {
  switch (element.type) {
    case 'text':
      return (
        <TextRenderer
          element={element as TextElement}
          onClick={onClick as (el: TextElement) => void}
          isSelected={isSelected}
        />
      )

    case 'image':
      return (
        <ImageRenderer
          element={element as ImageElement}
          onClick={onClick as (el: ImageElement) => void}
          isSelected={isSelected}
        />
      )

    case 'shape':
      return (
        <ShapeRenderer
          element={element as ShapeElement}
          onClick={onClick as (el: ShapeElement) => void}
          isSelected={isSelected}
        />
      )

    default:
      // 其他類型暫不支援
      return null
  }
}

// ============================================================================
// 批量元素渲染器
// ============================================================================

interface ElementsRendererProps {
  elements: CanvasElement[]
  selectedElementId?: string
  onElementClick?: (element: CanvasElement) => void
}

export const ElementsRenderer: React.FC<ElementsRendererProps> = ({
  elements,
  selectedElementId,
  onElementClick,
}) => {
  // 按 zIndex 排序
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <>
      {sortedElements.map(element => (
        <ElementRenderer
          key={element.id}
          element={element}
          onClick={onElementClick}
          isSelected={element.id === selectedElementId}
        />
      ))}
    </>
  )
}
