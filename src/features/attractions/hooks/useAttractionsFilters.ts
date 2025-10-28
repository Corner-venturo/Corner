import { useState, useMemo } from 'react';
import { Attraction, SortField, SortDirection } from '../types';

// ============================================
// Hook: 篩選和排序邏輯
// ============================================

interface UseAttractionsFiltersProps {
  attractions: Attraction[];
  cities: any[];
}

export function useAttractionsFilters({ attractions, cities }: UseAttractionsFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // 排序處理
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 同一欄位：null → asc → desc → null
      setSortDirection(
        sortDirection === null ? 'asc' : sortDirection === 'asc' ? 'desc' : null
      );
      if (sortDirection === 'desc') {
        setSortField(null);
      }
    } else {
      // 不同欄位：直接設為 asc
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 清除篩選
  const clearFilters = () => {
    setSelectedCountry('');
    setSelectedRegion('');
    setSelectedCity('');
    setSelectedCategory('all');
  };

  // 過濾資料（包含搜尋、國家、地區、城市、類別）
  const filteredAttractions = useMemo(() => {
    return attractions.filter(attr => {
      // 搜尋過濾
      if (searchTerm) {
        const matchSearch =
          attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          attr.name_en?.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchSearch) return false;
      }

      // 地區過濾
      if (selectedCity) {
        if (attr.city_id !== selectedCity) return false;
      } else if (selectedRegion) {
        if (attr.region_id !== selectedRegion) return false;
      } else if (selectedCountry) {
        if (attr.country_id !== selectedCountry) return false;
      }

      // 類別過濾
      if (selectedCategory !== 'all') {
        if (attr.category !== selectedCategory) return false;
      }

      return true;
    });
  }, [attractions, searchTerm, selectedCountry, selectedRegion, selectedCity, selectedCategory]);

  // 排序資料
  const sortedAttractions = useMemo(() => {
    return [...filteredAttractions].sort((a, b) => {
      if (!sortField || !sortDirection) return 0;

      let compareA: any;
      let compareB: any;

      switch (sortField) {
        case 'name':
          compareA = a.name;
          compareB = b.name;
          break;
        case 'city':
          const cityA = cities.find(c => c.id === a.city_id);
          const cityB = cities.find(c => c.id === b.city_id);
          compareA = cityA?.name || '';
          compareB = cityB?.name || '';
          break;
        case 'category':
          compareA = a.category || '';
          compareB = b.category || '';
          break;
        case 'duration':
          compareA = a.duration_minutes || 0;
          compareB = b.duration_minutes || 0;
          break;
        default:
          return 0;
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredAttractions, sortField, sortDirection, cities]);

  // 是否有套用篩選
  const hasActiveFilters = selectedCountry || selectedRegion || selectedCity || selectedCategory !== 'all';

  return {
    // 搜尋
    searchTerm,
    setSearchTerm,
    // 篩選
    selectedCountry,
    setSelectedCountry,
    selectedRegion,
    setSelectedRegion,
    selectedCity,
    setSelectedCity,
    selectedCategory,
    setSelectedCategory,
    clearFilters,
    hasActiveFilters,
    // 排序
    sortField,
    sortDirection,
    handleSort,
    // 結果
    sortedAttractions,
  };
}
