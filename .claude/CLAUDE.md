# Claude Code 工作規範 (Venturo ERP)

> **最後更新**: 2026-01-04 (全面性架構審查與新組件)
> **專案狀態**: 核心功能完成，代碼品質強化中

---

## 🚨🚨🚨 對話開始必做 (P0) 🚨🚨🚨

### 第一步：閱讀 SITEMAP

**每次對話開始時，必須先執行：**
```
Read /Users/williamchien/Projects/SITEMAP.md
```

**為什麼？**
- SITEMAP 包含完整的頁面路由、API、Store、關鍵檔案位置
- 直接查 SITEMAP 比 grep/glob 搜尋快 10 倍
- 減少 token 消耗，提高回應速度
- 避免找錯檔案或重複搜尋

**SITEMAP 包含：**
- 頁面路由對照表
- API 端點列表
- Store 結構
- 工具模組位置
- 狀態生命週期

---

## 📍 必讀清單（開發前必看）

### 1. 專案網站地圖（已在上方強調）
```
/Users/williamchien/Projects/SITEMAP.md
```

### 2. UI/UX 規範文件
| 文件 | 內容 | 最後更新 |
|------|------|----------|
| `docs/VENTURO_UI_DESIGN_STYLE.md` | 莫蘭迪色系、組件樣式、陰影設計 | 2025-10 |
| `docs/DESIGN_SYSTEM.md` | 圓角、邊框、間距規範 | 2025-10 |
| `docs/STANDARD_PAGE_LAYOUT.md` | 頁面佈局使用指南 | 2025-10 |

### 3. 架構規範
| 文件 | 內容 |
|------|------|
| `docs/ARCHITECTURE_STANDARDS.md` | 五層架構、資料隔離、權限控制 |
| `docs/CODE_REVIEW_CHECKLIST.md` | 程式碼審查清單 |

**⚠️ 避免 AI 斷裂感：開發新頁面前，務必先閱讀 UI 規範！**

---

## 🎨 UI/UX 速查規範（最重要！）

> **設計理念**: 優雅、精緻、有質感的莫蘭迪風格
> **參考頁面**: `/login`（設計標準）

### 莫蘭迪色系 (CSS 變數)

```css
/* 主色系 */
--morandi-primary: #3a3633;     /* 主文字、深色 */
--morandi-secondary: #8b8680;   /* 次要文字 */
--morandi-gold: #c9aa7c;        /* 強調色、按鈕、連結 ⭐ */
--morandi-gold-hover: #b8996b;  /* 金色懸停 */
--morandi-green: #9fa68f;       /* 成功 */
--morandi-red: #c08374;         /* 錯誤 */
--morandi-container: #e8e5e0;   /* 背景淡色 */
--morandi-muted: #b8b2aa;       /* 禁用 */

/* 背景 */
--background: #f6f4f1;          /* 頁面背景 */
--card: #ffffff;                /* 卡片背景 */
--border: #d4c4b0;              /* 邊框 */
```

### 標準組件使用規則

| 場景 | 必須使用的組件 | 位置 |
|------|---------------|------|
| **列表頁面** | `ListPageLayout` | `@/components/layout/list-page-layout` |
| **頁面標題** | `ResponsiveHeader` | `@/components/layout/responsive-header` |
| **表格** | `EnhancedTable` | `@/components/ui/enhanced-table` |
| **表格單元格** | `DateCell`, `StatusCell`, `CurrencyCell` 等 | `@/components/table-cells` |

### 列表頁面標準模板

```tsx
// ✅ 正確：使用 ListPageLayout
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { DateCell, StatusCell, ActionCell } from '@/components/table-cells'

export default function MyListPage() {
  return (
    <ListPageLayout
      title="XXX 管理"
      icon={SomeIcon}
      breadcrumb={[
        { label: '首頁', href: '/' },
        { label: 'XXX 管理', href: '/xxx' },
      ]}
      data={items}
      columns={columns}
      searchable
      searchFields={['name', 'code']}
      statusTabs={[
        { value: 'all', label: '全部' },
        { value: 'active', label: '進行中' },
      ]}
      statusField="status"
      onAdd={() => setShowDialog(true)}
      addLabel="新增 XXX"
    />
  )
}
```

### 表格 Column 定義範例

```tsx
const columns = [
  {
    key: 'date',
    label: '日期',
    width: 120,
    render: (_, row) => <DateCell date={row.date} showIcon />,
  },
  {
    key: 'status',
    label: '狀態',
    width: 100,
    render: (_, row) => <StatusCell type="tour" status={row.status} />,
  },
  {
    key: 'amount',
    label: '金額',
    width: 120,
    render: (_, row) => <CurrencyCell amount={row.amount} />,
  },
  {
    key: 'actions',
    label: '',
    width: 80,
    render: (_, row) => (
      <ActionCell
        actions={[
          { icon: Edit2, label: '編輯', onClick: () => handleEdit(row) },
          { icon: Trash2, label: '刪除', onClick: () => handleDelete(row), variant: 'danger' },
        ]}
      />
    ),
  },
]
```

### 設計 Token 快速參考

| 元素 | Class | 說明 |
|------|-------|------|
| **主要卡片** | `rounded-xl shadow-lg border border-border p-8` | 登入頁標準 |
| **次要卡片** | `rounded-lg shadow-sm border border-border p-6` | 列表項目 |
| **主要按鈕** | `bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-lg` | CTA |
| **輸入框** | `rounded-lg border border-border focus:ring-2 focus:ring-morandi-gold` | 表單 |
| **表格頭** | `bg-morandi-container/40 border-b border-border/60` | 表格 |

### ❌ 禁止的設計做法

```tsx
// ❌ 不要使用固定顏色（不支援深色主題）
<div className="border-gray-200 bg-gray-100">

// ✅ 使用 CSS 變數
<div className="border-border bg-morandi-container">

// ❌ 不要自己寫列表頁面結構
<div className="h-full flex flex-col">
  <div className="p-4">標題</div>
  <table>...</table>
</div>

// ✅ 使用 ListPageLayout
<ListPageLayout title="..." data={...} columns={...} />

// ❌ 不要自己格式化日期/金額/狀態
<span>{new Date(row.date).toLocaleDateString()}</span>
<span>NT$ {row.amount}</span>
<span className="text-green-500">{row.status}</span>

// ✅ 使用 Table Cells
<DateCell date={row.date} />
<CurrencyCell amount={row.amount} />
<StatusCell type="tour" status={row.status} />
```

### 可用的 Table Cell 組件

| 組件 | 用途 | 範例 |
|------|------|------|
| `DateCell` | 日期顯示 | `<DateCell date={date} format="short" showIcon />` |
| `StatusCell` | 狀態徽章 | `<StatusCell type="tour" status="confirmed" />` |
| `CurrencyCell` | 金額顯示 | `<CurrencyCell amount={1000} variant="income" />` |
| `DateRangeCell` | 日期區間 | `<DateRangeCell start={start} end={end} showDuration />` |
| `ActionCell` | 操作按鈕 | `<ActionCell actions={[...]} />` |
| `AvatarCell` | 頭像+名稱 | `<AvatarCell name="張三" subtitle="業務部" />` |
| `TextCell` | 截斷文字 | `<TextCell text={desc} maxLength={50} />` |
| `NumberCell` | 數字 | `<NumberCell value={10} suffix="人" />` |
| `BadgeCell` | 簡單徽章 | `<BadgeCell text="熱門" variant="warning" />` |

### 狀態類型對應

`StatusCell` 的 `type` 參數對應不同的狀態配置：

| type | 用途 | 可用狀態 |
|------|------|----------|
| `tour` | 旅遊團 | planning, confirmed, in_progress, completed, cancelled |
| `order` | 訂單 | draft, pending, confirmed, processing, completed, cancelled |
| `payment` | 付款 | pending, confirmed, completed, cancelled |
| `invoice` | 發票 | draft, pending, approved, paid, rejected |
| `visa` | 簽證 | pending, submitted, issued, collected, rejected |
| `todo` | 待辦 | pending, in_progress, completed, cancelled |
| `voucher` | 傳票 | draft, pending, approved, posted |

### 🔘 按鈕規範（重要！）

**所有主要操作按鈕必須有圖標 + 文字**

#### 標準按鈕樣式

```tsx
import { Plus, Save, Check, X, Trash2, Edit2, Printer } from 'lucide-react'

// ✅ 主要操作按鈕（新增/儲存/確認）
<Button className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2">
  <Plus size={16} />
  新增項目
</Button>

<Button className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2">
  <Save size={16} />
  儲存
</Button>

<Button className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2">
  <Check size={16} />
  確認
</Button>

// ✅ 次要操作按鈕（取消/關閉）
<Button variant="outline" className="gap-2">
  <X size={16} />
  取消
</Button>

// ✅ 危險操作按鈕（刪除）
<Button variant="outline" className="gap-2 text-morandi-red border-morandi-red hover:bg-morandi-red hover:text-white">
  <Trash2 size={16} />
  刪除
</Button>

// ❌ 禁止：純文字按鈕（缺少圖標）
<Button>儲存</Button>
<Button>確認</Button>
<Button variant="outline">取消</Button>
```

#### 常用按鈕圖標對應

| 操作 | 圖標 | import |
|------|------|--------|
| 新增 | `Plus` | `lucide-react` |
| 儲存 | `Save` | `lucide-react` |
| 確認 | `Check` | `lucide-react` |
| 更新 | `RefreshCw` | `lucide-react` |
| 取消 | `X` | `lucide-react` |
| 關閉 | `X` | `lucide-react` |
| 刪除 | `Trash2` | `lucide-react` |
| 編輯 | `Edit2` | `lucide-react` |
| 列印 | `Printer` | `lucide-react` |
| 下載 | `Download` | `lucide-react` |
| 上傳 | `Upload` | `lucide-react` |
| 搜尋 | `Search` | `lucide-react` |
| 重設 | `RotateCcw` | `lucide-react` |

---

## 🆕 新增組件與工具 (2026-01-04 新增)

> **背景**: 全面性架構審查後新增的標準組件與工具

### 表單驗證組件

#### FieldError - 欄位錯誤訊息
```tsx
import { FieldError } from '@/components/ui/field-error'

// 單一錯誤
<FieldError error="此欄位為必填" />

// 多個錯誤
<FieldError error={['格式錯誤', '長度不足']} />
```

#### FormField - 表單欄位包裝器
```tsx
import { FormField } from '@/components/ui/form-field'

<FormField label="姓名" required error={errors.name}>
  <Input value={name} onChange={...} />
</FormField>
```

#### Label 必填標記
```tsx
import { Label } from '@/components/ui/label'

<Label required>姓名</Label>  // 顯示紅色星號
```

### Dialog 組件

#### DIALOG_SIZES - 標準尺寸
```tsx
import { DIALOG_SIZES } from '@/components/ui/dialog'

// 可用尺寸: sm, md, lg, xl, 2xl, 4xl, full
<DialogContent className={DIALOG_SIZES.lg}>
  ...
</DialogContent>
```

#### ManagedDialog - 有狀態管理的 Dialog
```tsx
import { ManagedDialog } from '@/components/dialog/managed-dialog'
import { useManagedDialogState } from '@/hooks/useManagedDialogState'

const { isDirty, markDirty, reset } = useManagedDialogState()

<ManagedDialog
  open={open}
  onOpenChange={setOpen}
  isDirty={isDirty}
  confirmMessage="有未儲存的變更，確定要關閉嗎？"
>
  ...
</ManagedDialog>
```

### 錯誤處理組件

#### Error Boundary - 全域錯誤邊界
```tsx
import { ErrorBoundary } from '@/components/error-boundary'

// 已在 layout 層級設置，無需手動添加
// 錯誤時顯示重試按鈕
```

#### NotFoundState - 找不到資料狀態
```tsx
import { NotFoundState } from '@/components/ui/not-found-state'

// 用於詳細頁找不到資料時
if (!data) return <NotFoundState resourceName="訂單" />
```

### 導航組件

#### useBreadcrumb - 自動麵包屑
```tsx
import { useBreadcrumb } from '@/hooks/useBreadcrumb'

const breadcrumb = useBreadcrumb()
// 根據 URL 自動生成麵包屑
```

#### ResponsiveHeader autoBreadcrumb
```tsx
<ResponsiveHeader
  title="訂單管理"
  autoBreadcrumb  // 自動生成麵包屑
/>
```

### Store 同步系統

#### 設置同步
```tsx
// 在 app layout 中設置
import { StoreSyncProvider } from '@/stores/sync'

<StoreSyncProvider>
  {children}
</StoreSyncProvider>
```

#### 發送同步事件
```tsx
import { withTourUpdate } from '@/stores/sync'

// 更新 Tour 時自動同步相關 Orders
const update = withTourUpdate(tourStore.update)
await update(tourId, data)
```

### API 工具

#### 統一 API 回應格式
```tsx
import { successResponse, errorResponse } from '@/lib/api/response'

// API Route 內使用
export async function POST(req: Request) {
  try {
    const data = await doSomething()
    return successResponse(data)
  } catch (error) {
    return errorResponse('操作失敗', 500, 'OPERATION_FAILED')
  }
}

// 回應格式: { success: boolean, data?, error?, code? }
```

#### Webhook 簽名驗證 (LinkPay)
```tsx
import { verifyWebhookSignature } from '@/lib/linkpay/signature'

// 在 webhook route 中驗證
if (!verifyWebhookSignature(payload, signature, secretKey)) {
  return errorResponse('簽名驗證失敗', 401)
}
```

### 新增檔案清單

| 檔案 | 用途 |
|------|------|
| `src/components/ui/field-error.tsx` | 欄位錯誤訊息組件 |
| `src/components/ui/form-field.tsx` | 表單欄位包裝器 |
| `src/components/ui/not-found-state.tsx` | 找不到資料狀態 |
| `src/components/dialog/managed-dialog.tsx` | 有狀態管理的 Dialog |
| `src/components/error-boundary.tsx` | 全域錯誤邊界 |
| `src/hooks/useBreadcrumb.ts` | 自動麵包屑 Hook |
| `src/hooks/useManagedDialogState.ts` | Dialog 狀態管理 Hook |
| `src/lib/api/response.ts` | API 回應格式工具 |
| `src/lib/linkpay/signature.ts` | Webhook 簽名驗證 |
| `src/lib/navigation/breadcrumb-config.ts` | 麵包屑路由配置 |
| `src/stores/sync/` | Store 同步系統 (5 個檔案) |

---

## 🔒 安全修改規範 - Stale Closure 防範 (2025-12-31 新增)

> **背景**: 多次修復發現的共同問題模式 - React 閉包陷阱導致資料更新失敗

### 問題說明

**Stale Closure（過時閉包）** 是 React 中最常見的 bug 來源之一：

```typescript
// ❌ 危險模式：callback 中使用外部狀態變數
const handleSave = useCallback(() => {
  // data 可能是過時的！
  updateField('image', url)
  updateField('position', { x: 50, y: 50 })  // 這裡的 data 可能已經過時
}, [updateField])  // 缺少 data 依賴，或 data 更新後 callback 未重建

// ❌ 危險模式：SWR mutate 使用過時陣列
mutate(KEY, [...items, newItem], false)  // items 可能是 stale 的！
```

### ✅ 正確做法

```typescript
// ✅ 方案 1：合併多個狀態更新為一次
const handleSave = useCallback(() => {
  // 一次性更新多個欄位，避免連續調用導致 stale
  onChange({
    ...data,
    image: url,
    position: { x: 50, y: 50 },
  })
}, [data, onChange])

// ✅ 方案 2：SWR 使用 functional update
mutate(KEY, (currentItems) => [...(currentItems || []), newItem], false)

// ✅ 方案 3：React setState 使用 functional update
setItems(prev => [...prev, newItem])
```

### 必須檢查的情境

| 情境 | 檢查項目 |
|------|---------|
| **SWR mutate 樂觀更新** | 必須使用 `(current) => ...` 函式形式 |
| **連續多次 setState** | 考慮合併為單次更新 |
| **useCallback 中使用外部狀態** | 確認依賴陣列完整 |
| **事件處理器中讀取狀態** | 使用 `useRef` 或 functional update |
| **異步操作後更新狀態** | 確認使用最新值而非閉包捕獲的舊值 |

### 已修復的案例（供參考）

1. **封面圖片上傳** (`CoverInfoSection.tsx`)
   - 問題：連續設定 `coverImage` 和 `coverImagePosition` 導致第二次覆蓋第一次
   - 修復：合併為單次 `onChange` 調用

2. **待辦事項 CRUD** (`useTodos.ts`, `createCloudHook.ts`)
   - 問題：`mutate(KEY, [...items, newItem])` 使用過時的 items
   - 修復：改用 `mutate(KEY, (current) => [...current, newItem])`

### 開發時自問

- [ ] 這個 callback 內使用的變數，在執行時是最新的嗎？
- [ ] 連續呼叫多次 setState/update，會不會互相覆蓋？
- [ ] 異步操作完成後，使用的狀態是當時的還是最新的？
- [ ] useCallback/useMemo 的依賴陣列是否完整？

---

## 🎯 單一遮罩規範 (Single Overlay Pattern) - 2026-01-07 新增

> **指令名稱**: `修復多重遮罩` 或 `fix-overlay`
> **當你說這個指令時，我會知道要檢查並修復巢狀 Dialog 的遮罩問題**

### 問題說明

當 Dialog A 內部開啟 Dialog B 時，會出現多層遮罩疊加，導致：
- 背景越來越暗
- 視覺混亂
- 關閉邏輯複雜

### ✅ 正確做法：單一遮罩模式

```tsx
// 父 Dialog 在子 Dialog 開啟時「完全不渲染」
export function ParentDialog({ open, onOpenChange }) {
  const [childDialogOpen, setChildDialogOpen] = useState(false)

  return (
    <>
      {/* 父 Dialog：子 Dialog 開啟時完全不渲染（避免動畫過渡期間的遮罩疊加） */}
      {!childDialogOpen && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent>
            {/* ... 內容 ... */}
            <Button onClick={() => setChildDialogOpen(true)}>
              開啟子視窗
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {/* 子 Dialog：放在父 Dialog 外面 */}
      <ChildDialog
        open={childDialogOpen}
        onOpenChange={setChildDialogOpen}
      />
    </>
  )
}
```

### 關鍵規則

1. **子 Dialog 放在父 Dialog 的 JSX 外面**（使用 Fragment `<>` 包裹）
2. **父 Dialog 必須使用條件渲染 `{!childDialogOpen && <Dialog>}`**
   - ❌ 錯誤：`<Dialog open={open && !childDialogOpen}>` - 這只是設置 open=false，Dialog 仍會淡出動畫，導致遮罩疊加
   - ✅ 正確：`{!childDialogOpen && <Dialog open={open}>}` - 完全不渲染父 Dialog，立即清除遮罩

### 已修復的案例

| 父 Dialog | 子 Dialog | 檔案 |
|-----------|-----------|------|
| ProposalDetailDialog | TimelineItineraryDialog | `proposals/components/` |
| TimelineItineraryDialog | AttractionSelector | `proposals/components/` |
| RequirementSyncDialog | TourRequestFormDialog | `proposals/components/` |
| TourRequestFormDialog | PrintPreview (Portal) | `proposals/components/` |
| ReceiptDetailDialog | CreateLinkPayDialog | `finance/payments/components/` |
| CompanyDetailDialog | CompanyFormDialog | `customers/companies/components/` |
| DisbursementDetailDialog | DisbursementPrintDialog | `disbursement/components/` |
| RoomManagerDialog | AddRoomDialog | `components/tours/room-manager/` |
| TourRoomManager | AddRoomDialog | `components/tours/tour-room-manager.tsx` |

### 檢查指令

當用戶說「修復多重遮罩」或「fix-overlay」時：
1. 搜尋 `Dialog.*open=` 和巢狀的 Dialog 組件
2. 檢查是否有 Dialog 內部 render 另一個 Dialog
3. 套用上述單一遮罩模式修復

---

## 🚨🚨🚨 絕對禁止規則 (Zero Tolerance) 🚨🚨🚨

### ❌ 五大禁令 - 違反立即停止

| 禁令 | 說明 | 後果 |
|------|------|------|
| **禁止 any** | 不准使用 `: any`、`as any`、`<any>` | 必須使用明確類型 |
| **禁止忽略資料庫** | 修改功能前必須檢查 Supabase 表格結構 | 必須確認欄位存在 |
| **禁止盲目修改** | 每次修改前必須先讀取並理解現有代碼 | 必須先 Read 再 Edit |
| **禁止自訂版面** | 列表頁面必須使用標準組件 | 必須用 EnhancedTable |
| **禁止詳細頁跳轉** | 不要建立 `/xxx/[id]/page.tsx` 詳細頁 | 用 Dialog 或展開功能 |

### ✅ 正確做法

```typescript
// ❌ 錯誤：使用 any
const data: any = response
const items = data as any[]

// ✅ 正確：明確類型
interface ApiResponse { items: Customer[] }
const data: ApiResponse = response
const items: Customer[] = data.items

// ❌ 錯誤：自訂列表版面
<div className="custom-table">...</div>
<table className="my-table">...</table>

// ✅ 正確：使用標準組件
import { EnhancedTable } from '@/components/ui/enhanced-table'
import { ResponsiveHeader } from '@/components/layout/responsive-header'

// 列表頁面標準結構：
<div className="h-full flex flex-col">
  <ResponsiveHeader title="XXX管理" icon={Icon} ... />
  <div className="flex-1 overflow-auto">
    <EnhancedTable columns={columns} data={data} ... />
  </div>
</div>

// ❌ 錯誤：建立詳細頁面路由
// /app/(main)/orders/[orderId]/page.tsx  ← 不要這樣做！
router.push(`/orders/${order.id}`)  // 跳轉到詳細頁

// ✅ 正確：使用 Dialog 或展開功能
// 方式1: Dialog
const [selectedItem, setSelectedItem] = useState<Item | null>(null)
<ItemDetailDialog item={selectedItem} onClose={() => setSelectedItem(null)} />

// 方式2: 展開列表
<EnhancedTable expandable={{ renderExpanded: (row) => <ItemDetails item={row} /> }} />

// 方式3: URL 參數展開
router.push(`/tours?highlight=${tourId}`)  // 跳轉並展開指定項目
```

### 📋 新功能開發檢查清單

**寫代碼前必須確認：**
- [ ] 相關的 Supabase 表格結構是否正確？（執行 `檢查表格` 指令）
- [ ] 需要的欄位是否存在？
- [ ] TypeScript 類型定義是否完整？（檢查 `src/lib/supabase/types.ts`）
- [ ] 是否可以複用現有組件/Hook？
- [ ] 是否需要詳細頁？（**不需要！用 Dialog 或展開**）

**寫代碼時必須遵守：**
- [ ] 不使用 any 類型
- [ ] 使用現有的可重用組件
- [ ] 錯誤要有適當處理
- [ ] 列表用 Dialog/展開，不建詳細頁

**寫完代碼後必須驗證：**
- [ ] `npm run type-check` 通過
- [ ] `npm run lint` 通過
- [ ] 功能正常運作
- [ ] 資料可以正確儲存到資料庫

### 🗄️ Supabase 表格檢查指令

**新功能前必須執行：**
```bash
# 檢查表格是否存在
SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 \
  npx supabase db dump --project-ref pfqvdacxowpgfamuvnsn | grep "CREATE TABLE"

# 檢查特定表格欄位
SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 \
  npx supabase db dump --project-ref pfqvdacxowpgfamuvnsn | grep -A 50 "CREATE TABLE.*table_name"

# 重新生成 TypeScript 類型（確保同步）
SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 \
  npx supabase gen types typescript --project-id pfqvdacxowpgfamuvnsn > src/lib/supabase/types.ts
```

**功能完成後必須驗證：**
```bash
# 測試資料能否正確存入
1. 在 UI 建立一筆測試資料
2. 到 Supabase Dashboard 確認資料已存入
3. 刪除測試資料
```

---

## 🚨 效能開發規範 (重要！)

> **背景**: 2025-12 venturo-online 效能優化發現的問題，同樣適用於 ERP。
> 以下規範確保新功能不會造成效能問題。

### ❌ 絕對禁止的效能殺手

```typescript
// ❌ 1. 禁止在 API route 內直接 createClient
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)  // 每次請求都建新連線，浪費 200-500ms

// ❌ 2. 禁止 N+1 查詢 (map + await)
const results = await Promise.all(
  items.map(async (item) => {
    return await supabase.from('table').select().eq('id', item.id) // 10 筆 = 10 次查詢
  })
)

// ❌ 3. 禁止 waterfall 查詢（等前一個完成才開始下一個）
const users = await supabase.from('users').select()
const orders = await supabase.from('orders').select()  // 等 users 完成才開始
const items = await supabase.from('items').select()    // 等 orders 完成才開始
```

### ✅ 正確做法

```typescript
// ✅ 1. 使用單例模式（如果已建立）
// 若有 supabase-server.ts：
import { getSupabase } from '@/lib/supabase-server'
const supabase = getSupabase()  // 重用連線

// ✅ 2. 批量查詢取代 N+1
const itemIds = items.map(i => i.id)
const { data } = await supabase
  .from('table')
  .select()
  .in('id', itemIds)  // 1 次查詢取得所有

// ✅ 3. 平行查詢 Promise.all（獨立查詢同時執行）
const [users, orders, items] = await Promise.all([
  supabase.from('users').select(),
  supabase.from('orders').select(),
  supabase.from('items').select(),
])

// ✅ 4. 使用 join 減少查詢次數
const { data } = await supabase
  .from('orders')
  .select(`
    *,
    customer:customers(*),
    items:order_items(*)
  `)
```

### 效能檢查清單（新增 API 時）

- [ ] 是否重用 Supabase 連線（單例模式）？
- [ ] 是否有 `.map(async)` 內做資料庫查詢？（改用 `.in()` 批量）
- [ ] 多個獨立查詢是否用 `Promise.all` 平行執行？
- [ ] 能否用 join/select 減少查詢次數？

### 效能工具檔案

| 檔案 | 用途 |
|------|------|
| `src/lib/supabase/admin.ts` | API 用 Supabase 單例 ⭐️ |
| `src/lib/request-dedup.ts` | 請求去重 + SWR 快取 ⭐️ |
| `src/lib/api-utils.ts` | API 回應快取標頭 ⭐️ |

---

## 🚨🚨🚨 快取架構規範 (2025-12-26 新增，極重要！) 🚨🚨🚨

> **核心原則**：登入速度 = 用戶體驗，任何功能都不能讓登入變慢！

### ❌ 絕對禁止的架構

```typescript
// ❌ 登入時才去 JOIN 多個表格
const onLogin = async () => {
  // 這樣會讓登入變慢！
  const tours = await supabase
    .from('tours')
    .select('*, orders(*), order_members(*), itineraries(*)')
    .eq('...', '...')
}

// ❌ 每次讀取都 JOIN 多個表格
const MyComponent = () => {
  // View 每次查詢都 JOIN 4 個表格 = 浪費資源
  const { data } = useSWR('my_erp_tours', fetcher)
}
```

### ✅ 正確的快取架構

```
寫入時計算（ERP 端觸發）：
  ERP 建立訂單 → 自動更新快取表 → 會員登入直接讀（快！）

而不是：
  會員登入 → 即時 JOIN 計算 → 慢！
```

### 快取表設計模式

```sql
-- 1. 建立快取表（預先計算好的資料）
CREATE TABLE xxx_cache (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,

  -- 快取的資料（從多個表 JOIN 計算出來的）
  cached_field_1 text,
  cached_field_2 jsonb,

  -- 快取元資料
  cached_at timestamptz DEFAULT now(),
  source_updated_at timestamptz
);

-- 2. 來源資料變更時，自動更新快取
CREATE TRIGGER trigger_refresh_cache
AFTER INSERT OR UPDATE ON source_table
FOR EACH ROW
EXECUTE FUNCTION auto_refresh_cache();

-- 3. 使用者讀取時，直接查快取表（單表查詢）
SELECT * FROM xxx_cache WHERE user_id = auth.uid();
```

### 已實作的快取表

| 快取表 | 來源 | 觸發時機 |
|--------|------|---------|
| `traveler_tour_cache` | tours + orders + order_members + itineraries | order_members 新增/修改、tours 修改、旅客綁定身分證 |

### 新功能開發檢查清單

開發任何需要「跨表查詢」的功能前，問自己：

- [ ] **登入時會觸發嗎？** 如果是，必須用快取表！
- [ ] **頻繁讀取嗎？** 如果 >10次/天/用戶，考慮快取
- [ ] **JOIN 幾個表？** 如果 >2 個表，考慮快取
- [ ] **資料變動頻率？** 如果來源資料很少變，適合快取
- [ ] **觸發時機？** 寫入時更新快取，而不是讀取時計算

### 其他應該使用快取的功能

| 功能 | 建議快取 | 觸發時機 |
|------|---------|---------|
| 未讀訊息數 | `user_unread_counts` | 訊息新增時 |
| 用戶統計 | `user_stats_cache` | 相關資料變更時 |
| 權限快取 | `user_permissions_cache` | 角色變更時 |
| 通知數量 | `notification_counts` | 通知新增時 |

---

## 🚨 前端效能優化規範 (2025-12-24 新增)

### 1. Dynamic Import - 大型組件延遲載入

```typescript
// ❌ 錯誤：直接 import 大型 Dialog（增加首次載入時間）
import { AddReceiptDialog } from '@/features/finance/payments'

// ✅ 正確：使用 dynamic import
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const AddReceiptDialog = dynamic(
  () => import('@/features/finance/payments').then(m => m.AddReceiptDialog),
  { loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Loader2 className="animate-spin text-white" size={32} />
    </div>
  }
)
```

**使用時機**：
- Dialog/Modal 組件（用戶不一定會打開）
- 複雜的表單組件
- 圖表/視覺化組件

### 2. Image Blur Placeholder - 圖片載入優化

```typescript
// ❌ 錯誤：直接使用 Image
<Image src={url} alt="..." width={200} height={150} />

// ✅ 正確：使用 blur placeholder
import { getOptimizedImageProps } from '@/lib/image-utils'

<Image
  src={url}
  alt="..."
  width={200}
  height={150}
  {...getOptimizedImageProps(url)}
/>
```

**效果**：載入時顯示模糊佔位符，改善視覺體驗

### 3. VirtualizedTable - 大資料虛擬化

```typescript
// ❌ 錯誤：大量資料用普通表格（>100筆會卡頓）
<EnhancedTable data={largeData} columns={columns} />

// ✅ 正確：使用虛擬化表格
import { VirtualizedTable } from '@/components/ui/enhanced-table'

<VirtualizedTable
  data={largeData}          // >100 筆資料
  columns={columns}
  height={600}              // 固定高度
  estimateRowHeight={48}    // 預估行高
  onRowClick={handleClick}
/>
```

**使用時機**：
- 資料量 >100 筆
- 需要無分頁顯示全部資料
- EnhancedTable 已有分頁功能，大部分場景不需要

### 效能組件一覽表

| 組件/工具 | 檔案位置 | 用途 |
|---------|---------|------|
| `VirtualizedTable` | `src/components/ui/enhanced-table/VirtualizedTable.tsx` | 大資料虛擬化表格 |
| `useVirtualList` | `src/hooks/useVirtualList.ts` | 虛擬列表 Hook |
| `getOptimizedImageProps` | `src/lib/image-utils.ts` | 圖片 blur placeholder |

---

## 🚨 Next.js 16 RSC 邊界規範 (重要！)

> **背景**: Next.js 16 使用 Turbopack，對 Server/Client Component 邊界檢查更嚴格。

### ❌ 常見錯誤

```typescript
// ❌ 錯誤：在 Server Component 中使用 client hooks
// page.tsx (Server Component)
import { useMyHook } from './hooks'  // 會報錯！

// ❌ 錯誤：barrel export 混合 server/client
// features/index.ts
export * from './components'  // 包含 client components
export * from './hooks'       // 包含 client hooks
// 當 Server Component import 這個 index 時會失敗
```

### ✅ 正確做法

```typescript
// ✅ 1. Client Hooks 檔案必須加 'use client'
// hooks/useMyHook.ts
'use client'
import useSWR from 'swr'
export function useMyHook() { ... }

// ✅ 2. 使用 client hooks 的 index 也要加 'use client'
// features/my-feature/hooks/index.ts
'use client'
export * from './useMyHook'
export * from './useAnotherHook'

// ✅ 3. 頁面使用 client component 包裝
// page.tsx (Server Component)
import { MyClientComponent } from './components/MyClientComponent'
export default function Page() {
  return <MyClientComponent />  // 委託給 client component
}

// ✅ 4. 或直接標記頁面為 client
// page.tsx
'use client'
import { useMyHook } from './hooks'
```

### RSC 邊界檢查清單

- [ ] 使用 `useState`, `useEffect`, SWR 等 hooks 的檔案有 `'use client'`
- [ ] 使用 `onClick`, `onChange` 等事件的組件有 `'use client'`
- [ ] barrel export (`index.ts`) 如果包含 client code，整個檔案加 `'use client'`
- [ ] 避免 Server Component 直接 import client hooks

---

## 🚨🚨🚨 Console 與 as any 嚴禁規範 (2025-12-25 強制) 🚨🚨🚨

### ❌ 絕對禁止：console.log/error/warn

**從今以後，所有新代碼禁止使用 console，必須使用 logger。**

```typescript
// ❌ 絕對禁止
console.log('debug:', data)
console.error('錯誤:', error)
console.warn('警告:', message)

// ✅ 唯一正確做法
import { logger } from '@/lib/utils/logger'

logger.log('資訊:', data)
logger.error('錯誤:', error)
logger.warn('警告:', message)
```

**Logger 優勢**：
- 統一格式、可控制輸出級別、生產環境可關閉、便於追蹤問題

**例外情況**（僅以下兩種允許 console）：
1. `src/lib/utils/logger.ts` - Logger 本身的實現
2. `scripts/reset-db.ts` - 開發工具腳本

---

### ❌ 絕對禁止：新增 as any

**從今以後，所有新代碼禁止使用 `as any`。沒有例外。**

```typescript
// ❌ 絕對禁止
const data = response as any
const items = result as any[]
function process(input: any): any { }

// ✅ 正確做法：使用明確類型
interface ApiResponse { items: Customer[] }
const data: ApiResponse = response
const items: Customer[] = result.items

// ✅ 如果真的無法確定類型，使用 unknown + type guard
const data: unknown = response
if (isValidResponse(data)) {
  // data 現在有正確類型
}
```

### 📋 現存 as any 遺留清單 (43 處，已凍結)

以下是 2025-12-25 技術債清理時記錄的現存 `as any` 使用。這些是歷史遺留問題，大多與 Supabase 類型系統深度整合相關，風險較高不適合現階段修改。

| 檔案 | 數量 | 原因 |
|------|------|------|
| `src/stores/cloud-store-factory.ts` | 8 | Supabase 泛型 store 類型推導 |
| `src/stores/order-store.ts` | 5 | Supabase 關聯查詢類型 |
| `src/stores/passport-ocr-store.ts` | 4 | OCR API 回應類型 |
| `src/stores/quote-store.ts` | 4 | 報價單複雜嵌套類型 |
| `src/stores/tour-store.ts` | 3 | 團號關聯查詢 |
| `src/lib/supabase/admin.ts` | 2 | Supabase Admin 類型 |
| `src/app/api/` 各 route | 7 | API 請求/回應類型轉換 |
| 其他散落 | 10 | 各種 edge case |

**規則**：
1. 現存的 43 處 `as any` 已凍結，不再增加
2. 新代碼絕對禁止使用 `as any`
3. 如果修改現有檔案，鼓勵順便修復該檔案的 `as any`
4. 未來若有時間，逐步修復這些遺留問題

---

## 🚨 開發前必讀：架構規範

**重要**: 修改程式碼前，請先閱讀以下文件：

1. **`docs/ARCHITECTURE_STANDARDS.md`** ⭐️ 系統架構規範（最重要）
   - 五層架構定義
   - 資料隔離規範（workspaceScoped）
   - 權限控制規範
   - Store 開發規範
   - 新功能開發檢查清單

2. **`docs/CODE_REVIEW_CHECKLIST.md`** 程式碼審查清單

### 五個絕對不能做的事：
1. **不要用預設值掩蓋 null/undefined** - 例如 `value || 'TP'` 會讓台中同事看到錯誤資料
2. **不要假設資料已載入** - store.items 在某些時間點可能是空的
3. **不要用 `as any` 繞過型別** - 這會隱藏真正的問題
4. **不要寫空的 catch 區塊** - 至少要 `logger.error()`
5. **不要背景 .then() 不等待** - 後續代碼可能在資料載入前執行

### 開發時自問：
- 這個功能需要的資料，在使用時一定已經載入了嗎？
- 如果是不同 workspace 的使用者，這段代碼會正常運作嗎？
- 如果資料不存在，使用者會看到什麼？

---

## 🔢 編號規範（固定標準，不可更改）

> **重要**：以下編號格式為固定規範，所有編號生成必須遵守此標準。

### 編號格式一覽表

| 項目 | 格式 | 範例 | 說明 |
|------|------|------|------|
| **團號** | `{城市代碼}{YYMMDD}{A-Z}` | `CNX250128A` | 清邁 2025/01/28 第1團 |
| **訂單** | `{團號}-O{2位數}` | `CNX250128A-O01` | 該團第1筆訂單 |
| **需求單** | `{團號}-RQ{2位數}` | `CNX250128A-RQ01` | 該團第1張需求單 (RQ=Request) |
| **請款單** | `{團號}-I{2位數}` | `CNX250128A-I01` | 該團第1張請款單 (I=Invoice) |
| **收款單** | `{團號}-R{2位數}` | `CNX250128A-R01` | 該團第1張收款單 (R=Receipt) |
| **出納單** | `P{YYMMDD}{A-Z}` | `P250128A` | 2025/01/28 第1張出納單 |
| **客戶** | `C{6位數}` | `C000001` | 流水號 |
| **報價單(標準)** | `Q{6位數}` | `Q000001` | 流水號 |
| **報價單(快速)** | `X{6位數}` | `X000001` | 流水號 |
| **員工** | `E{3位數}` | `E001` | 無辦公室前綴，入口選公司 |

### 編號規則說明

```
團號規則：
- 城市代碼：使用 IATA 機場代碼（CNX=清邁, BKK=曼谷, HND=東京...）
- 日期：YYMMDD 格式（年後2碼+月2碼+日2碼）
- 序號：A-Z 字母（同城市同日期的第N團）

關聯編號規則：
- 訂單/需求單/請款單/收款單：都依附於團號，格式為 {團號}-{類型}{序號}
- 序號為 2 位數，從 01 開始
- 類型代碼：O=訂單, RQ=需求單, I=請款單, R=收款單

獨立編號規則：
- 出納單：以出帳日期為基準，格式為 P{日期}{字母}
- 客戶/報價單：純流水號，6位數

員工編號特殊規則：
- 台北和台中員工都使用 E001~E999
- 系統紀錄和登入帳號都是 E001（無辦公室前綴）
- 登入時需選擇公司來區分
```

### 編號生成函數位置

所有編號生成邏輯集中在：`src/stores/utils/code-generator.ts`

```typescript
// 團號
generateTourCode(workspaceCode, cityCode, departureDate, existingTours)

// 訂單
generateOrderCode(tourCode, existingOrders)

// 請款單
generatePaymentRequestCode(tourCode, existingPaymentRequests)

// 收款單
generateReceiptOrderCode(tourCode, existingReceiptOrders)

// 出納單
generateDisbursementOrderCode(disbursementDate, existingDisbursementOrders)

// 客戶
generateCustomerCode(existingCustomers)

// 報價單
generateCode(workspaceCode, { quoteType: 'standard' | 'quick' }, existingQuotes)

// 員工
generateEmployeeNumber(workspaceCode, existingEmployees)
```

---

## 🎯 核心原則

### 行為控制
- **問題 → 只回答**，不執行操作
- **等待指令**：「執行」「修正」「開始」才動作
- **簡潔回應**：問什麼答什麼

### 專案資訊
```
專案名稱: Venturo ERP (旅遊團管理系統)
工作目錄: /Users/williamchien/Projects/venturo-erp
開發端口: 3000
技術棧:   Next.js 16 + React 19.2 + TypeScript 5 + Zustand 5 + Supabase
```

---

## 📁 專案架構

### 核心目錄結構
```
src/
├── app/          (51 頁面) - Next.js 路由
├── components/   (185 檔案) - UI 組件
├── features/     (88 檔案) - 功能模組
├── stores/       (36 檔案) - Zustand 狀態管理
├── hooks/        (18 檔案) - 自定義 Hooks
├── lib/          (29 檔案) - 工具函式
├── services/     (5 檔案) - 業務服務
└── types/        (20 檔案) - TypeScript 型別
```

### 架構模式
- **Hybrid Feature-Based + Layer-Based**
- 功能模組獨立 (features/)
- 共享基礎層 (components/, hooks/, stores/)

---

## 🔧 開發規範

### 組件創建規則
```tsx
// ✅ 正確：使用 Phase 1/2 的可重用組件
import { ListPageLayout } from '@/components/layout/list-page-layout';
import { DateCell, StatusCell, ActionCell } from '@/components/table-cells';

// ❌ 錯誤：不要重複寫 ResponsiveHeader + EnhancedTable
```

### 命名規範
- **組件**: PascalCase (`ChannelChat.tsx`)
- **Hooks**: camelCase (`useUserStore.ts`)
- **工具**: kebab-case (`format-date.ts`)
- **型別**: kebab-case + `.types.ts`

### 型別安全
- **禁止**: `as any`、`: any`、`<any>`
- **盡量避免**: `as unknown`
- **使用**: 正確的 TypeScript 型別定義

### 🔧 自動化檢查工具

```bash
# 提交前檢查
npm run type-check         # TypeScript 檢查
npm run lint               # ESLint 檢查
```

**Pre-commit Hook 已啟用：**
- 提交時自動執行 type-check 和 lint
- 類型錯誤或 lint 錯誤會阻止提交

---

## 📋 常用指令

### 開發
```bash
cd /Users/williamchien/Projects/venturo-erp
npm run dev          # 啟動開發伺服器 (port 3000)
npm run build        # 建置專案
npm run lint         # 執行 ESLint
```

### 檢查架構
```bash
ls -la src/components/     # 查看組件
ls -la src/features/       # 查看功能模組
find . -name "*-store.ts"  # 查找所有 stores
```

---

## ✅ 最近完成的優化

### Phase 1-2: 可重用組件系統
- ✅ ListPageLayout 組件
- ✅ Table Cell 組件庫 (8 個組件)
- ✅ useListPageState Hook
- ✅ 應用到 Quotes/Contracts/Itinerary 頁面

### Phase 3: RLS 完整系統
- ✅ 完整的 RLS 策略（業務資料隔離）
- ✅ Helper functions（get_current_user_workspace、is_super_admin）
- ✅ workspace 級別資料隔離
- ✅ Super admin 跨 workspace 存取

---

## 🎯 工作檢查清單

### 開始任何工作前
- [ ] 確認當前工作目錄正確
- [ ] 檢查 port 3000 是否已佔用
- [ ] 了解要修改的功能範圍

### 修改代碼前
- [ ] 是否使用了可重用組件？
- [ ] 型別定義是否完整？
- [ ] 是否避免 `as any`？
- [ ] 是否符合命名規範？

### 提交前檢查
- [ ] `npm run build` 通過
- [ ] 沒有新增 console.log
- [ ] 沒有未使用的 imports
- [ ] 型別檢查通過

---

## 🔍 快速參考

### 主要文檔位置
```
README.md                            - 專案總覽
docs/ARCHITECTURE_STANDARDS.md       - 系統架構規範
docs/CODE_REVIEW_CHECKLIST.md        - 程式碼審查清單
```

### 關鍵檔案
```
# 狀態管理
src/stores/types.ts                        - 所有型別定義

# 組件系統
src/components/table-cells/index.tsx       - 表格單元格組件
src/components/layout/list-page-layout.tsx - 列表頁佈局
src/hooks/useListPageState.ts              - 列表頁狀態管理
src/lib/status-config.ts                   - 狀態配置

# 類型定義
src/lib/supabase/types.ts                  - Supabase 自動生成類型
src/types/                                 - 業務類型定義
```

---

## 💡 給 AI 助手的提示

1. **優先使用現有組件** - Phase 1/2 已建立可重用組件系統
2. **保持一致性** - 遵循既有的架構模式
3. **型別安全優先** - 避免型別斷言
4. **簡潔回應** - 不要過度解釋，除非被問到
5. **等待確認** - 重大修改前先說明計劃
6. **主動修復** - 發現資料庫表格錯誤或缺失時，直接透過 CLI 修復，不要要求用戶手動操作

---

## 🗄️ 資料庫操作規範 (Supabase)

### ⚠️ 絕對規則：永遠使用 Supabase CLI
**禁止以下做法**：
- ❌ 創建 HTML 工具讓用戶手動執行
- ❌ 創建 Node.js 腳本嘗試直接連 PostgreSQL
- ❌ 使用 REST API 執行 DDL
- ❌ 要求用戶到 Supabase Dashboard 手動操作

**唯一正確做法**：
- ✅ 使用 Supabase CLI + Personal Access Token
- ✅ 執行 `SUPABASE_ACCESS_TOKEN=xxx npx supabase db push`

### Supabase 連接資訊
```bash
Personal Access Token: sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0
Project Ref: pfqvdacxowpgfamuvnsn
Project URL: https://pfqvdacxowpgfamuvnsn.supabase.co
```

### 標準 Migration 流程

#### 1. 創建 Migration 檔案
```bash
# 檔案命名必須符合: YYYYMMDDHHMMSS_description.sql
# 例如: supabase/migrations/20251027000000_add_channel_order.sql
```

#### 2. 撰寫 SQL（包含 BEGIN/COMMIT）
```sql
-- 範例
BEGIN;

ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;

COMMENT ON COLUMN public.channels."order" IS 'Display order for channels';

UPDATE public.channels
SET "order" = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY workspace_id ORDER BY created_at) - 1 AS row_num
  FROM public.channels
) AS subquery
WHERE channels.id = subquery.id;

COMMIT;
```

#### 3. 執行 Migration（推薦方式）
```bash
# 使用自動化工具（推薦！每台電腦都能自動執行）
npm run db:migrate

# 或使用 Supabase CLI（可能遇到 SSL 問題）
echo "Y" | SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 npx supabase db push
```

**自動化工具優勢**：
- ✅ 使用 Supabase Management API，避免 SSL 連線問題
- ✅ 自動追蹤已執行的 migrations
- ✅ 支援斷點續傳（失敗後可重新執行）
- ✅ 在任何電腦上都能可靠執行

#### 4. 驗證結果（可選）
```bash
# 查看資料庫類型定義
SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 \
  npx supabase gen types typescript --project-id pfqvdacxowpgfamuvnsn | grep -A 20 "table_name:"
```

### 自動修復原則
當發現以下問題時，**直接執行修復**，不要要求用戶操作：
- 表格缺失 → 建立 migration → 執行 db push
- 欄位錯誤 → 建立 migration → 執行 db push
- 資料類型不符 → 建立 migration → 執行 db push
- 索引缺失 → 建立 migration → 執行 db push
- **RLS 問題 → 依照 RLS 規範修正（見下方）**

### 🔐 RLS (Row Level Security) 規範

**Venturo 使用 RLS 進行資料隔離（2025-12-11 更新）**

#### 基本原則

**業務資料表格啟用 RLS，共用資料表格禁用 RLS**

#### RLS 架構

```
啟用 RLS 的表格（業務資料）：
- orders, tours, customers, payments, quotes, contracts
- itineraries, visas, tasks, todos
- channels, messages, calendar_events
- 等業務相關表格

禁用 RLS 的表格（全公司共用）：
- workspaces, employees, user_roles
- destinations, airlines, hotels, suppliers
- cities, countries, attractions
- 等基礎資料表格
```

#### Helper Functions

```sql
-- 取得當前用戶的 workspace_id
get_current_user_workspace()

-- 檢查是否為超級管理員
is_super_admin()

-- 取得當前員工 ID
get_current_employee_id()

-- 設定當前 workspace（前端登入時呼叫）
set_current_workspace(p_workspace_id text)
```

#### 創建新表時的標準模板

```sql
-- 業務資料表格（啟用 RLS）
CREATE TABLE public.new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 啟用 RLS
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- 建立 policies
CREATE POLICY "new_table_select" ON public.new_table FOR SELECT
USING (workspace_id = get_current_user_workspace() OR is_super_admin());

CREATE POLICY "new_table_insert" ON public.new_table FOR INSERT
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "new_table_update" ON public.new_table FOR UPDATE
USING (workspace_id = get_current_user_workspace() OR is_super_admin());

CREATE POLICY "new_table_delete" ON public.new_table FOR DELETE
USING (workspace_id = get_current_user_workspace() OR is_super_admin());
```

#### 權限層級

```typescript
// 一般員工：RLS 自動過濾到自己 workspace
fetchOrders() // RLS 會自動套用 workspace_id filter

// Super Admin：RLS 允許看所有
// is_super_admin() 會返回 true，繞過 workspace 限制
```

### Migration 記錄（自動更新）
| 日期 | Migration 檔案 | 目的 | 狀態 |
|------|---------------|------|------|
| 2025-12-11 | `20251211120000_enable_complete_rls_system.sql` | 啟用完整 RLS 系統 | ⏳ 待執行 |
| 2025-12-10 | `20251210_add_workspace_to_itineraries.sql` | 為 itineraries 添加 workspace 支援 | ⏳ 待執行 |

### 詳細文檔
完整的 Supabase 工作流程請參考：
`docs/reports/SUPABASE_WORKFLOW.md`

---

## 🔧 TypeScript 類型修復流程

### 問題：types.ts 缺少表格定義

當 `npm run type-check` 報錯說某個表格不存在於 `Database['public']['Tables']` 時，表示 `src/lib/supabase/types.ts` 缺少該表格的類型定義。

### 原因

`types.ts` 是由 Supabase CLI 自動生成的，但有時：
1. 遷移已創建但未推送到遠端資料庫
2. 遠端資料庫有表格但未重新生成類型
3. 手動添加的表格未同步

### 解決方案

#### 方案 A：重新生成類型（推薦）

```bash
# 1. 確保遷移已推送
npm run db:migrate

# 2. 重新生成類型
SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 \
  npx supabase gen types typescript --project-id pfqvdacxowpgfamuvnsn > src/lib/supabase/types.ts

# 3. 驗證
npm run type-check
```

#### 方案 B：手動添加類型（當遷移無法執行時）

在 `src/lib/supabase/types.ts` 的 `Tables` 區塊結尾處（`workspaces` 表格之後、`Views` 之前）添加缺少的表格定義：

```typescript
// 在 workspaces 的 Relationships 結束 } 之後添加
// === 手動添加的缺少表格類型 (日期) ===
new_table_name: {
  Row: {
    id: string
    // ... 所有欄位
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    // ... 可選欄位用 ?
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    // ... 所有欄位都是可選的
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}
```

### 查找表格結構的方法

1. **從遷移檔案**：查看 `supabase/migrations/` 中對應的 SQL 檔案
2. **從 Supabase Dashboard**：直接查看資料庫結構
3. **從代碼使用處**：搜尋 `.from('table_name')` 看使用了哪些欄位

### 已手動添加的表格/欄位（2025-12-11）

| 表格/欄位 | 位置 | 說明 |
|---------|------|------|
| `api_usage` | types.ts | API 使用量追蹤 |
| `image_library` | types.ts | 圖庫資料表 |
| `system_settings` | types.ts | 系統設定 |
| `travel_invoices` | types.ts | 代轉發票 |
| `vendor_costs` | types.ts | 代辦商成本 |
| `timebox_scheduled_boxes` | types.ts | Timebox 排程項目 |
| `customers.passport_image_url` | types.ts | 客戶護照圖片 URL |
| `order_members.passport_image_url` | types.ts | 訂單成員護照圖片 URL |
| `User.name`, `User.email` | stores/types.ts | 便捷屬性 |
| `User.roles` 添加 `super_admin` | stores/types.ts | 角色類型 |
| `itineraries.quote_id` | types.ts | 行程表關聯報價單 ID |
| `FlightInfo.departureDate` 改為可選 | tour-form/types.ts | 與 stores/types.ts 一致 |

### 注意事項

- 手動添加的類型只是**暫時解決方案**
- 最終應該推送遷移並重新生成類型
- 手動添加時要確保欄位類型與遷移 SQL 一致

---

## 🔄 Realtime 同步規範

### 核心原則：直接從 Supabase 取資料

**目前架構**：無離線優先、無 IndexedDB，直接從 Supabase 即時取資料

```typescript
// 標準資料取得方式
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('workspace_id', workspaceId)
```

### Realtime 訂閱（可選）

如需即時更新，可使用 Supabase Realtime：

```typescript
// 訂閱表格變更
const subscription = supabase
  .channel('orders-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders'
  }, (payload) => {
    // 處理變更
  })
  .subscribe()
```

---

**注意**: 這是精簡版規範。專案接近完工，不需要冗長的歷史指令。
