# Supabase 認證資訊與 CLI 執行完整說明

## 重要認證資訊

### Personal Access Token (用於 Supabase CLI)
```
sbp_653aa28afea3e6a714e2acc536eed313bc7b85a0
```

### 資料庫密碼 (Database Password)
```
kH6j4/UXg-+hGu@
```

### 專案資訊
- Project Reference: `pfqvdacxowpgfamuvnsn`
- Supabase URL: `https://pfqvdacxowpgfamuvnsn.supabase.co`

---

## CLI 執行失敗原因完整分析

### ❌ 錯誤方法 1: REST API
**嘗試:** 使用 REST API 的 RPC 功能執行 SQL
**失敗原因:** Supabase PostgREST 基於安全考量，不提供 DDL (CREATE TABLE) 操作的 API 端點
**錯誤訊息:** `Could not find the function public.exec_sql(sql)`

### ❌ 錯誤方法 2: 直接 PostgreSQL 連接 (使用 JWT token)
**嘗試:**
```bash
psql "postgresql://postgres.pfqvdacxowpgfamuvnsn:[JWT_TOKEN]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
```
**失敗原因:** **這是關鍵錯誤** - 將 JWT token (SERVICE_ROLE_KEY) 當作資料庫密碼使用
- JWT token 用於 REST API 認證
- PostgreSQL 連接需要實際的資料庫密碼
- 這兩種認證機制完全不同
**錯誤訊息:** `Tenant or user not found`

### ❌ 錯誤方法 3: 直接 PostgreSQL 連接 (hostname 錯誤)
**嘗試:** 連接 `db.pfqvdacxowpgfamuvnsn.supabase.co`
**失敗原因:** hostname 格式不正確或此端點未公開
**錯誤訊息:** `getaddrinfo ENOTFOUND`

### ✅ 正確方法: Supabase CLI + Personal Access Token

**為什麼之前能用，後來不能用？**
因為沒有設定 `SUPABASE_ACCESS_TOKEN` 環境變數。CLI 需要這個 token 才能認證。

**正確步驟:**
```bash
# 1. 設定 Personal Access Token
export SUPABASE_ACCESS_TOKEN="sbp_653aa28afea3e6a714e2acc536eed313bc7b85a0"

# 2. 連結專案
npx supabase link --project-ref pfqvdacxowpgfamuvnsn

# 3. 推送 migrations
npx supabase db push
```

**這個方法記錄在:** `scripts/setup-supabase.sh`

---

## 三種認證方式的區別

### 1. Personal Access Token (PAT)
- **格式:** `sbp_xxxxx`
- **用途:** Supabase CLI 認證
- **取得位置:** https://supabase.com/dashboard/account/tokens
- **使用方式:** 環境變數 `SUPABASE_ACCESS_TOKEN`

### 2. Database Password
- **格式:** `kH6j4/UXg-+hGu@`
- **用途:** 直接 PostgreSQL 連接 (如果需要)
- **取得位置:** Supabase Dashboard → Settings → Database
- **使用方式:** `psql` 連接字串的密碼欄位

### 3. API Keys (ANON_KEY / SERVICE_ROLE_KEY)
- **格式:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT)
- **用途:** REST API 認證
- **取得位置:** Supabase Dashboard → Settings → API
- **使用方式:** HTTP headers `Authorization: Bearer ...`

**重要:** 這三種不可混用！之前失敗就是因為把 JWT token 當作資料庫密碼使用。

---

## Migration 執行狀態

### ✅ 已成功建立的表格
- `user_preferences` - 使用者偏好設定 (widget 順序等)
- `notes` - 便條紙內容
- `manifestation_records` - 顯化魔法記錄

### ✅ RLS 政策已啟用
所有表格都有 Row Level Security，確保使用者只能存取自己的資料。

### 執行方式
最終在 Supabase Dashboard 手動執行成功。
CLI 驗證顯示表格已存在，確認 migration 已正確應用。

---

## 前端程式碼修改

### 已修改為使用 Supabase 同步的檔案：

1. **`src/features/dashboard/hooks/use-widgets.ts`**
   - Widget 順序儲存到 `user_preferences` 表格
   - Preference key: `homepage-widgets-order`

2. **`src/features/dashboard/hooks/use-notes.ts`** (新建)
   - 便條紙內容儲存到 `notes` 表格
   - 支援多個分頁

3. **`src/features/dashboard/components/notes-widget.tsx`**
   - 使用新的 `use-notes.ts` hook

4. **`src/lib/manifestation/reminder.ts`**
   - 新增 `loadManifestationFromSupabase()`
   - 新增 `saveManifestationToSupabase()`

5. **`src/features/dashboard/components/manifestation-widget.tsx`**
   - 載入時從 Supabase 同步資料

### 降級策略
所有功能都有 localStorage 備援，如果 Supabase 連接失敗會自動降級使用 localStorage。

---

## 未來使用說明

### 執行新的 Migration
```bash
# 1. 確保 token 已設定
export SUPABASE_ACCESS_TOKEN="sbp_653aa28afea3e6a714e2acc536eed313bc7b85a0"

# 2. 在 supabase/migrations/ 建立新的 migration 檔案
# 檔名格式: YYYYMMDDHHMMSS_description.sql

# 3. 推送到 Supabase
npx supabase db push
```

### 連接到資料庫 (如需要)
```bash
# 使用 pooler (建議)
psql "postgresql://postgres.pfqvdacxowpgfamuvnsn:kH6j4/UXg-+hGu@/aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

### 驗證表格
```bash
# 列出所有 migrations
npx supabase db remote ls

# 執行 SQL 查詢 (透過 CLI)
npx supabase db execute "SELECT * FROM user_preferences LIMIT 5;"
```

---

## 安全注意事項

✅ 此檔案位於 `.claude/` 目錄
✅ `.claude/` 已加入 `.gitignore`，不會上傳到 GitHub
✅ Personal Access Token 已儲存在 `/tmp/.supabase_access_token`
✅ Database Password 已儲存在 `/tmp/.supabase_db_password`

**請勿:**
- 將此檔案加入版本控制
- 在公開場合分享這些認證資訊
- 在程式碼中 hardcode 這些值

---

## 問題排查

### CLI 顯示 "Access token not provided"
**解決:** `export SUPABASE_ACCESS_TOKEN="sbp_653aa28afea3e6a714e2acc536eed313bc7b85a0"`

### Migration 顯示 "already exists"
**說明:** 表格已存在，這是正常的。如需重建請先 DROP TABLE。

### 前端無法連接 Supabase
**檢查:**
1. `.env.local` 中的 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是否正確
2. 使用者是否已登入 (`useAuthStore` 的 `user.id`)
3. RLS 政策是否正確設定

---

**文件建立時間:** 2025-10-26
**Migration 版本:** 20251026040000
**狀態:** ✅ 完成，跨裝置同步功能已啟用
