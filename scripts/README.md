# Venturo Database Migration 工具

## 📋 簡介

這個目錄包含了 Venturo 專案的資料庫 migration 工具，使用 **Supabase Management API** 確保在任何電腦上都能可靠地執行 migrations。

## 🚀 使用方式

### 1. 執行所有未執行的 Migrations

```bash
npm run db:migrate
```

這個指令會：
- ✅ 自動檢查 `supabase/migrations/` 目錄
- ✅ 找出未執行的 migration 檔案
- ✅ 按順序執行它們
- ✅ 記錄已執行的 migrations 到 `_migrations` 表格

### 2. 檢查資料庫狀態

```bash
node check-rls-status.js
```

檢查特定資料表的狀態和欄位。

### 3. 驗證最終狀態

```bash
node verify-final-status.js
```

驗證資料表結構是否正確。

## 📁 檔案說明

| 檔案 | 用途 |
|------|------|
| `db-migrate.js` | 主要的 migration 執行工具 |
| `check-rls-status.js` | 檢查資料表狀態 |
| `execute-rls.js` | 手動執行單一 SQL |
| `verify-final-status.js` | 驗證結果 |
| `fill-workspace-data.js` | 填充遺漏的 migration 記錄 |

## 🔧 工作原理

### Migration 記錄表

所有執行過的 migrations 都記錄在 `public._migrations` 表格：

```sql
CREATE TABLE public._migrations (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  executed_at timestamp with time zone DEFAULT now()
);
```

### 執行流程

```
1. 讀取 supabase/migrations/*.sql
2. 查詢 _migrations 表格
3. 找出未執行的檔案
4. 依序執行 SQL
5. 記錄到 _migrations
```

## 🎯 使用情境

### 情境 1：在新電腦上 clone 專案

```bash
git clone <repo>
cd venturo-new
npm install
npm run db:migrate  # 自動執行所有 migrations
```

### 情境 2：團隊成員新增 Migration

```bash
# 團隊成員 A 建立新 migration
git add supabase/migrations/20251120_add_new_feature.sql
git commit -m "feat: add new feature migration"
git push

# 團隊成員 B 拉取更新
git pull
npm run db:migrate  # 只執行新的 migration
```

### 情境 3：修復資料庫狀態

```bash
# 檢查狀態
node check-rls-status.js

# 執行 migrations
npm run db:migrate

# 驗證結果
node verify-final-status.js
```

## ⚠️ 注意事項

1. **不要手動修改 `_migrations` 表格**
   - 這會導致 migration 狀態不一致

2. **Migration 檔案命名規則**
   - 格式：`YYYYMMDDHHMMSS_description.sql`
   - 例如：`20251119085637_add_updated_by_to_todos.sql`

3. **SQL 交易**
   - Migration 應該使用 `BEGIN;` 和 `COMMIT;`
   - 失敗時會自動 ROLLBACK

4. **測試 Migration**
   - 在開發環境先測試
   - 確認沒問題再合併到 main

## 🔐 環境變數

Migration 工具使用 `.claude/CLAUDE.md` 中定義的 Supabase 憑證：

```javascript
const SUPABASE_ACCESS_TOKEN = 'sbp_...'
const PROJECT_REF = 'pfqvdacxowpgfamuvnsn'
```

## 📖 Migration 範例

```sql
-- 20251119085637_add_updated_by_to_todos.sql
BEGIN;

ALTER TABLE public.todos
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

COMMENT ON COLUMN public.todos.updated_by IS 'Last user who updated this todo';

UPDATE public.todos
SET updated_by = created_by
WHERE updated_by IS NULL;

COMMIT;
```

## 🐛 疑難排解

### 問題 1：Migration 執行失敗

```bash
# 檢查錯誤訊息
npm run db:migrate

# 查看具體 SQL
cat supabase/migrations/失敗的檔案.sql
```

### 問題 2：重複執行 Migration

```bash
# 查看已執行的 migrations
node -e "
const https = require('https');
const req = https.request({
  hostname: 'api.supabase.com',
  path: '/v1/projects/pfqvdacxowpgfamuvnsn/database/query',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0',
    'Content-Type': 'application/json'
  }
}, (res) => {
  res.on('data', d => console.log(d.toString()));
});
req.write(JSON.stringify({query: 'SELECT * FROM _migrations ORDER BY executed_at;'}));
req.end();
"
```

### 問題 3：手動執行 SQL

如果 API 失敗，可以手動執行：

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/sql/new)
2. 複製 migration 檔案的 SQL
3. 執行
4. 記錄到 `_migrations`：
   ```sql
   INSERT INTO public._migrations (name) VALUES ('檔案名稱.sql');
   ```

## ✅ 最佳實踐

1. **每次 Pull 後執行**
   ```bash
   git pull && npm run db:migrate
   ```

2. **建立 Migration 前檢查**
   ```bash
   npm run db:migrate  # 確保資料庫是最新狀態
   ```

3. **Commit 前測試**
   ```bash
   npm run db:migrate  # 測試新 migration
   npm run build       # 確認應用程式正常
   ```

## 🎉 成功案例

✅ `updated_by` 欄位新增
- Migration: `20251119085637_add_updated_by_to_todos.sql`
- 使用 Management API 成功執行
- 所有電腦都能自動同步

---

**維護者**: William Chien
**最後更新**: 2025-11-19
