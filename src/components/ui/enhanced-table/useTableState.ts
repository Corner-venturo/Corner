import { useState, useMemo, useEffect } from 'react';

export interface UseTableStateProps<T> {
  data: T[];
  searchTerm?: string;
  searchableFields?: string[];
  initialPageSize?: number;
}

export function useTableState<T>({
  data,
  searchTerm = '',
  searchableFields = [],
  initialPageSize = 10,
}: UseTableStateProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // 處理資料：搜尋、過濾、排序
  const processedData = useMemo(() => {
    let filtered = [...data];

    // 全文搜尋
    if (searchTerm && searchableFields.length > 0) {
      filtered = filtered.filter(row =>
        searchableFields.some(field => {
          const value = (row as any)[field];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // 篩選器
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        filtered = filtered.filter(row => {
          const value = (row as any)[key];
          return value && value.toString().toLowerCase().includes(filters[key].toLowerCase());
        });
      }
    });

    // 排序
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aValue = (a as any)[sortColumn];
        const bValue = (b as any)[sortColumn];

        if (aValue === bValue) return 0;

        const result = aValue < bValue ? -1 : 1;
        return sortDirection === 'asc' ? result : -result;
      });
    }

    return filtered;
  }, [data, searchTerm, searchableFields, filters, sortColumn, sortDirection]);

  // 分頁邏輯
  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = processedData.slice(startIndex, startIndex + pageSize);

  // 重置頁面當資料變化時
  useEffect(() => {
    setCurrentPage(1);
  }, [processedData.length]);

  const handleSort = (columnKey: string) => {
    const newDirection = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(columnKey);
    setSortDirection(newDirection);
  };

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === '__all__' ? '' : value }));
  };

  return {
    sortColumn,
    sortDirection,
    filters,
    showFilters,
    setShowFilters,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    processedData,
    paginatedData,
    totalPages,
    startIndex,
    handleSort,
    updateFilter,
  };
}
