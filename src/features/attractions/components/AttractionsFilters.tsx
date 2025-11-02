import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'

// ============================================
// 景點篩選器組件
// ============================================

interface AttractionsFiltersProps {
  selectedCountry: string
  setSelectedCountry: (value: string) => void
  selectedRegion: string
  setSelectedRegion: (value: string) => void
  selectedCity: string
  setSelectedCity: (value: string) => void
  hasActiveFilters: boolean
  clearFilters: () => void
  countries: any[]
  availableRegions: any[]
  availableCities: any[]
}

export function AttractionsFilters({
  selectedCountry,
  setSelectedCountry,
  selectedRegion,
  setSelectedRegion,
  selectedCity,
  setSelectedCity,
  hasActiveFilters,
  clearFilters,
  countries,
  availableRegions,
  availableCities,
}: AttractionsFiltersProps) {
  return (
    <div className="mb-4 p-4 bg-card border border-border rounded-lg flex flex-wrap gap-3 items-end">
      {/* 國家選擇 */}
      <div className="min-w-[200px]">
        <Combobox
          value={selectedCountry}
          onChange={value => {
            setSelectedCountry(value)
            setSelectedRegion('')
            setSelectedCity('')
          }}
          options={[
            { value: '', label: '所有國家' },
            ...countries.map(country => ({
              value: country.id,
              label: `${country.emoji} ${country.name}`,
            })),
          ]}
          placeholder="選擇國家..."
          emptyMessage="找不到符合的國家"
          showSearchIcon={true}
          showClearButton={true}
        />
      </div>

      {/* 地區選擇（如果有） */}
      {availableRegions.length > 0 && (
        <div className="min-w-[180px]">
          <Combobox
            value={selectedRegion}
            onChange={value => {
              setSelectedRegion(value)
              setSelectedCity('')
            }}
            options={[
              { value: '', label: '所有地區' },
              ...availableRegions.map(region => ({
                value: region.id,
                label: region.name,
              })),
            ]}
            placeholder="選擇地區..."
            emptyMessage="找不到符合的地區"
            showSearchIcon={true}
            showClearButton={true}
          />
        </div>
      )}

      {/* 城市選擇 */}
      {availableCities.length > 0 && (
        <div className="min-w-[180px]">
          <Combobox
            value={selectedCity}
            onChange={setSelectedCity}
            options={[
              { value: '', label: '所有城市' },
              ...availableCities.map(city => ({
                value: city.id,
                label: city.name,
              })),
            ]}
            placeholder="選擇城市..."
            emptyMessage="找不到符合的城市"
            showSearchIcon={true}
            showClearButton={true}
          />
        </div>
      )}

      {/* 清除篩選 */}
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          清除篩選
        </Button>
      )}
    </div>
  )
}
