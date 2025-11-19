# TODO 註解分析與處理建議

**專案**: Venturo 旅遊團管理系統  
**分析日期**: 2025-11-19  
**TODO 總數**: 27 個

---

## 📊 分類統計

| 類別 | 數量 | 優先級 |
|------|------|--------|
| 功能未實作 | 15 個 | 中 |
| 需要使用者輸入 | 3 個 | 低 |
| 需要外部 API | 4 個 | 低 |
| 架構改進 | 3 個 | 中 |
| 文件/說明 | 2 個 | 低 |

---

## 🔴 高優先級 TODO (0 個)

無高優先級 TODO - 所有 TODO 都是功能增強或待實作項目，不影響現有功能。

---

## 🟡 中優先級 TODO (18 個)

### 1. 認證系統 - userId 獲取 (4 個)
**位置**:
- `src/app/timebox/components/day-view.tsx:29`
- `src/app/timebox/components/week-view.tsx:21`
- `src/app/timebox/page.tsx:35`

**TODO 內容**: `// TODO: Get userId from auth context`

**建議處理**:
```typescript
// 應該從 useAuthStore 獲取 userId
import { useAuthStore } from '@/stores/auth-store'

const user = useAuthStore(state => state.user)
const userId = user?.id || ''
```

**狀態**: ✅ 可立即修復

---

### 2. 會計系統 - Store 方法缺失 (2 個)
**位置**:
- `src/features/accounting/services/accounting.service.ts:132`
- `src/features/accounting/services/accounting.service.ts:136`

**TODO 內容**:
- `// TODO: Implement updateCategory in accounting-store`
- `// TODO: Implement deleteCategory in accounting-store`

**建議處理**: 在 `accounting-store.ts` 中新增這兩個方法

**狀態**: ⚠️ 需要實作 Store 方法

---

### 3. 景點管理 - 編輯功能 (5 個)
**位置**:
- `src/features/attractions/components/tabs/PremiumExperiencesTab.tsx:346, 356`
- `src/features/attractions/components/tabs/MichelinRestaurantsTab.tsx:260, 270`
- `src/features/attractions/components/tabs/AttractionsTab.tsx:103`

**TODO 內容**: `// TODO: 打開編輯對話框` / `// TODO: Implement edit functionality`

**建議處理**: 實作編輯對話框組件和處理邏輯

**狀態**: ⚠️ 功能增強項目

---

### 4. 供應商系統 - 城市選擇 (1 個)
**位置**: `src/features/suppliers/components/CostTemplateDialog.tsx:124`

**TODO 內容**: `// TODO: 讓用戶選擇城市`

**建議處理**: 新增城市選擇下拉選單

**狀態**: ⚠️ UX 改進項目

---

### 5. 報價系統 - 編號衝突處理 (1 個)
**位置**: `src/features/quotes/hooks/useQuoteActions.ts:335`

**TODO 內容**: `// TODO: 傳入現有的 tours 來避免編號衝突`

**建議處理**: 修改函數簽名，傳入現有 tours 列表

**狀態**: ⚠️ 邏輯改進

---

### 6. Timebox - 複製功能 (1 個)
**位置**: `src/stores/timebox-store.ts:297`

**TODO 內容**: `// TODO: Implement copy logic`

**建議處理**: 實作複製邏輯，複製選定的時間區塊

**狀態**: ⚠️ 功能增強

---

### 7. 文件管理 (1 個)
**位置**: `src/components/tours/tour-documents.tsx:34`

**TODO 內容**: `// TODO: 實作文件管理功能後，從 store 取得實際的文件資料`

**狀態**: ⚠️ 等待文件管理功能實作

---

### 8. 工作區員工數 (1 個)
**位置**: `src/app/settings/workspaces/page.tsx:34`

**TODO 內容**: `// TODO: 如果需要顯示員工數，需在資料庫新增 workspace_id 欄位`

**建議處理**: 
1. 在 employees 表格加入 workspace_id 欄位（可能已存在）
2. 使用 SQL COUNT 查詢

**狀態**: ⚠️ 需確認資料庫欄位

---

### 9. 收據管理 (1 個)
**位置**: `src/features/finance/payments/components/AddReceiptDialog.tsx:81`

**TODO 內容**: `// TODO: 實作儲存邏輯`

**狀態**: ⚠️ 功能待實作

---

## 🟢 低優先級 TODO (9 個)

### 1. eSIM 系統 - FastMove API 整合 (5 個)
**位置**:
- `src/features/esims/components/EsimCreateDialog.tsx:167, 300, 316`
- `src/features/esims/components/EsimForm.tsx:35, 42, 108`

**TODO 內容**: 
- `// TODO: 等 FastMove API Key 配置後，取消註解下面這行`
- `// TODO: 調用 FastMove API 下單`
- `// TODO: 實作 orders hook`

**狀態**: ⏸️ 等待外部 API Key

---

### 2. 健身模組 - 資料清除 (1 個)
**位置**: `src/app/fitness/settings/page.tsx:25`

**TODO 內容**: `// TODO: 清除 IndexedDB 中的健身資料`

**建議處理**:
```typescript
await indexedDB.clear('fitness_records')
await indexedDB.clear('fitness_workouts')
```

**狀態**: ✅ 可立即修復

---

### 3. 健身模組 - 歷史記錄 (2 個)
**位置**:
- `src/app/fitness/history/page.tsx:7`
- `src/app/fitness/stats/page.tsx:7`

**TODO 內容**: 
- `// TODO: 從資料庫讀取訓練歷史`
- `// TODO: 從資料庫讀取統計數據`

**狀態**: ⏸️ 功能模組待完善

---

### 4. PDF Logo (1 個)
**位置**: `src/features/quotes/utils/QuickQuotePdf.ts:13`

**TODO 內容**: `// TODO: 如果有 Logo 圖片，可以用 doc.addImage() 添加`

**狀態**: 💡 功能增強建議

---

## 📋 處理建議

### 立即可修復 (5 個)
可以立即處理的 TODO，不需要額外開發：

1. ✅ **認證系統 userId** (4個) - 使用 `useAuthStore`
2. ✅ **健身資料清除** (1個) - 呼叫 IndexedDB clear

### 需要實作功能 (13 個)
需要額外開發時間：

1. ⚠️ 會計 Store 方法 (2個)
2. ⚠️ 景點編輯功能 (5個)
3. ⚠️ 供應商城市選擇 (1個)
4. ⚠️ 報價編號衝突 (1個)
5. ⚠️ Timebox 複製 (1個)
6. ⚠️ 文件管理 (1個)
7. ⚠️ 收據儲存 (1個)
8. ⚠️ 薪資請款 (1個)

### 等待外部條件 (6 個)
需要等待外部資源或 API：

1. ⏸️ eSIM FastMove API (5個)
2. ⏸️ 健身模組完善 (2個)

### 可選增強 (2 個)
非必要的功能增強：

1. 💡 PDF Logo (1個)
2. 💡 工作區員工數 (1個)

---

## 🎯 建議執行優先順序

### Week 1: 快速修復 (5 個)
處理所有「立即可修復」的 TODO：
- [ ] 修復 4 個 userId 獲取
- [ ] 實作健身資料清除

### Week 2-3: 核心功能 (8 個)
處理影響核心業務的 TODO：
- [ ] 會計 Store 方法 (2個)
- [ ] 景點編輯功能 (5個)
- [ ] 報價編號衝突 (1個)

### Week 4: 功能增強 (5 個)
處理次要功能：
- [ ] 供應商城市選擇
- [ ] Timebox 複製
- [ ] 文件管理
- [ ] 收據儲存
- [ ] 薪資請款

### 未來: 外部依賴 (6 個)
等待條件成熟後處理：
- [ ] eSIM API 整合 (5個)
- [ ] 健身模組完善 (2個)

---

## ✅ 清理策略

### 選項 1: 轉為 GitHub Issues
將所有 TODO 轉為 GitHub Issues，並移除程式碼註解：

```bash
# 為每個 TODO 建立 Issue
gh issue create --title "實作景點編輯功能" --body "..."
gh issue create --title "整合 FastMove API" --body "..."
# ... 等等
```

### 選項 2: 保留並分類
在程式碼中保留，但加上分類標籤：

```typescript
// TODO[P1]: 高優先級 - 需立即處理
// TODO[P2]: 中優先級 - 功能增強
// TODO[P3]: 低優先級 - 可選項目
// TODO[BLOCKED]: 等待外部條件
```

### 選項 3: 立即處理簡單項目
處理 5 個「立即可修復」的 TODO，將數量從 27 降至 22。

---

## 📊 統計總結

| 狀態 | 數量 | 百分比 |
|------|------|--------|
| ✅ 立即可修復 | 5 | 18.5% |
| ⚠️ 需要實作 | 13 | 48.1% |
| ⏸️ 等待外部 | 7 | 25.9% |
| 💡 可選增強 | 2 | 7.4% |
| **總計** | **27** | **100%** |

---

**結論**: 27 個 TODO 中，只有 5 個可立即修復。其餘需要額外開發時間或等待外部條件。建議優先處理 5 個簡單修復，然後根據業務需求決定其他 TODO 的處理順序。
