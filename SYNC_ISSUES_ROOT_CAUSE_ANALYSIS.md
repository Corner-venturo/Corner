# 同步問題根本原因分析報告

**日期**: 2025-11-20
**問題**: 最近 2-3 天多個頁面出現同步失敗
**狀態**: 🔍 已找到根本原因

---

## 📊 問題時間軸

### 最近 3 天的重大變更

```
2025-11-19 (今天)
├─ cbae43c - feat: 優化日曆和輸入欄位 UI
├─ bf198e8 - feat: 完整重構建立頻道功能與修正多項問題
├─ c071bf7 - fix: add missing audit fields (❌ 問題源頭 #1)
└─ 2fd73fd - feat: 建立完整的資料庫 Migration 自動化工具

2025-11-18
├─ b0d8f01 - fix: 修正 syncQueue 表格名稱 (❌ 問題源頭 #2)
└─ 9f2b392 - feat: 完整會計傳票系統與側邊欄 UI 優化

2025-11-17
└─ c80c21e - refactor: TypeScript 優化 (42.7% 改善)
```

---

## 🔥 根本原因分析

### 問題 1: 大量新增 audit fields（created_by, updated_by）

**影響範圍**: 14+ 個資料表

**Migration**: `_applied_20251119080200_add_created_updated_by_to_all_tables.sql`

**問題**:

1. **前端 TypeScript 定義沒有同步更新** → 型別不一致
2. **IndexedDB schema 沒有更新** → 本地快取欄位缺失
3. **Create/Update 操作缺少必填欄位** → Supabase 插入失敗

**受影響的表格**:

- ✅ vouchers
- ✅ companies
- ✅ confirmations
- ✅ esims
- ✅ pnrs
- ✅ quotes
- ✅ quote_versions
- ✅ receipts
- ✅ suppliers
- ✅ supplier_service_areas
- ✅ cost_templates
- ✅ visas
- ✅ notes
- ❌ **payment_requests** (還有其他問題)

---

### 問題 2: payment_requests 欄位混亂

**同時存在兩個欄位**:

- ❌ `notes` (舊欄位，TypeScript 定義)
- ❌ `note` (新欄位，資料庫)

**時間軸**:

1. 舊版 TypeScript: `notes?: string | null`
2. 新 Migration (20251119171000): 新增 `note` 欄位
3. **資料庫同時有兩個欄位** → Schema cache 混亂
4. 前端用 `note`，但 TypeScript 定義是 `notes` → 型別錯誤

**錯誤訊息**:

```
Could not find the 'note' column of 'payment_requests' in the schema cache
```

**已修復**:

- ✅ Migration (20251119172000): 刪除 `notes` 欄位
- ✅ TypeScript: 改為 `note?: string | null`

---

### 問題 3: syncQueue 表格名稱不一致

**Migration**: `b0d8f01`

**問題**:

- 程式碼使用: `'syncqueue'` (小寫)
- Schema 定義: `'syncQueue'` (駝峰)

**影響**:

- 所有背景同步的**刪除操作失敗**
- 離線資料無法正確標記為已同步

**已修復**:

- ✅ 統一使用 `TABLES.SYNC_QUEUE` 常數

---

## 🎯 為什麼最近變不穩定？

### 優化帶來的副作用

#### 1. **過度積極的資料庫標準化**

```
動機: 讓所有表格符合 BaseEntity 標準
行動: 批量新增 created_by, updated_by 欄位
結果: 14+ 個表格同時變更，但沒有對應的前端更新
```

**教訓**: 資料庫 schema 變更必須同步更新：

- TypeScript 型別定義
- IndexedDB schema
- Store create/update 邏輯
- Migration 測試

---

#### 2. **Migration 檔案命名混亂**

```
supabase/migrations/
├─ _applied_*.sql   (已執行，改名保存)
├─ _skip_*.sql      (跳過不執行)
├─ _failed_*.sql    (執行失敗)
└─ YYYYMMDDHHMMSS_*.sql (待執行)
```

**問題**:

- 沒有自動化工具追蹤哪些已執行
- 手動改名容易遺漏
- 無法回滾到穩定版本

**已建立工具**:

- ✅ `db-migrate.js` - 自動化 migration 執行
- ✅ `check-all-tables-schema.js` - 檢查欄位一致性

---

#### 3. **欄位命名不一致**

| 表格           | TypeScript | 資料庫 | 狀態               |
| -------------- | ---------- | ------ | ------------------ |
| PaymentRequest | `notes`    | `note` | ❌ 不一致 → 已修復 |
| QuoteItem      | `note`     | `note` | ✅ 一致            |
| Visa           | `note`     | `note` | ✅ 一致            |
| Company        | `note`     | `note` | ✅ 一致            |

**原因**: 歷史遺留 + 沒有統一規範

---

## 🔧 已執行的修復

### 立即修復（今天）

1. ✅ 刪除 `payment_requests.notes` 欄位
2. ✅ 更新 TypeScript: `notes` → `note`
3. ✅ 新增 `note`, `order_id`, `order_number`, `budget_warning` 欄位

### Migrations 執行記錄

```sql
-- 20251119171000: 新增缺失欄位
ALTER TABLE payment_requests ADD COLUMN note text;
ALTER TABLE payment_requests ADD COLUMN order_id text;
ALTER TABLE payment_requests ADD COLUMN order_number text;
ALTER TABLE payment_requests ADD COLUMN budget_warning boolean;

-- 20251119172000: 修復欄位重複
ALTER TABLE payment_requests DROP COLUMN notes;
```

---

## ⚠️ 還需要檢查的問題

### 1. 所有表格的 created_by/updated_by

**檢查清單**:

- [ ] TypeScript 型別是否都有 `created_by`, `updated_by`？
- [ ] Store 的 `create()` 是否自動填入 `created_by`？
- [ ] Store 的 `update()` 是否自動填入 `updated_by`？
- [ ] IndexedDB schema 是否包含這些欄位？

**建議**: 執行全面檢查

```bash
node check-all-tables-schema.js
```

---

### 2. 其他可能的欄位不一致

**需要檢查**:

- `TourRefund.notes` (TypeScript) vs 資料庫？
- `QuickQuoteItem.notes` (TypeScript) vs 資料庫？
- 其他 10+ 個有 `note/notes` 的 interface

**工具**: 已建立檢查腳本（見下方）

---

## 📋 建議的修復步驟

### Step 1: 全面檢查欄位一致性

```bash
# 1. 檢查所有表格的 schema
node check-all-tables-schema.js > schema-report.txt

# 2. 比對 TypeScript 定義
grep -r "export interface" src/stores/types.ts | wc -l

# 3. 檢查 IndexedDB schema
grep -A 10 "name: '" src/lib/db/schemas.ts
```

---

### Step 2: 修復 created_by/updated_by

**方案 A: 前端自動填入**（推薦）

```typescript
// src/stores/core/create-store-new.ts
async create(data) {
  const { useAuthStore } = await import('@/stores/auth-store')
  const userId = useAuthStore.getState().user?.id

  const fullData = {
    ...data,
    created_by: userId,
    updated_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return await this.adapter.insert(fullData)
}
```

**方案 B: 資料庫 Trigger**（更可靠）

```sql
-- 自動填入 created_by (從 auth.uid())
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 套用到所有表格
CREATE TRIGGER set_created_by_trigger
BEFORE INSERT ON payment_requests
FOR EACH ROW EXECUTE FUNCTION set_created_by();
```

---

### Step 3: 建立自動化測試

```typescript
// tests/schema-consistency.test.ts
describe('Schema Consistency', () => {
  test('所有 TypeScript interface 欄位都存在於資料庫', async () => {
    const supabaseSchema = await fetchSupabaseSchema()
    const typescriptInterfaces = parseTypescriptTypes()

    typescriptInterfaces.forEach(iface => {
      const dbTable = supabaseSchema[iface.tableName]

      iface.fields.forEach(field => {
        expect(dbTable.columns).toContain(field.name)
      })
    })
  })
})
```

---

## 🎓 經驗教訓

### 1. Schema 變更必須是原子操作

**錯誤做法**:

```
Day 1: 修改資料庫 schema
Day 2: 發現問題
Day 3: 修改 TypeScript
Day 4: 還有問題...
```

**正確做法**:

```
1. 建立 Migration
2. 更新 TypeScript 型別
3. 更新 Store 邏輯
4. 更新 IndexedDB schema
5. 執行測試
6. 一次性提交
```

---

### 2. 大批量變更需要分階段

**當前問題**: 一次修改 14+ 個表格

**建議**:

1. 先修改 1-2 個高風險表格
2. 測試 1-2 天
3. 確認穩定後再批次處理

---

### 3. Migration 需要可回滾

**當前缺失**:

- ❌ 沒有 down migration
- ❌ 沒有版本標記
- ❌ 無法快速回滾到穩定版

**建議工具**:

```bash
npm run db:rollback  # 回滾最後一次 migration
npm run db:status    # 查看 migration 狀態
npm run db:version   # 標記穩定版本
```

---

## 🚀 立即行動計劃

### 緊急（今天完成）

- [x] 修復 `payment_requests.note` 欄位
- [ ] 檢查所有 `created_by/updated_by` 是否正常運作
- [ ] 清除瀏覽器 IndexedDB cache（用戶端）

### 短期（本週完成）

- [ ] 建立 schema 一致性檢查工具
- [ ] 修復所有 `note/notes` 欄位不一致
- [ ] 更新 IndexedDB schema 版本（DB_VERSION = 6）
- [ ] 新增自動化測試

### 中期（下週完成）

- [ ] 建立 Migration 回滾機制
- [ ] 文件化所有資料表的標準欄位
- [ ] 建立 pre-commit hook 檢查 schema 一致性

---

## 📚 相關檔案

### Migration 檔案

- `supabase/migrations/20251119171000_add_payment_requests_missing_columns.sql`
- `supabase/migrations/20251119172000_fix_payment_requests_note_field.sql`
- `supabase/migrations/_applied_20251119080200_add_created_updated_by_to_all_tables.sql`

### 程式碼檔案

- `src/stores/types.ts` (已修改 line 532)
- `src/stores/core/create-store-new.ts` (需要檢查)
- `src/lib/db/schemas.ts` (需要更新)

### 檢查工具

- `check-all-tables-schema.js`
- `db-migrate.js`

---

## 🔍 如何避免未來再次發生？

### 1. 建立 Schema 變更檢查清單

```markdown
## Schema 變更檢查清單

- [ ] 建立 Migration 檔案
- [ ] 更新 TypeScript 型別定義
- [ ] 更新 Store create/update 邏輯
- [ ] 更新 IndexedDB schema (schemas.ts + DB_VERSION++)
- [ ] 執行 `npm run build` 檢查型別錯誤
- [ ] 測試 create/update/delete 操作
- [ ] 清除 IndexedDB 快取測試
- [ ] 提交前執行 schema 檢查工具
```

---

### 2. 自動化工具

```json
// package.json
{
  "scripts": {
    "db:check": "node scripts/check-schema-consistency.js",
    "db:migrate": "node scripts/db-migrate.js",
    "db:rollback": "node scripts/db-rollback.js",
    "pre-commit": "npm run db:check && npm run build"
  }
}
```

---

### 3. 監控和告警

```typescript
// 在生產環境監控 Supabase 錯誤
if (error.code === 'PGRST204') {
  // Schema cache 錯誤 → 立即告警
  Sentry.captureException(error, {
    level: 'critical',
    tags: { type: 'schema_mismatch' },
  })
}
```

---

## 結論

**根本原因**:

1. 大批量資料庫 schema 變更（14+ 表格）
2. 沒有同步更新前端型別定義和 IndexedDB schema
3. 欄位命名不一致（note vs notes）
4. 缺乏自動化檢查工具

**已修復**:

- ✅ payment_requests 欄位問題
- ✅ TypeScript 型別定義

**還需要做**:

- ⏳ 全面檢查所有表格的 created_by/updated_by
- ⏳ 建立自動化檢查和測試
- ⏳ 更新文檔和工作流程

**預計穩定時間**: 48 小時內（完成所有檢查和修復後）
