'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AttractionFormData } from '../../types'
import type { Country, Region, City } from '@/stores/region-store'

interface AttractionFormProps {
  formData: AttractionFormData
  countries: Country[]
  availableRegions: Region[]
  availableCities: City[]
  onFormDataChange: (formData: AttractionFormData) => void
}

export function AttractionForm({
  formData,
  countries,
  availableRegions,
  availableCities,
  onFormDataChange,
}: AttractionFormProps) {
  const setFormData = (updater: (prev: AttractionFormData) => AttractionFormData) => {
    onFormDataChange(updater(formData))
  }

  return (
    <>
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
          <Select
            value={formData.country_id}
            onValueChange={value =>
              setFormData(prev => ({
                ...prev,
                country_id: value,
                region_id: '',
                city_id: '',
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="請選擇" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {availableRegions.length > 0 && (
          <div>
            <label className="text-sm font-medium">地區（選填）</label>
            <Select
              value={formData.region_id}
              onValueChange={value =>
                setFormData(prev => ({
                  ...prev,
                  region_id: value,
                  city_id: '',
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="請選擇" />
              </SelectTrigger>
              <SelectContent>
                {availableRegions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className="text-sm font-medium">城市（選填）</label>
          <Select
            value={formData.city_id || '_none_'}
            onValueChange={value => setFormData(prev => ({ ...prev, city_id: value === '_none_' ? '' : value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="不指定" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none_">不指定</SelectItem>
              {availableCities.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 類別與標籤 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">類別</label>
          <Select
            value={formData.category}
            onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="景點" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="景點">景點</SelectItem>
              <SelectItem value="餐廳">餐廳</SelectItem>
              <SelectItem value="住宿">住宿</SelectItem>
              <SelectItem value="購物">購物</SelectItem>
              <SelectItem value="交通">交通</SelectItem>
            </SelectContent>
          </Select>
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
        <Checkbox
          checked={formData.is_active}
          onCheckedChange={checked => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
        />
        <label className="text-sm">啟用此景點</label>
      </div>
    </>
  )
}
