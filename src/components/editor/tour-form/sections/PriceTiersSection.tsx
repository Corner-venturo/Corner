'use client'

import React from 'react'
import { TourFormData, PriceTier } from '../types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Users, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PriceTiersSectionProps {
  data: TourFormData
  onChange: (data: TourFormData) => void
}

// 格式化價格（加千分位逗號）
const formatPrice = (value: string): string => {
  // 移除非數字字元
  const numericValue = value.replace(/[^\d]/g, '')
  if (!numericValue) return ''
  // 加上千分位逗號
  return Number(numericValue).toLocaleString('en-US')
}

// 解析價格（移除逗號）
const parsePrice = (value: string): string => {
  return value.replace(/,/g, '')
}

// 預設價格方案
const getDefaultPriceTiers = (): PriceTier[] => [
  {
    label: '4人包團',
    sublabel: '每人',
    price: '',
    priceNote: '起',
    addon: '加購1日包車 / 每人+NT$900',
  },
  {
    label: '6人包團',
    sublabel: '每人',
    price: '',
    priceNote: '起',
    addon: '加購1日包車 / 每人+NT$800',
  },
  {
    label: '8人包團',
    sublabel: '每人',
    price: '',
    priceNote: '起',
    addon: '加購1日包車 / 每人+NT$600',
  },
]

export function PriceTiersSection({ data, onChange }: PriceTiersSectionProps) {
  const priceTiers = data.priceTiers || getDefaultPriceTiers()

  // 更新價格方案
  const updatePriceTier = (index: number, updates: Partial<PriceTier>) => {
    const newTiers = [...priceTiers]
    newTiers[index] = { ...newTiers[index], ...updates }
    onChange({ ...data, priceTiers: newTiers })
  }

  // 新增價格方案
  const addPriceTier = () => {
    const newTiers = [
      ...priceTiers,
      {
        label: `${priceTiers.length + 4}人包團`,
        sublabel: '每人',
        price: '',
        priceNote: '起',
        addon: '',
      },
    ]
    onChange({ ...data, priceTiers: newTiers })
  }

  // 刪除價格方案
  const removePriceTier = (index: number) => {
    if (priceTiers.length <= 1) return
    const newTiers = priceTiers.filter((_, i) => i !== index)
    onChange({ ...data, priceTiers: newTiers })
  }

  return (
    <div className="space-y-6">
      {/* 區塊標題 */}
      <h2 className="text-lg font-bold text-morandi-primary border-b-2 border-morandi-gold pb-1">
        價格方案
      </h2>

      {/* 顯示開關 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-morandi-primary" />
          <div>
            <h3 className="font-medium text-morandi-primary">多人數價格方案</h3>
            <p className="text-sm text-morandi-secondary">
              顯示不同人數的包團價格（4人、6人、8人等）
            </p>
          </div>
        </div>
        <Switch
          checked={data.showPriceTiers || false}
          onCheckedChange={(checked) => {
            onChange({
              ...data,
              showPriceTiers: checked,
              priceTiers: checked && !data.priceTiers ? getDefaultPriceTiers() : data.priceTiers,
            })
          }}
        />
      </div>

      {/* 主內容區域 */}
      {data.showPriceTiers && (
        <div className="space-y-4">
          {/* 價格方案列表 - 根據數量自適應 */}
          <div className={cn(
            'grid gap-4',
            priceTiers.length === 1 && 'grid-cols-1',
            priceTiers.length === 2 && 'grid-cols-1 md:grid-cols-2',
            priceTiers.length >= 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          )}>
            {priceTiers.map((tier, index) => (
              <div
                key={index}
                className="p-4 border border-morandi-container rounded-lg bg-white space-y-3"
              >
                {/* 標題列 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-300" />
                    <span className="text-sm font-medium text-morandi-secondary">
                      方案 {index + 1}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePriceTier(index)}
                    disabled={priceTiers.length <= 1}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* 方案名稱 */}
                <div>
                  <Label className="text-xs text-morandi-secondary">方案名稱</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={tier.label}
                      onChange={(e) => updatePriceTier(index, { label: e.target.value })}
                      placeholder="如：4人包團"
                      className="flex-1"
                    />
                    <Input
                      value={tier.sublabel || ''}
                      onChange={(e) => updatePriceTier(index, { sublabel: e.target.value })}
                      placeholder="每人"
                      className="w-20"
                    />
                  </div>
                </div>

                {/* 價格 */}
                <div>
                  <Label className="text-xs text-morandi-secondary">價格</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-morandi-secondary">NT$</span>
                    <Input
                      value={formatPrice(tier.price)}
                      onChange={(e) => {
                        // 儲存時移除逗號，只保留數字
                        const rawValue = parsePrice(e.target.value)
                        updatePriceTier(index, { price: rawValue })
                      }}
                      placeholder="34,500"
                      className="flex-1"
                    />
                    <Input
                      value={tier.priceNote || ''}
                      onChange={(e) => updatePriceTier(index, { priceNote: e.target.value })}
                      placeholder="起"
                      className="w-16"
                    />
                  </div>
                </div>

                {/* 加購說明 */}
                <div>
                  <Label className="text-xs text-morandi-secondary">加購說明（選填）</Label>
                  <Input
                    value={tier.addon || ''}
                    onChange={(e) => updatePriceTier(index, { addon: e.target.value })}
                    placeholder="如：加購1日包車 / 每人+NT$900"
                    className="mt-1"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 新增按鈕 */}
          <Button
            type="button"
            variant="outline"
            onClick={addPriceTier}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            新增價格方案
          </Button>

          {/* 預覽提示 */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              💡 價格方案會顯示在行程頁面的「團費說明」區塊，建議設定至少 2-3 個不同人數的方案。
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
