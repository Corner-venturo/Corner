import { useState, useEffect, useCallback, useMemo } from 'react';
import { tourService } from '../services/tour.service';
import { Tour } from '@/stores/types';
import { PageRequest, PageResponse, UseEntityResult } from '@/core/types/common';
import { BaseEntity } from '@/core/types/common';

export function useTours(params?: PageRequest): UseEntityResult<Tour> {
  const [data, setData] = useState<Tour[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 使用 useMemo 來穩定 params 物件的參考
  const stableParams = useMemo(() => params, [
    params?.page,
    params?.pageSize,
    params?.search,
    params?.sortBy,
    params?.sortOrder
  ]);

  const loadTours = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await tourService.list(stableParams);
      setData(result.data);
      setTotalCount(result.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入旅遊團資料失敗';
      setError(errorMessage);
      console.error('Failed to load tours:', err);
    } finally {
      setLoading(false);
    }
  }, [stableParams]);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  const createTour = useCallback(async (tourData: Omit<Tour, keyof BaseEntity>) => {
    try {
      setError(null);
      const newTour = await tourService.create(tourData);
      await loadTours(); // 重新載入列表以確保數據同步
      return newTour;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '建立旅遊團失敗';
      setError(errorMessage);
      throw err; // 讓調用者可以處理錯誤
    }
  }, [loadTours]);

  const updateTour = useCallback(async (id: string, tourData: Partial<Tour>) => {
    try {
      setError(null);

      // 樂觀更新 - 立即更新 UI
      setData(prevData =>
        prevData.map(tour =>
          tour.id === id ? { ...tour, ...tourData } : tour
        )
      );

      const updated = await tourService.update(id, tourData);

      // 成功後用真實資料更新
      setData(prevData =>
        prevData.map(tour =>
          tour.id === id ? updated : tour
        )
      );

      return updated;
    } catch (err) {
      // 失敗時回滾
      await loadTours();
      const errorMessage = err instanceof Error ? err.message : '更新旅遊團失敗';
      setError(errorMessage);
      throw err;
    }
  }, [loadTours]);

  const deleteTour = useCallback(async (id: string) => {
    try {
      setError(null);

      // 樂觀更新 - 立即從 UI 移除
      const originalData = data;
      setData(prevData => prevData.filter(tour => tour.id !== id));
      setTotalCount(prev => Math.max(0, prev - 1));

      await tourService.delete(id);
    } catch (err) {
      // 失敗時回滾
      await loadTours();
      const errorMessage = err instanceof Error ? err.message : '刪除旅遊團失敗';
      setError(errorMessage);
      throw err;
    }
  }, [data, loadTours]);

  const refresh = useCallback(async () => {
    await loadTours();
  }, [loadTours]);

  return {
    data,
    totalCount,
    loading,
    error,
    actions: {
      create: createTour,
      update: updateTour,
      delete: deleteTour,
      refresh,
    },
  };
}

// 專門用於單個旅遊團詳情的 hook
export function useTourDetails(tour_id: string) {
  const [tour, setTour] = useState<Tour | null>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTourDetails = useCallback(async () => {
    if (!tourId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [tourData, financialData] = await Promise.all([
        tourService.getById(tourId),
        tourService.calculateFinancialSummary(tourId),
      ]);

      setTour(tourData);
      setFinancials(financialData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入旅遊團詳情失敗';
      setError(errorMessage);
      console.error('Failed to load tour details:', err);
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  useEffect(() => {
    loadTourDetails();
  }, [loadTourDetails]);

  const updateTourStatus = useCallback(async (newStatus: Tour['status'], reason?: string) => {
    if (!tourId) return null;

    try {
      setError(null);
      const updated = await tourService.updateTourStatus(tourId, newStatus, reason);
      setTour(updated);
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新旅遊團狀態失敗';
      setError(errorMessage);
      throw err;
    }
  }, [tourId]);

  const generateTourCode = useCallback(async (location: string, date: Date, isSpecial?: boolean) => {
    try {
      setError(null);
      return await tourService.generateTourCode(location, date, isSpecial);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成團號失敗';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    tour,
    financials,
    loading,
    error,
    actions: {
      updateStatus: updateTourStatus,
      generateCode: generateTourCode,
      refresh: loadTourDetails,
    }
  };
}