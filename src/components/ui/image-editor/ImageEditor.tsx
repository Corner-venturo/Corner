'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  Check,
  Crop,
  Loader2,
  Wand2,
  Sparkles,
  Sun,
  Cloud,
  Leaf,
  Snowflake,
  Camera,
  Utensils,
  Building,
  Trees,
  Move,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { alert } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'

// ============ Types ============

export interface ImageAdjustments {
  exposure: number
  contrast: number
  highlights: number
  shadows: number
  saturation: number
  temperature: number
  tint: number
  clarity: number
  vignette: number
}

export interface ImageEditorSettings {
  /** 縮放倍率 */
  scale: number
  /** 位置 X (0-100) */
  x: number
  /** 位置 Y (0-100) */
  y: number
  /** 旋轉角度 (0, 90, 180, 270) */
  rotation: number
  /** 水平翻轉 */
  flipH: boolean
  /** 色彩調整 */
  adjustments: ImageAdjustments
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  clarity: 0,
  vignette: 0,
}

export const DEFAULT_SETTINGS: ImageEditorSettings = {
  scale: 1,
  x: 50,
  y: 50,
  rotation: 0,
  flipH: false,
  adjustments: { ...DEFAULT_ADJUSTMENTS },
}

// AI 編輯動作
type AiEditAction =
  | 'clean_scene'
  | 'landscape_pro'
  | 'travel_magazine'
  | 'food_delicious'
  | 'architecture_dramatic'
  | 'golden_hour'
  | 'blue_hour'
  | 'season_spring'
  | 'season_summer'
  | 'season_autumn'
  | 'season_winter'

interface AiAction {
  action: AiEditAction
  label: string
  icon: React.ElementType
}

const AI_ACTIONS: AiAction[] = [
  { action: 'clean_scene', label: '淨空場景', icon: Sparkles },
  { action: 'landscape_pro', label: '風景大師', icon: Trees },
  { action: 'travel_magazine', label: '旅遊雜誌', icon: Camera },
  { action: 'food_delicious', label: '美食攝影', icon: Utensils },
  { action: 'architecture_dramatic', label: '建築攝影', icon: Building },
  { action: 'golden_hour', label: '黃金時刻', icon: Sun },
  { action: 'blue_hour', label: '藍調時刻', icon: Cloud },
  { action: 'season_spring', label: '春季櫻花', icon: Leaf },
  { action: 'season_autumn', label: '秋楓紅葉', icon: Leaf },
  { action: 'season_winter', label: '冬季雪景', icon: Snowflake },
]

// ============ Props ============

interface ImageEditorProps {
  open: boolean
  onClose: () => void
  imageSrc: string
  /** 目標比例 (預設 16:9) */
  aspectRatio?: number
  /** 初始設定 */
  initialSettings?: Partial<ImageEditorSettings>
  /** 存檔（保留設定可再調整） */
  onSave: (settings: ImageEditorSettings) => void
  /** 裁切並存檔（輸出最終圖片） */
  onCropAndSave?: (blob: Blob, settings: ImageEditorSettings) => void
  /** 是否顯示 AI 功能 */
  showAi?: boolean
  /** AI 編輯後替換圖片 */
  onAiReplace?: (newImageUrl: string) => void
}

// ============ Component ============

export function ImageEditor({
  open,
  onClose,
  imageSrc,
  aspectRatio = 16 / 9,
  initialSettings,
  onSave,
  onCropAndSave,
  showAi = true,
  onAiReplace,
}: ImageEditorProps) {
  const t = useTranslations('imageEditor')
  const tCommon = useTranslations('common')
  const tMessages = useTranslations('messages')

  // 設定狀態
  const [settings, setSettings] = useState<ImageEditorSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
    rotation: initialSettings?.rotation ?? 0,
    flipH: initialSettings?.flipH ?? false,
    adjustments: {
      ...DEFAULT_ADJUSTMENTS,
      ...initialSettings?.adjustments,
    },
  }))

  // UI 狀態
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiProcessing, setAiProcessing] = useState<AiEditAction | null>(null)
  const [previewSrc, setPreviewSrc] = useState(imageSrc)

  // Refs
  const previewRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 })

  // 開啟時重置
  useEffect(() => {
    if (open) {
      setSettings({
        ...DEFAULT_SETTINGS,
        ...initialSettings,
        rotation: initialSettings?.rotation ?? 0,
        flipH: initialSettings?.flipH ?? false,
        adjustments: {
          ...DEFAULT_ADJUSTMENTS,
          ...initialSettings?.adjustments,
        },
      })
      setPreviewSrc(imageSrc)
    }
  }, [open, imageSrc, initialSettings])

  // 色彩調整預覽（debounce）
  useEffect(() => {
    const timeout = setTimeout(async () => {
      const processed = await applyAdjustmentsToImage(imageSrc, settings.adjustments)
      setPreviewSrc(processed)
    }, 150)
    return () => clearTimeout(timeout)
  }, [imageSrc, settings.adjustments])

  // ============ 滾輪縮放 ============
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setSettings((prev) => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale + delta)),
    }))
  }, [])

  // ============ 拖曳移動 ============
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: settings.x,
        posY: settings.y,
      }
    },
    [settings.x, settings.y]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !previewRef.current) return

      const rect = previewRef.current.getBoundingClientRect()
      const deltaX = e.clientX - dragStartRef.current.x
      const deltaY = e.clientY - dragStartRef.current.y

      const percentX = (deltaX / rect.width) * 100
      const percentY = (deltaY / rect.height) * 100

      // 縮放越大，移動感覺越快
      const moveMultiplier = settings.scale

      setSettings((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(100, dragStartRef.current.posX - percentX * moveMultiplier)),
        y: Math.max(0, Math.min(100, dragStartRef.current.posY - percentY * moveMultiplier)),
      }))
    },
    [isDragging, settings.scale]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // ============ 調整滑軌 ============
  const handleAdjustmentChange = useCallback((key: keyof ImageAdjustments, value: number) => {
    setSettings((prev) => ({
      ...prev,
      adjustments: {
        ...prev.adjustments,
        [key]: value,
      },
    }))
  }, [])

  const handleResetAdjustments = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      adjustments: { ...DEFAULT_ADJUSTMENTS },
    }))
  }, [])

  // ============ 旋轉/翻轉 ============
  const handleRotateLeft = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      rotation: (prev.rotation - 90 + 360) % 360,
    }))
  }, [])

  const handleRotateRight = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }))
  }, [])

  const handleFlipH = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      flipH: !prev.flipH,
    }))
  }, [])

  const handleResetTransform = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      rotation: 0,
      flipH: false,
      scale: 1,
      x: 50,
      y: 50,
    }))
  }, [])

  // ============ AI 美化 ============
  const handleAiEdit = useCallback(
    async (action: AiEditAction) => {
      if (!onAiReplace) return

      setAiProcessing(action)
      try {
        const response = await fetch('/api/ai/edit-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: imageSrc, action }),
        })

        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || '編輯失敗')
        }

        // 上傳 base64 到 Storage
        const uploadResult = await uploadBase64ToStorage(result.data.image)
        if (uploadResult.success && uploadResult.url) {
          onAiReplace(uploadResult.url)
          void alert(`${result.data.actionLabel} 完成`, 'success')
        } else {
          throw new Error('上傳失敗')
        }
      } catch (error) {
        logger.error('AI 編輯失敗:', error)
        void alert(error instanceof Error ? error.message : '編輯失敗', 'error')
      } finally {
        setAiProcessing(null)
      }
    },
    [imageSrc, onAiReplace]
  )

  // ============ 存檔 ============
  const handleSave = useCallback(() => {
    onSave(settings)
    onClose()
  }, [settings, onSave, onClose])

  // ============ 裁切並存檔 ============
  const handleCropAndSave = useCallback(async () => {
    if (!onCropAndSave) return

    setIsProcessing(true)
    try {
      const blob = await cropImage(previewSrc, settings, aspectRatio)
      onCropAndSave(blob, settings)
      onClose()
    } catch (error) {
      logger.error('Crop failed:', error)
      void alert(tMessages('saveFailed'), 'error')
    } finally {
      setIsProcessing(false)
    }
  }, [previewSrc, settings, aspectRatio, onCropAndSave, onClose])

  // 檢查調整是否有變更
  const hasAdjustments = Object.entries(settings.adjustments).some(
    ([key, value]) => value !== DEFAULT_ADJUSTMENTS[key as keyof ImageAdjustments]
  )

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* 左邊：預覽區 */}
          <div className="flex-1 p-6 bg-black/5 flex items-center justify-center">
            <div
              ref={previewRef}
              className={cn(
                'relative bg-black rounded-lg overflow-hidden select-none',
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              )}
              style={{ aspectRatio, width: '100%', maxHeight: '100%' }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
            >
              <img
                src={previewSrc}
                alt={tCommon('preview')}
                className="w-full h-full object-cover pointer-events-none"
                style={{
                  objectPosition: `${settings.x}% ${settings.y}%`,
                  transform: `scale(${settings.scale}) rotate(${settings.rotation}deg) ${settings.flipH ? 'scaleX(-1)' : ''}`,
                  transformOrigin: `${settings.x}% ${settings.y}%`,
                }}
                draggable={false}
              />

              {/* 操作提示 */}
              <div
                className={cn(
                  'absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs transition-opacity',
                  isDragging ? 'opacity-0' : 'opacity-70'
                )}
              >
                {t('scrollToZoom')} · {t('dragToMove')}
              </div>

              {/* 縮放顯示 */}
              <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-xs">
                {Math.round(settings.scale * 100)}%
              </div>
            </div>
          </div>

          {/* 右邊：調整面板 */}
          <div className="w-72 border-l border-border flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* 變換工具 */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-morandi-muted font-semibold flex items-center gap-2">
                  <Move size={12} />
                  {t('transform')}
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRotateLeft}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-morandi-container hover:bg-morandi-gold/10 hover:text-morandi-gold transition-colors text-xs"
                    title={t('rotateLeft')}
                  >
                    <RotateCcw size={14} />
                    {t('rotateLeft')}
                  </button>
                  <button
                    type="button"
                    onClick={handleRotateRight}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-morandi-container hover:bg-morandi-gold/10 hover:text-morandi-gold transition-colors text-xs"
                    title={t('rotateRight')}
                  >
                    <RotateCw size={14} />
                    {t('rotateRight')}
                  </button>
                  <button
                    type="button"
                    onClick={handleFlipH}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded transition-colors text-xs',
                      settings.flipH
                        ? 'bg-morandi-gold/20 text-morandi-gold'
                        : 'bg-morandi-container hover:bg-morandi-gold/10 hover:text-morandi-gold'
                    )}
                    title={t('flipHorizontal')}
                  >
                    <FlipHorizontal size={14} />
                    {t('flipHorizontal')}
                  </button>
                </div>
                {(settings.rotation !== 0 || settings.flipH || settings.scale !== 1 || settings.x !== 50 || settings.y !== 50) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetTransform}
                    className="w-full gap-1.5 text-xs"
                  >
                    <RotateCcw size={12} />
                    {t('resetTransform')}
                  </Button>
                )}
              </div>

              {/* 調整滑軌 */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-wider text-morandi-muted font-semibold flex items-center gap-2">
                  <Sun size={12} />
                  {t('light')}
                </h4>
                <AdjustmentSlider
                  label={t('exposure')}
                  value={settings.adjustments.exposure}
                  onChange={(v) => handleAdjustmentChange('exposure', v)}
                />
                <AdjustmentSlider
                  label={t('contrast')}
                  value={settings.adjustments.contrast}
                  onChange={(v) => handleAdjustmentChange('contrast', v)}
                />
                <AdjustmentSlider
                  label={t('highlights')}
                  value={settings.adjustments.highlights}
                  onChange={(v) => handleAdjustmentChange('highlights', v)}
                />
                <AdjustmentSlider
                  label={t('shadows')}
                  value={settings.adjustments.shadows}
                  onChange={(v) => handleAdjustmentChange('shadows', v)}
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-wider text-morandi-muted font-semibold">
                  {t('color')}
                </h4>
                <AdjustmentSlider
                  label={t('saturation')}
                  value={settings.adjustments.saturation}
                  onChange={(v) => handleAdjustmentChange('saturation', v)}
                />
                <AdjustmentSlider
                  label={t('temperature')}
                  value={settings.adjustments.temperature}
                  onChange={(v) => handleAdjustmentChange('temperature', v)}
                />
                <AdjustmentSlider
                  label={t('tint')}
                  value={settings.adjustments.tint}
                  onChange={(v) => handleAdjustmentChange('tint', v)}
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-wider text-morandi-muted font-semibold">
                  {t('effects')}
                </h4>
                <AdjustmentSlider
                  label={t('clarity')}
                  value={settings.adjustments.clarity}
                  onChange={(v) => handleAdjustmentChange('clarity', v)}
                />
                <AdjustmentSlider
                  label={t('vignette')}
                  value={settings.adjustments.vignette}
                  min={0}
                  onChange={(v) => handleAdjustmentChange('vignette', v)}
                />
              </div>

              {hasAdjustments && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetAdjustments}
                  className="w-full gap-1.5 text-xs"
                >
                  <RotateCcw size={12} />
                  {t('resetAdjustments')}
                </Button>
              )}

              {/* AI 美化 */}
              {showAi && onAiReplace && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <h4 className="text-xs uppercase tracking-wider text-morandi-muted font-semibold flex items-center gap-2">
                    <Wand2 size={12} />
                    {t('aiEnhance')}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {AI_ACTIONS.map(({ action, label, icon: Icon }) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => handleAiEdit(action)}
                        disabled={aiProcessing !== null}
                        className={cn(
                          'flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors',
                          'bg-morandi-container hover:bg-morandi-gold/10 hover:text-morandi-gold',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                          aiProcessing === action && 'bg-morandi-gold/20 text-morandi-gold'
                        )}
                      >
                        {aiProcessing === action ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Icon size={12} />
                        )}
                        <span className="truncate">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSave}
            disabled={isProcessing}
            className="gap-1.5"
          >
            <Check size={14} />
            {t('save')}
          </Button>
          {onCropAndSave && (
            <Button
              type="button"
              onClick={handleCropAndSave}
              disabled={isProcessing}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1.5"
            >
              {isProcessing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Crop size={14} />
              )}
              {t('cropAndSave')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============ Sub Components ============

interface AdjustmentSliderProps {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}

function AdjustmentSlider({ label, value, min = -100, max = 100, onChange }: AdjustmentSliderProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-morandi-secondary">{label}</span>
        <span className="text-xs text-morandi-muted w-10 text-right">
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={(values) => onChange(values[0])}
        className="w-full"
      />
    </div>
  )
}

// ============ Helpers ============

async function applyAdjustmentsToImage(
  src: string,
  adjustments: ImageAdjustments
): Promise<string> {
  // 如果沒有調整，直接返回原圖
  const hasChanges = Object.values(adjustments).some((v) => v !== 0)
  if (!hasChanges) return src

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(src)
        return
      }

      canvas.width = img.width
      canvas.height = img.height

      // 基本繪製
      ctx.drawImage(img, 0, 0)

      // 獲取像素數據
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // 應用調整
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i]
        let g = data[i + 1]
        let b = data[i + 2]

        // 曝光度
        if (adjustments.exposure !== 0) {
          const factor = 1 + adjustments.exposure / 100
          r = Math.min(255, r * factor)
          g = Math.min(255, g * factor)
          b = Math.min(255, b * factor)
        }

        // 對比度
        if (adjustments.contrast !== 0) {
          const factor = (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast))
          r = factor * (r - 128) + 128
          g = factor * (g - 128) + 128
          b = factor * (b - 128) + 128
        }

        // 飽和度
        if (adjustments.saturation !== 0) {
          const gray = 0.2989 * r + 0.587 * g + 0.114 * b
          const factor = 1 + adjustments.saturation / 100
          r = gray + factor * (r - gray)
          g = gray + factor * (g - gray)
          b = gray + factor * (b - gray)
        }

        // 色溫
        if (adjustments.temperature !== 0) {
          const temp = adjustments.temperature / 100
          r = r + temp * 30
          b = b - temp * 30
        }

        // 限制範圍
        data[i] = Math.max(0, Math.min(255, r))
        data[i + 1] = Math.max(0, Math.min(255, g))
        data[i + 2] = Math.max(0, Math.min(255, b))
      }

      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = () => resolve(src)
    img.src = src
  })
}

async function cropImage(
  src: string,
  settings: ImageEditorSettings,
  aspectRatio: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // 先處理旋轉/翻轉
      const isRotated90 = settings.rotation === 90 || settings.rotation === 270
      const srcWidth = isRotated90 ? img.height : img.width
      const srcHeight = isRotated90 ? img.width : img.height

      // 建立臨時 canvas 來應用旋轉/翻轉
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) {
        reject(new Error('Canvas context not available'))
        return
      }

      tempCanvas.width = srcWidth
      tempCanvas.height = srcHeight

      // 應用變換
      tempCtx.translate(srcWidth / 2, srcHeight / 2)
      tempCtx.rotate((settings.rotation * Math.PI) / 180)
      if (settings.flipH) {
        tempCtx.scale(-1, 1)
      }
      tempCtx.drawImage(img, -img.width / 2, -img.height / 2)

      // 現在從變換後的圖片裁切
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      // 計算裁切區域
      const imgRatio = srcWidth / srcHeight
      let cropWidth: number, cropHeight: number, cropX: number, cropY: number

      if (imgRatio > aspectRatio) {
        // 圖片較寬，以高度為基準
        cropHeight = srcHeight / settings.scale
        cropWidth = cropHeight * aspectRatio
      } else {
        // 圖片較高，以寬度為基準
        cropWidth = srcWidth / settings.scale
        cropHeight = cropWidth / aspectRatio
      }

      // 根據位置計算偏移
      const maxOffsetX = srcWidth - cropWidth
      const maxOffsetY = srcHeight - cropHeight
      cropX = (settings.x / 100) * maxOffsetX
      cropY = (settings.y / 100) * maxOffsetY

      // 設定輸出尺寸
      canvas.width = cropWidth
      canvas.height = cropHeight

      ctx.drawImage(
        tempCanvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      )

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Canvas to Blob failed'))
          }
        },
        'image/jpeg',
        0.9
      )
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = src
  })
}

async function uploadBase64ToStorage(
  base64Data: string
): Promise<{ success: boolean; url?: string }> {
  try {
    const { supabase } = await import('@/lib/supabase/client')

    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) return { success: false }

    const mimeType = matches[1]
    const base64 = matches[2]
    const ext = mimeType.split('/')[1] || 'png'

    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })

    const fileName = `ai-edited/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('workspace-files')
      .upload(fileName, blob)

    if (uploadError) {
      logger.error('上傳失敗:', uploadError)
      return { success: false }
    }

    const { data } = supabase.storage.from('workspace-files').getPublicUrl(fileName)
    return { success: true, url: data.publicUrl }
  } catch (error) {
    logger.error('uploadBase64ToStorage 錯誤:', error)
    return { success: false }
  }
}
