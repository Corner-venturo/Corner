'use client';

import { useState, useCallback } from 'react';
import type { City } from '@/stores';

type SortField = 'name' | 'airport_code' | 'display_order';
type SortDirection = 'asc' | 'desc';

/**
 * 地區層級關係管理 Hook
 * 負責展開/收起狀態、排序、篩選等 UI 邏輯
 */
export function useRegionsHierarchy() {
  // 展開狀態
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());

  // 排序狀態
  const [sortField, setSortField] = useState<SortField>('display_order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // 搜尋
  const [searchTerm, setSearchTerm] = useState('');

  // 切換展開/收起
  const toggleCountry = useCallback((countryId: string) => {
    setExpandedCountries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(countryId)) {
        newSet.delete(countryId);
      } else {
        newSet.add(countryId);
      }
      return newSet;
    });
  }, []);

  const toggleRegion = useCallback((regionId: string) => {
    setExpandedRegions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(regionId)) {
        newSet.delete(regionId);
      } else {
        newSet.add(regionId);
      }
      return newSet;
    });
  }, []);

  // 排序切換
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // 排序城市
  const sortCities = useCallback((cities: City[]) => {
    return [...cities].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'zh-TW');
          break;
        case 'airport_code':
          const codeA = a.airport_code || '';
          const codeB = b.airport_code || '';
          comparison = codeA.localeCompare(codeB);
          break;
        case 'display_order':
          comparison = (a.display_order || 0) - (b.display_order || 0);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [sortField, sortDirection]);

  return {
    // 展開狀態
    expandedCountries,
    expandedRegions,
    toggleCountry,
    toggleRegion,

    // 排序
    sortField,
    sortDirection,
    handleSort,
    sortCities,

    // 搜尋
    searchTerm,
    setSearchTerm,
  };
}
