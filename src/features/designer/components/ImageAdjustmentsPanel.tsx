'use client'

import React, { useCallback } from 'react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import type { ImageAdjustments } from './types'
import { DEFAULT_IMAGE_ADJUSTMENTS } from './types'

interface AdjustmentSliderProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

function AdjustmentSlider({ label, value, min, max, onChange }: AdjustmentSliderProps) {
  return (
    <div className="space-y-1.5">
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

interface ImageAdjustmentsPanelProps {
  adjustments: ImageAdjustments
  onChange: (adjustments: ImageAdjustments) => void
  onReset?: () => void
  disabled?: boolean
}

/**
 * 圖片色彩調整面板
 * Lightroom 風格的滑桿控制
 */
export function ImageAdjustmentsPanel({
  adjustments,
  onChange,
  onReset,
  disabled = false,
}: ImageAdjustmentsPanelProps) {
  const handleChange = useCallback(
    (key: keyof ImageAdjustments, value: number) => {
      onChange({
        ...adjustments,
        [key]: value,
      })
    },
    [adjustments, onChange]
  )

  const handleReset = useCallback(() => {
    onChange({ ...DEFAULT_IMAGE_ADJUSTMENTS })
    onReset?.()
  }, [onChange, onReset])

  // 檢查是否有任何調整（非預設值）
  const hasAdjustments = Object.entries(adjustments).some(
    ([key, value]) => value !== DEFAULT_IMAGE_ADJUSTMENTS[key as keyof ImageAdjustments]
  )

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* 光線調整 */}
      <div className="space-y-3">
        <h4 className="text-[10px] uppercase tracking-wider text-morandi-muted font-semibold">
          光線
        </h4>
        <AdjustmentSlider
          label="曝光度"
          value={adjustments.exposure}
          min={-100}
          max={100}
          onChange={(v) => handleChange('exposure', v)}
        />
        <AdjustmentSlider
          label="對比度"
          value={adjustments.contrast}
          min={-100}
          max={100}
          onChange={(v) => handleChange('contrast', v)}
        />
        <AdjustmentSlider
          label="高光"
          value={adjustments.highlights}
          min={-100}
          max={100}
          onChange={(v) => handleChange('highlights', v)}
        />
        <AdjustmentSlider
          label="陰影"
          value={adjustments.shadows}
          min={-100}
          max={100}
          onChange={(v) => handleChange('shadows', v)}
        />
      </div>

      {/* 色彩調整 */}
      <div className="space-y-3">
        <h4 className="text-[10px] uppercase tracking-wider text-morandi-muted font-semibold">
          色彩
        </h4>
        <AdjustmentSlider
          label="飽和度"
          value={adjustments.saturation}
          min={-100}
          max={100}
          onChange={(v) => handleChange('saturation', v)}
        />
        <AdjustmentSlider
          label="色溫"
          value={adjustments.temperature}
          min={-100}
          max={100}
          onChange={(v) => handleChange('temperature', v)}
        />
        <AdjustmentSlider
          label="色調"
          value={adjustments.tint}
          min={-100}
          max={100}
          onChange={(v) => handleChange('tint', v)}
        />
      </div>

      {/* 效果 */}
      <div className="space-y-3">
        <h4 className="text-[10px] uppercase tracking-wider text-morandi-muted font-semibold">
          效果
        </h4>
        <AdjustmentSlider
          label="銳利度"
          value={adjustments.clarity}
          min={-100}
          max={100}
          onChange={(v) => handleChange('clarity', v)}
        />
        <AdjustmentSlider
          label="暈影"
          value={adjustments.vignette}
          min={0}
          max={100}
          onChange={(v) => handleChange('vignette', v)}
        />
      </div>

      {/* 重置按鈕 */}
      {hasAdjustments && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="w-full gap-1.5 text-xs"
        >
          <RotateCcw size={12} />
          重置所有調整
        </Button>
      )}
    </div>
  )
}
