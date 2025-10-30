# Venturo 快速優化指南 ⚡

> **狀態**: 架構穩固，進入精細優化階段
> **健康評分**: 6.75/10 → 目標 8.5/10
> **預估總工時**: 11-15 小時

---

## 📊 快速統計

```
代碼量:      86,068 行
檔案數:      489 個
超大檔案:    23 個 (>500 行)
型別繞過:    188 個 (as any/unknown)
測試覆蓋:    ~0%
```

---

## 🚀 立即可優化項目 (除檔案大小外)

### 1️⃣ Console.log 清理 ⏱️ 30 分鐘

**問題**: 40+ 檔案使用 `console.log` 而非 logger

**快速修復**:

```bash
# 1. 找出所有 console.log
grep -r "console\." src/ --include="*.ts" --include="*.tsx" | wc -l

# 2. 替換為 logger
# console.log() → logger.info()
# console.warn() → logger.warn()
# console.error() → logger.error()
```

**主要檔案**:

- `src/stores/user-store.ts` (Line 61, 93)
- `src/services/storage/index.ts` (Line 77, 87, 97)
- `src/components/layout/main-layout.tsx` (Line 66, 69)

---

### 2️⃣ 型別斷言清理 ⏱️ 60 分鐘

**問題**: 188 個 `as any`/`as unknown` 繞過型別檢查

**優先修復 Top 5**:

```tsx
// ❌ 錯誤
const [item, setItem] = useState<unknown>(null)
const data = response as any

// ✅ 正確
interface AdvanceListItem {
  id: string
  amount: number
}
const [item, setItem] = useState<AdvanceListItem | null>(null)
const data: ResponseData = response
```

**檔案位置**:

- `src/components/workspace/ChannelChat.tsx` (Line 48-49)
- `src/components/workspace/AdvanceListCard.tsx` (Line 11)
- `src/app/customers/page.tsx` (多個 `(o: any)`)

---

### 3️⃣ State 重構 ⏱️ 45 分鐘

**問題**: 單一組件有 11+ 個 boolean states

**檔案**: `src/components/workspace/ChannelChat.tsx` (Line 37-53)

**優化方案**:

```tsx
// ❌ 之前：11 個獨立 state
const [showMemberSidebar, setShowMemberSidebar] = useState(false)
const [showShareQuoteDialog, setShowShareQuoteDialog] = useState(false)
// ... 9 more

// ✅ 之後：合併為物件
interface DialogState {
  memberSidebar: boolean
  shareQuote: boolean
  shareTour: boolean
  // ...
}
const [dialogs, setDialogs] = useState<DialogState>({
  memberSidebar: false,
  shareQuote: false,
  // ...
})
const toggleDialog = (key: keyof DialogState) =>
  setDialogs(prev => ({ ...prev, [key]: !prev[key] }))
```

**相似檔案**:

- `src/app/finance/payments/page.tsx`
- `src/app/visas/page.tsx`

---

### 4️⃣ 重複代碼提取 ⏱️ 90 分鐘

#### A. Dialog 狀態管理 Hook

**檔案**: 3+ 個檔案重複相同模式

**建立**: `src/hooks/useDialogState.ts`

```tsx
export function useDialogState<K extends string>(keys: K[]) {
  const [openDialogs, setOpenDialogs] = useState<Set<K>>(new Set())

  const toggle = (key: K) => {
    setOpenDialogs(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return {
    isOpen: (key: K) => openDialogs.has(key),
    open: (key: K) => toggle(key),
    close: (key: K) => toggle(key),
  }
}
```

#### B. Employee Lookup Service

**檔案**: `src/components/workspace/AdvanceListCard.tsx` (Line 32-48)

**建立**: `src/services/employee-lookup.service.ts`

```tsx
export class EmployeeLookupService {
  static findByIdentifier(identifier: string, employees: Employee[]) {
    return employees.find(
      e =>
        e.email === identifier ||
        e.name === identifier ||
        e.display_name === identifier ||
        e.id === identifier
    )
  }

  static getDisplayName(identifier: string, employees: Employee[]) {
    const employee = this.findByIdentifier(identifier, employees)
    return employee?.display_name || employee?.name || identifier
  }
}
```

---

### 5️⃣ 命名一致性 ⏱️ 60 分鐘

**問題**: 檔案命名混亂

**標準化規則**:

```
✅ 組件:    PascalCase    ChannelChat.tsx
✅ Hooks:    camelCase     useUserStore.ts
✅ Utils:    kebab-case    format-date.ts
✅ Types:    kebab-case    base.types.ts
```

**需要重命名**:

```bash
# 檔案重命名範例
mv src/components/layout/sidebar.tsx src/components/layout/Sidebar.tsx
mv src/components/tours/tour-costs.tsx src/components/tours/TourCosts.tsx
```

---

### 6️⃣ Performance 快速優化 ⏱️ 90 分鐘

#### A. 加入 React.memo (10 個組件)

```tsx
// 列表項組件應該 memoize
export const ChannelListItem = React.memo(function ChannelListItem({ ... }) {
  // ...
});
```

**目標組件**:

- `src/components/workspace/ChannelChat.tsx`
- `src/app/customers/page.tsx` 的 CustomerCard

#### B. 提取 inline 常數 (8 個檔案)

```tsx
// ❌ 錯誤：每次 render 重建
function Sidebar() {
  const menuItems = [
    { href: '/', label: '首頁', icon: Home },
    // ... 20+ items
  ]
}

// ✅ 正確：提取到組件外
const SIDEBAR_MENU_ITEMS = [
  { href: '/', label: '首頁', icon: Home },
  // ...
]
function Sidebar() {
  // use SIDEBAR_MENU_ITEMS
}
```

**檔案位置**:

- `src/components/layout/sidebar.tsx` (Line 41-128)
- `src/components/workspace/ChannelSidebar.tsx` (Line 58-79)

#### C. useMemo 昂貴計算

```tsx
// src/app/customers/page.tsx
const enrichedCustomers = useMemo(
  () =>
    filteredCustomers.map(customer => {
      const customerOrders = orders.filter(o => o.customer_id === customer.id)
      // ... 複雜計算
      return { ...customer, orders: customerOrders }
    }),
  [filteredCustomers, orders]
)
```

---

### 7️⃣ 未使用的 Imports 清理 ⏱️ 20 分鐘

**自動檢查**:

```bash
npm run lint -- --rule "no-unused-vars: error"
```

**手動檢查重點**:

- `src/components/layout/main-layout.tsx` (Line 3: useRef)
- Lucide icons 只用到部分的檔案

---

## 📋 優化 Todo List

### 🔴 高優先級 (今天/本週)

- [ ] Console.log 全局清理 (30min)
- [ ] 型別斷言 Top 10 修復 (60min)
- [ ] ChannelChat.tsx State 重構 (45min)
- [ ] 未使用 imports 清理 (20min)
- [ ] **小計**: 155 分鐘 (2.6 小時)

### 🟡 中優先級 (本週/下週)

- [ ] 建立 useDialogState hook (30min)
- [ ] 建立 EmployeeLookupService (20min)
- [ ] 檔案命名標準化 (60min)
- [ ] React.memo 優化 10 個組件 (60min)
- [ ] 提取 inline 常數 (30min)
- [ ] **小計**: 200 分鐘 (3.3 小時)

### 🟢 低優先級 (有空再做)

- [ ] useMemo 優化計算 (30min)
- [ ] 建立其他 Service 層
- [ ] 測試覆蓋率提升
- [ ] 文檔完善

---

## 🎯 執行順序建議

### Day 1 (2-3 小時)

1. Console.log 清理 (30min)
2. 未使用 imports 清理 (20min)
3. 型別斷言修復 - 前 5 個檔案 (30min)
4. ChannelChat State 重構 (45min)
5. 提取 inline 常數 - sidebar.tsx (15min)

### Day 2 (2-3 小時)

1. 建立 useDialogState hook (30min)
2. 應用 useDialogState 到 3 個檔案 (45min)
3. 建立 EmployeeLookupService (20min)
4. React.memo 優化 5 個組件 (45min)

### Day 3 (2 小時)

1. 檔案命名標準化 (60min)
2. useMemo 優化 (30min)
3. 最終驗證 + Build 測試 (30min)

---

## ✅ 驗證檢查清單

完成每個優化後執行：

```bash
# 1. 型別檢查
npm run build

# 2. Lint 檢查
npm run lint

# 3. 搜尋問題
grep -r "console\." src/         # 應該很少
grep -r "as any" src/            # 應該 < 50
grep -r "useState<unknown>" src/ # 應該 < 10
```

---

## 📊 預期成果

優化完成後：

| 指標         | 優化前   | 優化後  | 改善         |
| ------------ | -------- | ------- | ------------ |
| Console.log  | 40+      | < 5     | ✅ 87%       |
| Type 繞過    | 188      | < 80    | ✅ 57%       |
| 重複代碼     | 高       | 中      | ✅ 40%       |
| 命名一致性   | 60%      | 90%     | ✅ 30%       |
| Memoization  | 356      | 400+    | ✅ 12%       |
| **健康評分** | **6.75** | **7.8** | **✅ +1.05** |

**總投資時間**: 6-8 小時
**ROI**: 顯著提升代碼品質和可維護性

---

**最後更新**: 2025-10-26
