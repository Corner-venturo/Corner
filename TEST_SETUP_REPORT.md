# Venturo 測試基礎設施設置報告

> 建立日期: 2025-11-19
> 狀態: 完成 - 所有測試通過 (39/39)

---

## 概述

本報告記錄了 Venturo 專案測試基礎設施的完整設置過程，包含測試框架配置、範例測試撰寫和執行結果。

## 安裝的套件

### 核心測試套件
```json
{
  "vitest": "^4.0.10",
  "@vitest/ui": "^4.0.10",
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/user-event": "^14.6.1",
  "jsdom": "^27.2.0",
  "@vitejs/plugin-react": "^5.1.1"
}
```

### 套件說明
- **vitest**: 快速的測試執行器，與 Vite 原生整合
- **@vitest/ui**: 提供 Web UI 介面，方便視覺化測試結果
- **@testing-library/react**: React 組件測試工具
- **@testing-library/jest-dom**: 提供 DOM 斷言擴展
- **@testing-library/user-event**: 模擬使用者互動
- **jsdom**: 在 Node.js 環境中模擬 DOM
- **@vitejs/plugin-react**: Vite 的 React 插件

---

## 配置檔案

### 1. vitest.config.ts
測試框架的主要配置檔案：

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.types.ts',
        'src/lib/supabase/types.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**配置重點**：
- 使用 `jsdom` 環境模擬瀏覽器
- 啟用全域測試 API (describe, it, expect)
- 排除 E2E 測試 (使用 Playwright 執行)
- 配置覆蓋率報告 (v8 引擎)
- 設定路徑別名 (`@` → `./src`)

### 2. tests/setup.ts
測試環境初始化檔案：

```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IndexedDB
const indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
}
global.indexedDB = indexedDB as any

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  },
}))
```

**Mock 目的**：
- **IndexedDB**: 避免實際操作瀏覽器資料庫
- **Supabase**: 隔離外部 API 依賴，加速測試執行

### 3. package.json Scripts
新增的測試指令：

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## 範例測試

### 1. Store 測試 (auth-store.test.ts)
**檔案位置**: `/tests/stores/auth-store.test.ts`
**測試範圍**: 7 個測試案例

#### 測試內容
- ✅ 初始狀態驗證
- ✅ 登入流程 (設置 user 和 authenticated 狀態)
- ✅ 登出流程 (清除使用者資料)
- ✅ 權限檢查 (checkPermission 方法)
- ✅ 側邊欄狀態管理 (toggle/set)

#### 關鍵技術
```typescript
// Mock 外部服務
vi.mock('@/services/offline-auth.service', () => ({
  OfflineAuthService: {
    validateLogin: vi.fn(),
    logout: vi.fn(),
  },
}))

// 測試前重置狀態
beforeEach(async () => {
  const store = useAuthStore.getState()
  await store.logout()
  useAuthStore.setState({
    currentProfile: null,
    user: null,
    isAuthenticated: false
  })
})
```

### 2. 工具函數測試 (format-date.test.ts)
**檔案位置**: `/tests/lib/utils/format-date.test.ts`
**測試範圍**: 13 個測試案例

#### 測試內容
- ✅ 有效日期格式化 (Date 物件、ISO 字串)
- ✅ 無效輸入處理 (null, undefined, 無效字串)
- ✅ 邊界情況 (閏年、遠古日期、未來日期)

#### 時區處理
```typescript
// 使用本地時區避免 CI/CD 環境差異
const date = new Date(2025, 11, 31) // 2025-12-31
expect(formatDate(date)).toBe('2025-12-31')
```

### 3. UI 組件測試 (button.test.tsx)
**檔案位置**: `/tests/components/ui/button.test.tsx`
**測試範圍**: 19 個測試案例

#### 測試內容
- ✅ 基本渲染和文字顯示
- ✅ 6 種 variant (default, destructive, outline, secondary, ghost, link)
- ✅ 5 種 size (default, sm, xs, lg, icon)
- ✅ 使用者互動 (點擊事件)
- ✅ 禁用狀態
- ✅ 自定義屬性 (className, type, aria-*)
- ✅ asChild 模式 (渲染為其他元素)

#### 互動測試範例
```typescript
it('should call onClick handler when clicked', async () => {
  const handleClick = vi.fn()
  const user = userEvent.setup()

  render(<Button onClick={handleClick}>Click me</Button>)
  await user.click(screen.getByRole('button'))

  expect(handleClick).toHaveBeenCalledTimes(1)
})
```

---

## 測試執行結果

### 成功案例
```
✓ tests/lib/utils/format-date.test.ts (13 tests) 8ms
✓ tests/stores/auth-store.test.ts (7 tests) 13ms
✓ tests/components/ui/button.test.tsx (19 tests) 207ms

Test Files  3 passed (3)
     Tests  39 passed (39)
  Start at  08:06:15
  Duration  1.13s
```

### 重要修正
1. **時區問題**: 將 UTC 時間改為本地時間建構
   ```typescript
   // Before: new Date('2025-12-31T23:59:59Z') ❌
   // After:  new Date(2025, 11, 31) ✅
   ```

2. **異步登出**: 正確處理 async/await
   ```typescript
   // Before: store.logout() ❌
   // After:  await store.logout() ✅
   ```

3. **狀態隔離**: 每個測試前完整重置狀態
   ```typescript
   beforeEach(async () => {
     await store.logout()
     useAuthStore.setState({ currentProfile: null, ... })
   })
   ```

---

## 如何執行測試

### 基本測試
```bash
npm test          # 執行所有測試
npm test -- --run # 執行一次後結束 (不監聽)
```

### UI 介面
```bash
npm run test:ui
```
- 開啟瀏覽器視覺化介面
- 提供測試結果樹狀圖
- 支援即時重新執行

### 覆蓋率報告
```bash
npm run test:coverage
```
- 生成 `coverage/` 目錄
- 包含 HTML 報告 (`coverage/index.html`)
- 顯示每個檔案的覆蓋率百分比

### 指定檔案
```bash
npm test -- auth-store         # 只測試 auth-store
npm test -- tests/lib/         # 只測試 lib 目錄
npm test -- --watch            # 監聽模式
```

---

## 測試覆蓋率現狀

### 目前狀態
- **總測試數**: 39 個
- **通過率**: 100% (39/39)
- **執行時間**: ~1.1 秒
- **覆蓋的模組**:
  - 1 個 Store (auth-store)
  - 1 個工具函數 (format-date)
  - 1 個 UI 組件 (Button)

### 未覆蓋領域
根據專案架構分析，以下模組尚未測試：

#### Stores (35 個檔案 - 1 已測 = 34 待測)
優先測試：
- `user-store.ts` - 使用者資料管理
- `workspace-store.ts` - 工作空間管理
- `order-store.ts` - 訂單管理
- `tour-store.ts` - 旅遊團管理

#### Features (88 個檔案)
優先測試：
- `features/orders/` - 訂單功能
- `features/tours/` - 旅遊團功能
- `features/accounting/` - 會計功能

#### Components (185 個檔案 - 1 已測 = 184 待測)
優先測試：
- `components/ui/` - 其他 UI 組件
- `components/orders/` - 訂單相關組件
- `components/tours/` - 旅遊團相關組件

---

## 下一步測試擴展建議

### Phase 1: 核心 Stores (預估 2-3 天)
```
1. user-store.test.ts (CRUD + 權限)
2. workspace-store.test.ts (工作空間切換)
3. order-store.test.ts (訂單生命週期)
4. tour-store.test.ts (旅遊團管理)
```

### Phase 2: 關鍵組件 (預估 3-4 天)
```
1. components/ui/input.test.tsx
2. components/ui/select.test.tsx
3. components/ui/dialog.test.tsx
4. components/orders/order-list.test.tsx
```

### Phase 3: Feature 模組 (預估 5-7 天)
```
1. features/orders/hooks/useOrders.test.ts
2. features/tours/services/tour.service.test.ts
3. features/accounting/hooks/useAccounting.test.ts
```

### Phase 4: 整合測試 (預估 3-5 天)
```
1. 訂單建立完整流程
2. 旅遊團編輯流程
3. 權限管理流程
```

### 覆蓋率目標
- **短期目標 (1 個月)**: 30% 覆蓋率
  - 所有 Stores
  - 核心 UI 組件
  - 關鍵工具函數

- **中期目標 (3 個月)**: 50% 覆蓋率
  - Features 模組
  - 業務邏輯服務

- **長期目標 (6 個月)**: 70% 覆蓋率
  - 整合測試
  - E2E 測試完善

---

## 測試最佳實踐

### 1. 測試命名
```typescript
// ✅ 清楚描述測試意圖
it('should format Date object correctly', () => {})
it('should call onClick handler when clicked', () => {})

// ❌ 模糊的測試名稱
it('works', () => {})
it('test 1', () => {})
```

### 2. 狀態隔離
```typescript
// ✅ 每個測試前重置狀態
beforeEach(async () => {
  await store.logout()
  useAuthStore.setState({ currentProfile: null })
})

// ❌ 狀態洩漏到其他測試
it('test 1', () => {
  store.login(user)
  // 沒有清理
})
```

### 3. Mock 外部依賴
```typescript
// ✅ Mock 外部服務
vi.mock('@/lib/supabase/client', () => ({ ... }))

// ❌ 實際調用外部 API
// 會導致測試緩慢且不穩定
```

### 4. 避免實作細節測試
```typescript
// ✅ 測試行為
expect(screen.getByText('Login')).toBeInTheDocument()

// ❌ 測試實作細節
expect(component.state.isLoading).toBe(true)
```

---

## 疑難排解

### 常見問題

#### 1. 時區相關錯誤
**問題**: 測試在 CI/CD 環境失敗
**解決**: 使用本地時間建構 Date
```typescript
// Before
new Date('2025-12-31T23:59:59Z')

// After
new Date(2025, 11, 31)
```

#### 2. Async 測試失敗
**問題**: Promise 未正確等待
**解決**: 確保使用 async/await
```typescript
it('should logout', async () => {
  await store.logout() // 必須 await
})
```

#### 3. Mock 不生效
**問題**: 實際調用了外部服務
**解決**: 確保 mock 在 import 之前
```typescript
// ✅ 在檔案最上方
vi.mock('@/services/offline-auth.service', ...)

// ❌ 在測試中才 mock
it('test', () => {
  vi.mock(...) // 太晚了
})
```

#### 4. 狀態洩漏
**問題**: 測試順序影響結果
**解決**: 使用 beforeEach 重置
```typescript
beforeEach(() => {
  useAuthStore.setState({ /* 初始狀態 */ })
})
```

---

## 資源連結

- [Vitest 官方文檔](https://vitest.dev/)
- [React Testing Library 指南](https://testing-library.com/react)
- [Testing Library 最佳實踐](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Vitest UI 介面](https://vitest.dev/guide/ui.html)

---

## 總結

Venturo 專案的測試基礎設施已完成建置，包含：
- ✅ 測試框架配置 (Vitest + React Testing Library)
- ✅ Mock 系統設置 (IndexedDB + Supabase)
- ✅ 39 個通過的範例測試
- ✅ 3 種測試類型示範 (Store / Utils / Component)
- ✅ 完整的測試指令和 UI 介面

**後續任務**：
1. 逐步提升測試覆蓋率
2. 建立 CI/CD 自動化測試
3. 撰寫整合測試和 E2E 測試

**預期效益**：
- 提升程式碼品質
- 減少 Bug 回歸風險
- 加速功能迭代速度
- 增強重構信心
