'use client'

/**
 * 模板數據編輯面板
 *
 * 提供快速編輯模板數據的輸入框（標題、日期、目的地等）
 */

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  FileText,
  MapPin,
  Calendar,
  Building2,
  Hash,
} from 'lucide-react'

interface TemplateDataPanelProps {
  templateData: Record<string, unknown> | null
  onTemplateDataChange: (newData: Record<string, unknown>) => void
}

export function TemplateDataPanel({
  templateData,
  onTemplateDataChange,
}: TemplateDataPanelProps) {
  if (!templateData) {
    return (
      <div className="w-64 h-full bg-white border-l border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <h3 className="font-medium text-sm text-morandi-primary">模板數據</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-morandi-secondary text-center">
            請先選擇模板
          </p>
        </div>
      </div>
    )
  }

  const updateField = (field: string, value: string) => {
    onTemplateDataChange({
      ...templateData,
      [field]: value,
    })
  }

  return (
    <div className="w-64 h-full bg-white border-l border-border flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="font-medium text-sm text-morandi-primary">模板數據</h3>
        <p className="text-xs text-morandi-secondary mt-1">
          修改後自動更新畫布
        </p>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-4">
        {/* 主標題 */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <FileText size={12} />
            主標題
          </Label>
          <Input
            value={(templateData.mainTitle as string) || ''}
            onChange={(e) => updateField('mainTitle', e.target.value)}
            placeholder="輸入主標題..."
            className="h-8 text-sm"
          />
        </div>

        {/* 副標題 */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <FileText size={12} />
            副標題
          </Label>
          <Input
            value={(templateData.subtitle as string) || ''}
            onChange={(e) => updateField('subtitle', e.target.value)}
            placeholder="Travel Handbook"
            className="h-8 text-sm"
          />
        </div>

        {/* 目的地 */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <MapPin size={12} />
            目的地
          </Label>
          <Input
            value={(templateData.destination as string) || ''}
            onChange={(e) => updateField('destination', e.target.value)}
            placeholder="JAPAN, OSAKA"
            className="h-8 text-sm"
          />
        </div>

        {/* 旅遊日期 */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Calendar size={12} />
            旅遊日期
          </Label>
          <Input
            value={(templateData.travelDates as string) || ''}
            onChange={(e) => updateField('travelDates', e.target.value)}
            placeholder="2025.01.15 - 2025.01.20"
            className="h-8 text-sm"
          />
        </div>

        {/* 公司名稱 */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Building2 size={12} />
            公司名稱
          </Label>
          <Input
            value={(templateData.companyName as string) || ''}
            onChange={(e) => updateField('companyName', e.target.value)}
            placeholder="Corner Travel"
            className="h-8 text-sm"
          />
        </div>

        {/* 團號 */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Hash size={12} />
            團號
          </Label>
          <Input
            value={(templateData.tourCode as string) || ''}
            onChange={(e) => updateField('tourCode', e.target.value)}
            placeholder="OSA250115A"
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  )
}
