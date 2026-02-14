'use client'
/**
 * 行程特色區塊編輯器
 *
 * 編輯行程特色列表
 */


import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import type { FeaturesBlockData } from '../types'
import type { Feature, FeaturesStyleType } from '@/components/editor/tour-form/types'
import { COMP_EDITOR_LABELS } from '../../constants/labels'

interface FeaturesBlockEditorProps {
  data: FeaturesBlockData
  onChange: (data: Partial<FeaturesBlockData>) => void
}

export function FeaturesBlockEditor({ data, onChange }: FeaturesBlockEditorProps) {
  const features = data.features || []

  const addFeature = useCallback(() => {
    onChange({
      features: [...features, { icon: '✨', title: '', description: '' }],
    })
  }, [features, onChange])

  const updateFeature = useCallback((index: number, field: keyof Feature, value: string | string[]) => {
    const newFeatures = [...features]
    newFeatures[index] = { ...newFeatures[index], [field]: value }
    onChange({ features: newFeatures })
  }, [features, onChange])

  const removeFeature = useCallback((index: number) => {
    onChange({ features: features.filter((_, i) => i !== index) })
  }, [features, onChange])

  return (
    <div className="space-y-3">
      {/* 風格選擇 */}
      <div>
        <label className="block text-xs font-medium text-morandi-primary mb-1">{COMP_EDITOR_LABELS.LABEL_9055}</label>
        <Select
          value={data.featuresStyle || 'original'}
          onValueChange={(value) => onChange({ featuresStyle: value as FeaturesStyleType })}
        >
          <SelectTrigger className="h-8 text-sm w-40">
            <SelectValue placeholder={COMP_EDITOR_LABELS.選擇風格} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="original">{COMP_EDITOR_LABELS.LABEL_6735}</SelectItem>
            <SelectItem value="luxury">{COMP_EDITOR_LABELS.LABEL_4759}</SelectItem>
            <SelectItem value="collage">{COMP_EDITOR_LABELS.LABEL_6627}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 特色列表 */}
      <div className="space-y-2">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 bg-morandi-container/30 rounded-lg"
          >
            <GripVertical size={14} className="text-morandi-secondary/50 mt-2 cursor-grab" />

            <div className="w-12">
              <Input
                value={feature.icon || ''}
                onChange={e => updateFeature(index, 'icon', e.target.value)}
                placeholder="✨"
                className="h-8 text-sm text-center"
              />
            </div>

            <div className="flex-1 space-y-1">
              <Input
                value={feature.title || ''}
                onChange={e => updateFeature(index, 'title', e.target.value)}
                placeholder={COMP_EDITOR_LABELS.特色標題}
                className="h-8 text-sm"
              />
              <Input
                value={feature.description || ''}
                onChange={e => updateFeature(index, 'description', e.target.value)}
                placeholder={COMP_EDITOR_LABELS.特色描述}
                className="h-8 text-sm"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-status-danger hover:text-status-danger hover:bg-status-danger-bg"
              onClick={() => removeFeature(index)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>

      {/* 新增按鈕 */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={addFeature}
      >
        <Plus size={14} />
        {COMP_EDITOR_LABELS.ADD_6408}
      </Button>
    </div>
  )
}
