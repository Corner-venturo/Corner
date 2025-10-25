import { useState, useCallback, useMemo } from 'react';
import { useTours } from '@/features/tours/hooks/useTours';
import { BatchRequestFormData } from '../types';

export function useBatchRequestForm() {
  const { tours } = useTours();

  const [formData, setFormData] = useState<BatchRequestFormData>({
    request_date: '',
    note: '',
    is_special_billing: false,
    created_by: '1'
  });

  const [selectedTourIds, setSelectedTourIds] = useState<string[]>([]);
  const [batchTourSearch, setBatchTourSearch] = useState('');
  const [showBatchTourDropdown, setShowBatchTourDropdown] = useState(false);

  // Filter tours by search
  const filteredTours = useMemo(() =>
    tours.filter(tour => {
      const searchTerm = batchTourSearch.toLowerCase();
      if (!searchTerm) return true;

      const tourCode = tour.code?.toLowerCase() || '';
      const tour_name = tour.name?.toLowerCase() || '';
      const departure_date = tour.departure_date || '';
      const dateNumbers = departure_date.replace(/\D/g, '').slice(-4);

      return tourCode.includes(searchTerm) ||
             tour_name.includes(searchTerm) ||
             dateNumbers.includes(searchTerm.replace(/\D/g, ''));
    })
  , [tours, batchTourSearch]);

  // Toggle tour selection
  const toggleTourSelection = useCallback((tourId: string) => {
    setSelectedTourIds(prev =>
      prev.includes(tourId)
        ? prev.filter(id => id !== tourId)
        : [...prev, tourId]
    );
  }, []);

  // Remove tour from selection
  const removeTourFromSelection = useCallback((tourId: string) => {
    setSelectedTourIds(prev => prev.filter(id => id !== tourId));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      request_date: '',
      note: '',
      is_special_billing: false,
      created_by: '1'
    });
    setSelectedTourIds([]);
    setBatchTourSearch('');
    setShowBatchTourDropdown(false);
  }, []);

  return {
    formData,
    setFormData,
    selectedTourIds,
    setSelectedTourIds,
    batchTourSearch,
    setBatchTourSearch,
    showBatchTourDropdown,
    setShowBatchTourDropdown,
    filteredTours,
    toggleTourSelection,
    removeTourFromSelection,
    resetForm,
    tours
  };
}
