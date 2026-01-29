'use client'

/**
 * ImagePositionDragger - 統一的圖片位置拖拉調整組件
 *
 * 用途：
 * - 景點圖片位置調整
 * - 行程表封面位置調整
 * - 手冊圖片位置調整
 * - 任何需要調整圖片顯示區域的地方
 *
 * 使用方式：
 * <ImagePositionDragger
 *   src={imageUrl}
 *   position={position}
 *   onChange={setPosition}
 *   aspectRatio={16/9}
 * />
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DIALOG_SIZES } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RotateCcw, Move, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// 精細位置設定（x, y 百分比）
export interface ImagePosition {
  x: number  // 0-100 百分比
  y: number  // 0-100 百分比
}

// 簡單位置（三選一，給景點等簡單場景用）
export type SimpleImagePosition = 'top' | 'center' | 'bottom'

export const defaultPosition: ImagePosition = { x: 50, y: 50 }

// 簡單位置轉精細位置
export function simpleToPosition(simple: SimpleImagePosition): ImagePosition {
  switch (simple) {
    case 'top': return { x: 50, y: 0 }
    case 'bottom': return { x: 50, y: 100 }
    default: return { x: 50, y: 50 }
  }
}

// 精細位置轉簡單位置（取最接近的）
export function positionToSimple(pos: ImagePosition): SimpleImagePosition {
  if (pos.y <= 25) return 'top'
  if (pos.y >= 75) return 'bottom'
  return 'center'
}

// 簡單位置的 CSS class
export function getSimplePositionClass(position: SimpleImagePosition): string {
  switch (position) {
    case 'top': return 'object-top'
    case 'bottom': return 'object-bottom'
    default: return 'object-center'
  }
}

// 轉換為 CSS style
export function getPositionStyle(position?: ImagePosition | null): React.CSSProperties {
  if (!position) {
    return { objectFit: 'cover', objectPosition: 'center' }
  }
  return {
    objectFit: 'cover',
    objectPosition: `${position.x}% ${position.y}%`,
  }
}

// 解析各種格式為 ImagePosition
export function parsePosition(value?: ImagePosition | string | null): ImagePosition {
  if (!value) return { ...defaultPosition }

  if (typeof value === 'object' && 'x' in value && 'y' in value) {
    return { x: value.x ?? 50, y: value.y ?? 50 }
  }

  if (typeof value === 'string') {
    // 嘗試解析 JSON
    if (value.startsWith('{')) {
      try {
        const parsed = JSON.parse(value)
        return { x: parsed.x ?? 50, y: parsed.y ?? 50 }
      } catch {
        // 繼續處理其他格式
      }
    }

    // 舊格式相容
    if (value === 'center') return { x: 50, y: 50 }
    if (value === 'top') return { x: 50, y: 0 }
    if (value === 'bottom') return { x: 50, y: 100 }
    if (value.includes('object-top')) return { x: 50, y: 0 }
    if (value.includes('object-bottom')) return { x: 50, y: 100 }
  }

  return { ...defaultPosition }
}

// ============================================
// 主組件：可點擊的圖片，點擊後開啟拖拉編輯器
// ============================================

interface ImagePositionDraggerProps {
  /** 圖片 URL */
  src: string
  /** 替代文字 */
  alt?: string
  /** 當前位置 */
  position?: ImagePosition | null
  /** 位置變更回調 */
  onChange: (position: ImagePosition) => void
  /** 圖片容器樣式 */
  className?: string
  /** 預覽比例（預設 16:9） */
  aspectRatio?: number
  /** 是否禁用 */
  disabled?: boolean
  /** 自訂 Dialog 標題 */
  title?: string
}

export function ImagePositionDragger({
  src,
  alt = '圖片',
  position,
  onChange,
  className,
  aspectRatio = 16 / 9,
  disabled = false,
  title = '調整圖片位置',
}: ImagePositionDraggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleConfirm = useCallback((newPosition: ImagePosition) => {
    onChange(newPosition)
    setIsOpen(false)
  }, [onChange])

  const currentPosition = parsePosition(position)

  return (
    <>
      {/* 可點擊的圖片預覽 */}
      <div
        className={cn(
          'relative cursor-pointer group overflow-hidden rounded-md',
          disabled && 'cursor-not-allowed opacity-60',
          className
        )}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          style={getPositionStyle(currentPosition)}
          draggable={false}
        />
        {/* Hover 提示 */}
        {!disabled && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
              <Move size={14} />
              點擊調整位置
            </div>
          </div>
        )}
      </div>

      {/* 編輯 Dialog */}
      <ImagePositionDialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        imageSrc={src}
        currentPosition={currentPosition}
        onConfirm={handleConfirm}
        aspectRatio={aspectRatio}
        title={title}
      />
    </>
  )
}

// ============================================
// Dialog：拖拉編輯器
// ============================================

interface ImagePositionDialogProps {
  open: boolean
  onClose: () => void
  imageSrc: string
  currentPosition: ImagePosition
  onConfirm: (position: ImagePosition) => void
  aspectRatio?: number
  title?: string
}

export function ImagePositionDialog({
  open,
  onClose,
  imageSrc,
  currentPosition,
  onConfirm,
  aspectRatio = 16 / 9,
  title = '調整圖片位置',
}: ImagePositionDialogProps) {
  const [position, setPosition] = useState<ImagePosition>(currentPosition)
  const [isDragging, setIsDragging] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 })

  // 開啟時重置為當前設定
  useEffect(() => {
    if (open) {
      setPosition(currentPosition)
    }
  }, [open, currentPosition])

  const handleReset = useCallback(() => {
    setPosition({ ...defaultPosition })
  }, [])

  const handleConfirm = useCallback(() => {
    onConfirm(position)
  }, [position, onConfirm])

  // 拖曳開始（滑鼠）
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    }
  }, [position])

  // 拖曳開始（觸控）
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      posX: position.x,
      posY: position.y,
    }
  }, [position])

  // 拖曳中（滑鼠）
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !previewRef.current) return

    const rect = previewRef.current.getBoundingClientRect()
    const deltaX = e.clientX - dragStartRef.current.x
    const deltaY = e.clientY - dragStartRef.current.y

    // 將像素位移轉換為百分比（反向移動）
    const percentX = (deltaX / rect.width) * 100
    const percentY = (deltaY / rect.height) * 100

    setPosition({
      x: Math.max(0, Math.min(100, dragStartRef.current.posX - percentX)),
      y: Math.max(0, Math.min(100, dragStartRef.current.posY - percentY)),
    })
  }, [isDragging])

  // 拖曳中（觸控）
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !previewRef.current) return

    const touch = e.touches[0]
    const rect = previewRef.current.getBoundingClientRect()
    const deltaX = touch.clientX - dragStartRef.current.x
    const deltaY = touch.clientY - dragStartRef.current.y

    const percentX = (deltaX / rect.width) * 100
    const percentY = (deltaY / rect.height) * 100

    setPosition({
      x: Math.max(0, Math.min(100, dragStartRef.current.posX - percentX)),
      y: Math.max(0, Math.min(100, dragStartRef.current.posY - percentY)),
    })
  }, [isDragging])

  // 拖曳結束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 綁定全域事件
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleDragEnd)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('touchend', handleDragEnd)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleDragEnd)
        window.removeEventListener('touchmove', handleTouchMove)
        window.removeEventListener('touchend', handleDragEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleTouchMove, handleDragEnd])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent level={1} className={DIALOG_SIZES.lg}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 預覽區域 */}
          <div
            ref={previewRef}
            className={cn(
              'relative bg-black rounded-lg overflow-hidden select-none',
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
            style={{ aspectRatio }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <img
              src={imageSrc}
              alt="預覽"
              className="w-full h-full object-cover pointer-events-none"
              style={{
                objectPosition: `${position.x}% ${position.y}%`,
              }}
              draggable={false}
            />

            {/* 拖曳提示 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={cn(
                  'bg-black/50 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-opacity',
                  isDragging ? 'opacity-0' : 'opacity-70'
                )}
              >
                <Move size={16} />
                拖曳調整顯示區域
              </div>
            </div>

            {/* 位置指示器 */}
            <div
              className="absolute w-3 h-3 bg-morandi-gold rounded-full border-2 border-white shadow-lg pointer-events-none transition-all"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>

          {/* 操作按鈕 */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw size={14} />
              重置
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="gap-2"
              >
                <X size={14} />
                取消
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
              >
                <Check size={14} />
                確認
              </Button>
            </div>
          </div>

          {/* 提示文字 */}
          <p className="text-xs text-morandi-secondary text-center">
            拖曳圖片調整顯示區域 · 金色圓點表示目前焦點位置
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// 純編輯按鈕（用於已有圖片的地方）
// ============================================

interface EditPositionButtonProps {
  imageSrc: string
  position?: ImagePosition | null
  onChange: (position: ImagePosition) => void
  aspectRatio?: number
  title?: string
  className?: string
  children?: React.ReactNode
}

export function EditPositionButton({
  imageSrc,
  position,
  onChange,
  aspectRatio = 16 / 9,
  title = '調整圖片位置',
  className,
  children,
}: EditPositionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentPosition = parsePosition(position)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        {children || <Move size={14} />}
      </button>

      <ImagePositionDialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        imageSrc={imageSrc}
        currentPosition={currentPosition}
        onConfirm={(newPos) => {
          onChange(newPos)
          setIsOpen(false)
        }}
        aspectRatio={aspectRatio}
        title={title}
      />
    </>
  )
}

// ============================================
// 簡單版：給景點等只需要 top/center/bottom 的場景
// ============================================

interface SimpleImagePositionDraggerProps {
  /** 圖片 URL */
  src: string
  /** 當前位置 (top/center/bottom) */
  position: SimpleImagePosition
  /** 位置變更回調 */
  onChange: (position: SimpleImagePosition) => void
  /** 圖片容器 className */
  className?: string
  /** 預覽比例 */
  aspectRatio?: number
  /** 是否禁用 */
  disabled?: boolean
  /** 自訂子元素（覆蓋預設的圖片顯示） */
  children?: React.ReactNode
}

export function SimpleImagePositionDragger({
  src,
  position,
  onChange,
  className,
  aspectRatio = 4 / 3,
  disabled = false,
  children,
}: SimpleImagePositionDraggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // 轉換簡單位置為精細位置
  const currentPosition = simpleToPosition(position)

  const handleConfirm = useCallback((newPos: ImagePosition) => {
    // 轉換回簡單位置
    onChange(positionToSimple(newPos))
    setIsOpen(false)
  }, [onChange])

  return (
    <>
      {/* 可點擊的區域 */}
      <div
        className={cn(
          'relative cursor-pointer group overflow-hidden',
          disabled && 'cursor-not-allowed opacity-60',
          className
        )}
        onClick={() => !disabled && setIsOpen(true)}
      >
        {children || (
          <>
            <img
              src={src}
              alt="圖片"
              className={cn(
                'w-full h-full object-cover transition-transform group-hover:scale-105',
                getSimplePositionClass(position)
              )}
              draggable={false}
            />
            {/* Hover 提示 */}
            {!disabled && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <Move size={12} />
                  調整位置
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 編輯 Dialog */}
      <ImagePositionDialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        imageSrc={src}
        currentPosition={currentPosition}
        onConfirm={handleConfirm}
        aspectRatio={aspectRatio}
        title="調整圖片顯示位置"
      />
    </>
  )
}
