'use client'

/**
 * 屬性面板組件
 *
 * 顯示選中元素的屬性，並提供編輯功能
 */

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { FontPicker, FontWeightPicker, TextAlignPicker } from './FontPicker'

interface PropertiesPanelProps {
  canvas: fabric.Canvas | null
  selectedObject: fabric.FabricObject | null
  onUpdate: () => void
}

export function PropertiesPanel({
  canvas,
  selectedObject,
  onUpdate,
}: PropertiesPanelProps) {
  const [properties, setProperties] = useState<Record<string, unknown>>({})

  // 監聽選中物件的屬性變化
  useEffect(() => {
    if (!selectedObject) {
      setProperties({})
      return
    }

    const updateProperties = () => {
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
        // Text properties
        ...(selectedObject.type === 'i-text' || selectedObject.type === 'text'
          ? {
              fontFamily: (selectedObject as fabric.IText).fontFamily,
              fontSize: (selectedObject as fabric.IText).fontSize,
              fontWeight: (selectedObject as fabric.IText).fontWeight,
              textAlign: (selectedObject as fabric.IText).textAlign,
              text: (selectedObject as fabric.IText).text,
            }
          : {}),
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

  // 更新物件屬性
  const updateProperty = (key: string, value: unknown) => {
    if (!selectedObject || !canvas) return

    if (key === 'opacity') {
      selectedObject.set('opacity', (value as number) / 100)
    } else {
      selectedObject.set(key as keyof fabric.FabricObject, value)
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

  const isText = properties.type === 'i-text' || properties.type === 'text'

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
            <div>
              <Label className="text-xs text-morandi-secondary">文字內容</Label>
              <Input
                value={(properties.text as string) || ''}
                onChange={(e) => {
                  updateProperty('text', e.target.value)
                }}
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs text-morandi-secondary">字體</Label>
              <FontPicker
                fontFamily={(properties.fontFamily as string) || 'Noto Sans TC'}
                fontSize={(properties.fontSize as number) || 24}
                onFontFamilyChange={(font) => updateProperty('fontFamily', font)}
                onFontSizeChange={(size) => updateProperty('fontSize', size)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-morandi-secondary">粗細</Label>
                <FontWeightPicker
                  fontWeight={String(properties.fontWeight || 'normal')}
                  onChange={(weight) => updateProperty('fontWeight', weight)}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-morandi-secondary">對齊</Label>
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
            <Label className="text-xs text-morandi-secondary">位置</Label>
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

        {/* 大小 */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <Maximize2 size={12} className="text-morandi-secondary" />
            <Label className="text-xs text-morandi-secondary">大小</Label>
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

        {/* 旋轉 */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <RotateCw size={12} className="text-morandi-secondary" />
            <Label className="text-xs text-morandi-secondary">旋轉</Label>
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

        {/* 顏色 */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <Palette size={12} className="text-morandi-secondary" />
            <Label className="text-xs text-morandi-secondary">顏色</Label>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-[10px] text-morandi-muted w-8">填充</Label>
              <input
                type="color"
                value={String(properties.fill || '#c9aa7c')}
                onChange={(e) => updateProperty('fill', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <Input
                value={String(properties.fill || '#c9aa7c')}
                onChange={(e) => updateProperty('fill', e.target.value)}
                className="flex-1 text-sm h-8"
              />
            </div>
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

        {/* 透明度 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-morandi-secondary">透明度</Label>
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
    default:
      return '元素'
  }
}
