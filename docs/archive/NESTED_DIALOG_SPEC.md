# 巢狀對話框 (Nested Dialog) 規範

> **最後更新**: 2026-01-05
> **狀態**: 強制執行

---

## 問題說明

當從一個對話框 (Dialog) 內部開啟另一個對話框時，會出現以下問題：

1. **遮罩疊加過黑**: 兩層 `bg-black/60` 遮罩疊加，總黑度達 84%
2. **底層對話框未被遮住**: z-index 設定不正確時，第一層對話框內容會「穿透」第二層遮罩
3. **視覺混亂**: 使用者分不清哪個對話框是當前焦點

---

## 解決方案

### 使用 `nested` Prop

當對話框是從另一個對話框內部開啟時，**必須**在 `DialogContent` 加上 `nested` prop：

```tsx
// 正確
<DialogContent nested className="...">
  {/* 巢狀對話框內容 */}
</DialogContent>

// 或明確傳入
<DialogContent nested={true} className="...">
```

### Z-Index 層級

| 元素 | 普通對話框 | 巢狀對話框 |
|------|-----------|-----------|
| 遮罩 (Overlay) | z-[9998] | z-[10001] |
| 內容 (Content) | z-[9999] | z-[10002] |
| 關閉按鈕 | z-[10000] | z-[10003] |

### 遮罩透明度

| 類型 | 透明度 | 說明 |
|------|--------|------|
| 普通對話框 | `bg-black/60` | 60% 黑色 + 模糊效果 |
| 巢狀對話框 | `bg-black/40` | 40% 黑色，無模糊（避免疊加過黑） |

疊加效果：60% + (40% × 40%) ≈ 76%（比原本的 84% 更接近單層效果）

---

## 開發檢查清單

### 建立新對話框時

- [ ] 這個對話框會從其他對話框內部開啟嗎？
- [ ] 如果是，`DialogContent` 是否有 `nested` prop？
- [ ] 如果對話框可能在兩種情況下使用（獨立或巢狀），是否將 `nested` 設為可配置 prop？

### 常見需要 `nested` 的場景

1. **團號詳情頁** (`TourDetailDialog`) 內開啟的所有對話框
2. **訂單詳情** 內開啟的收款/請款對話框
3. **任何「編輯」或「新增」對話框** 內開啟的子對話框
4. **確認對話框** 從其他對話框觸發時

---

## 程式碼範例

### 1. 永遠是巢狀的對話框

```tsx
// 這個對話框只會從 TourDetailDialog 內開啟
export function TourCloseDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent nested> {/* 永遠加 nested */}
        <DialogHeader>
          <DialogTitle>結團確認</DialogTitle>
        </DialogHeader>
        {/* ... */}
      </DialogContent>
    </Dialog>
  )
}
```

### 2. 可能巢狀也可能獨立的對話框

```tsx
interface AddReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nested?: boolean // 讓呼叫端決定
}

export function AddReceiptDialog({ open, onOpenChange, nested = false }: AddReceiptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent nested={nested}>
        {/* ... */}
      </DialogContent>
    </Dialog>
  )
}

// 使用方式
// 從頁面開啟（非巢狀）
<AddReceiptDialog open={open} onOpenChange={setOpen} />

// 從另一個對話框內開啟（巢狀）
<AddReceiptDialog open={open} onOpenChange={setOpen} nested />
```

### 3. 父對話框內有多個子對話框

```tsx
export function TourDetailDialog() {
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  return (
    <Dialog>
      <DialogContent>
        {/* 父對話框內容 */}

        {/* 子對話框 - 都需要 nested */}
        <TourCloseDialog
          open={closeDialogOpen}
          onOpenChange={setCloseDialogOpen}
          // TourCloseDialog 內部的 DialogContent 應該有 nested
        />
        <TourEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          // TourEditDialog 內部的 DialogContent 應該有 nested
        />
      </DialogContent>
    </Dialog>
  )
}
```

---

## 已知需要修正的檔案

### 已正確實作
- [x] `src/features/finance/payments/components/AddReceiptDialog.tsx`
- [x] `src/features/finance/requests/components/AddRequestDialog.tsx`

### 需要修正（從 TourDetailDialog 開啟）
- [ ] `src/components/tours/tour-close-dialog.tsx`
- [ ] `src/components/tours/tour-edit-dialog.tsx`
- [ ] `src/components/tours/components/AddPaymentDialog.tsx`
- [ ] `src/components/tours/components/InvoiceDialog.tsx`
- [ ] `src/features/tours/components/TourConfirmationDialog.tsx`

### 需要檢查
- [ ] `src/app/(main)/finance/payments/components/CreateReceiptDialog.tsx`
- [ ] `src/app/(main)/finance/payments/components/BatchConfirmReceiptDialog.tsx`

---

## 測試方式

1. 開啟一個父對話框
2. 從父對話框內開啟子對話框
3. 檢查：
   - 遮罩是否過黑？（應該是適度的暗化）
   - 父對話框是否被遮罩覆蓋？（應該被暗化）
   - 子對話框是否在最上層？（應該是）
   - 點擊子對話框外部是否正確處理？（通常應防止關閉）

---

## 相關檔案

- `src/components/ui/dialog.tsx` - Dialog 組件，包含 `nested` prop 實作
- `src/components/dialog/managed-dialog.tsx` - 有狀態管理的 Dialog wrapper
