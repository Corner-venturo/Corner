/**
 * PassportImageEnhancer - 護照圖片增強組件
 * 專注於銳利化功能，提升 OCR 辨識率
 */

'use client'

import React, { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { logger } from '@/lib/utils/logger'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { RotateCcw, Sparkles, Check } from 'lucide-react'
import { useImageAdjustments } from '@/features/designer/hooks/useImageAdjustments'
import { DEFAULT_IMAGE_ADJUSTMENTS } from '@/features/designer/components/types'
import type { ImageAdjustments } from '@/features/designer/components/types'
import { COMP_ORDERS_LABELS } from '../constants/labels'

interface PassportImageEnhancerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onSave: (enhancedImageSrc: string) => void
}

export function PassportImageEnhancer({
  open,
  onOpenChange,
  imageSrc,
  onSave,
}: PassportImageEnhancerProps) {
  const { applyAdjustments } = useImageAdjustments()
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewSrc, setPreviewSrc] = useState(imageSrc)
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    ...DEFAULT_IMAGE_ADJUSTMENTS,
    clarity: 30, // 預設增加一些銳利度
    contrast: 10, // 稍微增加對比
  })

  // 當 dialog 開啟時重設
  React.useEffect(() => {
    if (open) {
      setPreviewSrc(imageSrc)
      setAdjustments({
        ...DEFAULT_IMAGE_ADJUSTMENTS,
        clarity: 30,
        contrast: 10,
      })
    }
  }, [open, imageSrc])

  // 套用調整並更新預覽
  const handleApplyPreview = useCallback(async (newAdjustments: ImageAdjustments) => {
    setAdjustments(newAdjustments)
    setIsProcessing(true)
    try {
      const result = await applyAdjustments(imageSrc, newAdjustments)
      setPreviewSrc(result)
    } catch (error) {
      logger.error(COMP_ORDERS_LABELS.圖片處理失敗, error)
    } finally {
      setIsProcessing(false)
    }
  }, [imageSrc, applyAdjustments])

  // 重設為原始圖片
  const handleReset = useCallback(() => {
    setAdjustments(DEFAULT_IMAGE_ADJUSTMENTS)
    setPreviewSrc(imageSrc)
  }, [imageSrc])

  // 儲存並關閉
  const handleSave = useCallback(() => {
    onSave(previewSrc)
    onOpenChange(false)
  }, [previewSrc, onSave, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent level={2} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-morandi-gold" />
            {COMP_ORDERS_LABELS.LABEL_5560}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* 預覽區域 */}
          <div className="space-y-2">
            <p className="text-xs text-morandi-muted">{COMP_ORDERS_LABELS.PREVIEW}</p>
            <div className="relative aspect-[3/2] bg-morandi-container rounded-lg overflow-hidden">
              <img
                src={previewSrc}
                alt={COMP_ORDERS_LABELS.護照預覽}
                className="w-full h-full object-contain"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="text-white text-sm">{COMP_ORDERS_LABELS.處理中}</span>
                </div>
              )}
            </div>
          </div>

          {/* 調整控制 */}
          <div className="space-y-4">
            <p className="text-xs text-morandi-muted">{COMP_ORDERS_LABELS.SETTINGS_1270}</p>

            {/* 銳利度 - 主要功能 */}
            <div className="space-y-2 p-3 bg-morandi-gold/10 rounded-lg border border-morandi-gold/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-morandi-primary">{COMP_ORDERS_LABELS.LABEL_1814}</span>
                <span className="text-xs text-morandi-muted">
                  {adjustments.clarity > 0 ? `+${adjustments.clarity}` : adjustments.clarity}
                </span>
              </div>
              <Slider
                value={[adjustments.clarity]}
                min={-50}
                max={100}
                step={5}
                onValueChange={(values) => {
                  handleApplyPreview({ ...adjustments, clarity: values[0] })
                }}
                className="w-full"
              />
              <p className="text-[10px] text-morandi-muted">
                {COMP_ORDERS_LABELS.LABEL_1423}
              </p>
            </div>

            {/* 對比度 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-morandi-secondary">{COMP_ORDERS_LABELS.LABEL_3794}</span>
                <span className="text-xs text-morandi-muted">
                  {adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}
                </span>
              </div>
              <Slider
                value={[adjustments.contrast]}
                min={-50}
                max={50}
                step={5}
                onValueChange={(values) => {
                  handleApplyPreview({ ...adjustments, contrast: values[0] })
                }}
                className="w-full"
              />
            </div>

            {/* 曝光度 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-morandi-secondary">{COMP_ORDERS_LABELS.LABEL_2427}</span>
                <span className="text-xs text-morandi-muted">
                  {adjustments.exposure > 0 ? `+${adjustments.exposure}` : adjustments.exposure}
                </span>
              </div>
              <Slider
                value={[adjustments.exposure]}
                min={-50}
                max={50}
                step={5}
                onValueChange={(values) => {
                  handleApplyPreview({ ...adjustments, exposure: values[0] })
                }}
                className="w-full"
              />
            </div>

            {/* 陰影 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-morandi-secondary">{COMP_ORDERS_LABELS.LABEL_6915}</span>
                <span className="text-xs text-morandi-muted">
                  {adjustments.shadows > 0 ? `+${adjustments.shadows}` : adjustments.shadows}
                </span>
              </div>
              <Slider
                value={[adjustments.shadows]}
                min={-50}
                max={50}
                step={5}
                onValueChange={(values) => {
                  handleApplyPreview({ ...adjustments, shadows: values[0] })
                }}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex justify-between pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="gap-1.5"
          >
            <RotateCcw size={14} />
            {COMP_ORDERS_LABELS.RESET}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {COMP_ORDERS_LABELS.取消}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="gap-1.5 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              <Check size={14} />
              {COMP_ORDERS_LABELS.SAVING_9589}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
