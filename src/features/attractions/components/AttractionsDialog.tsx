import { useState, useEffect } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Attraction, AttractionFormData } from '../types'
import type { Country, Region, City } from '@/stores/region-store'

// ============================================
// 景點對話框組件（新增/編輯共用）
// ============================================

interface AttractionsDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (formData: AttractionFormData) => Promise<{ success: boolean }>
  attraction?: Attraction | null
  countries: Country[]
  regions: Region[]
  cities: City[]
  getRegionsByCountry: (countryId: string) => Region[]
  getCitiesByCountry: (countryId: string) => City[]
  getCitiesByRegion: (regionId: string) => City[]
  initialFormData: AttractionFormData
}

export function AttractionsDialog({
  open,
  onClose,
  onSubmit,
  attraction,
  countries,
  regions,
  cities,
  getRegionsByCountry,
  getCitiesByCountry,
  getCitiesByRegion,
  initialFormData,
}: AttractionsDialogProps) {
  const [formData, setFormData] = useState<AttractionFormData>(initialFormData)

  // 編輯模式：載入景點資料
  useEffect(() => {
    if (attraction) {
      setFormData({
        name: attraction.name || '',
        name_en: attraction.name_en || '',
        description: attraction.description || '',
        country_id: attraction.country_id || '',
        region_id: attraction.region_id || '',
        city_id: attraction.city_id || '',
        category: attraction.category || '景點',
        tags: attraction.tags?.join(', ') || '',
        duration_minutes: attraction.duration_minutes || 60,
        address: attraction.address || '',
        phone: attraction.phone || '',
        website: attraction.website || '',
        images: attraction.images?.join(', ') || '',
        notes: attraction.notes || '',
        is_active: attraction.is_active,
      })
    } else {
      setFormData(initialFormData)
    }
  }, [attraction, initialFormData])

  const handleSubmit = async () => {
    const result = await onSubmit(formData)
    if (result.success) {
      onClose()
      if (!attraction) {
        // 只在新增模式重置表單
        setFormData(initialFormData)
      }
    }
  }

  const availableRegions = formData.country_id ? getRegionsByCountry(formData.country_id) : []
  const availableCities = formData.region_id
    ? getCitiesByRegion(formData.region_id)
    : formData.country_id
      ? getCitiesByCountry(formData.country_id)
      : []

  return (
    <FormDialog
      open={open}
      onOpenChange={open => !open && onClose()}
      title={attraction ? '編輯景點' : '新增景點'}
      onSubmit={handleSubmit}
      submitLabel={attraction ? '更新' : '新增'}
      submitDisabled={!formData.name || !formData.country_id || !formData.city_id}
      maxWidth="2xl"
      contentClassName="max-h-[90vh] overflow-y-auto"
    >
      <div className="grid grid-cols-2 gap-4">
        {/* 中文名稱 */}
        <div>
          <label className="text-sm font-medium">中文名稱 *</label>
          <Input
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="例如: 太宰府天滿宮"
            required
          />
        </div>

        {/* 英文名稱 */}
        <div>
          <label className="text-sm font-medium">英文名稱</label>
          <Input
            value={formData.name_en}
            onChange={e => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
            placeholder="例如: Dazaifu Tenmangu"
          />
        </div>
      </div>

      {/* 描述 */}
      <div>
        <label className="text-sm font-medium">描述</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="景點簡介..."
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm min-h-[80px]"
        />
      </div>

      {/* 地點選擇 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">國家 *</label>
          <select
            value={formData.country_id}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                country_id: e.target.value,
                region_id: '',
                city_id: '',
              }))
            }
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
            required
          >
            <option value="">請選擇</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </div>

        {availableRegions.length > 0 && (
          <div>
            <label className="text-sm font-medium">地區</label>
            <select
              value={formData.region_id}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  region_id: e.target.value,
                  city_id: '',
                }))
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
            >
              <option value="">請選擇</option>
              {availableRegions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-sm font-medium">城市 *</label>
          <select
            value={formData.city_id}
            onChange={e => setFormData(prev => ({ ...prev, city_id: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
            required
          >
            <option value="">請選擇</option>
            {availableCities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 類別與標籤 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">類別</label>
          <select
            value={formData.category}
            onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
          >
            <option value="景點">景點</option>
            <option value="餐廳">餐廳</option>
            <option value="住宿">住宿</option>
            <option value="購物">購物</option>
            <option value="交通">交通</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">標籤（逗號分隔）</label>
          <Input
            value={formData.tags}
            onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="例如: 文化,神社,歷史"
          />
        </div>
      </div>

      {/* 建議停留時間 */}
      <div>
        <label className="text-sm font-medium">建議停留時間（分鐘）</label>
        <Input
          type="number"
          value={formData.duration_minutes}
          onChange={e =>
            setFormData(prev => ({ ...prev, duration_minutes: Number(e.target.value) }))
          }
          min={0}
        />
      </div>

      {/* 聯絡資訊 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">電話</label>
          <Input
            value={formData.phone}
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+81-92-123-4567"
          />
        </div>

        <div>
          <label className="text-sm font-medium">官網</label>
          <Input
            value={formData.website}
            onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* 地址 */}
      <div>
        <label className="text-sm font-medium">地址</label>
        <Input
          value={formData.address}
          onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
          placeholder="完整地址..."
        />
      </div>

      {/* 圖片 URL */}
      <div>
        <label className="text-sm font-medium">圖片 URL（逗號分隔）</label>
        <textarea
          value={formData.images}
          onChange={e => setFormData(prev => ({ ...prev, images: e.target.value }))}
          placeholder="https://images.unsplash.com/photo-xxx, https://..."
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm min-h-[80px]"
        />
        <p className="text-xs text-morandi-muted mt-1">建議使用 Unsplash 圖片 (1920x1080)</p>
      </div>

      {/* 備註 */}
      <div>
        <label className="text-sm font-medium">內部備註</label>
        <textarea
          value={formData.notes}
          onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="內部使用備註..."
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm min-h-[60px]"
        />
      </div>

      {/* 啟用狀態 */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
          className="w-4 h-4"
        />
        <label className="text-sm">啟用此景點</label>
      </div>
    </FormDialog>
  )
}
