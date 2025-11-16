'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Users, Car, Home, UtensilsCrossed, MapPin, MoreHorizontal, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CostCategory, CostItem } from '../types'
import { CostItemRow } from './CostItemRow'
import { AccommodationItemRow } from './AccommodationItemRow'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'

const categoryIcons: Record<string, React.ElementType> = {
  transport: Car,
  'group-transport': Users,
  accommodation: Home,
  meals: UtensilsCrossed,
  activities: MapPin,
  others: MoreHorizontal,
  guide: Users,
}

interface TransportationRate {
  id: string
  country_id: string
  country_name: string
  vehicle_type: string
  price: number
  currency: string
  unit: string
  notes: string | null
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
  handleAddGuideRow: (categoryId: string) => void
  handleAddAdultTicket: (categoryId: string) => void
  handleAddChildTicket: (categoryId: string) => void
  handleAddInfantTicket: (categoryId: string) => void
  handleUpdateItem: (
    categoryId: string,
    itemId: string,
    field: keyof CostItem,
    value: unknown
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
  handleAddGuideRow,
  handleAddAdultTicket,
  handleAddChildTicket,
  handleAddInfantTicket,
  handleUpdateItem,
  handleRemoveItem,
}) => {
  const Icon = categoryIcons[category.id]
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [transportRates, setTransportRates] = useState<TransportationRate[]>([])
  const [loading, setLoading] = useState(false)

  // 載入國家列表
  useEffect(() => {
    const fetchCountries = async () => {
      const { data } = await supabase
        .from('countries')
        .select('id, name, emoji')
        .order('display_order')

      if (data) setCountries(data)
    }
    fetchCountries()
  }, [])

  // 當選擇國家時載入該國家的車資資料
  useEffect(() => {
    if (!selectedCountry) {
      setTransportRates([])
      return
    }

    const fetchRates = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('transportation_rates')
        .select('*')
        .eq('country_id', selectedCountry)
        .eq('is_active', true)
        .order('display_order')

      if (data) setTransportRates(data)
      setLoading(false)
    }
    fetchRates()
  }, [selectedCountry])

  return (
    <React.Fragment>
      {/* 分類標題行 */}
      <tr className="bg-morandi-container/20 border-b border-border/40">
        <td colSpan={2} className="py-3 px-4 text-sm font-medium text-morandi-primary">
          <div className="flex items-center space-x-2">
            <Icon size={16} className="text-morandi-gold" />
            <span>{category.name}</span>

            {/* 參考報價圖示 - 僅顯示於交通和團體交通分類 */}
            {(category.id === 'transport' || category.id === 'group-transport') && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="p-1 hover:bg-morandi-gold/10 rounded transition-colors"
                    title="查看參考報價"
                  >
                    <DollarSign size={14} className="text-morandi-gold" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-96" align="start">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-morandi-primary">
                      參考報價
                    </h4>

                    {/* 國家選擇 */}
                    <div>
                      <label className="text-xs text-morandi-secondary mb-1.5 block">
                        選擇國家
                      </label>
                      <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="請選擇國家" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map(country => (
                            <SelectItem key={country.id} value={country.id}>
                              {country.emoji} {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 車資列表 */}
                    {loading ? (
                      <div className="text-sm text-morandi-secondary text-center py-4">
                        載入中...
                      </div>
                    ) : transportRates.length > 0 ? (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {transportRates.map(rate => (
                          <div
                            key={rate.id}
                            className="flex items-center justify-between py-2 px-3 bg-morandi-container/30 rounded text-sm"
                          >
                            <div className="flex-1">
                              <div className="text-morandi-primary font-medium">
                                {rate.vehicle_type}
                              </div>
                              {rate.notes && (
                                <div className="text-xs text-morandi-secondary mt-0.5">
                                  {rate.notes}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <span className="font-medium text-morandi-gold">
                                {rate.currency} {rate.price.toLocaleString()}
                              </span>
                              <span className="text-xs text-morandi-secondary">
                                / {rate.unit}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : selectedCountry ? (
                      <div className="text-sm text-morandi-secondary text-center py-4">
                        此國家尚無車資資料
                      </div>
                    ) : (
                      <div className="text-sm text-morandi-secondary text-center py-4">
                        請先選擇國家
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
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
                成人機票
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
                小孩機票
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
                嬰兒機票
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
                // 機票小計：只計算成人機票
                const adultTicketTotal = category.items
                  .filter(item => item.name === '成人機票')
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
    </React.Fragment>
  )
}
