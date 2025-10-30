# 🗺️ Venturo 重構路線圖

基於程式碼掃描結果，整理出需要抽象成 Hook 和 API 的優先順序清單。

---

## 📊 現況總覽

### 大型頁面 (需要重構)

| 頁面                                     | 行數 | 優先級     | 預估縮減     |
| ---------------------------------------- | ---- | ---------- | ------------ |
| `tours/page.tsx`                         | 600  | ⭐⭐⭐⭐⭐ | → 350 (-42%) |
| `finance/treasury/disbursement/page.tsx` | 630  | ⭐⭐⭐⭐   | → 400 (-36%) |
| `finance/payments/page.tsx`              | 522  | ⭐⭐⭐⭐   | → 350 (-33%) |
| `todos/page.tsx`                         | 497  | ⭐⭐⭐     | → 300 (-40%) |
| `visas/page.tsx`                         | 469  | ✅ 已完成  | -            |

### 重複邏輯模式

- **Payment Items Form**: 2 個地方重複 (120+ 行)
- **Status Configuration**: 4+ 個地方重複 (60+ 行)
- **Filter Logic**: 3 個地方重複 (40+ 行)
- **Dialog Management**: 多處重複 (50+ 行)

---

## 🎯 Phase 1: 快速勝利 (Quick Wins) - 1 週

### 優先級 CRITICAL ⭐⭐⭐⭐⭐

#### 1. 統一 Status Configuration (20 分鐘)

**問題**: 4+ 個檔案重複定義狀態顏色/標籤

```typescript
// ❌ 目前狀況 - 每個檔案都重複
const getStatusColor = (status) => {
  if (status === 'pending') return 'text-morandi-gold';
  if (status === 'confirmed') return 'text-morandi-green';
  ...
}
```

**解決方案**: 創建 `/src/lib/status-config.ts`

```typescript
// ✅ 單一真相來源
export const STATUS_CONFIGS = {
  payment: {
    pending: { color: 'text-morandi-gold', label: '待確認', icon: Clock },
    confirmed: { color: 'text-morandi-green', label: '已確認', icon: CheckCircle },
    completed: { color: 'text-morandi-primary', label: '已完成', icon: FileCheck }
  },
  disbursement: { ... },
  todo: { ... },
  invoice: { ... }
};

export function getStatusConfig(type: string, status: string) {
  return STATUS_CONFIGS[type]?.[status] || STATUS_CONFIGS[type].default;
}

export function getStatusColor(type: string, status: string) {
  return getStatusConfig(type, status).color;
}

export function getStatusLabel(type: string, status: string) {
  return getStatusConfig(type, status).label;
}
```

**影響**:

- 節省 60+ 行程式碼
- 4 個檔案受益
- 未來新增狀態只需修改一處

**使用範例**:

```typescript
// Before
const color = status === 'pending' ? 'text-morandi-gold' : 'text-morandi-green'

// After
import { getStatusColor } from '@/lib/status-config'
const color = getStatusColor('payment', status)
```

---

#### 2. Payment Items Form Hook (30 分鐘)

**問題**: `finance/payments/page.tsx` 和 `finance/payments/new/page.tsx` 重複 120+ 行邏輯

**解決方案**: 創建 `/src/hooks/usePaymentItemsForm.ts`

```typescript
interface PaymentItem {
  id: string
  payment_method: string
  amount: number
  bank_account_id?: string
  check_number?: string
  notes?: string
}

interface UsePaymentItemsFormReturn {
  paymentItems: PaymentItem[]
  addPaymentItem: () => void
  removePaymentItem: (id: string) => void
  updatePaymentItem: (id: string, updates: Partial<PaymentItem>) => void
  resetForm: () => void
  totalAmount: number
}

export const usePaymentItemsForm = (initialItems?: PaymentItem[]): UsePaymentItemsFormReturn => {
  const [paymentItems, setPaymentItems] = useState<PaymentItem[]>(
    initialItems || [createDefaultItem()]
  )

  const addPaymentItem = useCallback(() => {
    setPaymentItems(prev => [...prev, createDefaultItem()])
  }, [])

  const removePaymentItem = useCallback((id: string) => {
    setPaymentItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const updatePaymentItem = useCallback((id: string, updates: Partial<PaymentItem>) => {
    setPaymentItems(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)))
  }, [])

  const resetForm = useCallback(() => {
    setPaymentItems([createDefaultItem()])
  }, [])

  const totalAmount = useMemo(() => {
    return paymentItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  }, [paymentItems])

  return {
    paymentItems,
    addPaymentItem,
    removePaymentItem,
    updatePaymentItem,
    resetForm,
    totalAmount,
  }
}

function createDefaultItem(): PaymentItem {
  return {
    id: Date.now().toString(),
    payment_method: '現金',
    amount: 0,
    notes: '',
  }
}
```

**影響**:

- 節省 120+ 行程式碼 (2 個檔案各 60 行)
- 統一邏輯，易於維護
- 可重用於未來的付款表單

---

#### 3. Data Filtering Hook (20 分鐘)

**問題**: 3 個頁面重複過濾邏輯

**解決方案**: 創建 `/src/hooks/useDataFiltering.ts`

```typescript
interface FilterConfig<T> {
  statusField?: keyof T
  searchFields?: (keyof T)[]
  customFilters?: Array<(item: T) => boolean>
}

export function useDataFiltering<T>(
  data: T[],
  statusFilter: string,
  searchTerm: string,
  config: FilterConfig<T>
): T[] {
  return useMemo(() => {
    return data.filter(item => {
      // Status filter
      if (
        config.statusField &&
        statusFilter !== 'all' &&
        item[config.statusField] !== statusFilter
      ) {
        return false
      }

      // Search filter
      if (searchTerm && config.searchFields) {
        const lowerSearch = searchTerm.toLowerCase()
        const matchesSearch = config.searchFields.some(field => {
          const value = item[field]
          return value && String(value).toLowerCase().includes(lowerSearch)
        })
        if (!matchesSearch) return false
      }

      // Custom filters
      if (config.customFilters) {
        return config.customFilters.every(filter => filter(item))
      }

      return true
    })
  }, [data, statusFilter, searchTerm, config])
}
```

**使用範例**:

```typescript
// Before (tours/page.tsx)
const filteredTours = useMemo(() => {
  return tours.filter(tour => {
    if (activeStatusTab !== 'all' && tour.status !== activeStatusTab) return false
    if (searchQuery && !tour.name.toLowerCase().includes(searchQuery)) return false
    return true
  })
}, [tours, activeStatusTab, searchQuery])

// After
const filteredTours = useDataFiltering(tours, activeStatusTab, searchQuery, {
  statusField: 'status',
  searchFields: ['name', 'code', 'location'],
})
```

**影響**:

- 節省 40+ 行
- 可重用於所有列表頁面
- 統一過濾邏輯

---

### 📦 Phase 1 完成後的成果

**新增檔案**:

```
src/
├── lib/
│   └── status-config.ts          (新增)
└── hooks/
    ├── usePaymentItemsForm.ts    (新增)
    ├── useDataFiltering.ts       (新增)
    └── index.ts                  (更新 exports)
```

**程式碼縮減**:

- 總計節省: **220+ 行**
- 受益檔案: **9 個**
- 時間成本: **70 分鐘**
- 風險等級: **低** (新增檔案，不影響現有程式碼)

---

## 🚀 Phase 2: Tours Page 重構 - 1.5 天

### 參考 Visas 成功經驗

**目標**: 600 行 → 350 行 (-42%)

### Step 1: 提取 Dialog 管理 (30 分鐘)

創建 `/src/features/tours/hooks/useContractDialogs.ts`

### Step 2: 提取 Table 配置 (45 分鐘)

創建 `/src/features/tours/hooks/useTourTableConfig.ts`

### Step 3: 拆分 useTourPageState (1 小時)

分解成 5 個專注的 hooks:

- `usePaginationState.ts`
- `useTourFormState.ts`
- `useUIState.ts`
- `useTourFiltersState.ts`
- `useTourExtraFieldsState.ts`

### Step 4: 組件化 (30 分鐘)

創建獨立組件:

- `TourFilters.tsx`
- `ContractDialog.tsx`
- `ContractViewDialog.tsx`

**預期成果**:

```
tours/page.tsx: 600 → 350 lines (-42%)
新增 Hooks: 5 個
新增組件: 3 個
```

---

## 🎨 Phase 3: Finance Pages 重構 - 2 天

### 優先級 HIGH ⭐⭐⭐⭐

#### 3.1 Payments Page (522 → 350 lines)

**執行順序**:

1. 套用 `usePaymentItemsForm` hook (已在 Phase 1 建立)
2. 提取 `PaymentItemFormRow` 組件
3. 建立 `usePaymentMethodFields` hook
4. 套用 `useDataFiltering` hook

#### 3.2 Treasury Disbursement Page (630 → 400 lines)

**執行順序**:

1. 套用 `status-config.ts` (已在 Phase 1 建立)
2. 建立 `useCheckboxSelection` hook
3. 提取 Table Columns 到獨立檔案
4. 套用 `useDataFiltering` hook

---

## 📋 Phase 4: Todos Page 重構 - 0.5 天

### 優先級 MEDIUM ⭐⭐⭐

**執行順序**:

1. 套用 `status-config.ts`
2. 建立 `useTodoStatusUtils` hook
3. 提取 `AddTodoForm` 組件
4. 套用 `useDataFiltering` hook

**預期成果**: 497 → 300 lines (-40%)

---

## 📈 總體預期成果

### 程式碼縮減

| 階段     | 目標          | 縮減行數      | 時間     |
| -------- | ------------- | ------------- | -------- |
| Phase 1  | Quick Wins    | -220 行       | 1 週     |
| Phase 2  | Tours Page    | -250 行       | 1.5 天   |
| Phase 3  | Finance Pages | -352 行       | 2 天     |
| Phase 4  | Todos Page    | -197 行       | 0.5 天   |
| **總計** |               | **-1,019 行** | **5 天** |

### 新增可重用模組

- **Hooks**: 12 個
- **Components**: 6 個
- **Services**: 2 個
- **Utils**: 1 個

### 程式碼健康度改善

- **Before**: 58/100
- **After**: 75/100 (預估)

---

## ✅ 驗證標準

每個 Phase 完成後必須確認:

- [ ] TypeScript 零錯誤
- [ ] Build 成功
- [ ] 所有功能正常運作
- [ ] 無 console 錯誤
- [ ] 效能無劣化

---

## 🎯 立即行動建議

**今晚可以完成的**:

### 選項 A: 只做 Phase 1 (70 分鐘) ⭐⭐⭐⭐⭐

✅ 最安全
✅ 立即見效 (220+ 行縮減)
✅ 為後續重構鋪路

### 選項 B: Phase 1 + Tours Page (3 小時) ⭐⭐⭐⭐

✅ 大幅改善 Tours Page (600 → 350 lines)
⚠️ 需要更多時間

### 選項 C: 全部完成 (5 天)

❌ 時間太長
❌ 建議分階段執行

---

**推薦**: 先執行 **Phase 1** (Quick Wins)，見效後再繼續！

你想從哪個開始？😊
