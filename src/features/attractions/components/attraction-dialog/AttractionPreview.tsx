'use client'

import { AttractionFormData } from '../../types'
import type { Country, Region, City } from '@/stores/region-store'
import { ImagePosition } from '../../hooks/useAttractionForm'

interface AttractionPreviewProps {
  formData: AttractionFormData
  uploadedImages: string[]
  imagePositions: Record<string, ImagePosition>
  countries: Country[]
  regions: Region[]
  cities: City[]
}

export function AttractionPreview({
  formData,
  uploadedImages,
  imagePositions,
  countries,
  regions,
  cities,
}: AttractionPreviewProps) {
  const country = countries.find(c => c.id === formData.country_id)
  const region = regions.find(r => r.id === formData.region_id)
  const city = cities.find(c => c.id === formData.city_id)

  const positionStyles: Record<ImagePosition, string> = {
    top: 'object-top',
    center: 'object-center',
    bottom: 'object-bottom',
  }

  return (
    <div className="space-y-4 p-4 bg-morandi-bg rounded-lg border border-border">
      <h3 className="text-lg font-medium">預覽</h3>

      {/* 圖片預覽 */}
      {uploadedImages.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">主圖片</div>
          <img
            src={uploadedImages[0]}
            alt={formData.name}
            className={`w-full h-48 object-cover rounded-md ${positionStyles[imagePositions[uploadedImages[0]] || 'center']}`}
          />
          {uploadedImages.length > 1 && (
            <div className="text-xs text-morandi-muted">
              +{uploadedImages.length - 1} 張圖片
            </div>
          )}
        </div>
      )}

      {/* 基本資訊 */}
      <div className="space-y-2">
        <h4 className="text-base font-medium">{formData.name || '未命名景點'}</h4>
        {formData.english_name && (
          <div className="text-sm text-morandi-muted">{formData.english_name}</div>
        )}
      </div>

      {/* 地點 */}
      <div className="text-sm">
        <span className="text-morandi-muted">地點：</span>
        {[country?.name, region?.name, city?.name].filter(Boolean).join(' / ') || '未設定'}
      </div>

      {/* 類別與標籤 */}
      <div className="flex gap-2 flex-wrap">
        <span className="px-2 py-1 bg-morandi-gold/10 text-morandi-gold rounded text-xs">
          {formData.category}
        </span>
        {formData.tags && formData.tags.split(',').map((tag, i) => (
          <span key={i} className="px-2 py-1 bg-morandi-blue/10 text-morandi-blue rounded text-xs">
            {tag.trim()}
          </span>
        ))}
      </div>

      {/* 描述 */}
      {formData.description && (
        <div className="text-sm text-morandi-muted">
          {formData.description}
        </div>
      )}

      {/* 其他資訊 */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {formData.duration_minutes > 0 && (
          <div>
            <span className="text-morandi-muted">停留時間：</span>
            {formData.duration_minutes} 分鐘
          </div>
        )}
        {formData.address && (
          <div>
            <span className="text-morandi-muted">地址：</span>
            {formData.address}
          </div>
        )}
        {formData.phone && (
          <div>
            <span className="text-morandi-muted">電話：</span>
            {formData.phone}
          </div>
        )}
        {formData.website && (
          <div>
            <span className="text-morandi-muted">官網：</span>
            <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-morandi-blue hover:underline">
              連結
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
