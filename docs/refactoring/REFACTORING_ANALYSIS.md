# 中等風險重構項目 - 深入分析報告

## 📋 目錄
1. [Tour Hooks 分析](#1-tour-hooks-分析)
2. [Customer Hooks 分析](#2-customer-hooks-分析)
3. [日期輸入組件分析](#3-日期輸入組件分析)
4. [Store 創建方式分析](#4-store-創建方式分析)
5. [重構建議總結](#5-重構建議總結)

---

## 1. Tour Hooks 分析

### 📁 發現的 Tour Hooks

| 檔案路徑 | 行數 | 用途 | 狀態 |
|---------|------|------|------|
| `/src/features/tours/hooks/useTours.ts` | 52行 | **簡化版** - 統一接口 | ✅ 推薦使用 |
| `/src/hooks/useTours.ts` | 396行 | **完整版** - 包含驗證 + 業務邏輯 | ⚠️ 功能重疊 |
| `/src/features/tours/hooks/useTours-advanced.ts` | 220行 | **進階版** - 分頁 + 樂觀更新 | ⚠️ 功能重疊 |
| `/src/features/tours/hooks/useTourOperations.ts` | 200行 | **表單操作** - 新增/編輯/刪除 | ✅ 保留 |
| `/src/features/tours/hooks/useTourPageState.ts` | - | **頁面狀態管理** | ✅ 保留 |

### 🔍 詳細對比

#### A. `/src/features/tours/hooks/useTours.ts` (52行)
```typescript
// 特點：簡潔、統一接口
export const useTours = () => {
  const tourStore = useTourStore();
  return {
    tours: tourStore.items,
    createTour,
    updateTour,
    deleteTour,
    loadTours,
    generateTourCode,      // 業務方法
    isTourCodeExists,      // 業務方法
    calculateFinancialSummary,
    updateTourStatus,
  };
};
```
**優點：**
- ✅ 直接使用 store
- ✅ 代碼簡潔清晰
- ✅ 與其他模組接口統一（customers、quotes 等）
- ✅ 已添加必要的業務方法

**缺點：**
- ❌ 缺少資料驗證
- ❌ 缺少權限檢查
- ❌ 缺少進階查詢方法

---

#### B. `/src/hooks/useTours.ts` (396行)
```typescript
// 特點：完整業務邏輯
export function useTours() {
  const store = useTourStore();

  // 驗證方法
  const validateTourDates = (start, end) => { /* ... */ };
  const validateTourData = (data) => { /* ... */ };

  // 業務邏輯
  const canEditTour = (tour) => { /* ... */ };
  const canDeleteTour = (tour) => { /* ... */ };
  const isFullyBooked = (tour) => { /* ... */ };

  // 增強的 CRUD
  const createTour = async (data) => {
    validateTourData(data);  // 加入驗證
    return await store.create(data);
  };

  // 查詢方法
  const activeTours = useMemo(() => { /* ... */ }, []);
  const searchTours = (keyword) => { /* ... */ };

  return {
    tours, loading, error,
    createTour, updateTour, deleteTour,
    validateTourData,
    canEditTour, canDeleteTour,
    activeTours, draftTours,
    searchTours,
  };
}
```
**優點：**
- ✅ 完整的資料驗證
- ✅ 業務邏輯封裝良好
- ✅ 權限檢查
- ✅ 進階查詢方法

**缺點：**
- ❌ 太重（396行）
- ❌ 與其他模組接口不統一
- ❌ 部分邏輯應該在 service 層

---

#### C. `/src/features/tours/hooks/useTours-advanced.ts` (220行)
```typescript
// 特點：分頁 + 樂觀更新
export function useTours(params?: PageRequest): UseEntityResult<Tour> {
  const [data, setData] = useState<Tour[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const loadTours = useCallback(async () => {
    // 首次載入呼叫 fetchAll
    if (!initializedRef.current) {
      await useTourStore.getState().fetchAll();
      initializedRef.current = true;
    }

    // 從 service 讀取並處理（過濾、排序、分頁）
    const result = await tourService.list(stableParams);
    setData(result.data);
    setTotalCount(result.total);
  }, [stableParams]);

  const createTour = useCallback(async (data) => {
    // 樂觀更新 - 立即加入 UI
    setData(prevData => [newTour, ...prevData]);
    const newTour = await tourService.create(data);
    return newTour;
  }, []);

  return {
    data, totalCount, loading, error,
    actions: { create, update, delete, refresh }
  };
}
```
**優點：**
- ✅ 樂觀更新提升 UX
- ✅ 支援分頁
- ✅ 統一返回格式 (`UseEntityResult`)

**缺點：**
- ❌ 與 store 的關係不清楚（useState 重複管理狀態）
- ❌ 命名衝突（與 B 同名）
- ❌ 複雜度高

---

### 💡 重構建議

#### 方案 A：保留分層架構（推薦 ⭐⭐⭐⭐⭐）

**策略：將三個 hooks 合併為分層結構**

```
/src/features/tours/hooks/
├── index.ts                    # 統一導出
├── useTours.ts                 # 基礎版（保留現有的 52 行簡化版）
├── useToursAdvanced.ts         # 進階版（重命名，添加分頁功能）
├── useTourValidation.ts        # 驗證邏輯（從 B 提取）
├── useTourQueries.ts           # 查詢方法（從 B 提取）
├── useTourOperations.ts        # 表單操作（保留）
└── useTourPageState.ts         # 頁面狀態（保留）
```

**具體拆分：**

```typescript
// ===== useTours.ts (基礎版，保持不變) =====
export const useTours = () => {
  const tourStore = useTourStore();
  return {
    tours: tourStore.items,
    loading: tourStore.loading,
    error: tourStore.error,
    createTour: tourStore.create,
    updateTour: tourStore.update,
    deleteTour: tourStore.delete,
    loadTours: tourStore.fetchAll,
  };
};

// ===== useTourValidation.ts (新建，從 B 提取) =====
export function useTourValidation() {
  const validateTourDates = (start: string, end: string) => { /* ... */ };
  const validateTourData = (data: Partial<Tour>) => { /* ... */ };
  const canEditTour = (tour: Tour) => tour.status === 'draft' || tour.status === 'active';
  const canDeleteTour = (tour: Tour) => tour.status === 'draft';

  return {
    validateTourDates,
    validateTourData,
    canEditTour,
    canDeleteTour,
  };
}

// ===== useTourQueries.ts (新建，從 B 提取) =====
export function useTourQueries() {
  const { tours } = useTours();

  const activeTours = useMemo(() =>
    tours.filter(t => t.status === 'active'), [tours]
  );

  const draftTours = useMemo(() =>
    tours.filter(t => t.status === 'draft'), [tours]
  );

  const searchTours = (keyword: string) =>
    tours.filter(t =>
      t.code.includes(keyword) ||
      t.name.includes(keyword)
    );

  const getToursByDateRange = (start: string, end: string) => { /* ... */ };

  return {
    activeTours,
    draftTours,
    searchTours,
    getToursByDateRange,
  };
}

// ===== useToursAdvanced.ts (重命名 C，解決命名衝突) =====
export function useToursAdvanced(params?: PageRequest) {
  // 保留分頁 + 樂觀更新邏輯
  // ...（現有邏輯）
}

// ===== index.ts (統一導出) =====
export { useTours } from './useTours';                    // 基礎版
export { useToursAdvanced } from './useToursAdvanced';    // 進階版
export { useTourValidation } from './useTourValidation';  // 驗證
export { useTourQueries } from './useTourQueries';        // 查詢
export { useTourOperations } from './useTourOperations';  // 操作
export { useTourPageState } from './useTourPageState';    // 狀態
```

**使用範例：**
```typescript
// 簡單列表頁面 - 只需要基礎版
import { useTours } from '@/features/tours/hooks';
const { tours, createTour } = useTours();

// 複雜搜尋頁面 - 需要查詢功能
import { useTours, useTourQueries } from '@/features/tours/hooks';
const { tours } = useTours();
const { searchTours, activeTours } = useTourQueries();

// 表單頁面 - 需要驗證
import { useTours, useTourValidation } from '@/features/tours/hooks';
const { createTour } = useTours();
const { validateTourData, canEditTour } = useTourValidation();

// 大型列表頁面 - 需要分頁
import { useToursAdvanced } from '@/features/tours/hooks';
const { data, totalCount, actions } = useToursAdvanced({ page: 1, limit: 20 });
```

**優點：**
- ✅ 職責單一（Single Responsibility）
- ✅ 按需引入，減少 bundle size
- ✅ 易於測試
- ✅ 保持向後兼容

**缺點：**
- ⚠️ 需要修改所有使用處的 import

---

#### 方案 B：單一強化版（不推薦 ⭐⭐）

**策略：合併為一個超級 Hook**

```typescript
export function useTours(options?: {
  withValidation?: boolean;
  withQueries?: boolean;
  withPagination?: PageRequest;
}) {
  // 合併所有邏輯到一個檔案
  // ...
}
```

**優點：**
- ✅ 只有一個檔案
- ✅ 不需要修改 import

**缺點：**
- ❌ 違反單一職責原則
- ❌ 檔案太大（500+ 行）
- ❌ 難以維護
- ❌ 載入不必要的代碼

---

### 📊 影響評估

**需要修改的檔案：**
```bash
# 搜尋所有使用 useTours 的地方
$ grep -r "import.*useTours" src --include="*.tsx" --include="*.ts"

估計：10-15 個檔案需要更新 import
```

**風險等級：中等**
- 有型別檢查保護
- 邏輯不變，只是位置改變
- 可以逐步遷移

**時間估計：**
- 重構 hooks: 2-3 小時
- 更新使用處: 1-2 小時
- 測試: 1 小時
- **總計: 4-6 小時**

---

## 2. Customer Hooks 分析

### 📁 發現的 Customer Hooks

| 檔案路徑 | 行數 | 功能 | 狀態 |
|---------|------|------|------|
| `/src/features/customers/hooks/useCustomers.ts` | 68行 | 簡化版 | ⚠️ |
| `/src/hooks/useCustomers.ts` | 69行 | 包含驗證 | ⚠️ |

### 🔍 詳細對比

#### A. `/src/features/customers/hooks/useCustomers.ts`
```typescript
export const useCustomers = () => {
  const store = useCustomerStore();

  return {
    customers: store.items,
    createCustomer: store.create,
    updateCustomer: store.update,
    deleteCustomer: store.delete,
    loadCustomers: store.fetchAll,
    searchCustomers,        // 來自 service
    getCustomersByTour,     // 來自 service
    getVIPCustomers,        // 來自 service
  };
};
```

#### B. `/src/hooks/useCustomers.ts`
```typescript
export function useCustomers() {
  const store = useCustomerStore();

  // 驗證邏輯
  const validateCustomerData = (data) => {
    if (data.phone && !/^[0-9-+()]{8,15}$/.test(data.phone)) {
      throw new Error('電話格式錯誤');
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Email 格式錯誤');
    }
  };

  // VIP 折扣計算
  const getVipDiscount = (level?: VipLevel): number => {
    const discounts = { bronze: 0.05, silver: 0.1, /* ... */ };
    return level ? discounts[level] : 0;
  };

  const createCustomer = async (data) => {
    validateCustomerData(data);  // 加入驗證
    return await store.create(data);
  };

  // VIP 客戶篩選
  const vipCustomers = useMemo(() =>
    store.items.filter(c => c.is_vip && c.is_active), [store.items]
  );

  return {
    customers: store.items,
    loading: store.loading,
    error: store.error,
    createCustomer,
    updateCustomer,
    deleteCustomer: store.delete,
    vipCustomers,
    searchCustomers,
    getVipDiscount,
  };
}
```

### 💡 重構建議

#### 推薦方案：合併為單一檔案 ⭐⭐⭐⭐⭐

**原因：**
- Customer 業務邏輯簡單（不像 Tour 那麼複雜）
- 兩個檔案差異不大（只差驗證 + VIP 邏輯）
- 合併後只有 ~80 行，仍然很輕量

**新檔案位置：**
```
/src/features/customers/hooks/useCustomers.ts  (✅ 保留這個)
/src/hooks/useCustomers.ts                      (❌ 刪除)
```

**合併後的代碼：**
```typescript
// /src/features/customers/hooks/useCustomers.ts
import { useMemo } from 'react';
import { useCustomerStore } from '@/stores';
import { customerService } from '../services/customer.service';
import { Customer, VipLevel } from '@/types';

export const useCustomers = () => {
  const store = useCustomerStore();

  // ========== 驗證邏輯 ==========
  const validateCustomerData = (data: Partial<Customer>): void => {
    if (data.phone && !/^[0-9-+()]{8,15}$/.test(data.phone)) {
      throw new Error('電話格式錯誤');
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Email 格式錯誤');
    }
  };

  // ========== VIP 邏輯 ==========
  const getVipDiscount = (level?: VipLevel): number => {
    const discounts: Record<VipLevel, number> = {
      bronze: 0.05,
      silver: 0.1,
      gold: 0.15,
      platinum: 0.2,
      diamond: 0.25,
    };
    return level ? discounts[level] : 0;
  };

  const vipCustomers = useMemo(() =>
    store.items.filter(c => c.is_vip && c.is_active),
    [store.items]
  );

  // ========== CRUD 操作（加入驗證）==========
  const createCustomer = async (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
    validateCustomerData(data);
    return await store.create(data as unknown);
  };

  const updateCustomer = async (id: string, data: Partial<Customer>) => {
    validateCustomerData(data);
    return await store.update(id, data);
  };

  // ========== 業務方法 ==========
  const searchCustomers = (keyword: string): Customer[] => {
    const k = keyword.toLowerCase();
    return store.items.filter(c =>
      c.name.toLowerCase().includes(k) ||
      c.phone.includes(k) ||
      c.email?.toLowerCase().includes(k)
    );
  };

  return {
    // 資料
    customers: store.items,
    loading: store.loading,
    error: store.error,

    // CRUD
    createCustomer,
    updateCustomer,
    deleteCustomer: store.delete,
    loadCustomers: store.fetchAll,

    // VIP 相關
    vipCustomers,
    getVipDiscount,
    getVIPCustomers: customerService.getVIPCustomers,

    // 查詢
    searchCustomers,
    getCustomersByTour: customerService.getCustomersByTour,

    // 驗證
    validateCustomerData,
  };
};
```

### 📊 影響評估

**需要修改的檔案：**
```bash
# 搜尋使用 /src/hooks/useCustomers 的地方
$ grep -r "from '@/hooks.*useCustomers" src --include="*.tsx" --include="*.ts"

估計：3-5 個檔案需要更新 import
```

**遷移步驟：**
1. 將 `/src/hooks/useCustomers.ts` 的驗證邏輯合併到 `/src/features/customers/hooks/useCustomers.ts`
2. 更新所有 import 路徑
3. 刪除 `/src/hooks/useCustomers.ts`
4. 測試

**風險等級：低**
- 邏輯簡單
- 使用處少

**時間估計：1-2 小時**

---

## 3. 日期輸入組件分析

### 📁 發現的日期組件

| 檔案路徑 | 行數 | 使用次數 | 狀態 |
|---------|------|---------|------|
| `/src/components/ui/date-input.tsx` | 200行 | 0 次 | ❌ 未使用 |
| `/src/components/ui/smart-date-input.tsx` | 217行 | 2 次 | ✅ 使用中 |

### 🔍 使用情況檢查

```bash
# smart-date-input 被使用
$ grep -r "smart-date-input" src --include="*.tsx" --include="*.ts"
src/components/ui/index.ts:export { SmartDateInput } from './smart-date-input';
src/app/calendar/page.tsx:import { SmartDateInput } from '@/components/ui';

# date-input 未被使用
$ grep -r "date-input" src --include="*.tsx" --include="*.ts" | grep -v smart
(無結果)
```

### 💡 重構建議

#### 方案：直接刪除 `date-input.tsx` ⭐⭐⭐⭐⭐

**原因：**
- ✅ 完全未被使用（0 引用）
- ✅ `smart-date-input.tsx` 已經滿足所有需求
- ✅ 零風險

**執行步驟：**
```bash
# 1. 最後確認無使用
grep -r "date-input" src --include="*.tsx" --include="*.ts" | grep -v smart

# 2. 刪除檔案
rm src/components/ui/date-input.tsx

# 3. 從 index.ts 移除導出（如果有）
# 編輯 src/components/ui/index.ts
```

**優點：**
- ✅ 立即減少 200 行代碼
- ✅ 零風險
- ✅ 減少維護成本

**時間估計：5 分鐘**

---

## 4. Store 創建方式分析

### 📁 發現的 Store 工廠

| 檔案路徑 | 使用次數 | 狀態 |
|---------|---------|------|
| `/src/stores/create-store.ts` | **20+ 次** | ✅ 現役 |
| `/src/stores/core/create-store-new.ts` | 2 次 | ⚠️ 新版未完全採用 |

### 🔍 詳細對比

#### A. `/src/stores/create-store.ts` (現役版本)
```typescript
/**
 * Zustand Store 工廠函數
 * 支援 Supabase 雲端同步 + IndexedDB 本地快取
 */
export function createStore<T extends BaseEntity>(
  tableName: TableName,
  codePrefix?: string
): UseStore<StoreState<T>> {
  return create<StoreState<T>>()(
    persist(
      (set, get) => ({
        items: [],
        loading: false,
        error: null,

        // CRUD 操作
        fetchAll: async () => { /* ... */ },
        create: async (data) => { /* ... */ },
        update: async (id, data) => { /* ... */ },
        delete: async (id) => { /* ... */ },

        // 批次操作
        createMany: async (dataArray) => { /* ... */ },
        deleteMany: async (ids) => { /* ... */ },

        // 查詢操作
        findByField: (field, value) => { /* ... */ },
        filter: (predicate) => { /* ... */ },
        count: (predicate) => { /* ... */ },
        clear: () => { /* ... */ },
      }),
      {
        name: `${tableName}-storage`,
        storage: createJSONStorage(() => localStorage),
      }
    )
  );
}
```

**使用方式：**
```typescript
// src/stores/index.ts
export const useTourStore = createStore<Tour>('tours', 'T');
export const useOrderStore = createStore<Order>('orders', 'O');
export const useCustomerStore = createStore<Customer>('customers', 'C');
```

#### B. `/src/stores/core/create-store-new.ts` (新版)
```typescript
/**
 * Zustand Store 工廠函數（重構版）
 * 使用適配器模式 + 同步協調器
 */
export function createStore<T extends BaseEntity>(
  config: StoreConfig | TableName,
  legacyPrefix?: string
): UseStore<StoreState<T>> {
  // 向後相容處理
  const finalConfig: StoreConfig = typeof config === 'string'
    ? { tableName: config, codePrefix: legacyPrefix }
    : config;

  // 初始化適配器
  const indexedDBAdapter = new IndexedDBAdapter(finalConfig.tableName);
  const supabaseAdapter = new SupabaseAdapter(finalConfig.tableName);

  // 初始化同步協調器
  const syncCoordinator = new SyncCoordinator({
    indexedDBAdapter,
    supabaseAdapter,
    tableName: finalConfig.tableName,
  });

  return create<StoreState<T>>()(
    persist(
      (set, get) => ({
        items: [],
        loading: false,
        error: null,

        // 使用提取的操作函數
        fetchAll: () => fetchAll({ get, set, syncCoordinator }),
        fetchById: (id) => fetchById(id, { get, set, syncCoordinator }),
        create: (data) => createItem(data, { get, set, syncCoordinator, config: finalConfig }),
        update: (id, data) => updateItem(id, data, { get, set, syncCoordinator }),
        delete: (id) => deleteItem(id, { get, set, syncCoordinator }),
        // ...
      }),
      { name: `${finalConfig.tableName}-storage` }
    )
  );
}
```

**使用方式：**
```typescript
// 新版支援兩種方式
const useTourStore = createStore<Tour>('tours', 'T');  // 舊版相容
const useTourStore = createStore<Tour>({ tableName: 'tours', codePrefix: 'T' });  // 新版
```

### 🤔 問題分析

#### 為什麼有兩個版本？

1. **`create-store.ts`** (現役)
   - 所有 Store 都在使用 (20+ 個)
   - 穩定、經過實戰檢驗
   - 但代碼較單一化（所有邏輯在一個檔案）

2. **`create-store-new.ts`** (新版)
   - 架構更優雅（適配器模式、操作分離）
   - 只有 2 個 Store 在試用
   - 未完全推廣

#### 兩個版本的差異

| 特性 | create-store.ts | create-store-new.ts |
|-----|----------------|-------------------|
| 架構 | 單一檔案 | 適配器模式 + 模組化 |
| 操作邏輯 | 內嵌在 createStore | 提取到 operations/ |
| 同步邏輯 | 內嵌 | SyncCoordinator |
| 測試性 | 較難測試 | 易於測試 |
| 複雜度 | 簡單直接 | 較複雜 |
| 向後相容 | N/A | 完全相容 |

### 💡 重構建議

#### 方案 A：保留現狀（推薦 ⭐⭐⭐⭐）

**原因：**
- ✅ 現有系統穩定運行
- ✅ 新版架構確實更優，但**未經充分驗證**
- ✅ 重構 20+ Stores 風險太高
- ✅ 收益不明顯（使用者不會感知）

**建議：**
```
1. 保留 create-store.ts 作為主要版本
2. 保留 create-store-new.ts 但標記為實驗性
3. 在新建 Store 時優先使用新版（如果團隊同意）
4. 不強制遷移現有 Store
```

---

#### 方案 B：全面遷移到新版（不推薦 ⭐⭐）

**步驟：**
1. 將 `create-store-new.ts` 改名為 `create-store.ts`
2. 將舊版備份為 `create-store-legacy.ts`
3. 利用向後相容性，無需修改使用處
4. 充分測試所有 Store

**風險：**
- ❌ 高風險（20+ Stores 同時變更）
- ❌ 新版未經充分驗證
- ❌ 如果出問題，影響範圍極大

---

#### 方案 C：逐步遷移（折衷方案 ⭐⭐⭐）

**步驟：**
1. 保留兩個版本共存
2. 新建的 Store 使用新版
3. 重要 Store（tours, orders）逐一遷移並測試
4. 3-6 個月後，如果新版穩定，再考慮全面遷移

**優點：**
- ✅ 風險可控
- ✅ 可以在實戰中驗證新版
- ✅ 不影響現有功能

---

### 📊 決策建議

**當前最佳做法：方案 A（保留現狀）**

**理由：**
1. **沒有緊急需求** - 現有 Store 工作正常
2. **風險高於收益** - 遷移 20+ Stores 風險很高，但收益不明顯
3. **優先級低** - 有更重要的業務功能要開發
4. **新版未驗證** - 只有 2 個 Store 試用，樣本太小

**建議行動：**
```markdown
✅ 保留 create-store.ts 作為主力
✅ 在 create-store-new.ts 頂部添加註釋說明其實驗性質
✅ 如果未來新版被證明穩定，再考慮遷移
❌ 不花時間在這個重構上
```

---

## 5. 重構建議總結

### 🎯 優先級排序

| 項目 | 優先級 | 風險 | 時間 | 收益 | 建議 |
|-----|-------|------|------|------|------|
| 日期輸入組件 | ⭐⭐⭐⭐⭐ 最高 | 極低 | 5分鐘 | 減少 200 行代碼 | ✅ **立即執行** |
| Customer Hooks | ⭐⭐⭐⭐ 高 | 低 | 1-2小時 | 減少重複、統一接口 | ✅ **近期執行** |
| Tour Hooks | ⭐⭐⭐ 中 | 中 | 4-6小時 | 改善架構、易於維護 | ⚠️ **規劃後執行** |
| Store 創建方式 | ⭐ 低 | 高 | 不建議 | 收益不明顯 | ❌ **暫不執行** |

---

### 📋 推薦執行計劃

#### 第一階段：快速清理（立即執行）
```bash
# 1. 刪除未使用的 date-input.tsx
rm src/components/ui/date-input.tsx

# 預期收益：
# - 減少 200 行代碼
# - 減少維護成本
# - 零風險
```

---

#### 第二階段：統一 Customer Hooks（本週內）
```bash
# 1. 合併 useCustomers
# 2. 更新 import 路徑（3-5 個檔案）
# 3. 刪除舊檔案

# 預期收益：
# - 統一接口
# - 減少重複
# - 添加驗證邏輯
```

---

#### 第三階段：重構 Tour Hooks（規劃後）
```bash
# 需要先討論：
# 1. 是否接受分層架構？
# 2. 是否值得花 4-6 小時？
# 3. 團隊是否有時間？

# 如果答案都是 YES，再執行：
# 1. 拆分 useTours 為多個小 hooks
# 2. 更新所有使用處（10-15 個檔案）
# 3. 充分測試

# 預期收益：
# - 更好的架構
# - 易於維護和測試
# - 按需引入
```

---

#### 第四階段：Store 創建方式（暫不執行）
```
❌ 不建議現在重構
✅ 保留現狀，持續觀察新版穩定性
✅ 如果 6 個月後新版證明穩定，再考慮遷移
```

---

### 🎯 最終建議

**立即執行：**
1. ✅ 刪除 `date-input.tsx`（5 分鐘）
2. ✅ 合併 Customer Hooks（1-2 小時）

**需要討論：**
3. ⚠️ Tour Hooks 重構（需要團隊討論是否值得）

**暫不執行：**
4. ❌ Store 創建方式（保留現狀）

**總時間投入：1-2.5 小時**
**總收益：減少 200+ 行代碼，統一接口，降低維護成本**

---

### 📞 下一步行動

請回答以下問題，幫助我確定執行策略：

1. **日期組件** - 是否立即刪除 `date-input.tsx`？（建議：是）
2. **Customer Hooks** - 是否合併為單一檔案？（建議：是）
3. **Tour Hooks** - 是否值得花 4-6 小時重構？（需討論）
4. **Store 創建** - 是否同意保留現狀？（建議：是）

---

**報告完成時間：** 2025-10-26
**建議審閱人：** 技術負責人 / 架構師
**預期決策時間：** 1-2 天內
