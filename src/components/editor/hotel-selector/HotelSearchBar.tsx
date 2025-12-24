import React from 'react'
import { Search, PenLine, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface HotelSearchBarProps {
  // Filters
  countries: { id: string; name: string }[]
  regions: { id: string; name: string }[]
  cities: { id: string; name: string }[]
  brands: string[]

  // Selected values
  selectedCountryId: string
  selectedRegionId: string
  selectedCityId: string
  selectedBrand: string
  searchQuery: string

  // Handlers
  onCountryChange: (id: string) => void
  onRegionChange: (id: string) => void
  onCityChange: (id: string) => void
  onBrandChange: (brand: string) => void
  onSearchChange: (query: string) => void

  // Manual input
  showManualInput: boolean
  manualHotelName: string
  onToggleManualInput: () => void
  onManualInputChange: (name: string) => void
  onManualAdd: () => void
}

export function HotelSearchBar({
  countries,
  regions,
  cities,
  brands,
  selectedCountryId,
  selectedRegionId,
  selectedCityId,
  selectedBrand,
  searchQuery,
  onCountryChange,
  onRegionChange,
  onCityChange,
  onBrandChange,
  onSearchChange,
  showManualInput,
  manualHotelName,
  onToggleManualInput,
  onManualInputChange,
  onManualAdd,
}: HotelSearchBarProps) {
  return (
    <div className="space-y-4">
      {/* 篩選區 - 第一排：國家、區域、城市、品牌、搜尋 */}
      <div className="flex gap-3 flex-wrap">
        {/* 國家選擇 */}
        <Select value={selectedCountryId || '__all__'} onValueChange={onCountryChange}>
          <SelectTrigger className="h-11 px-4 border-morandi-container rounded-xl text-sm bg-white min-w-[120px] focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500">
            <SelectValue placeholder="全部國家" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部國家</SelectItem>
            {countries.map(country => (
              <SelectItem key={country.id} value={country.id}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 區域選擇 */}
        {selectedCountryId && regions.length > 0 && (
          <Select value={selectedRegionId || '__all__'} onValueChange={onRegionChange}>
            <SelectTrigger className="h-11 px-4 border-morandi-container rounded-xl text-sm bg-white min-w-[120px] focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500">
              <SelectValue placeholder="全部區域" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全部區域</SelectItem>
              {regions.map(region => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* 城市選擇 */}
        {selectedCountryId && cities.length > 0 && (
          <Select value={selectedCityId || '__all__'} onValueChange={onCityChange}>
            <SelectTrigger className="h-11 px-4 border-morandi-container rounded-xl text-sm bg-white min-w-[120px] focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500">
              <SelectValue placeholder="全部城市" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全部城市</SelectItem>
              {cities.map(city => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* 品牌選擇 */}
        <Select value={selectedBrand || '__all__'} onValueChange={onBrandChange}>
          <SelectTrigger className="h-11 px-4 border-morandi-container rounded-xl text-sm bg-white min-w-[140px] focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500">
            <SelectValue placeholder="全部品牌" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部品牌</SelectItem>
            {brands.map(brand => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 搜尋框 */}
        <div className="flex-1 relative min-w-[180px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="搜尋飯店..."
            className="pl-10 h-11 rounded-xl border-morandi-container focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          />
        </div>

        {/* 手動新增按鈕 */}
        <Button
          type="button"
          variant="outline"
          onClick={onToggleManualInput}
          className={`rounded-xl h-11 gap-1.5 ${showManualInput ? 'bg-amber-50 border-amber-300' : ''}`}
        >
          <PenLine size={16} />
          手動輸入
        </Button>
      </div>

      {/* 手動輸入區 */}
      {showManualInput && (
        <div className="flex gap-2 p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
          <Input
            value={manualHotelName}
            onChange={e => onManualInputChange(e.target.value)}
            placeholder="輸入飯店名稱..."
            className="flex-1 h-10 rounded-lg border-amber-200 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onManualAdd()
              }
            }}
            autoFocus
          />
          <Button
            type="button"
            onClick={onManualAdd}
            disabled={!manualHotelName.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg h-10 px-4 gap-1.5"
          >
            <Plus size={16} />
            新增
          </Button>
        </div>
      )}
    </div>
  )
}
