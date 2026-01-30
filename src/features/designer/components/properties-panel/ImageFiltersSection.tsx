'use client'

/**
 * 圖片濾鏡區塊
 * 提供預設濾鏡和自訂調整（亮度、對比、飽和度）
 */

import React, { useState, useEffect, useCallback } from 'react'
import * as fabric from 'fabric'
import { Sparkles } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface ImageFiltersSectionProps {
  canvas: fabric.Canvas | null
  selectedObject: fabric.FabricImage | null
  onUpdate: () => void
}

// 濾鏡預設值
const FILTER_PRESETS = [
  { id: 'none', label: '原始', icon: '🎨' },
  { id: 'grayscale', label: '灰階', icon: '⬛' },
  { id: 'sepia', label: '復古', icon: '🟤' },
  { id: 'vintage', label: '懷舊', icon: '📷' },
  { id: 'cool', label: '冷調', icon: '❄️' },
  { id: 'warm', label: '暖調', icon: '🔥' },
]

export function ImageFiltersSection({ canvas, selectedObject, onUpdate }: ImageFiltersSectionProps) {
  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(0)
  const [saturation, setSaturation] = useState(0)
  const [activePreset, setActivePreset] = useState('none')

  // 當選取不同圖片時，讀取現有濾鏡設定
  useEffect(() => {
    if (!selectedObject) return

    // 讀取自訂屬性
    const obj = selectedObject as unknown as Record<string, unknown>
    setBrightness((obj.__filterBrightness as number) || 0)
    setContrast((obj.__filterContrast as number) || 0)
    setSaturation((obj.__filterSaturation as number) || 0)
    setActivePreset((obj.__filterPreset as string) || 'none')
  }, [selectedObject])

  // 套用濾鏡
  const applyFilters = useCallback((
    brightnessVal: number,
    contrastVal: number,
    saturationVal: number,
    preset: string
  ) => {
    if (!selectedObject || !canvas) return

    // 清除現有濾鏡
    selectedObject.filters = []

    // 套用預設濾鏡
    switch (preset) {
      case 'grayscale':
        selectedObject.filters.push(new fabric.filters.Grayscale())
        break
      case 'sepia':
        selectedObject.filters.push(new fabric.filters.Sepia())
        break
      case 'vintage':
        selectedObject.filters.push(new fabric.filters.Sepia())
        selectedObject.filters.push(new fabric.filters.Brightness({ brightness: -0.1 }))
        selectedObject.filters.push(new fabric.filters.Contrast({ contrast: 0.1 }))
        break
      case 'cool':
        // 冷調效果：增加藍色、降低飽和度
        selectedObject.filters.push(new fabric.filters.Saturation({ saturation: -0.2 }))
        break
      case 'warm':
        // 暖調效果：增加飽和度
        selectedObject.filters.push(new fabric.filters.Saturation({ saturation: 0.3 }))
        break
    }

    // 套用自訂調整（亮度、對比、飽和度）
    if (brightnessVal !== 0) {
      selectedObject.filters.push(new fabric.filters.Brightness({ brightness: brightnessVal / 100 }))
    }
    if (contrastVal !== 0) {
      selectedObject.filters.push(new fabric.filters.Contrast({ contrast: contrastVal / 100 }))
    }
    if (saturationVal !== 0 && preset !== 'cool' && preset !== 'warm') {
      selectedObject.filters.push(new fabric.filters.Saturation({ saturation: saturationVal / 100 }))
    }

    // 套用濾鏡
    selectedObject.applyFilters()

    // 儲存設定到物件（供下次讀取）
    const obj = selectedObject as unknown as Record<string, unknown>
    obj.__filterBrightness = brightnessVal
    obj.__filterContrast = contrastVal
    obj.__filterSaturation = saturationVal
    obj.__filterPreset = preset

    canvas.renderAll()
    onUpdate()
  }, [canvas, selectedObject, onUpdate])

  const handlePresetChange = (preset: string) => {
    setActivePreset(preset)
    applyFilters(brightness, contrast, saturation, preset)
  }

  const handleBrightnessChange = (value: number) => {
    setBrightness(value)
    applyFilters(value, contrast, saturation, activePreset)
  }

  const handleContrastChange = (value: number) => {
    setContrast(value)
    applyFilters(brightness, value, saturation, activePreset)
  }

  const handleSaturationChange = (value: number) => {
    setSaturation(value)
    applyFilters(brightness, contrast, value, activePreset)
  }

  const handleReset = () => {
    setBrightness(0)
    setContrast(0)
    setSaturation(0)
    setActivePreset('none')
    applyFilters(0, 0, 0, 'none')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <Sparkles size={12} className="text-morandi-secondary" />
          <Label className="text-xs text-morandi-primary">濾鏡效果</Label>
        </div>
        <button
          onClick={handleReset}
          className="text-[10px] text-morandi-gold hover:underline"
        >
          重設
        </button>
      </div>

      {/* 預設濾鏡 */}
      <div className="grid grid-cols-3 gap-1 mb-3">
        {FILTER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetChange(preset.id)}
            className={cn(
              'flex flex-col items-center gap-0.5 p-1.5 rounded border text-xs transition-colors',
              activePreset === preset.id
                ? 'border-morandi-gold bg-morandi-gold/10 text-morandi-gold'
                : 'border-border hover:border-morandi-gold/50'
            )}
          >
            <span>{preset.icon}</span>
            <span className="text-[10px]">{preset.label}</span>
          </button>
        ))}
      </div>

      {/* 自訂調整 */}
      <div className="space-y-3">
        {/* 亮度 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-[10px] text-morandi-muted">亮度</Label>
            <span className="text-[10px] text-morandi-muted">{brightness}</span>
          </div>
          <Slider
            value={[brightness]}
            onValueChange={([v]) => handleBrightnessChange(v)}
            min={-100}
            max={100}
            step={5}
          />
        </div>

        {/* 對比 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-[10px] text-morandi-muted">對比</Label>
            <span className="text-[10px] text-morandi-muted">{contrast}</span>
          </div>
          <Slider
            value={[contrast]}
            onValueChange={([v]) => handleContrastChange(v)}
            min={-100}
            max={100}
            step={5}
          />
        </div>

        {/* 飽和度 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-[10px] text-morandi-muted">飽和度</Label>
            <span className="text-[10px] text-morandi-muted">{saturation}</span>
          </div>
          <Slider
            value={[saturation]}
            onValueChange={([v]) => handleSaturationChange(v)}
            min={-100}
            max={100}
            step={5}
          />
        </div>
      </div>
    </div>
  )
}
