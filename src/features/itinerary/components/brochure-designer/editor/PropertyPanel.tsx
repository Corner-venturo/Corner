'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  Type,
  Image,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Lock,
  Unlock,
  Link2,
  Link2Off,
  Trash2,
  Copy,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  BrochureElement,
  TextElement,
  ImageElement,
  TextStyle,
} from './types'

interface PropertyPanelProps {
  selectedElement: BrochureElement | null
  onUpdate: (id: string, updates: Partial<BrochureElement>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onUnbind: (id: string) => void
}

// 字體選項
const FONT_OPTIONS = [
  { value: 'Noto Sans TC', label: 'Noto Sans TC' },
  { value: 'Noto Serif TC', label: 'Noto Serif TC' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Playfair Display', label: 'Playfair Display' },
]

// 預設顏色
const COLOR_PRESETS = [
  '#3a3633', '#8b8680', '#c9aa7c', '#9fa68f', '#c08374',
  '#ffffff', '#f6f4f1', '#1a365d', '#0d9488', '#000000',
]

export function PropertyPanel({
  selectedElement,
  onUpdate,
  onDelete,
  onDuplicate,
  onUnbind,
}: PropertyPanelProps) {
  if (!selectedElement) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-medium text-morandi-primary">屬性</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-morandi-secondary text-center">
            選擇元素以編輯屬性
          </p>
        </div>
      </div>
    )
  }

  const isBound = selectedElement.dataSource !== 'manual' && !selectedElement.dataBinding?.isUnbound

  // 更新文字樣式
  const updateTextStyle = (updates: Partial<TextStyle>) => {
    if (selectedElement.type !== 'text') return
    const textEl = selectedElement as TextElement
    onUpdate(selectedElement.id, {
      style: { ...textEl.style, ...updates },
    } as Partial<TextElement>)
  }

  return (
    <div className="h-full flex flex-col">
      {/* 標題 */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedElement.type === 'text' && <Type size={16} />}
          {selectedElement.type === 'image' && <Image size={16} />}
          {selectedElement.type === 'shape' && <Square size={16} />}
          <h3 className="font-medium text-morandi-primary">
            {selectedElement.name || getElementTypeName(selectedElement.type)}
          </h3>
        </div>
        {isBound && (
          <span className="text-xs bg-morandi-gold/10 text-morandi-gold px-2 py-0.5 rounded">
            綁定
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 綁定資料警告 */}
        {isBound && (
          <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Lock size={14} className="text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-amber-800 font-medium">此為綁定資料</p>
                <p className="text-xs text-amber-600 mt-1">
                  如需修改內容請至行程編輯器，或解除綁定後自由編輯
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-7 text-xs gap-1"
                  onClick={() => onUnbind(selectedElement.id)}
                >
                  <Link2Off size={12} />
                  解除綁定
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 位置與尺寸 */}
        <div className="p-4 border-b border-border">
          <h4 className="text-xs font-medium text-morandi-secondary mb-3">位置與尺寸</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">X</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => onUpdate(selectedElement.id, { x: Number(e.target.value) })}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Y</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => onUpdate(selectedElement.id, { y: Number(e.target.value) })}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">寬度</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) => onUpdate(selectedElement.id, { width: Number(e.target.value) })}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">高度</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) => onUpdate(selectedElement.id, { height: Number(e.target.value) })}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="mt-3">
            <Label className="text-xs">旋轉</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[selectedElement.rotation]}
                min={-180}
                max={180}
                step={1}
                onValueChange={([v]) => onUpdate(selectedElement.id, { rotation: v })}
                className="flex-1"
              />
              <span className="text-xs w-10 text-right">{selectedElement.rotation}°</span>
            </div>
          </div>
        </div>

        {/* 文字樣式 */}
        {selectedElement.type === 'text' && (
          <div className="p-4 border-b border-border">
            <h4 className="text-xs font-medium text-morandi-secondary mb-3">文字樣式</h4>

            {/* 字體 */}
            <div className="mb-3">
              <Label className="text-xs">字體</Label>
              <Select
                value={(selectedElement as TextElement).style.fontFamily}
                onValueChange={(v) => updateTextStyle({ fontFamily: v })}
                disabled={isBound}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 字體大小 */}
            <div className="mb-3">
              <Label className="text-xs">大小</Label>
              <Input
                type="number"
                value={(selectedElement as TextElement).style.fontSize}
                onChange={(e) => updateTextStyle({ fontSize: Number(e.target.value) })}
                className="h-8 text-sm"
                disabled={isBound}
              />
            </div>

            {/* 樣式按鈕 */}
            <div className="flex gap-1 mb-3">
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  'h-8 w-8',
                  (selectedElement as TextElement).style.fontWeight === 'bold' && 'bg-morandi-gold/20'
                )}
                onClick={() =>
                  updateTextStyle({
                    fontWeight:
                      (selectedElement as TextElement).style.fontWeight === 'bold' ? 'normal' : 'bold',
                  })
                }
                disabled={isBound}
              >
                <Bold size={14} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  'h-8 w-8',
                  (selectedElement as TextElement).style.fontStyle === 'italic' && 'bg-morandi-gold/20'
                )}
                onClick={() =>
                  updateTextStyle({
                    fontStyle:
                      (selectedElement as TextElement).style.fontStyle === 'italic' ? 'normal' : 'italic',
                  })
                }
                disabled={isBound}
              >
                <Italic size={14} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  'h-8 w-8',
                  (selectedElement as TextElement).style.textDecoration === 'underline' &&
                    'bg-morandi-gold/20'
                )}
                onClick={() =>
                  updateTextStyle({
                    textDecoration:
                      (selectedElement as TextElement).style.textDecoration === 'underline'
                        ? 'none'
                        : 'underline',
                  })
                }
                disabled={isBound}
              >
                <Underline size={14} />
              </Button>
              <div className="w-px bg-border mx-1" />
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  'h-8 w-8',
                  (selectedElement as TextElement).style.textAlign === 'left' && 'bg-morandi-gold/20'
                )}
                onClick={() => updateTextStyle({ textAlign: 'left' })}
                disabled={isBound}
              >
                <AlignLeft size={14} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  'h-8 w-8',
                  (selectedElement as TextElement).style.textAlign === 'center' && 'bg-morandi-gold/20'
                )}
                onClick={() => updateTextStyle({ textAlign: 'center' })}
                disabled={isBound}
              >
                <AlignCenter size={14} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  'h-8 w-8',
                  (selectedElement as TextElement).style.textAlign === 'right' && 'bg-morandi-gold/20'
                )}
                onClick={() => updateTextStyle({ textAlign: 'right' })}
                disabled={isBound}
              >
                <AlignRight size={14} />
              </Button>
            </div>

            {/* 顏色 */}
            <div>
              <Label className="text-xs">顏色</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      'w-6 h-6 rounded border',
                      (selectedElement as TextElement).style.color === color
                        ? 'ring-2 ring-morandi-gold ring-offset-1'
                        : 'border-border'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => updateTextStyle({ color })}
                    disabled={isBound}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 圖片屬性 */}
        {selectedElement.type === 'image' && (
          <div className="p-4 border-b border-border">
            <h4 className="text-xs font-medium text-morandi-secondary mb-3">圖片設定</h4>

            <div className="mb-3">
              <Label className="text-xs">填充方式</Label>
              <Select
                value={(selectedElement as ImageElement).objectFit}
                onValueChange={(v) =>
                  onUpdate(selectedElement.id, { objectFit: v as 'cover' | 'contain' | 'fill' })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">填滿裁切</SelectItem>
                  <SelectItem value="contain">完整顯示</SelectItem>
                  <SelectItem value="fill">拉伸填滿</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">圓角</Label>
              <Slider
                value={[(selectedElement as ImageElement).borderRadius]}
                min={0}
                max={50}
                step={1}
                onValueChange={([v]) => onUpdate(selectedElement.id, { borderRadius: v })}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 gap-2"
              onClick={() => {
                // TODO: 開啟圖片選擇器
              }}
            >
              <Image size={14} />
              更換圖片
            </Button>
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="p-4">
          <h4 className="text-xs font-medium text-morandi-secondary mb-3">操作</h4>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => onDuplicate(selectedElement.id)}
            >
              <Copy size={14} />
              複製元素
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() =>
                onUpdate(selectedElement.id, { locked: !selectedElement.locked })
              }
            >
              {selectedElement.locked ? <Unlock size={14} /> : <Lock size={14} />}
              {selectedElement.locked ? '解除鎖定' : '鎖定元素'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => onUpdate(selectedElement.id, { rotation: 0 })}
            >
              <RotateCcw size={14} />
              重置旋轉
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-morandi-red border-morandi-red hover:bg-morandi-red hover:text-white"
              onClick={() => onDelete(selectedElement.id)}
            >
              <Trash2 size={14} />
              刪除元素
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getElementTypeName(type: string): string {
  const names: Record<string, string> = {
    text: '文字',
    image: '圖片',
    shape: '形狀',
    'attraction-card': '景點卡片',
    'flight-info': '航班資訊',
    accommodation: '住宿資訊',
    'day-header': '日期標題',
    sticker: '貼紙',
  }
  return names[type] || type
}
