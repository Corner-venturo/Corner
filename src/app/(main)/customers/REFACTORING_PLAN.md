# 🔧 Customers Page 重構計劃

**原文件**: `src/app/(main)/customers/page.tsx`
**當前行數**: 2,110 行
**目標**: 拆分成 < 200 行的主文件 + 多個小型組件
**狀態**: 📋 規劃中

---

## 📊 問題分析

### 當前違規項目

| 違規類型            | 數量            | 嚴重程度            |
| ------------------- | --------------- | ------------------- |
| 組件行數超標 (>300) | 2,110 行        | 🔴 嚴重 (超過 603%) |
| 單一職責違反        | 8+ 個職責       | 🔴 嚴重             |
| 狀態管理過多        | 20+ 個 useState | 🟠 高               |
| 函數過多            | 15+ 個函數      | 🟠 高               |
| JSX 過長            | ~1,000 行       | 🔴 嚴重             |

### 組件職責分析

當前組件包含以下**8個不同職責**：

1. **搜尋功能** (~150 行)
   - 進階搜尋對話框
   - 搜尋參數管理
   - localStorage 持久化
   - 過濾邏輯

2. **新增顧客** (~100 行)
   - 表單狀態管理
   - 新增對話框
   - 表單驗證

3. **批次護照上傳** (~400 行)
   - 文件拖放
   - PDF 轉圖片
   - 圖片壓縮
   - OCR 處理
   - 批次上傳邏輯

4. **顧客驗證對話框** (~200 行)
   - 驗證表單
   - 資料比對
   - 儲存邏輯

5. **圖片編輯器** (~350 行)
   - 縮放/平移
   - 旋轉/翻轉
   - 裁剪功能
   - 滑鼠事件處理

6. **OCR 重新辨識** (~150 行)
   - 使用裁剪圖片辨識
   - 使用原圖辨識
   - 結果處理

7. **表格顯示** (~200 行)
   - 表格欄位定義
   - 點擊事件
   - 詳情對話框

8. **主頁面布局** (~560 行 JSX)
   - 頁面結構
   - 多個對話框
   - 按鈕組

---

## 🎯 重構目標

### 文件結構

```
src/app/(main)/customers/
├── page.tsx                                    # 主頁面 (~150 行)
│
├── components/
│   ├── CustomerTable.tsx                       # 表格顯示 (~200 行)
│   ├── CustomerAddDialog.tsx                   # 新增對話框 (~150 行)
│   ├── CustomerDetailDialog.tsx                # 詳情對話框 (~100 行)
│   ├── CustomerVerifyDialog/
│   │   ├── index.tsx                           # 驗證對話框主組件 (~200 行)
│   │   ├── ImageEditor.tsx                     # 圖片編輯器 (~250 行)
│   │   └── VerifyForm.tsx                      # 驗證表單 (~150 行)
│   └── PassportBatchUpload/
│       ├── index.tsx                           # 上傳主組件 (~150 行)
│       ├── FileDropZone.tsx                    # 拖放區域 (~100 行)
│       └── UploadPreview.tsx                   # 上傳預覽 (~100 行)
│
├── hooks/
│   ├── useCustomerSearch.ts                    # 搜尋邏輯 (~100 行)
│   ├── usePassportUpload.ts                    # 上傳邏輯 (~200 行)
│   ├── useImageEditor.ts                       # 圖片編輯 (~150 行)
│   ├── useCustomerVerify.ts                    # 驗證邏輯 (~100 行)
│   └── useOcrRecognition.ts                    # OCR 辨識 (~100 行)
│
├── config/
│   └── tableColumns.tsx                        # 表格欄位配置 (~100 行)
│
└── types/
    └── index.ts                                # 本地類型定義 (~50 行)
```

### 預期結果

| 指標       | 改善前 | 改善後 | 改善幅度 |
| ---------- | ------ | ------ | -------- |
| 主文件行數 | 2,110  | ~150   | ↓ 93%    |
| 最大組件   | 2,110  | ~250   | ↓ 88%    |
| 組件數量   | 1      | 15+    | ↑ 1400%  |
| 可測試性   | 低     | 高     | ↑↑↑      |
| 可維護性   | 低     | 高     | ↑↑↑      |

---

## 📋 詳細拆分方案

### Phase 1: 提取 Hooks (優先)

#### 1.1 `useCustomerSearch.ts`

**職責**: 管理搜尋狀態和過濾邏輯

```typescript
export function useCustomerSearch(customers: Customer[]) {
  const [searchParams, setSearchParams] = useState<CustomerSearchParams>(() => {
    // localStorage 邏輯
  })

  const filteredCustomers = useMemo(() => {
    // 過濾邏輯（~80 行）
  }, [customers, searchParams])

  const handleSearch = useCallback((params: CustomerSearchParams) => {
    setSearchParams(params)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params))
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchParams({})
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    searchParams,
    filteredCustomers,
    handleSearch,
    handleClearSearch,
    hasActiveFilters: Object.keys(searchParams).length > 0,
  }
}
```

**提取行數**: ~120 行
**減少主文件**: 120 行

---

#### 1.2 `useImageEditor.ts`

**職責**: 圖片縮放、旋轉、翻轉、裁剪

```typescript
export function useImageEditor() {
  // 縮放/平移狀態
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  // 旋轉/翻轉狀態
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)

  // 裁剪狀態
  const [isCropMode, setIsCropMode] = useState(false)
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 0, height: 0 })

  // 滑鼠事件處理
  const handleMouseDown = useCallback(...)
  const handleMouseMove = useCallback(...)
  const handleMouseUp = useCallback(...)

  // 圖片轉換
  const transformImage = useCallback(...)
  const cropImage = useCallback(...)

  // 重置
  const reset = useCallback(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setRotation(0)
    setFlipH(false)
    setIsCropMode(false)
    setCropRect({ x: 0, y: 0, width: 0, height: 0 })
  }, [])

  return {
    zoom, setZoom,
    position, setPosition,
    rotation, setRotation,
    flipH, setFlipH,
    isCropMode, setIsCropMode,
    cropRect, setCropRect,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    transformImage,
    cropImage,
    reset,
  }
}
```

**提取行數**: ~150 行
**減少主文件**: 150 行

---

#### 1.3 `usePassportUpload.ts`

**職責**: 護照批次上傳、PDF 轉圖片、壓縮

```typescript
export function usePassportUpload(onSuccess?: () => void) {
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // PDF 轉圖片
  const convertPdfToImages = useCallback(async (pdfFile: File): Promise<File[]> => {
    // PDF 處理邏輯（~30 行）
  }, [])

  // 壓縮圖片
  const compressImage = useCallback(async (file: File, quality = 0.6): Promise<File> => {
    // 壓縮邏輯（~50 行）
  }, [])

  // 批次上傳
  const handleBatchUpload = useCallback(async () => {
    // 上傳邏輯（~200 行）
    // - OCR 辨識
    // - 客戶比對
    // - 資料更新
  }, [files])

  // 文件處理
  const handleFileChange = useCallback(...)
  const handleDragOver = useCallback(...)
  const handleDrop = useCallback(...)
  const handleRemoveFile = useCallback(...)

  return {
    files,
    isUploading,
    isDragging,
    handleFileChange,
    handleDragOver,
    handleDrop,
    handleRemoveFile,
    handleBatchUpload,
  }
}
```

**提取行數**: ~200 行
**減少主文件**: 200 行

---

#### 1.4 `useOcrRecognition.ts`

**職責**: OCR 辨識功能

```typescript
export function useOcrRecognition() {
  const [isRecognizing, setIsRecognizing] = useState(false)

  const recognizePassport = useCallback(
    async (imageSource: string | File, onSuccess: (data: OcrResult) => void) => {
      setIsRecognizing(true)
      try {
        // OCR API 呼叫
        // 結果處理
        // 性別判斷邏輯
        onSuccess(result)
      } catch (error) {
        toast.error('辨識失敗')
      } finally {
        setIsRecognizing(false)
      }
    },
    []
  )

  return {
    isRecognizing,
    recognizePassport,
  }
}
```

**提取行數**: ~100 行
**減少主文件**: 100 行

---

#### 1.5 `useCustomerVerify.ts`

**職責**: 顧客驗證邏輯

```typescript
export function useCustomerVerify(
  updateCustomer: (id: string, data: UpdateCustomerData) => Promise<void>
) {
  const [isOpen, setIsOpen] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<Partial<UpdateCustomerData>>({})
  const [isSaving, setIsSaving] = useState(false)

  const openDialog = useCallback((customer: Customer) => {
    setCustomer(customer)
    setFormData({
      name: customer.name,
      passport_romanization: customer.passport_romanization,
      // ... 其他欄位
    })
    setIsOpen(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!customer) return

    setIsSaving(true)
    try {
      await updateCustomer(customer.id, formData as UpdateCustomerData)
      toast.success('儲存成功')
      setIsOpen(false)
    } catch (error) {
      toast.error('儲存失敗')
    } finally {
      setIsSaving(false)
    }
  }, [customer, formData, updateCustomer])

  return {
    isOpen,
    customer,
    formData,
    setFormData,
    isSaving,
    openDialog,
    handleSave,
    closeDialog: () => setIsOpen(false),
  }
}
```

**提取行數**: ~80 行
**減少主文件**: 80 行

---

### Phase 2: 提取組件

#### 2.1 `CustomerTable.tsx`

**職責**: 表格顯示和互動

```typescript
interface CustomerTableProps {
  customers: Customer[]
  onRowClick: (customer: Customer) => void
}

export function CustomerTable({ customers, onRowClick }: CustomerTableProps) {
  const columns = useCustomerTableColumns()

  return (
    <EnhancedTable
      data={customers}
      columns={columns}
      onRowClick={onRowClick}
    />
  )
}
```

**提取行數**: ~50 行（組件） + ~100 行（欄位配置）
**減少主文件**: 150 行

---

#### 2.2 `CustomerAddDialog.tsx`

**職責**: 新增顧客表單

```typescript
interface CustomerAddDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: CreateCustomerData) => Promise<void>
}

export function CustomerAddDialog({ isOpen, onClose, onAdd }: CustomerAddDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    // ...
  })

  const handleSubmit = async () => {
    await onAdd(formData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* 表單 UI */}
    </Dialog>
  )
}
```

**提取行數**: ~150 行
**減少主文件**: 150 行

---

#### 2.3 `CustomerVerifyDialog/index.tsx`

**職責**: 驗證對話框主組件

```typescript
interface CustomerVerifyDialogProps {
  isOpen: boolean
  customer: Customer | null
  formData: Partial<UpdateCustomerData>
  onFormChange: (data: Partial<UpdateCustomerData>) => void
  onSave: () => Promise<void>
  onClose: () => void
}

export function CustomerVerifyDialog({
  isOpen,
  customer,
  formData,
  onFormChange,
  onSave,
  onClose,
}: CustomerVerifyDialogProps) {
  const imageEditor = useImageEditor()
  const ocrRecognition = useOcrRecognition()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="grid grid-cols-2 gap-4">
        {/* 左側：圖片編輯器 */}
        <ImageEditor
          imageUrl={customer?.passport_image_url}
          {...imageEditor}
          onReOcr={(data) => onFormChange({ ...formData, ...data })}
        />

        {/* 右側：驗證表單 */}
        <VerifyForm
          data={formData}
          onChange={onFormChange}
          onSave={onSave}
        />
      </div>
    </Dialog>
  )
}
```

**提取行數**: ~200 行
**減少主文件**: 200 行

---

#### 2.4 `CustomerVerifyDialog/ImageEditor.tsx`

**職責**: 圖片編輯功能

```typescript
interface ImageEditorProps {
  imageUrl?: string
  zoom: number
  setZoom: (zoom: number) => void
  rotation: number
  setRotation: (rotation: number) => void
  flipH: boolean
  setFlipH: (flipH: boolean) => void
  // ... 其他 props
  onReOcr: (data: Partial<UpdateCustomerData>) => void
}

export function ImageEditor({ imageUrl, zoom, rotation, ... }: ImageEditorProps) {
  return (
    <div className="space-y-2">
      {/* 工具列 */}
      <div className="flex gap-2">
        <Button onClick={() => setZoom(zoom + 0.1)}>
          <ZoomIn />
        </Button>
        {/* ... 其他按鈕 */}
      </div>

      {/* 圖片顯示區 */}
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{
          transform: `scale(${zoom}) rotate(${rotation}deg)`,
          scaleX: flipH ? -1 : 1,
        }}
      >
        <img src={imageUrl} />
        {/* 裁剪框 */}
      </div>
    </div>
  )
}
```

**提取行數**: ~250 行
**減少主文件**: 250 行

---

#### 2.5 `PassportBatchUpload/index.tsx`

**職責**: 批次上傳主組件

```typescript
interface PassportBatchUploadProps {
  onSuccess?: () => void
}

export function PassportBatchUpload({ onSuccess }: PassportBatchUploadProps) {
  const upload = usePassportUpload(onSuccess)

  return (
    <div className="space-y-4">
      {/* 拖放區域 */}
      <FileDropZone
        isDragging={upload.isDragging}
        onDragOver={upload.handleDragOver}
        onDrop={upload.handleDrop}
        onChange={upload.handleFileChange}
      />

      {/* 上傳預覽 */}
      {upload.files.length > 0 && (
        <UploadPreview
          files={upload.files}
          onRemove={upload.handleRemoveFile}
        />
      )}

      {/* 上傳按鈕 */}
      <Button
        onClick={upload.handleBatchUpload}
        disabled={upload.isUploading}
      >
        {upload.isUploading ? '上傳中...' : '開始上傳'}
      </Button>
    </div>
  )
}
```

**提取行數**: ~150 行
**減少主文件**: 150 行

---

### Phase 3: 重構主頁面

#### 3.1 新的 `page.tsx` 結構

```typescript
'use client'

import { useState } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { CustomerSearchDialog } from '@/components/customers/customer-search-dialog'
import { useCustomers } from '@/hooks/cloud-hooks'

// 本地組件
import { CustomerTable } from './components/CustomerTable'
import { CustomerAddDialog } from './components/CustomerAddDialog'
import { CustomerDetailDialog } from './components/CustomerDetailDialog'
import { CustomerVerifyDialog } from './components/CustomerVerifyDialog'
import { PassportBatchUpload } from './components/PassportBatchUpload'

// 本地 Hooks
import { useCustomerSearch } from './hooks/useCustomerSearch'
import { useCustomerVerify } from './hooks/useCustomerVerify'

export default function CustomersPage() {
  const { items: customers, create, update, delete: deleteCustomer } = useCustomers()

  // 搜尋功能
  const search = useCustomerSearch(customers)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // 新增對話框
  const [isAddOpen, setIsAddOpen] = useState(false)

  // 驗證對話框
  const verify = useCustomerVerify(update)

  // 詳情對話框
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  return (
    <>
      {/* 頁面標題 */}
      <ResponsiveHeader title="顧客管理">
        <div className="flex gap-2">
          <Button onClick={() => setIsSearchOpen(true)}>
            搜尋
          </Button>
          <Button onClick={() => setIsAddOpen(true)}>
            新增顧客
          </Button>
        </div>
      </ResponsiveHeader>

      {/* 主要內容 */}
      <div className="space-y-4">
        {/* 搜尋條件顯示 */}
        {search.hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span>目前篩選條件</span>
            <Button onClick={search.handleClearSearch}>清除</Button>
          </div>
        )}

        {/* 表格 */}
        <CustomerTable
          customers={search.filteredCustomers}
          onRowClick={verify.openDialog}
        />

        {/* 批次上傳區域 */}
        <PassportBatchUpload />
      </div>

      {/* 對話框們 */}
      <CustomerSearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={search.handleSearch}
        initialParams={search.searchParams}
      />

      <CustomerAddDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={create}
      />

      <CustomerVerifyDialog
        isOpen={verify.isOpen}
        customer={verify.customer}
        formData={verify.formData}
        onFormChange={verify.setFormData}
        onSave={verify.handleSave}
        onClose={verify.closeDialog}
      />

      {selectedCustomer && (
        <CustomerDetailDialog
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </>
  )
}
```

**最終行數**: ~150 行
**減少**: 1,960 行 (93%)

---

## 📈 重構效益

### 代碼品質改善

| 指標         | 改善前 | 改善後 | 改善    |
| ------------ | ------ | ------ | ------- |
| **行數**     | 2,110  | 150    | ↓ 93%   |
| **職責數量** | 8      | 1      | ↓ 87.5% |
| **狀態變數** | 20+    | 5      | ↓ 75%   |
| **函數數量** | 15+    | 3      | ↓ 80%   |
| **最大嵌套** | 5+     | 2      | ↓ 60%   |
| **可測試性** | 困難   | 容易   | ↑↑↑     |
| **可維護性** | 低     | 高     | ↑↑↑     |
| **複用性**   | 無     | 高     | ↑↑↑     |

### 開發體驗改善

- ✅ **更快的檔案載入**: 從 2,110 行 → 150 行
- ✅ **更快的 TypeScript 檢查**: 小文件編譯更快
- ✅ **更好的 IDE 支援**: 不會因文件過大而變慢
- ✅ **更容易理解**: 每個組件職責明確
- ✅ **更容易測試**: 可以單獨測試每個組件/Hook
- ✅ **更容易除錯**: 問題範圍縮小
- ✅ **更容易協作**: 不同功能可由不同人開發

---

## 🚀 執行計劃

### Week 1: Hook 提取

- [ ] Day 1: `useCustomerSearch.ts`
- [ ] Day 2: `useImageEditor.ts`
- [ ] Day 3: `usePassportUpload.ts`
- [ ] Day 4: `useOcrRecognition.ts`
- [ ] Day 5: `useCustomerVerify.ts`

### Week 2: 組件提取

- [ ] Day 1: `CustomerTable.tsx` + `tableColumns.tsx`
- [ ] Day 2: `CustomerAddDialog.tsx`
- [ ] Day 3: `CustomerDetailDialog.tsx`
- [ ] Day 4: `PassportBatchUpload/` (3個文件)
- [ ] Day 5: `CustomerVerifyDialog/` (3個文件)

### Week 3: 主頁面重構

- [ ] Day 1: 重構主頁面，整合所有組件
- [ ] Day 2: 測試所有功能
- [ ] Day 3: 修復 bug
- [ ] Day 4: 性能優化
- [ ] Day 5: 文檔更新

---

## ⚠️ 注意事項

### 必須保持的功能

1. ✅ 所有現有功能必須保持不變
2. ✅ 搜尋參數 localStorage 持久化
3. ✅ OCR 辨識功能
4. ✅ 圖片編輯（縮放、旋轉、翻轉、裁剪）
5. ✅ 批次護照上傳
6. ✅ PDF 轉圖片支援
7. ✅ 圖片壓縮（< 1MB）
8. ✅ 客戶自動比對

### 風險與緩解措施

| 風險         | 影響 | 緩解措施             |
| ------------ | ---- | -------------------- |
| 功能遺失     | 高   | 詳細測試清單         |
| 狀態管理錯誤 | 中   | 逐步重構，每步測試   |
| 性能下降     | 低   | 使用 React.memo 優化 |
| 型別錯誤     | 低   | TypeScript 嚴格模式  |

---

## ✅ 驗收標準

重構完成後必須滿足：

1. [ ] 主文件 < 200 行
2. [ ] 所有組件 < 300 行
3. [ ] 所有 Hook < 200 行
4. [ ] 無 `any` 類型使用
5. [ ] 所有現有功能正常運作
6. [ ] 通過所有測試
7. [ ] 通過 ESLint 檢查
8. [ ] 通過 TypeScript 類型檢查
9. [ ] 通過 `npm run audit:code-quality`

---

**建立日期**: 2025-12-10
**預計完成**: 2025-12-31
**負責人**: 開發團隊

---

_📝 此計劃將隨著重構進行持續更新_
