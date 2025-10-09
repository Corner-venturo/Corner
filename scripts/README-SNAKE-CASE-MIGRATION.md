# Snake Case 遷移工具包

**版本**: 1.0.0
**日期**: 2025-10-08
**目的**: 將整個系統從 camelCase 改為 snake_case

---

## 📋 執行前檢查清單

- [ ] 確認沒有重要的本地資料（IndexedDB 會清空）
- [ ] 已 commit 所有未提交的修改
- [ ] 建立新分支：`git checkout -b feature/snake-case-migration`
- [ ] 預留 2-3 個工作天

---

## 🎯 五步驟執行計畫

### Step 1: 修改資料庫 Schema（手動）

**檔案**: `src/lib/db/schemas.ts`

**修改內容**:
1. 升級版本號：`DB_VERSION = 7`
2. 表格名稱（4個）：
   ```typescript
   'paymentRequests' → 'payment_requests'
   'disbursementOrders' → 'disbursement_orders'
   'receiptOrders' → 'receipt_orders'
   'quoteItems' → 'quote_items'
   ```
3. 更新 `TABLES` 常數

**驗證**:
```bash
# 檢查語法
npm run type-check
```

**完成標記**: `[Step 1 完成]`

---

### Step 2: 轉換 TypeScript 型別定義（自動）

**執行**:
```bash
node scripts/convert-types-to-snake-case.js
```

**影響檔案**:
- `src/types/base.types.ts`
- `src/types/tour.types.ts`
- `src/types/order.types.ts`
- `src/types/quote.types.ts`
- `src/types/customer.types.ts`
- `src/types/finance.types.ts`
- `src/types/employee.types.ts`
- `src/types/common.types.ts`
- `src/types/template.ts`

**預期結果**:
```
✅ 完成：總共修改 XX 個欄位
```

**手動檢查**:
```bash
# 查看變更
git diff src/types/

# 確認沒有誤改
# 特別注意：enum 值、字串字面量、註解
```

**驗證**:
```bash
npm run type-check
# 預期：會有大量錯誤（正常，Step 4 會修正）
```

**完成標記**: `[Step 2 完成]`

---

### Step 3: 修改 Stores（手動）

**檔案**:
- `src/stores/index.ts` - 修改表格名稱
- `src/lib/persistent-store.ts` - 修改 TABLE_MAP
- `src/lib/offline/offline-manager.ts` - 修改 storeNames
- `src/lib/db/init-local-data.ts` - 修改 tables 陣列

**修改內容**: 已在 Step 1 完成（表格名稱統一改動）

**完成標記**: `[Step 3 完成]`

---

### Step 4: 全域替換屬性訪問（自動）

**先預覽**:
```bash
node scripts/replace-component-properties.js --dry-run
```

**檢查預覽結果**:
- 確認替換是否正確
- 注意是否有誤判

**執行實際替換**:
```bash
node scripts/replace-component-properties.js
```

**影響範圍**:
- `src/components/**/*.tsx` (~50 個檔案)
- `src/app/**/*.tsx` (~30 個檔案)
- `src/stores/**/*.ts` (~10 個檔案)
- `src/features/**/*.ts` (~20 個檔案)

**預期結果**:
```
✅ 完成：已修改 XX 個檔案
```

**驗證**:
```bash
npm run type-check
# 預期：錯誤數量應大幅減少
```

**完成標記**: `[Step 4 完成]`

---

### Step 5: 修正 TypeScript 錯誤（手動）

**執行**:
```bash
npm run type-check 2>&1 | tee typescript-errors.log
```

**錯誤分類**:

1. **屬性不存在** (最常見)
   ```
   Property 'tourName' does not exist on type 'Tour'
   ```
   **修正**: 改為 `tour_name`

2. **型別不匹配**
   ```
   Type '{ tourName: string }' is not assignable to type 'Tour'
   ```
   **修正**: 改為 `{ tour_name: string }`

3. **解構賦值錯誤**
   ```
   Property 'tourName' does not exist
   ```
   **修正**: `const { tourName }` → `const { tour_name }`

**建議流程**:
1. 一次處理 10-20 個錯誤
2. 修正後重新執行 `npm run type-check`
3. 重複直到沒有錯誤

**完成標記**: `[Step 5 完成]`

---

## ✅ 完成後測試

### 測試 1: 資料庫結構
```bash
# 1. 清除舊資料庫
開啟 DevTools → Application → IndexedDB → 刪除 VenturoLocalDB

# 2. 啟動專案
npm run dev

# 3. 檢查資料庫
開啟 DevTools → Application → IndexedDB → VenturoLocalDB
```

**驗證點**:
- [ ] 版本號為 7
- [ ] 表格名稱為 `payment_requests`, `disbursement_orders`, `receipt_orders`, `quote_items`
- [ ] 其他表格正常存在

### 測試 2: 建立資料
```typescript
// 在瀏覽器 Console 執行
const testTour = {
  tour_name: '測試團',
  start_date: '2025-01-01',
  end_date: '2025-01-07'
};

// 應該可以正常建立
```

### 測試 3: 核心功能
- [ ] 登入功能正常
- [ ] 旅遊團列表顯示正常
- [ ] 建立/編輯/刪除功能正常
- [ ] 訂單管理正常
- [ ] 報價單功能正常

---

## 🚨 遇到問題時

### 問題 1: 腳本執行失敗
```bash
# 檢查 Node.js 版本
node --version  # 需要 >= 14

# 安裝相依套件
npm install glob
```

### 問題 2: 替換錯誤太多
```bash
# 復原修改
git checkout src/

# 重新執行，先預覽
node scripts/replace-component-properties.js --dry-run
```

### 問題 3: TypeScript 錯誤太多無法處理
```bash
# 暫時關閉型別檢查
# tsconfig.json 加入：
"skipLibCheck": true

# 之後再逐步修正
```

---

## 📊 進度追蹤

```markdown
### Snake Case 遷移進度

- [x] Step 1: 修改資料庫 Schema (2025-10-08 已完成)
- [ ] Step 2: 轉換 TypeScript 型別
- [ ] Step 3: 修改 Stores
- [ ] Step 4: 全域替換屬性
- [ ] Step 5: 修正 TypeScript 錯誤
- [ ] 測試驗證

**預估完成時間**: 2-3 工作天
**實際開始時間**: ____
**實際完成時間**: ____
```

---

## 🎉 完成後

1. **Commit 修改**:
   ```bash
   git add .
   git commit -m "feat: 全面改用 snake_case 命名規範

   - 升級資料庫版本到 v7
   - 轉換所有 TypeScript 型別定義
   - 更新所有組件屬性訪問
   - 修正所有 TypeScript 錯誤

   Breaking Change: 所有欄位從 camelCase 改為 snake_case
   "
   ```

2. **建立 PR** (可選):
   ```bash
   git push origin feature/snake-case-migration
   # 在 GitHub 建立 Pull Request
   ```

3. **更新 MANUAL**:
   - [x] 已更新命名規範章節
   - [x] 已更新 Phase 規劃
   - [x] 已更新錯誤對照表

---

## 📞 需要協助？

如果遇到無法解決的問題：
1. 保存錯誤訊息截圖
2. 記錄執行到哪一步
3. 提供 `typescript-errors.log` 檔案
