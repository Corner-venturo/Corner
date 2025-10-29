export { EnhancedTable } from './EnhancedTable';
export { useTableState } from './useTableState';
export type {
  TableColumn,
  SelectionConfig,
  ExpandableConfig,
  EnhancedTableProps,
} from './types';

// Convenience hook for handling sorting and filtering logic
import { useState } from 'react';

export function useEnhancedTable<T>(
  originalData: T[],
  sortFunction?: (data: T[], column: string, direction: 'asc' | 'desc') => T[],
  filterFunction?: (data: T[], filters: Record<string, string>) => T[]
) {
  const [sortedData, setSortedData] = useState(originalData);
  const [filteredData, setFilteredData] = useState(originalData);

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    if (sortFunction) {
      const sorted = sortFunction(filteredData, column, direction);
      setSortedData(sorted);
    }
  };

  const handleFilter = (filters: Record<string, string>) => {
    if (filterFunction) {
      const filtered = filterFunction(originalData, filters);
      setFilteredData(filtered);
      setSortedData(filtered);
    }
  };

  return {
    data: sortedData,
    handleSort,
    handleFilter
  };
}
