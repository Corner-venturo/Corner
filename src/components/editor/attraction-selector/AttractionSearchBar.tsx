'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, PenLine, Plus } from 'lucide-react'

interface City {
  id: string
  name: string
}

interface Country {
  id: string
  name: string
}

interface AttractionSearchBarProps {
  countries: Country[]
  cities: City[]
  selectedCountryId: string
  selectedCityId: string
  searchQuery: string
  showManualInput: boolean
  manualAttractionName: string
  onCountryChange: (countryId: string) => void
  onCityChange: (cityId: string) => void
  onSearchChange: (query: string) => void
  onToggleManualInput: () => void
  onManualAttractionChange: (name: string) => void
  onManualAdd: () => void
}

export function AttractionSearchBar({
  countries,
  cities,
  selectedCountryId,
  selectedCityId,
  searchQuery,
  showManualInput,
  manualAttractionName,
  onCountryChange,
  onCityChange,
  onSearchChange,
  onToggleManualInput,
  onManualAttractionChange,
  onManualAdd,
}: AttractionSearchBarProps) {
  return (
    <div className="p-4 space-y-3">
      {/* 篩選區 */}
      <div className="flex gap-2 flex-wrap">
        {/* 國家選擇 */}
        <Select value={selectedCountryId || '__all__'} onValueChange={onCountryChange}>
          <SelectTrigger className="h-9 px-3 border-morandi-container rounded-lg text-sm bg-white min-w-[120px]">
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

        {/* 城市選擇 */}
        {selectedCountryId && cities.length > 0 && (
          <Select value={selectedCityId || '__all__'} onValueChange={onCityChange}>
            <SelectTrigger className="h-9 px-3 border-morandi-container rounded-lg text-sm bg-white min-w-[120px]">
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

        {/* 手動新增按鈕 */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleManualInput}
          className={`rounded-lg h-9 gap-1 ${showManualInput ? 'bg-morandi-gold/10 border-morandi-gold/30' : ''}`}
        >
          <PenLine size={14} />
          手動
        </Button>
      </div>

      {/* 搜尋框 */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-muted"
          size={16}
        />
        <Input
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="搜尋景點名稱..."
          className="pl-9 h-9 rounded-lg border-morandi-container"
        />
      </div>

      {/* 手動輸入區 */}
      {showManualInput && (
        <div className="flex gap-2 p-2 bg-morandi-gold/5 border border-morandi-gold/20 rounded-lg">
          <Input
            value={manualAttractionName}
            onChange={e => onManualAttractionChange(e.target.value)}
            placeholder="輸入景點名稱..."
            className="flex-1 h-8 rounded-md text-sm"
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
            disabled={!manualAttractionName.trim()}
            size="sm"
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-md h-8 px-3"
          >
            <Plus size={14} />
          </Button>
        </div>
      )}
    </div>
  )
}
