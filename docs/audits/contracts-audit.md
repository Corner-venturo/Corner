# 合約管理模組審計報告

**審計日期**: 2025-01-26
**審計範圍**: `src/app/(main)/contracts/`, `src/components/contracts/`
**審計人**: Claude (AI Assistant)

---

## 📋 模組概覽

合約管理模組提供以下功能：
- 從旅遊團建立合約
- 合約範本選擇（國內/國外/個別國外）
- 合約內容編輯與儲存
- 旅客簽約管理
- 合約列印
- 信封標籤列印

---

## 🔴 嚴重問題

### 1. `handlePrint` 中缺少 XSS 防護

**檔案**: `useContractForm.ts` (第 310-348 行)

**問題**: 列印功能直接將 `contractData` 注入範本，沒有進行 HTML 轉義或消毒。

```typescript
// 替換所有變數
Object.entries(contractData).forEach(([key, value]) => {
  const regex = new RegExp(`{{${key}}}`, 'g')
  template = template.replace(regex, value || '')  // ⚠️ 沒有轉義！
})
```

**風險**: 攻擊者可以在表單欄位中注入惡意 JavaScript 代碼，例如：
```
<script>alert('XSS')</script>
```

**建議修復**:
```typescript
// 使用與 ContractViewDialog 相同的消毒邏輯
const safeValue = String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')
template = template.replace(regex, safeValue)
```

**對比**: `ContractViewDialog.tsx` 中的查看功能已經有正確的 XSS 防護（使用 DOMPurify + HTML 轉義）。

---

### 2. 類型定義不一致

**檔案**: 多處

**問題**: `ContractData` 介面在三個地方定義，但內容不完全相同：

| 位置 | 欄位數 | 缺少的欄位 |
|------|--------|-----------|
| `contract-dialog/types.ts` | 23 | - |
| `lib/contract-utils.ts` | 23 | - |
| `useContractForm.ts` | 使用 Partial | - |

兩處定義是重複的，應該合併為單一來源。

**建議**: 刪除 `contract-dialog/types.ts` 中的 `ContractData` 定義，統一從 `lib/contract-utils.ts` import。

---

## 🟠 中等問題

### 3. 合約範本映射不一致

**檔案**: 
- `ContractViewDialog.tsx` (第 55-59 行)
- `useContractForm.ts` (第 304-308 行)

**問題**: 兩處的範本映射使用不同的檔案名稱：

```typescript
// ContractViewDialog.tsx
const templateMap = {
  domestic: 'domestic.html',
  international: 'international.html',
  individual_international: 'individual_international_full.html',  // 使用 _full
}

// useContractForm.ts
const templateMap: Record<string, string> = {
  domestic: 'domestic.html',
  international: 'international.html',
  individual_international: 'individual_international.html',  // 沒有 _full
}
```

**風險**: 查看和列印功能使用不同的範本檔案，可能造成內容不一致。

**建議**: 統一使用同一個範本，或將映射提取為共用常數。

---

### 4. 缺少錯誤邊界處理

**檔案**: `ContractDialog.tsx`

**問題**: Dialog 組件沒有 Error Boundary，如果子組件拋出錯誤，整個對話框會崩潰。

**建議**: 添加 ErrorBoundary 包裝：
```tsx
<ErrorBoundary fallback={<ContractErrorFallback />}>
  <ContractFormFields ... />
</ErrorBoundary>
```

---

### 5. useEffect 依賴項過於寬鬆

**檔案**: `useContractForm.ts` (第 112-218 行)

**問題**: 初始化合約資料的 useEffect 依賴項使用了 `tour.id` 而非完整的 tour 物件，但內部使用了 `tour` 的多個屬性。

```typescript
useEffect(() => {
  // ... 使用 tour.contract_template, tour.contract_content, etc.
}, [isOpen, mode, tour.id, itinerary?.id, linkedQuote?.id])  // 只依賴 tour.id
```

**風險**: 如果 tour 的其他屬性變更但 id 不變，effect 不會重新執行。

**建議**: 考慮使用 `tour` 作為依賴項，或明確列出所有使用的屬性。

---

### 6. 列印視窗可能被阻擋

**檔案**: 
- `ContractViewDialog.tsx` (第 80-102 行)
- `useContractForm.ts` (第 310-350 行)
- `EnvelopeDialog.tsx` (第 90-160 行)

**問題**: 三處列印功能都使用 `window.open()`，但沒有統一的彈出視窗阻擋處理機制。

**建議**: 創建共用的 `printContract` 工具函數，統一處理彈出視窗阻擋和錯誤。

---

## 🟡 輕微問題

### 7. 硬編碼的公司資訊

**檔案**: `EnvelopeDialog.tsx` (第 53-54 行)

```typescript
const senderAddress = '台北市大同區重慶北路一段67號8樓之2'
const senderCompany = '角落旅行社'
```

**建議**: 移至環境變數或組織設定中。

---

### 8. 缺少載入狀態的骨架屏

**檔案**: `ContractDialog.tsx`

**問題**: 載入訂單時只顯示 Loader2 圖標，沒有骨架屏（Skeleton）。

```tsx
{ordersLoading ? (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="w-5 h-5 animate-spin text-morandi-secondary" />
  </div>
) : ...}
```

**建議**: 使用 Skeleton 組件提供更好的載入體驗。

---

### 9. 類型斷言過多

**檔案**: `ContractDialog.tsx` (第 276-278 行)

```typescript
const memberData = member as unknown as { chinese_name?: string; passport_name?: string; id_number?: string }
```

**問題**: 使用 `as unknown as` 是不安全的類型斷言。

**建議**: 修正 `ContractMember` 類型定義，避免類型斷言。

---

### 10. 缺少合約版本控制

**問題**: 合約修改後沒有歷史記錄，無法追蹤變更。

**建議**: 
- 添加 `contract_version` 欄位
- 保存合約變更歷史到 `contract_history` 表

---

### 11. 表單驗證不完整

**檔案**: `ContractFormFields.tsx`

**問題**: 表單欄位沒有驗證規則（如身分證格式、電話格式）。

**建議**: 添加驗證邏輯：
```typescript
// 身分證驗證
const isValidTWID = (id: string) => /^[A-Z][12]\d{8}$/.test(id)
```

---

### 12. 日期時間處理可改進

**檔案**: `ContractFormFields.tsx` (第 107-134 行)

**問題**: 將 datetime-local 分解為 5 個欄位的邏輯過於複雜。

**建議**: 考慮直接在合約資料中使用 ISO 8601 格式，在範本渲染時再格式化。

---

## ✅ 正面發現

1. **ContractViewDialog.tsx** 中的 XSS 防護做得很好，使用了 DOMPurify 和 HTML 轉義
2. 全形數字自動轉半形的處理很貼心
3. 合約範本使用政府定型化契約格式，符合法規要求
4. 成員選擇支援多選和批次處理
5. 從報價單/訂單自動帶入資料的邏輯完整

---

## 📊 問題統計

| 嚴重程度 | 數量 |
|---------|------|
| 🔴 嚴重 | 2 |
| 🟠 中等 | 4 |
| 🟡 輕微 | 6 |
| **總計** | **12** |

---

## 🎯 優先修復建議

1. **立即修復**: `useContractForm.ts` 中的 XSS 漏洞
2. **短期**: 統一合約範本映射
3. **短期**: 合併重複的類型定義
4. **中期**: 添加合約版本控制
5. **長期**: 添加表單驗證和 Error Boundary

---

## 📝 附錄：檔案清單

| 檔案 | 用途 | 行數 |
|------|------|------|
| `contracts/page.tsx` | 合約列表頁面 | ~210 |
| `ContractDialog.tsx` (重導出) | 向後相容的重導出 | ~3 |
| `ContractViewDialog.tsx` | 查看合約對話框 | ~130 |
| `SelectTourDialog.tsx` | 選擇團建立合約 | ~90 |
| `EnvelopeDialog.tsx` | 信封列印對話框 | ~230 |
| `contract-dialog/ContractDialog.tsx` | 合約編輯對話框 | ~350 |
| `contract-dialog/ContractFormFields.tsx` | 合約表單欄位 | ~200 |
| `contract-dialog/useContractForm.ts` | 合約表單邏輯 | ~360 |
| `contract-dialog/types.ts` | 類型定義 | ~60 |
| `contract-dialog/index.ts` | 導出 | ~2 |
| `lib/contract-utils.ts` | 合約工具函數 | ~200 |
