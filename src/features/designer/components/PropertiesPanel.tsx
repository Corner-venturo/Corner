'use client'

/**
 * 屬性面板組件
 *
 * 顯示選中元素的屬性，並提供編輯功能
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import * as fabric from 'fabric'
import {
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  Minus,
  Palette,
  Move,
  Maximize2,
  RotateCw,
  Upload,
  Sparkles,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { FontPicker, FontWeightPicker, TextAlignPicker } from './FontPicker'
import { GradientPicker, cssGradientToFabric } from './GradientPicker'
import { cn } from '@/lib/utils'

interface PropertiesPanelProps {
  canvas: fabric.Canvas | null
  selectedObject: fabric.FabricObject | null
  onUpdate: () => void
  onImageFill?: (object: fabric.FabricObject) => void  // 圖片填充回調
}

export function PropertiesPanel({
  canvas,
  selectedObject,
  onUpdate,
  onImageFill,
}: PropertiesPanelProps) {
  const [properties, setProperties] = useState<Record<string, unknown>>({})

  // 檢查是否為文字類型
  const isTextType = (type: string) =>
    type === 'i-text' || type === 'text' || type === 'textbox'

  // 檢查多選時是否全部都是文字（使用 useMemo 避免重複計算）
  const { selectedObjects, allAreText, isMultiSelect } = useMemo(() => {
    if (!selectedObject) return { selectedObjects: [], allAreText: false, isMultiSelect: false }

    let objects: fabric.FabricObject[] = []
    if (selectedObject.type === 'activeselection' || selectedObject.type === 'activeSelection') {
      objects = (selectedObject as fabric.ActiveSelection).getObjects()
    } else {
      objects = [selectedObject]
    }

    const allText = objects.length > 0 && objects.every(obj => isTextType(obj.type || ''))
    return {
      selectedObjects: objects,
      allAreText: allText,
      isMultiSelect: objects.length > 1,
    }
  }, [selectedObject])

  // 監聽選中物件的屬性變化
  useEffect(() => {
    if (!selectedObject) {
      setProperties({})
      return
    }

    const updateProperties = () => {
      // 多選且全是文字時，取第一個文字的屬性作為參考
      const firstTextObj = allAreText ? selectedObjects[0] as fabric.IText : null

      setProperties({
        type: selectedObject.type,
        left: Math.round(selectedObject.left || 0),
        top: Math.round(selectedObject.top || 0),
        width: Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1)),
        height: Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1)),
        angle: Math.round(selectedObject.angle || 0),
        fill: selectedObject.fill,
        stroke: selectedObject.stroke,
        strokeWidth: selectedObject.strokeWidth,
        opacity: Math.round((selectedObject.opacity || 1) * 100),
        // Text properties (單選文字或多選全是文字)
        ...((isTextType(selectedObject.type || '') || allAreText)
          ? {
              fontFamily: firstTextObj?.fontFamily || (selectedObject as fabric.IText).fontFamily,
              fontSize: firstTextObj?.fontSize || (selectedObject as fabric.IText).fontSize,
              fontWeight: firstTextObj?.fontWeight || (selectedObject as fabric.IText).fontWeight,
              textAlign: firstTextObj?.textAlign || (selectedObject as fabric.IText).textAlign,
              text: isMultiSelect ? `${selectedObjects.length} 個文字` : (selectedObject as fabric.IText).text,
            }
          : {}),
        // 標記多選狀態
        isMultiSelect,
        selectedCount: selectedObjects.length,
      })
    }

    updateProperties()

    // 監聽修改事件
    selectedObject.on('modified', updateProperties)
    selectedObject.on('scaling', updateProperties)
    selectedObject.on('moving', updateProperties)
    selectedObject.on('rotating', updateProperties)

    return () => {
      selectedObject.off('modified', updateProperties)
      selectedObject.off('scaling', updateProperties)
      selectedObject.off('moving', updateProperties)
      selectedObject.off('rotating', updateProperties)
    }
   
  }, [selectedObject])

  // 更新物件屬性（支援多選）
  const updateProperty = (key: string, value: unknown) => {
    if (!selectedObject || !canvas) return

    // 如果是多選且是文字屬性，更新所有選中的文字元素
    const textProperties = ['fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'fill']
    if (isMultiSelect && textProperties.includes(key)) {
      selectedObjects.forEach(obj => {
        if (isTextType(obj.type || '')) {
          obj.set(key as keyof fabric.FabricObject, value)
        }
      })
    } else {
      // 單選或非文字屬性
      if (key === 'opacity') {
        selectedObject.set('opacity', (value as number) / 100)
      } else {
        selectedObject.set(key as keyof fabric.FabricObject, value)
      }
    }

    canvas.renderAll()
    onUpdate()

    setProperties((prev) => ({ ...prev, [key]: value }))
  }

  if (!selectedObject) {
    return (
      <div className="w-64 h-full bg-white border-l border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <h3 className="font-medium text-sm text-morandi-primary">屬性</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-morandi-secondary text-center">
            選取元素以編輯屬性
          </p>
        </div>
      </div>
    )
  }

  const isText = isTextType(properties.type as string || '') || allAreText

  return (
    <div className="w-64 h-full bg-white border-l border-border flex flex-col overflow-hidden">
      <div className="p-3 border-b border-border flex items-center gap-2">
        {getTypeIcon(properties.type as string)}
        <h3 className="font-medium text-sm text-morandi-primary">
          {getTypeName(properties.type as string)}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* 文字屬性 */}
        {isText && (
          <div className="space-y-3">
            {/* 多選時顯示選中數量，單選時可編輯文字 */}
            {isMultiSelect ? (
              <div className="p-2 bg-morandi-container/30 rounded text-sm text-morandi-secondary">
                已選擇 {selectedObjects.length} 個文字元素
              </div>
            ) : (
              <div>
                <Label className="text-xs text-morandi-primary">文字內容</Label>
                <Input
                  value={(properties.text as string) || ''}
                  onChange={(e) => {
                    updateProperty('text', e.target.value)
                  }}
                  className="mt-1 text-sm"
                />
              </div>
            )}

            {/* 字級 - 獨立顯示 */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Type size={12} className="text-morandi-secondary" />
                <Label className="text-xs text-morandi-primary">字級</Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={String((properties.fontSize as number) || 24)}
                  onChange={(e) => updateProperty('fontSize', parseInt(e.target.value) || 24)}
                  className="w-20 text-sm h-8"
                  min={8}
                  max={200}
                />
                <span className="text-xs text-morandi-secondary">px</span>
                {/* 快速選擇 */}
                <div className="flex gap-1">
                  {[16, 24, 32, 48].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => updateProperty('fontSize', size)}
                      className={cn(
                        'px-2 py-1 text-xs rounded border transition-colors',
                        (properties.fontSize as number) === size
                          ? 'bg-morandi-gold text-white border-morandi-gold'
                          : 'border-border hover:border-morandi-gold'
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs text-morandi-primary">字體</Label>
              <FontPicker
                fontFamily={(properties.fontFamily as string) || 'Noto Sans TC'}
                fontSize={(properties.fontSize as number) || 24}
                onFontFamilyChange={(font) => updateProperty('fontFamily', font)}
                onFontSizeChange={(size) => updateProperty('fontSize', size)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-morandi-primary">粗細</Label>
                <FontWeightPicker
                  fontWeight={String(properties.fontWeight || 'normal')}
                  onChange={(weight) => updateProperty('fontWeight', weight)}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-morandi-primary">對齊</Label>
              <TextAlignPicker
                textAlign={(properties.textAlign as string) || 'left'}
                onChange={(align) => updateProperty('textAlign', align)}
              />
            </div>
          </div>
        )}

        {/* 位置 */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <Move size={12} className="text-morandi-secondary" />
            <Label className="text-xs text-morandi-primary">位置</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-morandi-muted">X</Label>
              <Input
                type="number"
                value={String(properties.left || 0)}
                onChange={(e) => updateProperty('left', parseInt(e.target.value))}
                className="mt-0.5 text-sm h-8"
              />
            </div>
            <div>
              <Label className="text-[10px] text-morandi-muted">Y</Label>
              <Input
                type="number"
                value={String(properties.top || 0)}
                onChange={(e) => updateProperty('top', parseInt(e.target.value))}
                className="mt-0.5 text-sm h-8"
              />
            </div>
          </div>
        </div>

        {/* 大小 - 文字元素不顯示（改用字級調整） */}
        {!isText && (
          <div>
            <div className="flex items-center gap-1 mb-2">
              <Maximize2 size={12} className="text-morandi-secondary" />
              <Label className="text-xs text-morandi-primary">大小</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-morandi-muted">寬</Label>
                <Input
                  type="number"
                  value={String(properties.width || 0)}
                  onChange={(e) => {
                    const newWidth = parseInt(e.target.value)
                    const scale = newWidth / (selectedObject?.width || 1)
                    updateProperty('scaleX', scale)
                  }}
                  className="mt-0.5 text-sm h-8"
                />
              </div>
              <div>
                <Label className="text-[10px] text-morandi-muted">高</Label>
                <Input
                  type="number"
                  value={String(properties.height || 0)}
                  onChange={(e) => {
                    const newHeight = parseInt(e.target.value)
                    const scale = newHeight / (selectedObject?.height || 1)
                    updateProperty('scaleY', scale)
                  }}
                  className="mt-0.5 text-sm h-8"
                />
              </div>
            </div>
          </div>
        )}

        {/* 旋轉 */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <RotateCw size={12} className="text-morandi-secondary" />
            <Label className="text-xs text-morandi-primary">旋轉</Label>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={String(properties.angle || 0)}
              onChange={(e) => updateProperty('angle', parseInt(e.target.value))}
              className="w-20 text-sm h-8"
            />
            <span className="text-xs text-morandi-secondary">度</span>
          </div>
        </div>

        {/* 顏色/填充 */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <Palette size={12} className="text-morandi-secondary" />
            <Label className="text-xs text-morandi-primary">填充</Label>
          </div>
          <div className="space-y-3">
            {/* 漸層/純色填充 */}
            <div>
              <Label className="text-[10px] text-morandi-muted mb-1 block">顏色/漸層</Label>
              <GradientPicker
                value={getFillValue(properties.fill)}
                onChange={(value, isSolid) => {
                  if (isSolid) {
                    // 純色直接設定
                    updateProperty('fill', value)
                    // 如果是 path（貼紙），同時更新 stroke 顏色
                    if (selectedObject?.type === 'path' && canvas) {
                      selectedObject.set('stroke', value)
                      canvas.renderAll()
                    }
                    // 如果是 group（彩色圖標等），更新所有子元素的顏色
                    if (selectedObject?.type === 'group' && canvas) {
                      const group = selectedObject as fabric.Group
                      group.getObjects().forEach(obj => {
                        if ('fill' in obj) obj.set('fill', value)
                        if ('stroke' in obj && obj.stroke) obj.set('stroke', value)
                      })
                      canvas.renderAll()
                    }
                  } else {
                    // 漸層需要轉換為 fabric.Gradient
                    if (selectedObject && canvas) {
                      const width = (selectedObject.width || 100) * (selectedObject.scaleX || 1)
                      const height = (selectedObject.height || 100) * (selectedObject.scaleY || 1)
                      const gradient = cssGradientToFabric(value, width, height)
                      selectedObject.set('fill', gradient)
                      // 儲存原始 CSS 值供之後編輯
                      ;(selectedObject as unknown as Record<string, unknown>).__cssGradient = value
                      canvas.renderAll()
                      onUpdate()
                    }
                  }
                }}
              />
            </div>

            {/* 圖片填充（僅形狀支援） */}
            {isShapeType(properties.type as string) && onImageFill && (
              <div>
                <Label className="text-[10px] text-morandi-muted mb-1 block">圖片遮罩</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => selectedObject && onImageFill(selectedObject)}
                >
                  <Upload size={14} />
                  上傳圖片填充
                </Button>
                <p className="text-[10px] text-morandi-muted mt-1">
                  上傳圖片後會裁切成此形狀
                </p>
              </div>
            )}

            {/* 邊框顏色 */}
            {properties.stroke !== undefined && (
              <div className="flex items-center gap-2">
                <Label className="text-[10px] text-morandi-muted w-8">邊框</Label>
                <input
                  type="color"
                  value={String(properties.stroke || '#000000')}
                  onChange={(e) => updateProperty('stroke', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <Input
                  value={String(properties.stroke || '#000000')}
                  onChange={(e) => updateProperty('stroke', e.target.value)}
                  className="flex-1 text-sm h-8"
                />
              </div>
            )}
          </div>
        </div>

        {/* 遮罩圖片調整 - 有 clipPath 的圖片 */}
        {properties.type === 'image' && selectedObject?.clipPath && (
          <MaskedImageAdjustment
            canvas={canvas}
            selectedObject={selectedObject as fabric.FabricImage}
            onUpdate={onUpdate}
          />
        )}

        {/* 圖片濾鏡 - 僅圖片類型顯示 */}
        {properties.type === 'image' && (
          <ImageFiltersSection
            canvas={canvas}
            selectedObject={selectedObject as fabric.FabricImage}
            onUpdate={onUpdate}
          />
        )}

        {/* 透明度 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-morandi-primary">透明度</Label>
            <span className="text-xs text-morandi-muted">{String(properties.opacity || 100)}%</span>
          </div>
          <Slider
            value={[(properties.opacity as number) || 100]}
            onValueChange={([value]) => updateProperty('opacity', value)}
            min={0}
            max={100}
            step={1}
          />
        </div>
      </div>
    </div>
  )
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'i-text':
    case 'text':
    case 'textbox':
      return <Type size={14} className="text-morandi-gold" />
    case 'rect':
      return <Square size={14} className="text-morandi-gold" />
    case 'circle':
      return <Circle size={14} className="text-morandi-gold" />
    case 'image':
      return <ImageIcon size={14} className="text-morandi-gold" />
    case 'line':
      return <Minus size={14} className="text-morandi-gold" />
    default:
      return <Square size={14} className="text-morandi-gold" />
  }
}

function getTypeName(type: string) {
  switch (type) {
    case 'i-text':
    case 'text':
    case 'textbox':
      return '文字'
    case 'rect':
      return '矩形'
    case 'circle':
      return '圓形'
    case 'image':
      return '圖片'
    case 'line':
      return '線條'
    case 'group':
      return '群組'
    case 'path':
      return '圖案'
    case 'polygon':
      return '多邊形'
    case 'triangle':
      return '三角形'
    default:
      return '元素'
  }
}

// 檢查是否為形狀類型（支援圖片遮罩填充）
function isShapeType(type: string): boolean {
  return ['rect', 'circle', 'path', 'polygon', 'triangle', 'ellipse', 'group'].includes(type)
}

// 取得填充值（處理漸層和純色）
function getFillValue(fill: unknown): string {
  if (!fill) return '#c9aa7c'

  // 如果是字串（純色或 CSS 漸層）
  if (typeof fill === 'string') {
    return fill
  }

  // 如果是 fabric.Gradient 物件，嘗試取得儲存的 CSS 值
  if (typeof fill === 'object' && fill !== null) {
    const obj = fill as Record<string, unknown>
    if (obj.__cssGradient) {
      return obj.__cssGradient as string
    }
    // 嘗試從 colorStops 還原
    if (obj.colorStops && Array.isArray(obj.colorStops)) {
      const stops = obj.colorStops as Array<{ offset: number; color: string }>
      const type = obj.type === 'radial' ? 'radial-gradient' : 'linear-gradient'
      const stopsStr = stops.map(s => `${s.color} ${Math.round(s.offset * 100)}%`).join(', ')
      return `${type}(90deg, ${stopsStr})`
    }
  }

  return '#c9aa7c'
}

// 遮罩圖片調整區塊
interface MaskedImageAdjustmentProps {
  canvas: fabric.Canvas | null
  selectedObject: fabric.FabricImage
  onUpdate: () => void
}

function MaskedImageAdjustment({ canvas, selectedObject, onUpdate }: MaskedImageAdjustmentProps) {
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
          <Label className="text-xs text-morandi-primary">調整遮罩內圖片</Label>
        </div>
        <button
          onClick={handleReset}
          className="text-[10px] text-morandi-gold hover:underline"
        >
          重設
        </button>
      </div>

      <p className="text-[10px] text-morandi-muted mb-2">
        調整圖片在遮罩形狀內的顯示位置
      </p>

      <div className="space-y-3">
        {/* 縮放 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-[10px] text-morandi-muted">圖片縮放</Label>
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
            <Label className="text-[10px] text-morandi-muted">左右移動</Label>
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
            <Label className="text-[10px] text-morandi-muted">上下移動</Label>
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

// 圖片濾鏡區塊
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

function ImageFiltersSection({ canvas, selectedObject, onUpdate }: ImageFiltersSectionProps) {
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
