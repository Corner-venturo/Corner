# Venturo 系統架構規範

**版本**: 1.0.0
**日期**: 2025-12-09
**目的**: 確保系統開發與修復遵循統一標準，支援規模化擴展

---

## 目錄

1. [核心原則](#核心原則)
2. [五層架構規範](#五層架構規範)
3. [資料隔離規範](#資料隔離規範)
4. [權限控制規範](#權限控制規範)
5. [Store 開發規範](#store-開發規範)
6. [路由與導航規範](#路由與導航規範)
7. [錯誤處理規範](#錯誤處理規範)
8. [新功能開發檢查清單](#新功能開發檢查清單)

---

## 核心原則

### 1. 單一來源原則 (Single Source of Truth)

每個概念只在一處定義：
- 權限定義 → `src/lib/permissions.ts`
- 角色定義 → `src/lib/rbac-config.ts`
- 型別定義 → `src/types/*.ts`
- Store 工廠 → `src/stores/core/create-store.ts`

**違規範例**：
```typescript
// ❌ 錯誤：在多處定義相同的權限列表
// file1.ts
const permissions = ['admin', 'user', ...]
// file2.ts
const permissions = ['admin', 'user', ...] // 重複定義
```

### 2. 安全預設原則 (Secure by Default)

- 權限檢查：無法匹配時**預設拒絕**
- 資料查詢：無 workspace_id 時**不回傳資料**
- API 調用：無認證時**返回 401**

### 3. 層級隔離原則 (Layer Isolation)

每一層只與相鄰層溝通，禁止跨層調用：
```
UI → Hooks → Store → API/DB
     ↑
     不可直接調用 Store 或 DB
```

---

## 五層架構規範

```
┌─────────────────────────────────────────────────┐
│                  UI Layer                       │
│  React Components, Shadcn UI                    │
│  職責：顯示資料、使用者互動                     │
│  禁止：直接調用 Store 或 DB                     │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│                 Hook Layer                      │
│  Custom Hooks (useTours, useOrders...)          │
│  職責：業務邏輯、資料編排、狀態組合             │
│  禁止：直接操作 DB                              │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│                Store Layer                      │
│  Zustand + createStore 工廠                     │
│  職責：狀態管理、快取、CRUD 操作                │
│  禁止：包含業務邏輯                             │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│                 API Layer                       │
│  Supabase Client                                │
│  職責：資料查詢、同步                           │
│  禁止：包含業務規則                             │
└─────────────────────────────────────────────────┘
```

### 層級職責詳解

| 層級 | 可以做 | 不可以做 |
|------|--------|----------|
| UI | 調用 Hooks、渲染 UI、處理用戶事件 | 直接調用 Store、處理業務邏輯 |
| Hook | 組合多個 Store、處理業務邏輯、資料轉換 | 直接調用 Supabase、寫入 DB |
| Store | CRUD 操作、狀態管理、快取策略 | 處理業務規則、跨 Store 操作 |
| API | 資料查詢、同步、錯誤處理 | 業務邏輯、UI 相關操作 |

---

## 資料隔離規範

### Workspace 隔離架構

```
┌──────────────────────────────────────────────────┐
│                   API 查詢層                     │
│  🔒 workspaceScoped: true 的 Store               │
│  自動加入 .eq('workspace_id', userWorkspaceId)   │
└──────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│                  前端過濾層                      │
│  ⚠️ 僅作為備用，不可依賴                         │
│  用於 UI 層的額外篩選                            │
└──────────────────────────────────────────────────┘
```

### Store 分類

#### 需要 Workspace 隔離的 Store（業務資料）

```typescript
// ✅ 正確：使用 workspaceScoped 配置
export const useTourStore = createStore<Tour>({
  tableName: 'tours',
  codePrefix: 'T',
  workspaceScoped: true,  // 🔒 啟用隔離
})
```

已啟用隔離的 Store：
- `tours`, `itineraries`, `orders`, `customers`, `quotes`
- `payment_requests`, `disbursement_orders`, `receipt_orders`
- `members`, `quote_items`, `tour_addons`
- `todos`, `visas`, `calendar_events`

#### 不需要隔離的 Store（全局共享資料）

```typescript
// ✅ 正確：系統配置表不需要隔離
export const useSupplierStore = createStore<Supplier>('suppliers', 'S')
```

全局共享的 Store：
- `suppliers`, `supplier_categories`
- `regions`, `countries`, `cities`, `attractions`
- `cost_templates`, `vendor_costs`
- `accounting_subjects`（系統預設科目）

### 新增 Store 檢查清單

建立新 Store 時，問自己：
1. 這個資料是屬於特定公司/部門的嗎？ → 需要 `workspaceScoped: true`
2. 這個資料是全系統共享的配置嗎？ → 不需要隔離
3. Super Admin 需要跨 workspace 查看嗎？ → `canCrossWorkspace` 會自動處理

---

## 權限控制規範

### 權限架構層級

```
Layer 1: Supabase Auth (登入驗證)
         ↓
Layer 2: Middleware (路由保護)
         ↓
Layer 3: hasPermissionForRoute (功能權限)
         ↓
Layer 4: workspaceScoped (資料隔離)
         ↓
Layer 5: canCrossWorkspace (跨 workspace 權限)
```

### 權限定義位置

**唯一來源**：`src/lib/permissions.ts`

```typescript
// FEATURE_PERMISSIONS 定義所有功能權限
export const FEATURE_PERMISSIONS: PermissionConfig[] = [
  {
    id: 'tours',
    label: '旅遊團管理',
    category: '業務',
    routes: ['/tours'],
  },
  // ...
]
```

**角色能力**：`src/lib/rbac-config.ts`

```typescript
// ROLE_CONFIG 定義角色能力（不是權限列表）
export const ROLE_CONFIG = {
  super_admin: {
    canCrossWorkspace: true,  // 可跨 workspace
    canManageWorkspace: true, // 可管理 workspace
  },
  // ...
}
```

### 權限檢查流程

```typescript
// 1. Middleware 層：檢查是否已登入
if (!authToken) redirect('/login')

// 2. Auth Guard 層：同步 token 狀態
if (isAuthenticated && !hasAuthCookie()) logout()

// 3. 路由保護層：檢查功能權限
if (!hasPermissionForRoute(userPermissions, pathname)) {
  redirect('/unauthorized')
}

// 4. 資料層：自動過濾 workspace
// workspaceScoped: true 的 Store 會自動處理
```

### 安全原則

```typescript
// ❌ 錯誤：預設允許
if (requiredPermissions.length === 0) {
  return true  // 危險！未配置的路由會被允許訪問
}

// ✅ 正確：預設拒絕
if (requiredPermissions.length === 0) {
  console.warn(`路由 ${pathname} 未配置權限，預設拒絕`)
  return false
}
```

---

## Store 開發規範

### 使用 createStore 工廠

**永遠使用工廠函數**，不要自己寫 Zustand create：

```typescript
// ✅ 正確：使用工廠函數
export const useTourStore = createStore<Tour>({
  tableName: 'tours',
  codePrefix: 'T',
  workspaceScoped: true,
})

// ❌ 錯誤：自己寫 create
export const useTourStore = create<TourState>((set) => ({
  // 手動實作會遺漏快取、同步、隔離等功能
}))
```

### StoreConfig 完整配置

```typescript
interface StoreConfig {
  tableName: TableName       // 必填：資料表名稱
  codePrefix?: string        // 選填：編號前綴 (如 'T', 'O', 'Q')
  workspaceScoped?: boolean  // 選填：是否啟用 workspace 隔離
  enableSupabase?: boolean   // 選填：是否啟用 Supabase (預設 true)
  fastInsert?: boolean       // 選填：是否使用快速寫入 (預設 true)
}
```

### 命名規範

```typescript
// Store 命名：use{Entity}Store
export const useTourStore = createStore<Tour>(...)
export const useOrderStore = createStore<Order>(...)

// 型別命名：PascalCase
interface Tour extends BaseEntity { ... }
interface Order extends BaseEntity { ... }

// 表格命名：snake_case (複數)
tableName: 'tours'
tableName: 'orders'
tableName: 'payment_requests'
```

---

## 路由與導航規範

### 統一使用 router.push

```typescript
// ✅ 正確：使用 Next.js router
import { useRouter } from 'next/navigation'

const router = useRouter()
router.push('/tours')
router.push(`/orders/${orderId}`)

// ❌ 錯誤：使用 window.location
window.location.href = '/tours'      // 會造成完整頁面重載
window.location.reload()             // 會丟失 React 狀態
```

### 例外情況

只有以下情況才使用 `window.location`：
1. 需要完全重置應用狀態（如登出後）
2. 跳轉到外部網站

```typescript
// 登出時可以使用 window.location
const logout = () => {
  clearAuth()
  window.location.href = '/login'  // 確保完全清除狀態
}
```

### 資料刷新

```typescript
// ✅ 正確：使用 Store 的 fetchAll
await memberStore.fetchAll()

// ❌ 錯誤：重載頁面
window.location.reload()
```

---

## 錯誤處理規範

### Token 過期處理

```typescript
// Auth Guard 自動同步 token 狀態
const syncTokenState = useCallback(() => {
  // 檢查 cookie 是否被 middleware 清除
  if (isAuthenticated && !hasAuthCookie()) {
    logout()  // 前端同步登出
    return true
  }
  return false
}, [isAuthenticated, logout])
```

### API 錯誤處理

```typescript
// ✅ 正確：統一錯誤處理
try {
  const { data, error } = await supabase.from('tours').select()
  if (error) throw error
  return data
} catch (error) {
  logger.error('[tours] fetchAll 失敗:', error)
  set({ error: error.message, loading: false })
  return []
}

// ❌ 錯誤：忽略錯誤
const { data } = await supabase.from('tours').select()
return data  // 如果有錯誤會是 null，但不會被處理
```

### 靜默降級

```typescript
// 網路錯誤時靜默降級，不要彈出錯誤
try {
  await syncToSupabase(data)
} catch (error) {
  // 只記錄 log，不要 alert
  logger.warn('同步失敗，稍後重試')
  markForRetry(data)
}
```

---

## 新功能開發檢查清單

### 建立新頁面

- [ ] 頁面使用 `h-full flex flex-col` 佈局
- [ ] 內容區使用 `flex-1 overflow-auto`
- [ ] 在 `permissions.ts` 新增路由權限配置
- [ ] 使用 `useRouter` 處理導航

### 建立新 Store

- [ ] 使用 `createStore` 工廠函數
- [ ] 決定是否需要 `workspaceScoped: true`
- [ ] 在 `src/stores/index.ts` 匯出
- [ ] 型別定義在 `src/types/*.ts`

### 建立新 API

- [ ] 使用 Supabase client
- [ ] 包含錯誤處理
- [ ] 記錄操作日誌

### 修改權限

- [ ] 只修改 `permissions.ts`（不要在多處定義）
- [ ] 測試 Super Admin 能跨 workspace
- [ ] 測試一般用戶只能看到自己 workspace

### 提交前檢查

- [ ] `npm run build` 成功
- [ ] 沒有 `as any` 型別繞過
- [ ] 沒有 `console.log`（用 `logger` 代替）
- [ ] 路由導航使用 `router.push`

---

## 違規處理

當發現違反規範的程式碼時：

1. **優先修復**：不要等待，立即修正
2. **記錄原因**：在 commit message 說明為什麼違反
3. **更新規範**：如果規範不合理，更新文件而不是繞過

---

## 更新歷史

| 日期 | 版本 | 變更內容 |
|------|------|----------|
| 2025-12-09 | 1.0.0 | 初版建立：整合資料隔離、權限控制、Store 規範 |
