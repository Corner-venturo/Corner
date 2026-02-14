'use client'

/**
 * 遮罩圖片調整區塊
 * 讓用戶調整圖片在遮罩形狀內的顯示位置
 */

import React, { useState, useEffect, useCallback } from 'react'
import * as fabric from 'fabric'
import { Image as ImageIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { PROPERTIES_PANEL_LABELS } from './constants/labels'

interface MaskedImageAdjustmentProps {
  canvas: fabric.Canvas | null
  selectedObject: fabric.FabricImage
  onUpdate: () => void
}

export function MaskedImageAdjustment({ canvas, selectedObject, onUpdate }: MaskedImageAdjustmentProps) {
  // 讀取當前的調整值
  const obj = selectedObject as unknown as Record<string, unknown>
  const [zoom, setZoom] = useState((obj.__maskZoom as number) || 100)
  const [offsetX, setOffsetX] = useState((obj.__maskOffsetX as number) || 0)
  const [offsetY, setOffsetY] = useState((obj.__maskOffsetY as number) || 0)

  // 當選取不同圖片時，讀取現有設定
  useEffect(() => {
    const obj = selectedObject as unknown as Record<string, unknown>
    setZoom((obj.__maskZoom as number) || 100)
    setOffsetX((obj.__maskOffsetX as number) || 0)
    setOffsetY((obj.__maskOffsetY as number) || 0)
  }, [selectedObject])

  // 套用調整
  // 邏輯說明：用戶調整的是「圖片在遮罩內的位置」
  // - 縮放 100% = 原始大小，200% = 圖片在遮罩內放大顯示
  // - 為了讓圖片「看起來」放大，我們要縮小 clipPath（窗口變小=圖片看起來更大）
  // - 為了讓圖片「看起來」右移，我們要把 clipPath 左移（窗口左移=看到圖片右側）
  const applyAdjustment = useCallback((zoomVal: number, offsetXVal: number, offsetYVal: number) => {
    if (!selectedObject || !canvas || !selectedObject.clipPath) return

    const clipPath = selectedObject.clipPath

    // 反轉縮放：用戶縮放值越大，clipPath 要越小
    // zoom 100% = clipPath scale 1.0, zoom 200% = clipPath scale 0.5
    const clipScale = 100 / zoomVal

    // 取得圖片基準尺寸
    const baseWidth = selectedObject.width || 100
    const baseHeight = selectedObject.height || 100

    // 反轉偏移：用戶想讓圖片右移 = clipPath 要左移
    const actualOffsetX = -(offsetXVal / 100) * baseWidth * 0.5
    const actualOffsetY = -(offsetYVal / 100) * baseHeight * 0.5

    // 調整 clipPath
    clipPath.set({
      scaleX: clipScale,
      scaleY: clipScale,
      left: actualOffsetX,
      top: actualOffsetY,
    })

    // 儲存設定到物件
    const obj = selectedObject as unknown as Record<string, unknown>
    obj.__maskZoom = zoomVal
    obj.__maskOffsetX = offsetXVal
    obj.__maskOffsetY = offsetYVal

    selectedObject.setCoords()
    canvas.renderAll()
    onUpdate()
  }, [canvas, selectedObject, onUpdate])

  const handleZoomChange = (value: number) => {
    setZoom(value)
    applyAdjustment(value, offsetX, offsetY)
  }

  const handleOffsetXChange = (value: number) => {
    setOffsetX(value)
    applyAdjustment(zoom, value, offsetY)
  }

  const handleOffsetYChange = (value: number) => {
    setOffsetY(value)
    applyAdjustment(zoom, offsetX, value)
  }

  const handleReset = () => {
    setZoom(100)
    setOffsetX(0)
    setOffsetY(0)
    applyAdjustment(100, 0, 0)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <ImageIcon size={12} className="text-morandi-secondary" />
          <Label className="text-xs text-morandi-primary">{PROPERTIES_PANEL_LABELS.LABEL_3469}</Label>
        </div>
        <button
          onClick={handleReset}
          className="text-[10px] text-morandi-gold hover:underline"
        >
          {PROPERTIES_PANEL_LABELS.RESET}
        </button>
      </div>

      <p className="text-[10px] text-morandi-muted mb-2">
        {PROPERTIES_PANEL_LABELS.LABEL_950}
      </p>

      <div className="space-y-3">
        {/* 縮放 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-[10px] text-morandi-muted">{PROPERTIES_PANEL_LABELS.LABEL_9571}</Label>
            <span className="text-[10px] text-morandi-muted">{zoom}%</span>
          </div>
          <Slider
            value={[zoom]}
            onValueChange={([v]) => handleZoomChange(v)}
            min={50}
            max={200}
            step={5}
          />
        </div>

        {/* 水平位移 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-[10px] text-morandi-muted">{PROPERTIES_PANEL_LABELS.LABEL_8522}</Label>
            <span className="text-[10px] text-morandi-muted">{offsetX > 0 ? '→' : offsetX < 0 ? '←' : ''} {Math.abs(offsetX)}%</span>
          </div>
          <Slider
            value={[offsetX]}
            onValueChange={([v]) => handleOffsetXChange(v)}
            min={-100}
            max={100}
            step={5}
          />
        </div>

        {/* 垂直位移 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-[10px] text-morandi-muted">{PROPERTIES_PANEL_LABELS.LABEL_2412}</Label>
            <span className="text-[10px] text-morandi-muted">{offsetY > 0 ? '↓' : offsetY < 0 ? '↑' : ''} {Math.abs(offsetY)}%</span>
          </div>
          <Slider
            value={[offsetY]}
            onValueChange={([v]) => handleOffsetYChange(v)}
            min={-100}
            max={100}
            step={5}
          />
        </div>
      </div>
    </div>
  )
}
