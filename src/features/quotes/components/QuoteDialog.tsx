/**
 * QuoteDialog - Form dialog for adding/editing quotes
 */

'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface QuoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: {
    name: string
    status: 'proposed' | 'approved'
    group_size: number | ''
    tour_id: string | null
    is_pinned: boolean
    code: string
    country_id: string | null
    main_city_id: string | null
    other_city_ids: string[]
  }
  setFormField: (field: string, value: any) => void
  citySearchTerm: string
  setCitySearchTerm: (term: string) => void
  availableCities: any[]
  tours: any[]
  countries: any[]
  onSubmit: () => Promise<boolean>
  onClose: () => void
}

export const QuoteDialog: React.FC<QuoteDialogProps> = ({
  open,
  onOpenChange,
  formData,
  setFormField,
  citySearchTerm,
  setCitySearchTerm,
  availableCities,
  tours,
  countries,
  onSubmit,
  onClose,
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim()) {
      const success = await onSubmit()
      if (success) {
        onClose()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md"
        onInteractOutside={e => {
          const target = e.target as HTMLElement
          if (
            target.closest('[role="listbox"]') ||
            target.closest('[data-radix-select-viewport]') ||
            target.closest('[cmdk-root]')
          ) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>新增報價單</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 選擇是否關聯旅遊團 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary">關聯旅遊團（選填）</label>
            <Combobox
              options={[
                { value: '', label: '獨立報價單（無旅遊團）' },
                ...tours
                  .filter(t => !t._deleted)
                  .map(tour => ({
                    value: tour.id,
                    label: `${tour.code} - ${tour.name}`,
                    data: tour,
                  })),
              ]}
              value={formData.tour_id || ''}
              onChange={value => {
                if (!value) {
                  setFormField('tour_id', null)
                } else {
                  const tour = tours.find(t => t.id === value)
                  if (tour) {
                    setFormField('tour_id', value)
                    setFormField('name', tour.name)
                    setFormField('group_size', tour.max_participants || 1)
                    setFormField('country_id', tour.country_id || null)
                    setFormField('main_city_id', tour.main_city_id || null)
                  }
                }
              }}
              placeholder="搜尋或選擇旅遊團..."
              emptyMessage="找不到旅遊團"
              className="mt-1"
            />
            <p className="text-xs text-morandi-secondary mt-1">
              選擇旅遊團後，報價單編號將使用團號
            </p>
          </div>

          {/* 國家選擇 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary">國家</label>
            <Select
              value={formData.country_id || 'none'}
              onValueChange={value => {
                if (value === 'none') {
                  setFormField('country_id', null)
                  setFormField('main_city_id', null)
                  setFormField('other_city_ids', [])
                } else {
                  setFormField('country_id', value)
                  setFormField('main_city_id', null)
                  setFormField('other_city_ids', [])
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="選擇國家" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">請選擇國家</SelectItem>
                {countries
                  .filter(c => c.is_active)
                  .map(country => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.emoji} {country.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* 主要城市選擇 */}
          {formData.country_id && (
            <div>
              <label className="text-sm font-medium text-morandi-primary">主要城市</label>
              <Select
                value={formData.main_city_id || 'none'}
                onValueChange={value => {
                  setFormField('main_city_id', value === 'none' ? null : value)
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="選擇主要城市" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">請選擇主要城市</SelectItem>
                  {availableCities.map(city => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-morandi-secondary mt-1">主要城市用於團號生成</p>
            </div>
          )}

          {/* 其他城市選擇（多選） */}
          {formData.country_id &&
            formData.main_city_id &&
            availableCities.filter(city => city.id !== formData.main_city_id).length > 0 && (
              <div>
                <label className="text-sm font-medium text-morandi-primary">其他城市（選填）</label>
                <div className="mt-1 space-y-2">
                  <Input
                    placeholder="輸入城市名稱搜尋（例如：清）..."
                    value={citySearchTerm}
                    onChange={e => setCitySearchTerm(e.target.value)}
                    className="text-sm"
                  />

                  {formData.other_city_ids.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 border border-border rounded-md bg-morandi-container/10">
                      {formData.other_city_ids.map(cityId => {
                        const city = availableCities.find(c => c.id === cityId)
                        if (!city) return null
                        return (
                          <span
                            key={cityId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-morandi-gold/20 text-morandi-primary text-xs rounded"
                          >
                            {city.name}
                            <button
                              type="button"
                              onClick={() => {
                                setFormField(
                                  'other_city_ids',
                                  formData.other_city_ids.filter(id => id !== cityId)
                                )
                              }}
                              className="hover:text-morandi-red"
                            >
                              ×
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}

                  <div className="max-h-32 overflow-y-auto border border-border rounded-md">
                    {availableCities
                      .filter(
                        city =>
                          city.id !== formData.main_city_id &&
                          !formData.other_city_ids.includes(city.id) &&
                          (citySearchTerm === '' ||
                            city.name.toLowerCase().includes(citySearchTerm.toLowerCase()))
                      )
                      .map(city => (
                        <button
                          key={city.id}
                          type="button"
                          onClick={() => {
                            setFormField('other_city_ids', [...formData.other_city_ids, city.id])
                            setCitySearchTerm('')
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-morandi-container/20 transition-colors"
                        >
                          {city.name}
                        </button>
                      ))}
                    {availableCities.filter(
                      city =>
                        city.id !== formData.main_city_id &&
                        !formData.other_city_ids.includes(city.id) &&
                        (citySearchTerm === '' ||
                          city.name.toLowerCase().includes(citySearchTerm.toLowerCase()))
                    ).length === 0 && (
                      <div className="px-3 py-6 text-center text-sm text-morandi-secondary">
                        無符合的城市
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-morandi-secondary mt-1">點擊城市加入，用於廠商篩選</p>
              </div>
            )}

          {/* 團體名稱 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary">團體名稱</label>
            <Input
              value={formData.name}
              onChange={e => setFormField('name', e.target.value)}
              placeholder="輸入團體名稱"
              className="mt-1"
            />
          </div>

          {/* 人數 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary">人數</label>
            <Input
              type="number"
              value={formData.group_size}
              onChange={e => {
                const value = e.target.value
                setFormField('group_size', value === '' ? '' : Number(value))
              }}
              placeholder="1"
              className="mt-1"
              min="1"
            />
          </div>

          {/* 狀態 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary">狀態</label>
            <Select value={formData.status} onValueChange={value => setFormField('status', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proposed">提案</SelectItem>
                <SelectItem value="approved">已核准</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 置頂選項 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_pinned"
                checked={formData.is_pinned}
                onChange={e => setFormField('is_pinned', e.target.checked)}
                className="h-4 w-4 rounded border-morandi-border text-morandi-gold focus:ring-morandi-gold"
              />
              <label htmlFor="is_pinned" className="text-sm text-morandi-primary cursor-pointer">
                設為置頂範本（方便複製使用）
              </label>
            </div>

            {formData.is_pinned && (
              <div>
                <label className="text-sm font-medium text-morandi-primary">商品編號（選填）</label>
                <Input
                  value={formData.code}
                  onChange={e => setFormField('code', e.target.value)}
                  placeholder="例如：JP-BASIC, EU-LUXURY"
                  className="mt-1"
                />
                <p className="text-xs text-morandi-secondary mt-1">不填寫則自動生成 Q 開頭的編號</p>
              </div>
            )}
          </div>

          {/* 動作按鈕 */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              type="submit"
              disabled={!formData.name.trim() || !formData.group_size || formData.group_size < 1}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              新增 <span className="ml-1 text-xs opacity-70">(Enter)</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
