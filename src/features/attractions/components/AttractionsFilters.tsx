import { Button } from '@/components/ui/button';

// ============================================
// 景點篩選器組件
// ============================================

interface AttractionsFiltersProps {
  selectedCountry: string;
  setSelectedCountry: (value: string) => void;
  selectedRegion: string;
  setSelectedRegion: (value: string) => void;
  selectedCity: string;
  setSelectedCity: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  countries: any[];
  availableRegions: any[];
  availableCities: any[];
  categories: string[];
}

export function AttractionsFilters({
  selectedCountry,
  setSelectedCountry,
  selectedRegion,
  setSelectedRegion,
  selectedCity,
  setSelectedCity,
  selectedCategory,
  setSelectedCategory,
  hasActiveFilters,
  clearFilters,
  countries,
  availableRegions,
  availableCities,
  categories,
}: AttractionsFiltersProps) {
  return (
    <div className="mb-4 p-4 bg-card border border-border rounded-lg flex flex-wrap gap-3">
      {/* 國家選擇 */}
      <select
        value={selectedCountry}
        onChange={(e) => {
          setSelectedCountry(e.target.value);
          setSelectedRegion('');
          setSelectedCity('');
        }}
        className="px-3 py-2 border border-border rounded-md bg-background text-sm"
      >
        <option value="">所有國家</option>
        {countries.map(country => (
          <option key={country.id} value={country.id}>
            {country.emoji} {country.name}
          </option>
        ))}
      </select>

      {/* 地區選擇（如果有） */}
      {availableRegions.length > 0 && (
        <select
          value={selectedRegion}
          onChange={(e) => {
            setSelectedRegion(e.target.value);
            setSelectedCity('');
          }}
          className="px-3 py-2 border border-border rounded-md bg-background text-sm"
        >
          <option value="">所有地區</option>
          {availableRegions.map(region => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      )}

      {/* 城市選擇 */}
      {availableCities.length > 0 && (
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background text-sm"
        >
          <option value="">所有城市</option>
          {availableCities.map(city => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      )}

      {/* 類別選擇 */}
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="px-3 py-2 border border-border rounded-md bg-background text-sm"
      >
        {categories.map(cat => (
          <option key={cat} value={cat}>
            {cat === 'all' ? '所有類別' : cat}
          </option>
        ))}
      </select>

      {/* 清除篩選 */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
        >
          清除篩選
        </Button>
      )}
    </div>
  );
}
