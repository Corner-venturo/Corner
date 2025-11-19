'use client'

import { logger } from '@/lib/utils/logger'
import React, { useState, useEffect } from 'react'
import { Plus, Users, Car, Home, UtensilsCrossed, MapPin, MoreHorizontal, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CostCategory, CostItem } from '../types'
import { CostItemRow } from './CostItemRow'
import { AccommodationItemRow } from './AccommodationItemRow'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { RatesDetailDialog } from '@/features/transportation-rates/components/RatesDetailDialog'
import { TransportationRate } from '@/types/transportation-rates.types'

const categoryIcons: Record<string, React.ElementType> = {
  transport: Car,
  'group-transport': Users,
  accommodation: Home,
  meals: UtensilsCrossed,
  activities: MapPin,
  others: MoreHorizontal,
  guide: Users,
}

interface CategoryTransportationRate {
  id: string
  country_id: string
  country_name: string
  vehicle_type: string
  price: number
  price_twd?: number
  currency: string
  unit: string
  notes: string | null
  route?: string
  category?: string
}

interface Country {
  id: string
  name: string
  emoji: string | null
}

interface CategorySectionProps {
  category: CostCategory
  accommodationTotal: number
  accommodationDays: number
  isReadOnly: boolean
  handleAddAccommodationDay: () => void
  handleAddRow: (categoryId: string) => void
  handleInsertItem: (categoryId: string, item: CostItem) => void
  handleAddGuideRow: (categoryId: string) => void
  handleAddAdultTicket: (categoryId: string) => void
  handleAddChildTicket: (categoryId: string) => void
  handleAddInfantTicket: (categoryId: string) => void
  handleUpdateItem: (
    categoryId: string,
    itemId: string,
    field: keyof CostItem,
    value: string | number | boolean
  ) => void
  handleRemoveItem: (categoryId: string, itemId: string) => void
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  accommodationTotal,
  accommodationDays,
  isReadOnly,
  handleAddAccommodationDay,
  handleAddRow,
  handleInsertItem,
  handleAddGuideRow,
  handleAddAdultTicket,
  handleAddChildTicket,
  handleAddInfantTicket,
  handleUpdateItem,
  handleRemoveItem,
}) => {
  const Icon = categoryIcons[category.id]

  // 對話框狀態
  const [isCountryDialogOpen, setIsCountryDialogOpen] = useState(false)
  const [isRatesDialogOpen, setIsRatesDialogOpen] = useState(false)
  const [countries, setCountries] = useState<Array<{ name: string }>>([])
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [transportRates, setTransportRates] = useState<CategoryTransportationRate[]>([])
  const [loading, setLoading] = useState(false)

  // 載入車資資料庫中有資料的國家列表
  const fetchCountriesWithRates = async () => {
    if (countries.length > 0) {
      setIsCountryDialogOpen(true)
      return
    }

    const { data } = await supabase
      .from('transportation_rates')
      .select('country_name')
      .eq('is_active', true)

    if (data) {
      const ratesData = data as Array<{ country_name: string }>
      const uniqueCountries = Array.from(
        new Set(ratesData.map(item => item.country_name))
      ).map(name => ({ name }))
      setCountries(uniqueCountries)
      setIsCountryDialogOpen(true)
    }
  }

  // 當選擇國家時載入該國家的車資資料
  const handleCountrySelect = async (countryName: string) => {
    setSelectedCountry(countryName)
    setLoading(true)

    const { data } = await supabase
      .from('transportation_rates')
      .select('*')
      .eq('country_name', countryName)
      .eq('is_active', true)
      .order('display_order')

    if (data) {
      setTransportRates(data as CategoryTransportationRate[])
      setIsCountryDialogOpen(false)
      setIsRatesDialogOpen(true)
    }
    setLoading(false)
  }

  // 重新載入車資資料
  const refreshRates = async () => {
    if (!selectedCountry) return

    const { data } = await supabase
      .from('transportation_rates')
      .select('*')
      .eq('country_name', selectedCountry)
      .eq('is_active', true)
      .order('display_order')

    if (data) setTransportRates(data as CategoryTransportationRate[])
  }

  // 插入車資到團體分攤
  const handleInsertRate = (rate: CategoryTransportationRate) => {
    logger.log('🔄 [CategorySection] 插入車資:', rate)

    // 建立描述：使用 route（例如「包車1天（100公里／10小時）」）
    const description = rate.route || rate.category || rate.vehicle_type || '車資'

    // 建立完整的 CostItem
    const newItem: CostItem = {
      id: `item-${Date.now()}`,
      name: description,
      quantity: 1,
      unit_price: rate.price_twd || 0,
      total: rate.price_twd || 0,
      note: rate.notes || '',
      is_group_cost: true, // 標記為團體費用
    }

    logger.log('📝 [CategorySection] 插入項目:', newItem)

    // 直接插入完整項目
    handleInsertItem('group-transport', newItem)

    // 關閉對話框
    setIsRatesDialogOpen(false)
  }

  return (
    <React.Fragment>
      {/* 分類標題行 */}
      <tr className="bg-morandi-container/20 border-b border-border/40">
        <td colSpan={2} className="py-3 px-4 text-sm font-medium text-morandi-primary">
          <div className="flex items-center space-x-2">
            <Icon size={16} className="text-morandi-gold" />
            <span>{category.name}</span>

            {/* 參考報價圖示 - 僅顯示於團體分攤分類 */}
            {category.id === 'group-transport' && (
              <button
                className="p-1 hover:bg-morandi-gold/10 rounded transition-colors"
                title="查看參考報價"
                onClick={fetchCountriesWithRates}
              >
                <DollarSign size={14} className="text-morandi-gold" />
              </button>
            )}
          </div>
        </td>
        <td className="py-3 px-4"></td>
        <td className="py-3 px-4"></td>
        <td className="py-3 px-4"></td>
        <td className="py-3 px-4 text-right">
          {category.id === 'accommodation' ? (
            <div className="flex gap-1 justify-end">
              <Button
                variant="ghost"
                size="xs"
                onClick={handleAddAccommodationDay}
                disabled={isReadOnly}
                className={cn(
                  'text-morandi-gold hover:bg-morandi-gold/10',
                  isReadOnly && 'cursor-not-allowed opacity-60'
                )}
              >
                <Plus size={12} className="mr-1" />
                新增天數
              </Button>
              {accommodationDays > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleAddRow(category.id)}
                  disabled={isReadOnly}
                  className={cn(
                    'text-morandi-secondary hover:bg-morandi-gold/10',
                    isReadOnly && 'cursor-not-allowed opacity-60'
                  )}
                >
                  <Plus size={12} className="mr-1" />
                  新增
                </Button>
              )}
            </div>
          ) : category.id === 'group-transport' ? (
            <div className="flex gap-1 justify-end">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleAddRow(category.id)}
                disabled={isReadOnly}
                className={cn(
                  'text-morandi-gold hover:bg-morandi-gold/10',
                  isReadOnly && 'cursor-not-allowed opacity-60'
                )}
              >
                <Plus size={12} className="mr-1" />
                新增
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleAddGuideRow(category.id)}
                disabled={isReadOnly}
                className={cn(
                  'text-morandi-secondary hover:bg-morandi-gold/10',
                  isReadOnly && 'cursor-not-allowed opacity-60'
                )}
              >
                <Users size={12} className="mr-1" />
                新增
              </Button>
            </div>
          ) : category.id === 'transport' ? (
            <div className="flex gap-1 justify-end">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleAddAdultTicket(category.id)}
                disabled={isReadOnly}
                className={cn(
                  'text-morandi-gold hover:bg-morandi-gold/10',
                  isReadOnly && 'cursor-not-allowed opacity-60'
                )}
              >
                <Plus size={12} className="mr-1" />
                成人
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleAddChildTicket(category.id)}
                disabled={isReadOnly}
                className={cn(
                  'text-morandi-secondary hover:bg-morandi-gold/10',
                  isReadOnly && 'cursor-not-allowed opacity-60'
                )}
              >
                <Plus size={12} className="mr-1" />
                兒童
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleAddInfantTicket(category.id)}
                disabled={isReadOnly}
                className={cn(
                  'text-morandi-secondary hover:bg-morandi-gold/10',
                  isReadOnly && 'cursor-not-allowed opacity-60'
                )}
              >
                <Plus size={12} className="mr-1" />
                嬰兒
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleAddRow(category.id)}
                disabled={isReadOnly}
                className={cn(
                  'text-morandi-secondary hover:bg-morandi-gold/10',
                  isReadOnly && 'cursor-not-allowed opacity-60'
                )}
              >
                <Plus size={12} className="mr-1" />
                其他
              </Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleAddRow(category.id)}
                disabled={isReadOnly}
                className={cn(
                  'text-morandi-gold hover:bg-morandi-gold/10',
                  isReadOnly && 'cursor-not-allowed opacity-60'
                )}
              >
                <Plus size={12} className="mr-1" />
                新增
              </Button>
            </div>
          )}
        </td>
      </tr>

      {/* 項目明細行 */}
      {category.id === 'accommodation'
        ? // 住宿特殊渲染：按天分組，每天內顯示各房型
          (() => {
            const accommodationItems = category.items.filter(item => item.day !== undefined)
            const groupedByDay: Record<number, CostItem[]> = {}

            // 按天分組
            accommodationItems.forEach(item => {
              const day = item.day!
              if (!groupedByDay[day]) groupedByDay[day] = []
              groupedByDay[day].push(item)
            })

            return Object.keys(groupedByDay)
              .sort((a, b) => Number(a) - Number(b))
              .map(dayStr => {
                const day = Number(dayStr)
                const dayItems = groupedByDay[day]

                return dayItems.map((item, roomIndex) => (
                  <AccommodationItemRow
                    key={item.id}
                    item={item}
                    categoryId={category.id}
                    day={day}
                    roomIndex={roomIndex}
                    handleUpdateItem={handleUpdateItem}
                    handleRemoveItem={handleRemoveItem}
                  />
                ))
              })
          })()
        : // 一般分類的渲染
          category.items.map(item => (
            <CostItemRow
              key={item.id}
              item={item}
              categoryId={category.id}
              handleUpdateItem={handleUpdateItem}
              handleRemoveItem={handleRemoveItem}
            />
          ))}

      {/* 小計行 - 只有當該分類有項目時才顯示 */}
      {category.items.length > 0 && (
        <tr className="bg-morandi-container/10 border-b border-border">
          <td
            colSpan={4}
            className="py-2 px-4 text-right text-sm font-medium text-morandi-secondary"
          >
            小計
          </td>
          <td className="py-2 px-4 text-center text-sm font-bold text-morandi-primary">
            {(() => {
              if (category.id === 'accommodation') {
                return accommodationTotal.toLocaleString()
              } else if (category.id === 'transport') {
                // 機票小計：只計算成人
                const adultTicketTotal = category.items
                  .filter(item => item.name === '成人')
                  .reduce((sum, item) => sum + (item.total || 0), 0)
                return adultTicketTotal.toLocaleString()
              } else {
                return category.items
                  .reduce((sum, item) => sum + (item.total || 0), 0)
                  .toLocaleString()
              }
            })()}
          </td>
          <td className="py-2 px-4"></td>
        </tr>
      )}

      {/* 選擇國家對話框 */}
      <Dialog open={isCountryDialogOpen} onOpenChange={setIsCountryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>選擇國家</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loading ? (
              <div className="text-center py-8 text-morandi-secondary">
                載入中...
              </div>
            ) : countries.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {countries.map(country => (
                  <Button
                    key={country.name}
                    variant="outline"
                    className="h-auto py-4 text-base"
                    onClick={() => handleCountrySelect(country.name)}
                  >
                    {country.name}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-morandi-secondary">
                車資管理中尚無任何國家資料
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 車資管理表格對話框 */}
      {selectedCountry && (
        <RatesDetailDialog
          isOpen={isRatesDialogOpen}
          onClose={() => setIsRatesDialogOpen(false)}
          countryName={selectedCountry}
          rates={transportRates as unknown as TransportationRate[]}
          onUpdate={refreshRates}
          onInsert={handleInsertRate as unknown as (rate: TransportationRate) => void}
          isEditMode={false}
        />
      )}
    </React.Fragment>
  )
}
