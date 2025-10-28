# Tour Hooks 完整重構計劃

## 🎯 目標
將現有的 3 個重複 useTours hooks 重構為分層架構，提升可維護性和可測試性。

## 📋 現狀分析

### 現有檔案
```
/src/features/tours/hooks/
├── useTours.ts (52行) - 簡化版
├── useTours-advanced.ts (220行) - 進階版，有分頁
├── useTourOperations.ts (200行) - 表單操作
└── useTourPageState.ts - 頁面狀態

/src/hooks/
└── useTours.ts (396行) - 完整版，有驗證
```

### 問題
1. 命名衝突（2 個 useTours.ts）
2. 功能重疊（CRUD 邏輯重複 3 次）
3. 職責不清（驗證、查詢、CRUD 混在一起）
4. 使用者困惑（該用哪個 hook？）

## 🏗️ 目標架構

### 新的檔案結構
```
/src/features/tours/hooks/
├── index.ts                    # 統一導出
├── useTours.ts                 # 基礎版 CRUD
├── useTourValidation.ts        # 驗證邏輯
├── useTourQueries.ts           # 查詢 & 篩選
├── useTourBusiness.ts          # 業務邏輯（權限、狀態流程）
├── useToursWithPagination.ts  # 分頁版（重命名）
├── useTourOperations.ts        # 表單操作（保留）
└── useTourPageState.ts         # 頁面狀態（保留）
```

### 刪除的檔案
```
/src/hooks/useTours.ts          # 合併到上面的多個檔案
/src/features/tours/hooks/useTours-advanced.ts  # 改名為 useToursWithPagination.ts
```

## 📝 詳細設計

### 1. useTours.ts - 基礎版（保持簡潔）
```typescript
/**
 * 基礎 Tour Hook
 * 適用場景：簡單的列表頁、下拉選單、快速 CRUD
 *
 * @example
 * const { tours, createTour, updateTour } = useTours();
 */
import { useTourStore } from '@/stores';
import { tourService } from '../services/tour.service';
import { Tour } from '@/stores/types';

export const useTours = () => {
  const store = useTourStore();

  return {
    // ===== 資料 =====
    tours: store.items,
    loading: store.loading,
    error: store.error,

    // ===== CRUD 操作 =====
    loadTours: store.fetchAll,
    getTourById: store.fetchById,
    createTour: store.create,
    updateTour: store.update,
    deleteTour: store.delete,

    // ===== 基礎業務方法 =====
    generateTourCode: tourService.generateTourCode,
    isTourCodeExists: tourService.isTourCodeExists,
    calculateFinancialSummary: tourService.calculateFinancialSummary,
    updateTourStatus: tourService.updateTourStatus,
  };
};
```

---

### 2. useTourValidation.ts - 驗證邏輯
```typescript
/**
 * Tour 驗證 Hook
 * 適用場景：表單頁面、建立/編輯 Tour
 *
 * @example
 * const { validateTourData, canEditTour } = useTourValidation();
 * if (canEditTour(tour)) {
 *   validateTourData(formData);
 *   updateTour(tour.id, formData);
 * }
 */
export function useTourValidation() {
  /**
   * 驗證日期範圍
   */
  const validateTourDates = (start_date: string, end_date: string): void => {
    const start = new Date(start_date);
    const end = new Date(end_date);
    const now = new Date();

    // 檢查日期格式
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('日期格式錯誤');
    }

    // 結束日期必須大於開始日期
    if (end <= start) {
      throw new Error('結束日期必須晚於開始日期');
    }

    // 旅遊天數不能超過 365 天
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      throw new Error('旅遊天數不能超過 365 天');
    }
  };

  /**
   * 驗證 Tour 資料
   */
  const validateTourData = (data: Partial<Tour>): void => {
    // 團名檢查
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('團名不能為空');
    }

    // 目的地檢查
    if (data.location !== undefined && data.location.trim().length === 0) {
      throw new Error('目的地不能為空');
    }

    // 人數檢查
    if (data.max_participants !== undefined && data.max_participants < 1) {
      throw new Error('最高人數必須大於 0');
    }

    // 價格檢查
    if (data.price !== undefined && data.price < 0) {
      throw new Error('價格不能為負數');
    }

    // 日期檢查
    if (data.departure_date && data.return_date) {
      validateTourDates(data.departure_date, data.return_date);
    }
  };

  /**
   * 檢查是否可以編輯
   */
  const canEditTour = (tour: Tour): boolean => {
    return tour.status === 'draft' || tour.status === 'active';
  };

  /**
   * 檢查是否可以刪除
   */
  const canDeleteTour = (tour: Tour): boolean => {
    return tour.status === 'draft';
  };

  /**
   * 檢查是否可以取消
   */
  const canCancelTour = (tour: Tour): boolean => {
    return tour.status === 'draft' || tour.status === 'active';
  };

  return {
    validateTourDates,
    validateTourData,
    canEditTour,
    canDeleteTour,
    canCancelTour,
  };
}
```

---

### 3. useTourQueries.ts - 查詢 & 篩選
```typescript
/**
 * Tour 查詢 Hook
 * 適用場景：搜尋頁面、篩選功能、儀表板
 *
 * @example
 * const { activeTours, searchTours, getToursByDateRange } = useTourQueries();
 * const results = searchTours('日本');
 */
import { useMemo } from 'react';
import { useTours } from './useTours';
import { Tour } from '@/stores/types';

export function useTourQueries() {
  const { tours } = useTours();

  /**
   * 進行中的旅遊團
   */
  const activeTours = useMemo(() =>
    tours.filter(tour => tour.status === 'active'),
    [tours]
  );

  /**
   * 草稿旅遊團
   */
  const draftTours = useMemo(() =>
    tours.filter(tour => tour.status === 'draft'),
    [tours]
  );

  /**
   * 已完成的旅遊團
   */
  const completedTours = useMemo(() =>
    tours.filter(tour => tour.status === 'closed'),
    [tours]
  );

  /**
   * 已取消的旅遊團
   */
  const cancelledTours = useMemo(() =>
    tours.filter(tour => tour.status === 'cancelled'),
    [tours]
  );

  /**
   * 根據日期範圍查詢
   */
  const getToursByDateRange = (start_date: string, end_date: string): Tour[] => {
    const start = new Date(start_date);
    const end = new Date(end_date);

    return tours.filter(tour => {
      const tourStart = new Date(tour.departure_date);
      const tourEnd = new Date(tour.return_date);
      return tourStart <= end && tourEnd >= start;
    });
  };

  /**
   * 搜尋旅遊團（團號、團名、目的地）
   */
  const searchTours = (keyword: string): Tour[] => {
    if (!keyword.trim()) return tours;

    const lowerKeyword = keyword.toLowerCase();
    return tours.filter(
      tour =>
        tour.code.toLowerCase().includes(lowerKeyword) ||
        tour.name.toLowerCase().includes(lowerKeyword) ||
        tour.location.toLowerCase().includes(lowerKeyword)
    );
  };

  /**
   * 根據狀態篩選
   */
  const getToursByStatus = (status: Tour['status']): Tour[] => {
    return tours.filter(tour => tour.status === status);
  };

  return {
    // 預先篩選的資料
    activeTours,
    draftTours,
    completedTours,
    cancelledTours,

    // 查詢方法
    getToursByDateRange,
    searchTours,
    getToursByStatus,
  };
}
```

---

### 4. useTourBusiness.ts - 業務邏輯
```typescript
/**
 * Tour 業務邏輯 Hook
 * 適用場景：業務流程處理、狀態轉換、計算
 *
 * @example
 * const { getNextStatus, isFullyBooked, calculateDays } = useTourBusiness();
 */
import { Tour, TourStatus } from '@/stores/types';

export function useTourBusiness() {
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
   * 計算剩餘名額
   */
  const getRemainingSeats = (tour: Tour): number | null => {
    if (!tour.max_participants) return null;
    const current = tour.current_participants || 0;
    return Math.max(0, tour.max_participants - current);
  };

  /**
   * 計算完成百分比
   */
  const getBookingPercentage = (tour: Tour): number => {
    if (!tour.max_participants) return 0;
    const current = tour.current_participants || 0;
    return Math.round((current / tour.max_participants) * 100);
  };

  return {
    calculateDays,
    calculateNights,
    getNextStatus,
    isFullyBooked,
    getRemainingSeats,
    getBookingPercentage,
  };
}
```

---

### 5. useToursWithPagination.ts - 分頁版（重命名）
```typescript
/**
 * Tour 分頁 Hook
 * 適用場景：大型列表頁、需要分頁的資料表
 *
 * @example
 * const { data, totalCount, loading, actions } = useToursWithPagination({
 *   page: 1,
 *   limit: 20
 * });
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { tourService } from '../services/tour.service';
import { Tour } from '@/stores/types';
import { PageRequest, UseEntityResult } from '@/core/types/common';
import { useTourStore } from '@/stores';

export function useToursWithPagination(params?: PageRequest): UseEntityResult<Tour> {
  const [data, setData] = useState<Tour[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const stableParams = useMemo(() => params, [params]);

  const loadTours = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 首次載入才呼叫 fetchAll()
      if (!initializedRef.current) {
        await useTourStore.getState().fetchAll();
        initializedRef.current = true;
      }

      // 從 service 讀取並處理（過濾、排序、分頁）
      const result = await tourService.list(stableParams);
      setData(result.data);
      setTotalCount(result.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入旅遊團資料失敗';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [stableParams]);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  const createTour = useCallback(async (tourData: Omit<Tour, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const newTour = await tourService.create(tourData as Tour);

      // 樂觀更新
      setData(prevData => [newTour, ...prevData]);
      setTotalCount(prev => prev + 1);

      return newTour;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '建立旅遊團失敗';
      setError(errorMessage);
      await loadTours();
      throw err;
    }
  }, [loadTours]);

  const updateTour = useCallback(async (id: string, tourData: Partial<Tour>) => {
    try {
      setError(null);

      // 樂觀更新
      setData(prevData =>
        prevData.map(tour => tour.id === id ? { ...tour, ...tourData } : tour)
      );

      const updated = await tourService.update(id, tourData);

      // 用真實資料更新
      setData(prevData =>
        prevData.map(tour => tour.id === id ? updated : tour)
      );

      return updated;
    } catch (err) {
      await loadTours();
      const errorMessage = err instanceof Error ? err.message : '更新旅遊團失敗';
      setError(errorMessage);
      throw err;
    }
  }, [loadTours]);

  const deleteTour = useCallback(async (id: string) => {
    try {
      setError(null);

      // 樂觀更新
      setData(prevData => prevData.filter(tour => tour.id !== id));
      setTotalCount(prev => Math.max(0, prev - 1));

      await tourService.delete(id);
    } catch (err) {
      await loadTours();
      const errorMessage = err instanceof Error ? err.message : '刪除旅遊團失敗';
      setError(errorMessage);
      throw err;
    }
  }, [loadTours]);

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
      delete: async (id: string) => { await deleteTour(id); return true; },
      refresh,
    },
  };
}
```

---

### 6. index.ts - 統一導出
```typescript
/**
 * Tour Hooks 統一導出
 *
 * 使用指南：
 * - useTours: 基礎 CRUD，適用於簡單場景
 * - useTourValidation: 表單驗證
 * - useTourQueries: 搜尋、篩選
 * - useTourBusiness: 業務邏輯、計算
 * - useToursWithPagination: 大型列表、分頁
 * - useTourOperations: 表單操作（新增/編輯/刪除）
 * - useTourPageState: 頁面狀態管理
 */

// 基礎 CRUD
export { useTours } from './useTours';

// 驗證
export { useTourValidation } from './useTourValidation';

// 查詢 & 篩選
export { useTourQueries } from './useTourQueries';

// 業務邏輯
export { useTourBusiness } from './useTourBusiness';

// 分頁版
export { useToursWithPagination } from './useToursWithPagination';

// 表單操作（保留現有）
export { useTourOperations } from './useTourOperations';

// 頁面狀態（保留現有）
export { useTourPageState } from './useTourPageState';
```

---

## 🔄 遷移步驟

### 階段 1：創建新檔案（不影響現有代碼）
```bash
# 1. 創建新的 hooks
touch src/features/tours/hooks/useTourValidation.ts
touch src/features/tours/hooks/useTourQueries.ts
touch src/features/tours/hooks/useTourBusiness.ts

# 2. 重命名
mv src/features/tours/hooks/useTours-advanced.ts src/features/tours/hooks/useToursWithPagination.ts

# 3. 更新 index.ts
```

### 階段 2：更新使用處（逐一替換）
```typescript
// ===== 範例 1: 簡單列表頁 =====
// Before:
import { useTours } from '@/hooks/useTours';  // 396 行的完整版
const { tours, createTour, validateTourData } = useTours();

// After:
import { useTours, useTourValidation } from '@/features/tours/hooks';
const { tours, createTour } = useTours();
const { validateTourData } = useTourValidation();

// ===== 範例 2: 搜尋頁面 =====
// Before:
import { useTours } from '@/hooks/useTours';
const { tours, activeTours, searchTours } = useTours();

// After:
import { useTours, useTourQueries } from '@/features/tours/hooks';
const { tours } = useTours();
const { activeTours, searchTours } = useTourQueries();

// ===== 範例 3: 大型列表（分頁）=====
// Before:
import { useTours } from '@/features/tours/hooks/useTours-advanced';
const { data, totalCount, actions } = useTours({ page: 1, limit: 20 });

// After:
import { useToursWithPagination } from '@/features/tours/hooks';
const { data, totalCount, actions } = useToursWithPagination({ page: 1, limit: 20 });
```

### 階段 3：刪除舊檔案
```bash
# 確認所有使用處都已更新後
rm src/hooks/useTours.ts
```

---

## 📊 影響範圍分析

### 需要更新的檔案（預估）
```bash
# 搜尋所有使用 useTours 的地方
$ grep -r "import.*useTours" src --include="*.tsx" --include="*.ts"

預估：
- src/app/tours/page.tsx
- src/features/tours/components/*
- src/features/orders/hooks/*
- src/features/quotes/hooks/*
- ... (約 10-15 個檔案)
```

### 更新工作量
| 檔案類型 | 數量 | 更新複雜度 | 時間估計 |
|---------|------|-----------|---------|
| 簡單列表頁 | 3-5 | 低 | 10分鐘/個 |
| 搜尋/篩選頁 | 2-3 | 中 | 15分鐘/個 |
| 表單頁面 | 3-5 | 中 | 15分鐘/個 |
| 分頁列表 | 1-2 | 低 | 5分鐘/個 |
| **總計** | **10-15** | - | **3-4 小時** |

---

## ✅ 驗證清單

### 功能驗證
- [ ] 所有 CRUD 操作正常
- [ ] 表單驗證正確觸發
- [ ] 搜尋功能正常
- [ ] 分頁功能正常
- [ ] 狀態篩選正常
- [ ] 業務邏輯計算正確

### 代碼品質
- [ ] TypeScript 無錯誤
- [ ] ESLint 無警告
- [ ] 所有 import 路徑正確
- [ ] 無未使用的 imports
- [ ] 無循環依賴

### 測試
- [ ] 單元測試通過（如果有）
- [ ] E2E 測試通過
- [ ] 手動測試所有功能

---

## 📈 預期收益

### 代碼指標
| 指標 | Before | After | 改善 |
|-----|--------|-------|------|
| 總行數 | 868行 | ~650行 | -25% |
| 檔案數 | 3個重複 | 8個分層 | 職責清晰 |
| 平均檔案大小 | 289行 | ~80行 | -72% |
| 可測試性 | 低 | 高 | +++ |

### 開發體驗
- ✅ **按需引入** - 只載入需要的邏輯
- ✅ **職責單一** - 每個 hook 只做一件事
- ✅ **易於測試** - 小函數容易寫測試
- ✅ **命名清晰** - 不再有 useTours 衝突
- ✅ **文件友好** - 每個 hook 都有清楚的用途說明

### 維護性
- ✅ **新增功能** - 知道該放在哪個 hook
- ✅ **Bug 修復** - 快速定位到特定檔案
- ✅ **重構** - 改動範圍小、影響可控

---

## 🚀 執行時間表

| 階段 | 任務 | 時間 | 負責人 |
|-----|------|------|-------|
| 第 1 天 | 創建新 hooks（4 個檔案） | 2 小時 | 開發者 |
| 第 2 天 | 更新 import（10-15 個檔案） | 3 小時 | 開發者 |
| 第 3 天 | 測試 + 修復問題 | 2 小時 | 開發者 + QA |
| 第 4 天 | Code Review + 合併 | 1 小時 | Tech Lead |
| **總計** | - | **8 小時** | - |

---

## 💡 最佳實踐

### 使用指南
```typescript
// ✅ 好的做法：按需組合
import { useTours, useTourValidation, useTourQueries } from '@/features/tours/hooks';

function TourSearchPage() {
  const { tours, createTour } = useTours();
  const { validateTourData } = useTourValidation();
  const { searchTours, activeTours } = useTourQueries();

  // 只載入需要的邏輯
}

// ❌ 不好的做法：全部引入
import { useTours } from '@/hooks/useTours';  // 396 行全部載入

function SimpleTourList() {
  const { tours } = useTours();  // 只用到 tours，但載入了所有邏輯
}
```

---

## 📞 需要協助？

如果遷移過程遇到問題：
1. 檢查 TypeScript 錯誤訊息
2. 確認 import 路徑正確
3. 查看本文件的範例
4. 聯絡技術負責人

---

**文件版本：** v1.0
**最後更新：** 2025-10-26
**預計執行時間：** 2-4 週內
**預期投入：** 8 小時
**風險等級：** 中等（有 TypeScript 保護）
