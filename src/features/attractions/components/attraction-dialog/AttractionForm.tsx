'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AttractionFormData } from '../../types'
import type { Country, Region, City } from '@/stores/region-store'
import { ATTRACTION_FORM_LABELS, DATABASE_MANAGEMENT_PAGE_LABELS } from '../../constants/labels';

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
          <label className="text-sm font-medium">{ATTRACTION_FORM_LABELS.ZH_NAME}</label>
          <Input
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={ATTRACTION_FORM_LABELS.例如_太宰府天滿宮}
            required
          />
        </div>

        {/* 英文名稱 */}
        <div>
          <label className="text-sm font-medium">{ATTRACTION_FORM_LABELS.EN_NAME}</label>
          <Input
            value={formData.english_name}
            onChange={e => setFormData(prev => ({ ...prev, english_name: e.target.value }))}
            placeholder={ATTRACTION_FORM_LABELS.例如_Dazaifu_Tenmangu}
          />
        </div>
      </div>

      {/* 描述 */}
      <div>
        <label className="text-sm font-medium">{ATTRACTION_FORM_LABELS.DESCRIPTION_LABEL}</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder={ATTRACTION_FORM_LABELS.景點簡介}
          className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm min-h-[80px]"
        />
      </div>

      {/* 地點選擇 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">{ATTRACTION_FORM_LABELS.COUNTRY}</label>
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
              <SelectValue placeholder={ATTRACTION_FORM_LABELS.請選擇} />
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
            <label className="text-sm font-medium">{ATTRACTION_FORM_LABELS.REGION}</label>
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
                <SelectValue placeholder={ATTRACTION_FORM_LABELS.請選擇} />
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
          <label className="text-sm font-medium">{ATTRACTION_FORM_LABELS.CITY_SELECT}</label>
          <Select
            value={formData.city_id || '_none_'}
            onValueChange={value => setFormData(prev => ({ ...prev, city_id: value === '_none_' ? '' : value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={ATTRACTION_FORM_LABELS.不指定} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none_">{ATTRACTION_FORM_LABELS.NOT_SPECIFIED}</SelectItem>
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
          <label className="text-sm font-medium">{ATTRACTION_FORM_LABELS.CATEGORY}</label>
          <Select
            value={formData.category}
            onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={DATABASE_MANAGEMENT_PAGE_LABELS.景點} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DATABASE_MANAGEMENT_PAGE_LABELS.景點}>景點</SelectItem>
              <SelectItem value={DATABASE_MANAGEMENT_PAGE_LABELS.餐廳}>餐廳</SelectItem>
              <SelectItem value={DATABASE_MANAGEMENT_PAGE_LABELS.住宿}>住宿</SelectItem>
              <SelectItem value={DATABASE_MANAGEMENT_PAGE_LABELS.購物}>購物</SelectItem>
              <SelectItem value={DATABASE_MANAGEMENT_PAGE_LABELS.交通}>交通</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">{ATTRACTION_FORM_LABELS.TAGS}</label>
          <Input
            value={formData.tags}
            onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            placeholder={ATTRACTION_FORM_LABELS.例如_文化_神社_歷史}
          />
        </div>
      </div>

      {/* 建議停留時間 */}
      <div>
        <label className="text-sm font-medium">{ATTRACTION_FORM_LABELS.DURATION}</label>
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
          <label className="text-sm font-medium">{ATTRACTION_FORM_LABELS.PHONE}</label>
          <Input
            value={formData.phone}
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+81-92-123-4567"
          />
        </div>

        <div>
          <label className="text-sm font-medium">{ATTRACTION_FORM_LABELS.WEBSITE}</label>
          <Input
            value={formData.website}
            onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* 地址 */}
      <div>
        <label className="text-sm font-medium">{ATTRACTION_FORM_LABELS.ADDRESS}</label>
        <Input
          value={formData.address}
          onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
          placeholder={ATTRACTION_FORM_LABELS.完整地址}
        />
      </div>

      {/* 備註 */}
      <div>
        <label className="text-sm font-medium">{ATTRACTION_FORM_LABELS.INTERNAL_NOTES}</label>
        <textarea
          value={formData.notes}
          onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder={ATTRACTION_FORM_LABELS.內部使用備註}
          className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm min-h-[60px]"
        />
      </div>

      {/* 啟用狀態 */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={formData.is_active}
          onCheckedChange={checked => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
        />
        <label className="text-sm">{ATTRACTION_FORM_LABELS.ENABLE_ATTRACTION}</label>
      </div>
    </>
  )
}
