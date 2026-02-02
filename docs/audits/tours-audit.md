# 開團模組 (Tours) 審計報告

> 審計日期：2026-02-02
> 審計人員：Logan AI

---

## 📁 檔案結構

```
src/features/tours/
├── components/
│   ├── ToursPage.tsx              # 主頁面 (15,900 bytes)
│   ├── TourActionButtons.tsx      # 列表操作按鈕 (12,067 bytes)
│   ├── TourDetailDialog.tsx       # 旅遊團詳情彈窗
│   ├── TourConfirmationWizard.tsx # 確認出團精靈
│   ├── TourClosingDialog.tsx      # 結團對話框
│   ├── LinkDocumentsToTourDialog.tsx # 連結文件 (28,395 bytes)
│   └── ...
├── hooks/
└── services/
```

---

## ✅ 通過的檢查

### 列表功能
- [x] 旅遊團列表顯示正常
- [x] 搜尋篩選功能
- [x] 狀態頁籤切換（全部/提案/進行中/已結案/已封存）
- [x] 點擊整列開啟詳情

### 操作按鈕
- [x] 編輯按鈕 → TourEditDialog
- [x] 頻道按鈕 → 建立工作空間頻道
- [x] 報價/行程按鈕 → LinkDocumentsToTourDialog
- [x] 設計按鈕 → 跳轉到 /brochure
- [x] 合約按鈕 → ContractDialog
- [x] 需求按鈕 → TourRequirementsDialog
- [x] 團控按鈕 → TourControlDialogWrapper
- [x] 封存/解封按鈕
- [x] 結案按鈕（僅「進行中」狀態顯示）
- [x] 刪除按鈕

### 詳情頁籤
- [x] 團員名單 (OrderMembersExpandable)
- [x] 訂單管理 (TourOrders)
- [x] 需求總覽 (TourRequirementsTab)
- [x] 團確單 (TourConfirmationSheet)
- [x] 報到 (TourCheckin)
- [x] 設計 (TourDesignsTab)
- [x] 檔案 (TourFilesTab)
- [x] 總覽 (TourOverview)

---

## 🟡 中等問題（影響體驗）

### 1. TourDetailDialog 元件過大
- **檔案**：`src/components/tours/TourDetailDialog.tsx`
- **問題**：700+ 行程式碼，包含過多狀態和子對話框管理
- **影響**：維護困難，載入效能可能受影響
- **建議**：
  - 將各頁籤抽取為獨立組件（已部分完成）
  - 將子對話框狀態管理抽取到 hook
  - 考慮使用 URL 參數管理頁籤狀態

### 2. Dialog 層級管理複雜
- **問題**：主 Dialog (level=1) + 多個子 Dialog (level=2)，部分還有第三層
- **影響**：遮罩層疊加、焦點管理可能混亂
- **現狀**：已使用 level 系統處理，基本正常
- **建議**：考慮使用路由而非巢狀 Dialog

### 3. PNR 相關功能分散
- **位置**：TourDetailDialog, TourPnrToolDialog, PnrMatchDialog
- **問題**：PNR 開票期限、配對、狀態檢查邏輯分散
- **建議**：統一到 useTourPnr hook

---

## 🟢 輕微問題（可優化）

### 1. 未使用的 import
```typescript
// TourDetailDialog.tsx 中的 isCreatingChannel 狀態設定但似乎未充分使用
const [isCreatingChannel, setIsCreatingChannel] = useState(false)
```

### 2. 重複的 supabase 查詢
- **位置**：TourDetailDialog 中多處直接 import supabase client
- **建議**：統一使用 data hooks

### 3. 硬編碼的頁籤定義
```typescript
const tabs = [
  { value: 'members', label: '團員名單' },
  // ... 8 個頁籤
]
```
- **建議**：可考慮動態載入頁籤配置

### 4. 提案與旅遊團混合顯示
- **現狀**：「全部」頁籤將提案轉換為 Tour 格式顯示
- **實作**：使用 `__isProposal` 和 `__originalProposal` 標記
- **風險**：型別安全性較弱，但功能正常

---

## 📊 程式碼品質

| 指標 | 狀態 | 說明 |
|------|------|------|
| TypeScript 嚴格模式 | ✅ | 型別定義完整 |
| 動態載入 | ✅ | 大型組件使用 dynamic import |
| 錯誤處理 | ⚠️ | 部分 try-catch 缺少使用者反饋 |
| 載入狀態 | ✅ | 有 loading 顯示 |
| 響應式設計 | ✅ | Dialog 尺寸自適應 |

---

## 🔄 與其他模組的關聯

| 關聯模組 | 關聯方式 | 狀態 |
|---------|---------|------|
| 報價單 (quotes) | tour.quote_id | ✅ 正常 |
| 行程表 (itineraries) | tour.itinerary_id | ✅ 正常 |
| 訂單 (orders) | order.tour_id | ✅ 正常 |
| 提案 (proposals) | proposal → tour 轉換 | ✅ 正常 |
| 確認單 | TourConfirmationSheet | ✅ 正常 |
| Online | syncTripToOnline | 待驗證 |

---

## 💡 改進建議優先級

1. **高**：將 TourDetailDialog 的子對話框狀態抽取到 hook
2. **中**：統一 PNR 相關邏輯到專用 hook
3. **低**：將頁籤配置外部化
4. **低**：清理未使用的狀態變數

---

## 📝 審計結論

開團模組整體功能完整，核心流程正常運作。主要問題是 TourDetailDialog 過於龐大，但這是歷史遺留問題，目前不影響功能。建議在未來重構時逐步拆分。

**審計等級：🟡 良好（有改進空間）**
