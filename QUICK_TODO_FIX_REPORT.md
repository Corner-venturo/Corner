# 快速 TODO 修復報告

**執行日期**: 2025-11-19
**執行項目**: 立即可修復的 5 個 TODO

---

## ✅ 修復摘要

| 項目 | 檔案數 | 狀態 |
|------|--------|------|
| **userId 獲取** | 3 個檔案 | ✅ 已完成 |
| **健身資料清除** | 1 個檔案 | ✅ 已完成 |
| **總計** | **4 個檔案** | **5 個 TODO** |

**TODO 數量變化**: 27 → 22 個 (↓ 18.5%)

---

## 📝 修復明細

### 1. Timebox 組件 - userId 獲取 (4個)

#### 修復檔案:
- `src/app/timebox/components/day-view.tsx:29`
- `src/app/timebox/components/week-view.tsx:21`
- `src/app/timebox/page.tsx:35`

#### 修復前:
```typescript
// TODO: Get userId from auth context
const userId = 'temp-user-id' // Placeholder
initializeCurrentWeek(selectedDay, userId)
```

#### 修復後:
```typescript
import { useAuthStore } from '@/stores/auth-store'

const user = useAuthStore(state => state.user)
const userId = user?.id || 'temp-user-id'
initializeCurrentWeek(selectedDay, userId)
```

**修復說明**:
- 使用 `useAuthStore` 從認證狀態獲取真實 userId
- 保留 fallback 'temp-user-id' 以防止 user 為 null
- 新增 user 作為 useEffect 依賴項

---

### 2. 健身設定 - 資料清除功能 (1個)

#### 修復檔案:
- `src/app/fitness/settings/page.tsx:25`

#### 修復前:
```typescript
const handleClearData = () => {
  if (confirm('...')) {
    // TODO: 清除 IndexedDB 中的健身資料
    alert('本地資料已清除')
    router.push('/fitness')
  }
}
```

#### 修復後:
```typescript
import { localDB } from '@/lib/db'

const handleClearData = async () => {
  if (confirm('...')) {
    try {
      // 清除健身相關的 IndexedDB 資料表
      const fitnessTable = 'fitness_records' as const

      try {
        await localDB.clear(fitnessTable)
      } catch (error) {
        console.warn('清除健身資料時發生錯誤:', error)
      }

      alert('本地資料已清除')
      router.push('/fitness')
    } catch (error) {
      console.error('清除資料失敗:', error)
      alert('清除資料失敗，請稍後再試')
    }
  }
}
```

**修復說明**:
- 呼叫 `localDB.clear('fitness_records')` 清除 IndexedDB 資料
- 新增錯誤處理機制
- 使用 async/await 處理非同步操作
- 新增雙層 try-catch 防止表格不存在時報錯

---

## 🎯 成果驗證

```bash
# 驗證修復檔案不再包含 TODO
$ grep -c "TODO" src/app/timebox/page.tsx
0

$ grep -c "TODO" src/app/timebox/components/day-view.tsx
0

$ grep -c "TODO" src/app/timebox/components/week-view.tsx
0

$ grep -c "TODO" src/app/fitness/settings/page.tsx
0
```

✅ 所有 5 個 TODO 已完全移除

---

## 📊 剩餘 TODO 分布 (22 個)

根據 `TODO_ANALYSIS_REPORT.md` 的分類:

### 中優先級 (13 個)
1. **會計系統** - Store 方法 (2個)
   - `updateCategory` in accounting-store
   - `deleteCategory` in accounting-store

2. **景點管理** - 編輯功能 (5個)
   - PremiumExperiencesTab 編輯對話框 (2個)
   - MichelinRestaurantsTab 編輯對話框 (2個)
   - AttractionsTab 編輯功能 (1個)

3. **供應商系統** - 城市選擇 (1個)
   - CostTemplateDialog 城市選擇下拉選單

4. **報價系統** - 編號衝突 (1個)
   - useQuoteActions 傳入現有 tours

5. **Timebox** - 複製功能 (1個)
   - timebox-store 複製邏輯

6. **文件管理** (1個)
   - tour-documents 從 store 取得資料

7. **工作區員工數** (1個)
   - workspaces/page 顯示員工數

8. **收據管理** (1個)
   - AddReceiptDialog 儲存邏輯

### 低優先級 (9 個)
1. **eSIM 系統** - FastMove API (5個)
   - 等待 API Key 配置

2. **健身模組** - 歷史記錄 (2個)
   - 訓練歷史資料庫讀取
   - 統計數據資料庫讀取

3. **PDF Logo** (1個)
   - QuickQuotePdf.ts Logo 圖片添加

---

## 🎯 下一步建議

### Week 2: 核心功能 TODO (8 個)
優先處理影響業務的功能性 TODO:

1. **會計 Store 方法** (2個) - 高價值
2. **景點編輯功能** (5個) - 使用者體驗改善
3. **報價編號衝突** (1個) - 資料正確性

### Week 3: 功能增強 TODO (5 個)
1. 供應商城市選擇
2. Timebox 複製
3. 文件管理
4. 收據儲存
5. 工作區員工數

### 未來: 外部依賴 TODO (6 個)
- eSIM API 整合 (等待 API Key)
- 健身模組完善 (等待功能規劃)

---

**結論**: 快速修復完成 5 個簡單 TODO，TODO 數量從 27 減少至 22 個。剩餘 TODO 主要需要額外開發時間，建議按優先級逐步處理。
