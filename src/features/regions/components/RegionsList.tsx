'use client'

import {
  MapPin,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Power,
  Trash2,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Country, City } from '@/stores'

type SortField = 'name' | 'airport_code' | 'display_order'
type SortDirection = 'asc' | 'desc'

// ============================================
// 排序指示器
// ============================================

interface SortIndicatorProps {
  field: SortField
  currentField: SortField
  direction: SortDirection
}

function SortIndicator({ field, currentField, direction }: SortIndicatorProps) {
  if (currentField !== field) return null
  return <span className="ml-1 text-morandi-gold">{direction === 'asc' ? '↑' : '↓'}</span>
}

// ============================================
// 地區列表
// ============================================

interface RegionsListProps {
  loading: boolean
  filteredCountries: Country[]
  expandedCountries: Set<string>
  expandedRegions: Set<string>
  sortField: SortField
  sortDirection: SortDirection
  toggleCountry: (id: string) => void
  toggleRegion: (id: string) => void
  toggleCountryStatus: (country: Country) => void
  toggleCityStatus: (city: City) => void
  handleSort: (field: SortField) => void
  handleDeleteCountry: (id: string) => void
  handleDeleteRegion: (id: string) => void
  handleDeleteCity: (id: string) => void
  onAddCountry: () => void
  onAddRegion: (countryId: string) => void
  onAddCity: (countryId: string, regionId?: string) => void
  onEditCity: (city: City) => void
  onEditImage: (city: City) => void
  getRegionsByCountry: (countryId: string) => any[]
  getCitiesByCountry: (countryId: string) => City[]
  getCitiesByRegion: (regionId: string) => City[]
  sortCities: (cities: City[]) => City[]
}

export function RegionsList({
  loading,
  filteredCountries,
  expandedCountries,
  expandedRegions,
  sortField,
  sortDirection,
  toggleCountry,
  toggleRegion,
  toggleCountryStatus,
  toggleCityStatus,
  handleSort,
  handleDeleteCountry,
  handleDeleteRegion,
  handleDeleteCity,
  onAddCountry,
  onAddRegion,
  onAddCity,
  onEditCity,
  onEditImage,
  getRegionsByCountry,
  getCitiesByCountry,
  getCitiesByRegion,
  sortCities,
}: RegionsListProps) {
  // 渲染城市行
  const renderCityRow = (city: City, isUnderRegion = true) => (
    <div
      key={city.id}
      className="border-t border-border/50 hover:bg-morandi-container/20 transition-colors"
    >
      <div className="flex items-center px-4 py-2.5">
        {/* 縮排 */}
        <div className="w-6"></div>
        <div className="w-6"></div>
        <div className={cn(isUnderRegion ? 'w-6' : 'w-4')}></div>

        {/* 國家欄位（空白） */}
        <div className="w-48 ml-2"></div>

        {/* 地區欄位（空白） */}
        <div className="w-48"></div>

        {/* 城市欄位 */}
        <div className="w-48 flex items-center">
          <div className="w-1 h-1 rounded-full bg-morandi-secondary mr-3"></div>
          <span className="text-morandi-primary">{city.name}</span>
        </div>

        {/* 機場代碼 */}
        <div className="w-32 flex items-center">
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
              city.airport_code
                ? 'bg-morandi-blue/10 text-morandi-blue'
                : 'bg-morandi-container text-morandi-muted'
            )}
          >
            {city.airport_code || '-'}
          </span>
        </div>

        {/* 城市圖片 */}
        <div className="w-32 flex items-center justify-center gap-1">
          {/* 第一張圖片 */}
          {city.background_image_url ? (
            <div className="relative group">
              <img
                src={city.background_image_url}
                alt={`${city.name} 1`}
                className="w-12 h-8 object-cover rounded border border-border"
              />
              <button
                onClick={() => onEditImage(city)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded"
              >
                <ImageIcon size={12} className="text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onEditImage(city)}
              className="w-12 h-8 border-2 border-dashed border-morandi-secondary/30 rounded flex items-center justify-center hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors"
              title="上傳圖片 1"
            >
              <Upload size={12} className="text-morandi-muted" />
            </button>
          )}

          {/* 第二張圖片 */}
          {city.background_image_url_2 ? (
            <div className="relative group">
              <img
                src={city.background_image_url_2}
                alt={`${city.name} 2`}
                className="w-12 h-8 object-cover rounded border border-border"
              />
              <button
                onClick={() => onEditImage(city)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded"
              >
                <ImageIcon size={12} className="text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onEditImage(city)}
              className="w-12 h-8 border-2 border-dashed border-morandi-secondary/30 rounded flex items-center justify-center hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors"
              title="上傳圖片 2"
            >
              <Upload size={12} className="text-morandi-muted" />
            </button>
          )}
        </div>

        {/* 空白填充 */}
        <div className="flex-1"></div>

        {/* 狀態 */}
        <div className="w-24 flex items-center justify-center">
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
              city.is_active
                ? 'bg-morandi-green/80 text-white'
                : 'bg-morandi-container text-morandi-secondary'
            )}
          >
            {city.is_active ? '啟用' : '停用'}
          </span>
        </div>

        {/* 操作 */}
        <div className="w-40 flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditCity(city)}
            className="h-8 px-2 text-morandi-blue hover:bg-morandi-blue/10"
            title="編輯"
          >
            <Edit2 size={12} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleCityStatus(city)}
            className="h-8 px-2"
            title={city.is_active ? '停用' : '啟用'}
          >
            <Power
              size={12}
              className={city.is_active ? 'text-morandi-green' : 'text-morandi-secondary'}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteCity(city.id)}
            className="h-8 px-2 hover:text-morandi-red hover:bg-morandi-red/10"
            title="刪除"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm min-h-full flex flex-col">
      {/* 表格標題行 */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-morandi-container/40 via-morandi-gold/10 to-morandi-container/40 border-b-2 border-morandi-gold/20 backdrop-blur-sm">
        <div className="flex items-center px-4 py-3">
          <div className="w-6"></div>
          <div className="w-48 text-sm font-medium text-morandi-primary ml-2">國家</div>
          <div className="w-48 text-sm font-medium text-morandi-primary">地區</div>
          <button
            onClick={() => handleSort('name')}
            className="w-48 text-sm font-medium text-morandi-primary text-left hover:text-morandi-gold transition-colors cursor-pointer"
          >
            城市 <SortIndicator field="name" currentField={sortField} direction={sortDirection} />
          </button>
          <button
            onClick={() => handleSort('airport_code')}
            className="w-32 text-sm font-medium text-morandi-primary text-left hover:text-morandi-gold transition-colors cursor-pointer"
          >
            機場代碼{' '}
            <SortIndicator
              field="airport_code"
              currentField={sortField}
              direction={sortDirection}
            />
          </button>
          <div className="w-32 text-sm font-medium text-morandi-primary text-center">城市圖片</div>
          <div className="flex-1"></div>
          <div className="w-24 text-sm font-medium text-morandi-primary text-center">狀態</div>
          <div className="w-40 text-sm font-medium text-morandi-primary text-center">操作</div>
        </div>
      </div>

      {/* 載入中 */}
      {loading && (
        <div className="text-center py-12 text-morandi-secondary">
          <MapPin size={48} className="mx-auto mb-4 opacity-50 animate-pulse" />
          <p>載入中...</p>
        </div>
      )}

      {/* 無資料 */}
      {!loading && filteredCountries.length === 0 && (
        <div className="text-center py-12 text-morandi-secondary">
          <MapPin size={48} className="mx-auto mb-4 opacity-50" />
          <p>無符合條件的地區</p>
          <Button
            onClick={onAddCountry}
            className="mt-4 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Plus size={16} className="mr-2" />
            新增第一個國家
          </Button>
        </div>
      )}

      {/* 國家列表 */}
      {!loading && filteredCountries.length > 0 && (
        <div className="flex-1">
          {filteredCountries.map(country => {
            const isCountryExpanded = expandedCountries.has(country.id)
            const countryRegions = getRegionsByCountry(country.id)
            const countryCities = getCitiesByCountry(country.id)
            const totalCities = countryCities.length

            return (
              <div key={country.id} className="border-b border-border last:border-b-0">
                {/* 國家行 */}
                <div className="hover:bg-morandi-container/20 transition-colors">
                  <div className="flex items-center px-4 py-3">
                    {/* 展開按鈕 */}
                    <div className="w-6 flex items-center justify-center">
                      <button
                        onClick={() => toggleCountry(country.id)}
                        className="p-1 hover:bg-morandi-gold/10 rounded transition-colors"
                      >
                        {isCountryExpanded ? (
                          <ChevronDown size={16} className="text-morandi-gold" />
                        ) : (
                          <ChevronRight size={16} className="text-morandi-secondary" />
                        )}
                      </button>
                    </div>

                    {/* 國家欄位 */}
                    <div className="w-48 flex items-center ml-2">
                      <span className="text-2xl mr-2">{country.emoji || '🌍'}</span>
                      <span className="font-semibold text-morandi-primary">{country.name}</span>
                    </div>

                    {/* 地區欄位 */}
                    <div className="w-48 text-sm text-morandi-muted">
                      {country.has_regions && `${countryRegions.length} 個地區`}
                    </div>

                    {/* 城市欄位 */}
                    <div className="flex-1 text-sm text-morandi-muted">{totalCities} 個城市</div>

                    {/* 狀態 */}
                    <div className="w-24 flex items-center justify-center">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                          country.is_active
                            ? 'bg-morandi-green text-white'
                            : 'bg-morandi-container text-morandi-secondary'
                        )}
                      >
                        {country.is_active ? '啟用' : '停用'}
                      </span>
                    </div>

                    {/* 操作 */}
                    <div className="w-40 flex items-center justify-end gap-1">
                      {country.has_regions ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAddRegion(country.id)}
                          className="h-8 px-2 text-morandi-blue hover:bg-morandi-blue/10"
                          title="新增地區"
                        >
                          <Plus size={14} />
                        </Button>
                      ) : (
                        <div className="h-8 w-8"></div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddCity(country.id)}
                        className="h-8 px-2 text-morandi-green hover:bg-morandi-green/10"
                        title="新增城市"
                      >
                        <Plus size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCountryStatus(country)}
                        className="h-8 px-2"
                        title={country.is_active ? '停用' : '啟用'}
                      >
                        <Power
                          size={14}
                          className={
                            country.is_active ? 'text-morandi-green' : 'text-morandi-secondary'
                          }
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCountry(country.id)}
                        className="h-8 px-2 hover:text-morandi-red hover:bg-morandi-red/10"
                        title="刪除"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 展開內容：地區 or 城市 */}
                {isCountryExpanded && (
                  <div className="bg-morandi-container/5">
                    {country.has_regions
                      ? // 有地區分類
                        countryRegions.map(region => {
                          const isRegionExpanded = expandedRegions.has(region.id)
                          const regionCities = getCitiesByRegion(region.id)

                          return (
                            <div key={region.id} className="border-t border-border/50">
                              {/* 地區行 */}
                              <div className="hover:bg-morandi-container/20 transition-colors">
                                <div className="flex items-center px-4 py-2.5">
                                  <div className="w-6"></div>
                                  <div className="w-6 flex items-center justify-center">
                                    <button
                                      onClick={() => toggleRegion(region.id)}
                                      className="p-1 hover:bg-morandi-gold/10 rounded transition-colors"
                                    >
                                      {isRegionExpanded ? (
                                        <ChevronDown size={14} className="text-morandi-gold" />
                                      ) : (
                                        <ChevronRight
                                          size={14}
                                          className="text-morandi-secondary"
                                        />
                                      )}
                                    </button>
                                  </div>

                                  <div className="w-48 ml-2"></div>

                                  <div className="w-48 flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-morandi-gold mr-3"></div>
                                    <span className="font-medium text-morandi-primary">
                                      {region.name}
                                    </span>
                                  </div>

                                  <div className="flex-1 text-sm text-morandi-muted">
                                    {regionCities.length} 個城市
                                  </div>

                                  <div className="w-24"></div>

                                  <div className="w-40 flex items-center justify-end gap-1">
                                    <div className="h-8 w-8"></div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onAddCity(country.id, region.id)}
                                      className="h-8 px-2 text-morandi-green hover:bg-morandi-green/10"
                                      title="新增城市"
                                    >
                                      <Plus size={14} />
                                    </Button>
                                    <div className="h-8 w-8"></div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteRegion(region.id)}
                                      className="h-8 px-2 hover:text-morandi-red hover:bg-morandi-red/10"
                                      title="刪除"
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* 地區的城市列表 */}
                              {isRegionExpanded && regionCities.length > 0 && (
                                <div className="bg-morandi-container/10">
                                  {sortCities(regionCities).map(city => renderCityRow(city))}
                                </div>
                              )}
                            </div>
                          )
                        })
                      : // 無地區分類，直接顯示城市
                        sortCities(countryCities).map(city => renderCityRow(city, false))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
