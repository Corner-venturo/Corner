/**
 * 封面區塊編輯器
 *
 * 編輯封面相關資訊：標題、副標題、封面圖片等
 */

'use client'

import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { RichTextInput } from '@/components/ui/rich-text-input'
import { ImageUploader } from '@/components/ui/image-uploader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CoverBlockData } from '../types'
import type { CoverStyleType } from '@/components/editor/tour-form/types'
import type { ImagePositionSettings } from '@/components/ui/image-position-editor'

interface CoverBlockEditorProps {
  data: CoverBlockData
  onChange: (data: Partial<CoverBlockData>) => void
}

export function CoverBlockEditor({ data, onChange }: CoverBlockEditorProps) {
  const updateField = useCallback(<K extends keyof CoverBlockData>(
    field: K,
    value: CoverBlockData[K]
  ) => {
    onChange({ [field]: value })
  }, [onChange])

  return (
    <div className="space-y-4">
      {/* 基本資訊 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-morandi-secondary mb-1">標籤文字</label>
          <RichTextInput
            value={data.tagline || ''}
            onChange={value => updateField('tagline', value)}
            placeholder="Venturo Travel 2025"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-morandi-secondary mb-1">主標題</label>
          <RichTextInput
            value={data.title || ''}
            onChange={value => updateField('title', value)}
            placeholder="漫遊福岡"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-morandi-secondary mb-1">副標題</label>
          <RichTextInput
            value={data.subtitle || ''}
            onChange={value => updateField('subtitle', value)}
            placeholder="半自由行"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-medium text-morandi-secondary mb-1">描述</label>
          <RichTextInput
            value={data.description || ''}
            onChange={value => updateField('description', value)}
            placeholder="行程特色描述..."
            singleLine={false}
          />
        </div>
      </div>

      {/* 行程資訊 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-morandi-secondary mb-1">出發日期</label>
          <Input
            type="text"
            value={data.departureDate || ''}
            onChange={e => updateField('departureDate', e.target.value)}
            placeholder="2025/01/01"
            className="h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-morandi-secondary mb-1">行程代碼</label>
          <Input
            type="text"
            value={data.tourCode || ''}
            onChange={e => updateField('tourCode', e.target.value)}
            placeholder="25JFO21CIG"
            className="h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-morandi-secondary mb-1">國家</label>
          <Input
            type="text"
            value={data.country || ''}
            onChange={e => updateField('country', e.target.value)}
            placeholder="日本"
            className="h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-morandi-secondary mb-1">城市</label>
          <Input
            type="text"
            value={data.city || ''}
            onChange={e => updateField('city', e.target.value)}
            placeholder="福岡"
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* 價格資訊 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-morandi-secondary mb-1">價格</label>
          <Input
            type="text"
            value={data.price || ''}
            onChange={e => updateField('price', e.target.value)}
            placeholder="39,800"
            className="h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-morandi-secondary mb-1">單位</label>
          <Select
            value={data.priceNote || '/人'}
            onValueChange={(value) => updateField('priceNote', value)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="選擇單位" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="/人">/人</SelectItem>
              <SelectItem value="起">起</SelectItem>
              <SelectItem value="/人起">/人起</SelectItem>
              <SelectItem value="__hidden__">(不顯示)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 封面風格 */}
      <div>
        <label className="block text-xs font-medium text-morandi-secondary mb-1">封面風格</label>
        <Select
          value={data.coverStyle || 'original'}
          onValueChange={(value) => updateField('coverStyle', value as CoverStyleType)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="選擇風格" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="original">經典全屏</SelectItem>
            <SelectItem value="gemini">Gemini</SelectItem>
            <SelectItem value="nature">自然綠意</SelectItem>
            <SelectItem value="luxury">奢華質感</SelectItem>
            <SelectItem value="art">藝術雜誌</SelectItem>
            <SelectItem value="dreamscape">夢幻漫遊</SelectItem>
            <SelectItem value="collage">互動拼貼</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 封面圖片 */}
      <div>
        <label className="block text-xs font-medium text-morandi-secondary mb-1">封面圖片</label>
        <ImageUploader
          value={data.coverImage}
          onChange={(url) => updateField('coverImage', url)}
          position={data.coverImagePosition as ImagePositionSettings}
          onPositionChange={(pos) => updateField('coverImagePosition', pos)}
          bucket="city-backgrounds"
          filePrefix="itinerary"
          previewHeight="80px"
          aspectRatio={16 / 9}
          placeholder="拖曳圖片到此處，或點擊上傳"
        />
      </div>
    </div>
  )
}
