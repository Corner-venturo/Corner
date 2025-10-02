# 🏗️ Venturo 系統架構文檔

> **版本**: 2.0
> **最後更新**: 2025-01-02
> **架構師**: Claude AI + Team

---

## 📑 目錄

1. [系統概述](#系統概述)
2. [架構設計原則](#架構設計原則)
3. [分層架構](#分層架構)
4. [目錄結構](#目錄結構)
5. [數據流向](#數據流向)
6. [模組說明](#模組說明)
7. [設計模式](#設計模式)
8. [最佳實踐](#最佳實踐)
9. [性能優化](#性能優化)
10. [未來擴展](#未來擴展)

---

## 系統概述

Venturo 是一個基於 **Next.js 15** 的旅遊管理系統，採用 **分層架構** 和 **領域驅動設計** 原則，確保代碼的可維護性、可測試性和可擴展性。

### 核心技術棧

- **框架**: Next.js 15 (App Router)
- **語言**: TypeScript 5
- **狀態管理**: Zustand (with persist middleware)
- **UI 框架**: React 18
- **樣式**: Tailwind CSS
- **數據庫**: Supabase (PostgreSQL)
- **離線支援**: IndexedDB + localStorage

---

## 架構設計原則

### 1. **關注點分離 (Separation of Concerns)**
每一層只負責自己的職責，不跨層調用。

### 2. **依賴倒置 (Dependency Inversion)**
高層模組不依賴低層模組，都依賴抽象。

### 3. **單一職責 (Single Responsibility)**
每個模組、類、函數只做一件事。

### 4. **開放封閉 (Open/Closed)**
對擴展開放，對修改封閉。

### 5. **DRY 原則 (Don't Repeat Yourself)**
統一的 CRUD 方法、統一的錯誤處理、統一的類型定義。

---

## 分層架構

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer (Pages)                     │
│  - Next.js App Router Pages                             │
│  - React Components                                     │
│  - 只負責渲染和用戶交互                                  │
└──────────────────────┬──────────────────────────────────┘
                       │ 調用
                       ↓
┌─────────────────────────────────────────────────────────┐
│              Custom Hooks Layer (抽象層)                 │
│  - usePayments, useTours, useOrders, etc.               │
│  - 隔離 UI 和 Store                                      │
│  - 提供統一的業務接口                                    │
└──────────────────────┬──────────────────────────────────┘
                       │ 調用
                       ↓
┌─────────────────────────────────────────────────────────┐
│            Service Layer (業務邏輯層)                    │
│  - PaymentService, QuoteService, etc.                   │
│  - 業務規則驗證                                          │
│  - 複雜計算邏輯                                          │
│  - 繼承 BaseService (統一 CRUD)                          │
└──────────────────────┬──────────────────────────────────┘
                       │ 調用
                       ↓
┌─────────────────────────────────────────────────────────┐
│              Store Layer (狀態管理層)                    │
│  - Zustand Stores                                       │
│  - 純狀態管理，不含業務邏輯                              │
│  - 持久化到 localStorage                                 │
└──────────────────────┬──────────────────────────────────┘
                       │ 同步
                       ↓
┌─────────────────────────────────────────────────────────┐
│            Data Layer (數據持久層)                       │
│  - Supabase (PostgreSQL)                                │
│  - IndexedDB (離線緩存)                                  │
│  - localStorage (輕量緩存)                               │
└─────────────────────────────────────────────────────────┘
```

---

## 目錄結構

```
src/
├── app/                          # Next.js App Router 頁面
│   ├── (pages)/                  # 業務頁面群組
│   │   ├── finance/              # 財務模組頁面
│   │   ├── tours/                # 旅遊團管理頁面
│   │   ├── orders/               # 訂單管理頁面
│   │   └── ...
│   └── layout.tsx                # 根布局
│
├── features/                     # 🌟 業務層 (新增)
│   ├── index.ts                  # 統一導出所有 hooks 和 services
│   │
│   ├── payments/                 # 請款模組
│   │   ├── services/
│   │   │   └── payment.service.ts   # PaymentService - 業務邏輯
│   │   ├── hooks/
│   │   │   └── usePayments.ts       # Custom Hook - 抽象層
│   │   └── index.ts                 # 模組導出
│   │
│   ├── quotes/                   # 報價模組
│   │   ├── services/
│   │   │   └── quote.service.ts
│   │   ├── hooks/
│   │   │   └── useQuotes.ts
│   │   └── index.ts
│   │
│   ├── orders/                   # 訂單模組
│   │   ├── services/
│   │   │   └── order.service.ts
│   │   ├── hooks/
│   │   │   └── useOrders.ts
│   │   └── index.ts
│   │
│   ├── todos/                    # 待辦事項模組
│   │   ├── services/
│   │   │   └── todo.service.ts
│   │   ├── hooks/
│   │   │   └── useTodos.ts
│   │   └── index.ts
│   │
│   ├── accounting/               # 會計模組
│   │   ├── services/
│   │   │   └── accounting.service.ts
│   │   ├── hooks/
│   │   │   └── useAccounting.ts
│   │   └── index.ts
│   │
│   ├── tours/                    # 旅遊團模組
│   │   ├── services/
│   │   │   └── tour.service.ts
│   │   ├── hooks/
│   │   │   └── useTours.ts
│   │   └── index.ts
│   │
│   ├── suppliers/                # 供應商模組
│   │   ├── services/
│   │   │   └── supplier.service.ts
│   │   ├── hooks/
│   │   │   └── useSuppliers.ts
│   │   └── index.ts
│   │
│   └── customers/                # 客戶模組
│       ├── services/
│       │   └── customer.service.ts
│       ├── hooks/
│       │   └── useCustomers.ts
│       └── index.ts
│
├── core/                         # 核心基礎設施
│   ├── services/
│   │   └── base.service.ts       # BaseService - 所有 Service 的父類
│   ├── errors/
│   │   └── app-errors.ts         # 統一錯誤類型
│   └── types/
│       └── common.ts             # 通用類型定義
│
├── stores/                       # Zustand 狀態管理
│   ├── payment-store.ts
│   ├── quote-store.ts
│   ├── order-store.ts
│   ├── todo-store.ts
│   ├── accounting-store.ts
│   ├── tour-store.ts
│   ├── supplier-store.ts
│   └── types.ts                  # Store 類型定義
│
├── components/                   # React 組件
│   ├── ui/                       # 通用 UI 組件
│   ├── layout/                   # 布局組件
│   ├── shared/                   # 共享業務組件
│   └── [domain]/                 # 領域特定組件
│
├── lib/                          # 工具函數庫
│   ├── utils.ts                  # 通用工具函數
│   ├── persistent-store.ts       # Store 持久化工具
│   └── auth/                     # 認證相關
│
└── hooks/                        # 通用 React Hooks
    ├── useCrudOperations.ts
    └── useDialog.ts
```

---

## 數據流向

### 1. **讀取流程** (Read)

```
User Action (UI)
    ↓
usePayments() Hook
    ↓
paymentService.list()
    ↓
usePaymentStore.getState().paymentRequests
    ↓
返回數據到 UI
```

### 2. **創建流程** (Create)

```
User Input (UI)
    ↓
usePayments().createPaymentRequest(data)
    ↓
paymentService.create(data)
    ├─ 驗證數據 (validate)
    ├─ 生成 ID (generateId)
    ├─ 生成時間戳 (now)
    └─ 調用 Store
        ↓
usePaymentStore.addPaymentRequest()
    ├─ 更新內存狀態
    ├─ 持久化到 localStorage
    └─ (可選) 同步到 Supabase
        ↓
UI 自動更新 (Zustand 訂閱機制)
```

### 3. **更新流程** (Update)

```
User Edit (UI)
    ↓
usePayments().updatePaymentRequest(id, updates)
    ↓
paymentService.update(id, updates)
    ├─ 驗證數據
    ├─ 檢查存在性
    └─ 調用 Store
        ↓
usePaymentStore.updatePaymentRequest(id, updates)
    ├─ 更新內存
    ├─ 更新 updatedAt
    └─ 持久化
        ↓
UI 自動更新
```

---

## 模組說明

### 核心模組

#### 1. **Payments (請款管理)**
- **Service**: `PaymentService`
- **Hook**: `usePayments`
- **Store**: `usePaymentStore`
- **功能**:
  - 請款單管理 (CRUD)
  - 請款項目管理
  - 出納單管理
  - 自動編號生成
  - 金額計算

#### 2. **Quotes (報價管理)**
- **Service**: `QuoteService`
- **Hook**: `useQuotes`
- **Store**: `useQuoteStore`
- **功能**:
  - 報價單 CRUD
  - 版本管理
  - 報價單複製
  - 成本計算

#### 3. **Orders (訂單管理)**
- **Service**: `OrderService`
- **Hook**: `useOrders`
- **Store**: `useOrderStore`
- **功能**:
  - 訂單 CRUD
  - 訂單狀態管理
  - 營收統計

#### 4. **Tours (旅遊團管理)**
- **Service**: `TourService`
- **Hook**: `useTours`
- **Store**: `useTourStore`
- **功能**:
  - 旅遊團 CRUD
  - 團號生成
  - 財務摘要
  - 成員管理

#### 5. **Todos (待辦事項)**
- **Service**: `TodoService`
- **Hook**: `useTodos`
- **Store**: `useTodoStore`
- **功能**:
  - 待辦 CRUD
  - 優先級管理
  - 期限提醒
  - 權限控制

#### 6. **Accounting (會計)**
- **Service**: `AccountingService`, `CategoryService`
- **Hook**: `useAccounting`
- **Store**: `useAccountingStore`
- **功能**:
  - 帳戶管理
  - 交易記錄
  - 分類管理
  - 財務統計

#### 7. **Suppliers (供應商)**
- **Service**: `SupplierService`
- **Hook**: `useSuppliers`
- **Store**: `useSupplierStore`
- **功能**:
  - 供應商 CRUD
  - 分類管理
  - 搜尋功能

#### 8. **Customers (客戶)**
- **Service**: `CustomerService`
- **Hook**: `useCustomers`
- **Store**: `useTourStore.customers`
- **功能**:
  - 客戶 CRUD
  - VIP 管理
  - 搜尋功能

---

## 設計模式

### 1. **Service Layer Pattern (服務層模式)**

所有 Service 繼承 `BaseService`：

```typescript
// core/services/base.service.ts
export abstract class BaseService<T extends BaseEntity> {
  protected abstract resourceName: string;
  protected abstract getStore: () => StoreOperations<T>;

  async create(data: Omit<T, keyof BaseEntity>): Promise<T>
  async list(params?: PageRequest): Promise<PageResponse<T>>
  async getById(id: string): Promise<T | null>
  async update(id: string, data: Partial<T>): Promise<T>
  async delete(id: string): Promise<boolean>

  // 批次操作
  async batchCreate(items: Omit<T, keyof BaseEntity>[]): Promise<T[]>
  async batchUpdate(updates: { id: string; data: Partial<T> }[]): Promise<T[]>
  async batchDelete(ids: string[]): Promise<{ success: string[]; failed: string[] }>
}
```

### 2. **Custom Hooks Pattern (自定義 Hook 模式)**

統一的 Hook 接口設計：

```typescript
export const usePayments = () => {
  const store = usePaymentStore();

  return {
    // 數據
    paymentRequests: store.paymentRequests,

    // CRUD 操作
    createPaymentRequest: async (data) => {...},
    updatePaymentRequest: async (id, data) => {...},
    deletePaymentRequest: async (id) => {...},

    // 業務方法
    generateRequestNumber: () => {...},
    getPendingRequests: () => {...},
  };
};
```

### 3. **Repository Pattern (倉儲模式)**

Store 作為數據倉儲：

```typescript
interface StoreOperations<T> {
  getAll: () => T[];
  getById: (id: string) => T | undefined;
  add: (entity: T) => void;
  update: (id: string, data: Partial<T>) => void;
  delete: (id: string) => void;
}
```

### 4. **Factory Pattern (工廠模式)**

統一的 CRUD 方法生成：

```typescript
// lib/persistent-store.ts
export const createPersistentCrudMethods = <T>(
  tableName: string,
  arrayKey: string,
  set: SetState<any>,
  get: GetState<any>
) => {
  return {
    [`add${capitalizedName}`]: async (data) => {...},
    [`update${capitalizedName}`]: async (id, data) => {...},
    [`delete${capitalizedName}`]: async (id) => {...},
    [`load${capitalizedName}s`]: async () => {...},
  };
};
```

---

## 最佳實踐

### 1. **命名規範**

| 層級 | 操作 | 命名 | 範例 |
|-----|------|------|------|
| UI Layer | 創建 | `handleCreate*` | `handleCreateOrder` |
| Hook Layer | 創建 | `create*` | `createOrder` |
| Service Layer | 創建 | `create` | `service.create()` |
| Store Layer | 創建 | `add*` | `addOrder` |

### 2. **導入規範**

```typescript
// ✅ 推薦：從 features 統一導入
import { usePayments, useTours, useOrders } from '@/features';

// ⚠️ 可接受：從子模組導入
import { usePayments } from '@/features/payments';

// ❌ 不推薦：直接導入 Store
import { usePaymentStore } from '@/stores/payment-store';
```

### 3. **錯誤處理**

```typescript
try {
  const request = await createPaymentRequest(data);
} catch (error) {
  if (error instanceof ValidationError) {
    // 顯示驗證錯誤
  } else if (error instanceof NotFoundError) {
    // 顯示找不到錯誤
  } else {
    // 通用錯誤處理
  }
}
```

### 4. **類型安全**

```typescript
// ✅ 使用明確的類型
const request: PaymentRequest = await createPaymentRequest(data);

// ✅ 使用泛型
const service = new PaymentService<PaymentRequest>();

// ❌ 避免 any
const data: any = {...};  // 不推薦
```

---

## 性能優化

### 1. **React Memo**
所有頻繁重渲染的組件使用 `React.memo`：

```typescript
export const ExpensiveComponent = memo(function ExpensiveComponent(props) {
  // ...
});
```

### 2. **useCallback & useMemo**
```typescript
const handleSubmit = useCallback(() => {
  // 避免子組件重渲染
}, [dependencies]);

const expensiveValue = useMemo(() => {
  return complexCalculation(data);
}, [data]);
```

### 3. **Zustand 選擇器**
```typescript
// ✅ 只訂閱需要的數據
const orders = useOrderStore(state => state.orders);

// ❌ 避免訂閱整個 store
const store = useOrderStore();
```

### 4. **虛擬化長列表**
```typescript
// 使用 react-window 或 react-virtualized
import { FixedSizeList } from 'react-window';
```

---

## 未來擴展

### 階段 1：完善測試 (Q1 2025)
- [ ] 單元測試覆蓋率 80%+
- [ ] E2E 測試關鍵流程
- [ ] 性能測試基準

### 階段 2：API 集成 (Q2 2025)
- [ ] 替換 Store 為 API 調用
- [ ] 實現 Repository Pattern
- [ ] 加入 React Query 緩存

### 階段 3：微前端架構 (Q3 2025)
- [ ] 模組獨立部署
- [ ] Module Federation
- [ ] 統一的設計系統

### 階段 4：性能優化 (Q4 2025)
- [ ] SSR/SSG 渲染優化
- [ ] Code Splitting 細化
- [ ] CDN 資源加速

---

## 團隊協作

### Git Workflow
- `main` - 生產環境
- `develop` - 開發環境
- `feature/*` - 功能分支
- `hotfix/*` - 緊急修復

### Code Review Checklist
- [ ] 遵循分層架構
- [ ] 使用 Hook 而非直接 Store
- [ ] 完整的 TypeScript 類型
- [ ] 錯誤處理完善
- [ ] 無 console.log
- [ ] 代碼註釋充分

---

## 參考資源

- [Next.js 官方文檔](https://nextjs.org/docs)
- [React 設計模式](https://www.patterns.dev)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [TypeScript 最佳實踐](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

**維護者**: Venturo Development Team
**聯繫方式**: dev@venturo.com
