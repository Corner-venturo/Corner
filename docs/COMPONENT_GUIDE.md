# Venturo 組件使用指南

> **最後更新**: 2026-01-23
> **適用範圍**: UI 組件、設計規範、Table Cell、按鈕樣式

---

## 🎨 莫蘭迪色系設計系統

> **設計理念**: 優雅、精緻、有質感的莫蘭迪風格
> **參考頁面**: `/login`（設計標準）

### CSS 變數

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

### 設計 Token

| 元素 | Class | 說明 |
|------|-------|------|
| **主要卡片** | `rounded-xl shadow-lg border border-border p-8` | 登入頁標準 |
| **次要卡片** | `rounded-lg shadow-sm border border-border p-6` | 列表項目 |
| **主要按鈕** | `bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-lg` | CTA |
| **輸入框** | `rounded-lg border border-border focus:ring-2 focus:ring-morandi-gold` | 表單 |
| **表格頭** | `bg-morandi-container/40 border-b border-border/60` | 表格 |

### ❌ 禁止的設計做法

```tsx
// ❌ 不要使用固定顏色（不支援主題切換）
<div className="border-gray-200 bg-gray-100">

// ✅ 使用 CSS 變數
<div className="border-border bg-morandi-container">
```

---

## 📋 標準組件使用規則

| 場景 | 必須使用的組件 | 位置 |
|------|---------------|------|
| **列表頁面** | `ListPageLayout` | `@/components/layout/list-page-layout` |
| **頁面標題** | `ResponsiveHeader` | `@/components/layout/responsive-header` |
| **表格** | `EnhancedTable` | `@/components/ui/enhanced-table` |
| **表格單元格** | `DateCell`, `StatusCell`, `CurrencyCell` 等 | `@/components/table-cells` |

---

## 📄 列表頁面標準模板

```tsx
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

### ❌ 禁止的做法

```tsx
// ❌ 不要自己寫列表頁面結構
<div className="h-full flex flex-col">
  <div className="p-4">標題</div>
  <table>...</table>
</div>

// ✅ 使用 ListPageLayout
<ListPageLayout title="..." data={...} columns={...} />
```

---

## 📊 表格 Column 定義範例

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

---

## 🧩 Table Cell 組件

### 可用組件列表

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

### StatusCell 狀態類型

| type | 用途 | 可用狀態 |
|------|------|----------|
| `tour` | 旅遊團 | planning, confirmed, in_progress, completed, cancelled |
| `order` | 訂單 | draft, pending, confirmed, processing, completed, cancelled |
| `payment` | 付款 | pending, confirmed, completed, cancelled |
| `invoice` | 發票 | draft, pending, approved, paid, rejected |
| `visa` | 簽證 | pending, submitted, issued, collected, rejected |
| `todo` | 待辦 | pending, in_progress, completed, cancelled |
| `voucher` | 傳票 | draft, pending, approved, posted |

### ❌ 禁止的做法

```tsx
// ❌ 不要自己格式化日期/金額/狀態
<span>{new Date(row.date).toLocaleDateString()}</span>
<span>NT$ {row.amount}</span>
<span className="text-green-500">{row.status}</span>

// ✅ 使用 Table Cells
<DateCell date={row.date} />
<CurrencyCell amount={row.amount} />
<StatusCell type="tour" status={row.status} />
```

---

## 🔘 按鈕規範

**所有主要操作按鈕必須有圖標 + 文字**

### 標準按鈕樣式

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
```

### 常用按鈕圖標對應

| 操作 | 圖標 | 操作 | 圖標 |
|------|------|------|------|
| 新增 | `Plus` | 刪除 | `Trash2` |
| 儲存 | `Save` | 編輯 | `Edit2` |
| 確認 | `Check` | 列印 | `Printer` |
| 更新 | `RefreshCw` | 下載 | `Download` |
| 取消 | `X` | 上傳 | `Upload` |
| 關閉 | `X` | 搜尋 | `Search` |

---

## 📝 表單組件

### FieldError - 欄位錯誤訊息

```tsx
import { FieldError } from '@/components/ui/field-error'

<FieldError error="此欄位為必填" />
<FieldError error={['格式錯誤', '長度不足']} />
```

### FormField - 表單欄位包裝器

```tsx
import { FormField } from '@/components/ui/form-field'

<FormField label="姓名" required error={errors.name}>
  <Input value={name} onChange={...} />
</FormField>
```

### Label 必填標記

```tsx
import { Label } from '@/components/ui/label'

<Label required>姓名</Label>  // 顯示紅色星號
```

---

## 🪟 Dialog 組件

### DIALOG_SIZES - 標準尺寸

```tsx
import { DIALOG_SIZES } from '@/components/ui/dialog'

// 可用尺寸: sm, md, lg, xl, 2xl, 4xl, full
<DialogContent className={DIALOG_SIZES.lg}>
  ...
</DialogContent>
```

### ManagedDialog - 有狀態管理的 Dialog

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

### 單一遮罩規範

當 Dialog A 內部開啟 Dialog B 時，必須避免多層遮罩疊加：

```tsx
// ✅ 正確：父 Dialog 在子 Dialog 開啟時不渲染
export function ParentDialog({ open, onOpenChange }) {
  const [childDialogOpen, setChildDialogOpen] = useState(false)

  return (
    <>
      {/* 子 Dialog 開啟時，父 Dialog 完全不渲染 */}
      {!childDialogOpen && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent>
            <Button onClick={() => setChildDialogOpen(true)}>
              開啟子視窗
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {/* 子 Dialog 放在父 Dialog 外面 */}
      <ChildDialog
        open={childDialogOpen}
        onOpenChange={setChildDialogOpen}
      />
    </>
  )
}
```

**關鍵規則**：
1. 子 Dialog 放在父 Dialog 的 JSX 外面（用 `<>` 包裹）
2. 父 Dialog 使用 `{!childDialogOpen && <Dialog>}` 條件渲染

---

## 🧭 導航組件

### useBreadcrumb - 自動麵包屑

```tsx
import { useBreadcrumb } from '@/hooks/useBreadcrumb'

const breadcrumb = useBreadcrumb()
// 根據 URL 自動生成麵包屑
```

### ResponsiveHeader autoBreadcrumb

```tsx
<ResponsiveHeader
  title="訂單管理"
  autoBreadcrumb  // 自動生成麵包屑
/>
```

---

## ⚠️ 錯誤處理組件

### Error Boundary - 全域錯誤邊界

```tsx
import { ErrorBoundary } from '@/components/error-boundary'

// 已在 layout 層級設置，無需手動添加
// 錯誤時顯示重試按鈕
```

### NotFoundState - 找不到資料狀態

```tsx
import { NotFoundState } from '@/components/ui/not-found-state'

if (!data) return <NotFoundState resourceName="訂單" />
```

---

## 🔄 Store 同步系統

### 設置同步

```tsx
import { StoreSyncProvider } from '@/stores/sync'

<StoreSyncProvider>
  {children}
</StoreSyncProvider>
```

### 發送同步事件

```tsx
import { withTourUpdate } from '@/stores/sync'

// 更新 Tour 時自動同步相關 Orders
const update = withTourUpdate(tourStore.update)
await update(tourId, data)
```

---

## 📡 API 工具

### 統一 API 回應格式

```tsx
import { successResponse, errorResponse } from '@/lib/api/response'

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

---

## 📁 組件檔案位置索引

| 組件/工具 | 檔案位置 |
|---------|---------|
| `ListPageLayout` | `src/components/layout/list-page-layout.tsx` |
| `ResponsiveHeader` | `src/components/layout/responsive-header.tsx` |
| `EnhancedTable` | `src/components/ui/enhanced-table/` |
| `Table Cells` | `src/components/table-cells/index.tsx` |
| `FieldError` | `src/components/ui/field-error.tsx` |
| `FormField` | `src/components/ui/form-field.tsx` |
| `NotFoundState` | `src/components/ui/not-found-state.tsx` |
| `ManagedDialog` | `src/components/dialog/managed-dialog.tsx` |
| `ErrorBoundary` | `src/components/error-boundary.tsx` |
| `useBreadcrumb` | `src/hooks/useBreadcrumb.ts` |
| `useManagedDialogState` | `src/hooks/useManagedDialogState.ts` |
| `useListPageState` | `src/hooks/useListPageState.ts` |
| `API Response` | `src/lib/api/response.ts` |
| `Status Config` | `src/lib/status-config.ts` |

---

## 相關文件

- `docs/VENTURO_UI_DESIGN_STYLE.md` - 詳細 UI 設計規範
- `docs/DESIGN_SYSTEM.md` - 設計系統（圓角、邊框、間距）
