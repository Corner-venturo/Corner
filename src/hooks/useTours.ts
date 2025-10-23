/**
 * useTours - 旅遊團業務邏輯 Hook
 * 提供完整的 CRUD、驗證、業務邏輯
 */

import { useMemo } from 'react';

import { useTourStore } from '@/stores';
import { Tour, CreateTourData, UpdateTourData, TourStatus } from '@/types';

/**
 * 旅遊團日期驗證錯誤
 */
class TourDateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TourDateValidationError';
  }
}

/**
 * 旅遊團權限錯誤
 */
class TourPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TourPermissionError';
  }
}

/**
 * useTours Hook
 */
export function useTours() {
  const store = useTourStore();

  // ============================================
  // 資料驗證
  // ============================================

  /**
   * 驗證旅遊團日期
   */
  const validateTourDates = (start_date: string, end_date: string): void => {
    const start = new Date(start_date);
    const end = new Date(end_date);
    const now = new Date();

    // 檢查日期格式
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new TourDateValidationError('日期格式錯誤');
    }

    // 結束日期必須大於開始日期
    if (end <= start) {
      throw new TourDateValidationError('結束日期必須晚於開始日期');
    }

    // 開始日期不能是過去（草稿狀態除外）
    if (start < now) {
      console.warn('開始日期早於今天，請確認');
    }

    // 旅遊天數不能超過 365 天
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      throw new TourDateValidationError('旅遊天數不能超過 365 天');
    }
  };

  /**
   * 驗證旅遊團資料
   */
  const validateTourData = (data: Partial<Tour>): void => {
    // 檢查必填欄位
    if (data.name && data.name.trim().length === 0) {
      throw new Error('團名不能為空');
    }

    if (data.location && data.location.trim().length === 0) {
      throw new Error('目的地不能為空');
    }

    // 檢查人數
    if (data.max_participants !== undefined && data.max_participants < 1) {
      throw new Error('最高人數必須大於 0');
    }

    // 檢查價格
    if (data.price !== undefined && data.price < 0) {
      throw new Error('價格不能為負數');
    }

    // 檢查日期
    if (data.departure_date && data.return_date) {
      validateTourDates(data.departure_date, data.return_date);
    }
  };

  // ============================================
  // 業務邏輯
  // ============================================

  /**
   * 計算旅遊天數
   */
  const calculateDays = (start_date: string, end_date: string): number => {
    const start = new Date(start_date);
    const end = new Date(end_date);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  /**
   * 計算夜數
   */
  const calculateNights = (days: number): number => {
    return Math.max(0, days - 1);
  };

  /**
   * 檢查是否可以編輯
   */
  const canEditTour = (tour: Tour): boolean => {
    // 只有提案和進行中的團可以編輯
    return tour.status === 'draft' || tour.status === 'active';
  };

  /**
   * 檢查是否可以刪除
   */
  const canDeleteTour = (tour: Tour): boolean => {
    // 只有提案狀態可以刪除
    return tour.status === 'draft';
  };

  /**
   * 檢查是否可以取消
   */
  const canCancelTour = (tour: Tour): boolean => {
    // 提案和進行中的團可以取消
    return tour.status === 'draft' || tour.status === 'active';
  };

  /**
   * 取得下一個狀態
   */
  const getNextStatus = (currentStatus: TourStatus): TourStatus | null => {
    const statusFlow: Record<TourStatus, TourStatus | null> = {
      draft: 'active',
      active: 'pending_close',
      pending_close: 'closed',
      closed: null,
      cancelled: null,
      special: null,
    };
    return statusFlow[currentStatus];
  };

  /**
   * 檢查是否已滿團
   */
  const isFullyBooked = (tour: Tour): boolean => {
    if (!tour.max_participants || !tour.current_participants) return false;
    return tour.current_participants >= tour.max_participants;
  };

  /**
   * 檢查是否成團（注意：Tour 類型沒有 min_people 欄位）
   */
  const hasMetMinimum = (tour: Tour): boolean => {
    // TODO: 如果需要最低成團人數，請在 Tour 類型中添加 min_participants 欄位
    return false;
  };

  /**
   * 計算剩餘名額
   */
  const getRemainingSeats = (tour: Tour): number | null => {
    if (!tour.max_participants) return null;
    const current = tour.current_participants || 0;
    return Math.max(0, tour.max_participants - current);
  };

  // ============================================
  // 權限檢查（簡化版，實際應從 auth 取得）
  // ============================================

  const hasPermission = (action: 'create' | 'update' | 'delete'): boolean => {
    // TODO: 從 auth store 取得實際權限
    // 目前簡化為都允許
    return true;
  };

  // ============================================
  // 增強的 CRUD 操作
  // ============================================

  /**
   * 建立旅遊團
   */
  const createTour = async (data: Omit<CreateTourData, 'id' | 'code'>): Promise<Tour> => {
    // 1. 權限檢查
    if (!hasPermission('create')) {
      throw new TourPermissionError('沒有建立旅遊團的權限');
    }

    // 2. 資料驗證
    validateTourData(data);

    // 3. 計算天數和夜數（如果需要）
    // const days = calculateDays(data.departure_date, data.return_date);
    // const nights = calculateNights(days);

    // 4. 組合完整資料
    const tourData: Omit<CreateTourData, 'code'> = {
      ...data,
      status: data.status || 'draft',
    };

    // 5. 呼叫 Store
    return await store.create(tourData as Tour);
  };

  /**
   * 更新旅遊團
   */
  const updateTour = async (id: string, data: UpdateTourData): Promise<Tour> => {
    // 1. 權限檢查
    if (!hasPermission('update')) {
      throw new TourPermissionError('沒有更新旅遊團的權限');
    }

    // 2. 檢查旅遊團是否存在
    const existingTour = await store.fetchById(id);
    if (!existingTour) {
      throw new Error('旅遊團不存在');
    }

    // 3. 檢查是否可以編輯
    if (!canEditTour(existingTour)) {
      throw new Error(`${existingTour.status} 狀態的旅遊團無法編輯`);
    }

    // 4. 資料驗證
    validateTourData(data);

    // 5. 直接使用資料（不需要計算天數）
    const updatedData = { ...data };

    // 6. 呼叫 Store
    return await store.update(id, updatedData);
  };

  /**
   * 刪除旅遊團
   */
  const deleteTour = async (id: string): Promise<void> => {
    // 1. 權限檢查
    if (!hasPermission('delete')) {
      throw new TourPermissionError('沒有刪除旅遊團的權限');
    }

    // 2. 檢查旅遊團是否存在
    const tour = await store.fetchById(id);
    if (!tour) {
      throw new Error('旅遊團不存在');
    }

    // 3. 檢查是否可以刪除
    if (!canDeleteTour(tour)) {
      throw new Error(`${tour.status} 狀態的旅遊團無法刪除`);
    }

    // 4. 呼叫 Store
    await store.delete(id);
  };

  /**
   * 取消旅遊團
   */
  const cancelTour = async (id: string): Promise<Tour> => {
    const tour = await store.fetchById(id);
    if (!tour) {
      throw new Error('旅遊團不存在');
    }

    if (!canCancelTour(tour)) {
      throw new Error(`${tour.status} 狀態的旅遊團無法取消`);
    }

    return await store.update(id, { status: 'cancelled' });
  };

  /**
   * 完成旅遊團
   */
  const completeTour = async (id: string): Promise<Tour> => {
    const tour = await store.fetchById(id);
    if (!tour) {
      throw new Error('旅遊團不存在');
    }

    if (tour.status !== 'active') {
      throw new Error('只有進行中的旅遊團可以完成');
    }

    return await store.update(id, { status: 'pending_close' });
  };

  // ============================================
  // 查詢方法
  // ============================================

  /**
   * 取得進行中的旅遊團
   */
  const getActiveTours = useMemo(() => {
    return store.items.filter((tour) => tour.status === 'active');
  }, [store.items]);

  /**
   * 取得草稿旅遊團
   */
  const getDraftTours = useMemo(() => {
    return store.items.filter((tour) => tour.status === 'draft');
  }, [store.items]);

  /**
   * 根據日期範圍查詢
   */
  const getToursByDateRange = (start_date: string, end_date: string): Tour[] => {
    const start = new Date(start_date);
    const end = new Date(end_date);

    return store.items.filter((tour) => {
      const tourStart = new Date(tour.departure_date);
      const tourEnd = new Date(tour.return_date);
      return tourStart <= end && tourEnd >= start;
    });
  };

  /**
   * 搜尋旅遊團
   */
  const searchTours = (keyword: string): Tour[] => {
    const lowerKeyword = keyword.toLowerCase();
    return store.items.filter(
      (tour) =>
        tour.code.toLowerCase().includes(lowerKeyword) ||
        tour.name.toLowerCase().includes(lowerKeyword) ||
        tour.location.toLowerCase().includes(lowerKeyword)
    );
  };

  // ============================================
  // 返回值
  // ============================================

  return {
    // 資料
    tours: store.items,
    loading: store.loading,
    error: store.error,

    // CRUD 操作
    fetchAll: store.fetchAll,
    fetchById: store.fetchById,
    createTour,
    updateTour,
    deleteTour,
    cancelTour,
    completeTour,

    // 業務邏輯
    canEditTour,
    canDeleteTour,
    canCancelTour,
    getNextStatus,
    isFullyBooked,
    hasMetMinimum,
    getRemainingSeats,
    calculateDays,
    calculateNights,

    // 查詢方法
    activeTours: getActiveTours,
    draftTours: getDraftTours,
    getToursByDateRange,
    searchTours,

    // 驗證方法
    validateTourData,
    validateTourDates,
  };
}
