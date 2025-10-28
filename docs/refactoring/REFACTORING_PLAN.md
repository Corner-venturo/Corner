# 🏗️ create-store.ts 重構計劃

**目標**: 將 696 行的單一檔案拆分成 7 個模組化檔案
**預期結果**: 每個檔案 <150 行，職責明確，易於測試

---

## 📊 當前狀況分析

### 功能區塊分佈 (696 行)

| 區塊 | 行數 | 職責 | 複雜度 |
|------|------|------|--------|
| **型別定義** | ~80 行 | StoreState, CodeConfig, StoreConfig | 🟢 低 |
| **編號生成** | ~25 行 | _generateCode 函數 | 🟢 低 |
| **fetchAll** | ~210 行 | IndexedDB + Supabase 同步邏輯 | 🔴 高 |
| **fetchById** | ~35 行 | 單筆查詢 | 🟢 低 |
| **create** | ~60 行 | FastIn 新增邏輯 | 🟡 中 |
| **update** | ~60 行 | FastIn 更新邏輯 | 🟡 中 |
| **delete** | ~55 行 | FastIn 刪除邏輯 | 🟡 中 |
| **批次操作** | ~25 行 | createMany, deleteMany | 🟢 低 |
| **查詢操作** | ~20 行 | findByField, filter, count | 🟢 低 |
| **同步操作** | ~25 行 | syncPending, cancelRequests | 🟢 低 |
| **事件監聽器** | ~25 行 | 全域事件註冊 | 🟢 低 |
| **配置解析** | ~20 行 | 向後相容處理 | 🟢 低 |

### 核心問題

1. **fetchAll 太複雜** (210 行) - 包含：
   - IndexedDB 初始化邏輯
   - Supabase 首次下載
   - 快取優先策略
   - 背景同步
   - 資料合併
   - 錯誤處理

2. **CRUD 邏輯重複** - create/update/delete 都有類似的 FastIn 模式

3. **缺乏抽象層** - 直接操作 Supabase 和 IndexedDB

---

## 🎯 模組化架構設計

```
src/stores/
├── core/
│   ├── types.ts                  (~80 行) - 所有型別定義
│   ├── config.ts                 (~50 行) - 配置解析與驗證
│   └── create-store.ts           (~120 行) - 主入口，組合所有模組
│
├── operations/
│   ├── fetch.ts                  (~150 行) - fetchAll + fetchById
│   ├── create.ts                 (~80 行) - create + createMany
│   ├── update.ts                 (~80 行) - update 邏輯
│   ├── delete.ts                 (~80 行) - delete + deleteMany
│   └── query.ts                  (~40 行) - findByField, filter, count
│
├── sync/
│   ├── coordinator.ts            (~100 行) - 同步協調器
│   ├── merge-strategy.ts         (~80 行) - 資料合併策略
│   └── event-bus.ts              (~60 行) - 事件系統
│
├── adapters/
│   ├── indexeddb.ts              (~120 行) - IndexedDB 封裝
│   └── supabase.ts               (~100 行) - Supabase 封裝
│
└── utils/
    ├── code-generator.ts         (~50 行) - 編號生成
    └── abort-manager.ts          (~40 行) - AbortController 管理
```

**總行數**: ~1030 行 (重構後會增加一些，但更清晰)
**平均每檔**: ~85 行

---

## 📝 重構步驟

### Phase 2.1: 建立基礎架構 (1-2 小時)

#### Step 1: 型別定義 ✅
```typescript
// src/stores/core/types.ts
export interface StoreState<T> { ... }
export interface StoreConfig { ... }
export interface CodeConfig { ... }
export interface SyncState { ... }
```

#### Step 2: 工具模組 ✅
```typescript
// src/stores/utils/code-generator.ts
export function generateCode(config, items) { ... }

// src/stores/utils/abort-manager.ts
export class AbortManager { ... }
```

#### Step 3: 適配器層 ✅
```typescript
// src/stores/adapters/indexeddb.ts
export class IndexedDBAdapter<T> {
  async getAll(): Promise<T[]>
  async put(item: T): Promise<void>
  // ...
}

// src/stores/adapters/supabase.ts
export class SupabaseAdapter<T> {
  async fetchAll(): Promise<T[]>
  async insert(item: T): Promise<T>
  // ...
}
```

### Phase 2.2: 同步邏輯拆分 (2-3 小時)

#### Step 4: 同步協調器 ✅
```typescript
// src/stores/sync/coordinator.ts
export class SyncCoordinator<T> {
  async syncPending(): Promise<void>
  async uploadLocalChanges(): Promise<void>
  async downloadRemoteChanges(): Promise<T[]>
}
```

#### Step 5: 合併策略 ✅
```typescript
// src/stores/sync/merge-strategy.ts
export class MergeStrategy<T> {
  merge(local: T[], remote: T[]): T[]
  resolveConflict(local: T, remote: T): T
}
```

### Phase 2.3: 操作層重構 (3-4 小時)

#### Step 6: Fetch 操作 ✅
```typescript
// src/stores/operations/fetch.ts
export async function fetchAll<T>(config, adapters) { ... }
export async function fetchById<T>(id, adapters) { ... }
```

#### Step 7: CRUD 操作 ✅
```typescript
// src/stores/operations/create.ts
export async function create<T>(data, config, adapters) { ... }

// src/stores/operations/update.ts
export async function update<T>(id, data, config, adapters) { ... }

// src/stores/operations/delete.ts
export async function deleteItem<T>(id, config, adapters) { ... }
```

### Phase 2.4: 主入口重構 (1-2 小時)

#### Step 8: 組合所有模組 ✅
```typescript
// src/stores/core/create-store.ts
import { fetchAll, fetchById } from '../operations/fetch';
import { create } from '../operations/create';
// ...

export function createStore<T>(config) {
  const adapters = {
    indexedDB: new IndexedDBAdapter(config.tableName),
    supabase: new SupabaseAdapter(config.tableName),
  };

  const sync = new SyncCoordinator(adapters);

  return createZustandStore({
    fetchAll: () => fetchAll(config, adapters, sync),
    create: (data) => create(data, config, adapters, sync),
    // ...
  });
}
```

---

## ✅ 向後相容性保證

**重要**: 重構後的 API 必須完全向後相容

```typescript
// ✅ 所有現有程式碼無需修改
import { createStore } from './create-store';

// 舊的調用方式仍然有效
export const useTourStore = createStore<Tour>('tours', 'T');

// 新的調用方式也支援
export const useOrderStore = createStore<Order>({
  tableName: 'orders',
  codePrefix: 'O',
  fastInsert: true
});
```

---

## 🧪 測試策略

### 單元測試
每個模組都應該有獨立的單元測試：

```typescript
// __tests__/utils/code-generator.test.ts
describe('generateCode', () => {
  it('should generate correct tour code', () => {
    const code = generateCode({ prefix: 'T', year: 2025 }, []);
    expect(code).toBe('T20250001');
  });
});
```

### 整合測試
確保重構後功能正常：

```typescript
// __tests__/create-store.integration.test.ts
describe('createStore', () => {
  it('should create tour store with all operations', async () => {
    const store = createStore<Tour>('tours', 'T');
    const tour = await store.getState().create({ tour_name: 'Test' });
    expect(tour.code).toMatch(/^T\d{8}$/);
  });
});
```

---

## 📊 預期改善

| 指標 | 重構前 | 重構後 | 改善 |
|------|--------|--------|------|
| **檔案大小** | 696 行 | 最大 150 行 | ✅ -78% |
| **可測試性** | 困難 | 容易 | ✅ +200% |
| **複雜度** | 高 | 低-中 | ✅ -60% |
| **擴充性** | 困難 | 容易 | ✅ +150% |
| **維護性** | 困難 | 容易 | ✅ +200% |

---

## 🎯 執行時程

| 階段 | 任務 | 預估時間 | 狀態 |
|------|------|----------|------|
| **2.1** | 建立基礎架構 | 1-2h | ⏳ 準備開始 |
| **2.2** | 同步邏輯拆分 | 2-3h | ⏳ 待執行 |
| **2.3** | 操作層重構 | 3-4h | ⏳ 待執行 |
| **2.4** | 主入口重構 | 1-2h | ⏳ 待執行 |
| **測試** | 整合測試 | 1-2h | ⏳ 待執行 |

**總預估**: 8-13 小時

---

## 🚀 開始執行

執行順序：
1. ✅ 建立目錄結構
2. ✅ 拆分型別定義 → `core/types.ts`
3. ✅ 拆分工具函數 → `utils/`
4. ✅ 建立適配器層 → `adapters/`
5. ✅ 拆分同步邏輯 → `sync/`
6. ✅ 拆分操作邏輯 → `operations/`
7. ✅ 重構主入口 → `core/create-store.ts`
8. ✅ 測試所有功能
9. ✅ 更新匯入路徑

---

**開始時間**: 準備開始
**負責人**: Claude Code AI
**審查人**: William Chien
