# Supabase 工作流程指南

## 🎯 目標
建立一套簡單的流程，讓你不用在前端和 Supabase Dashboard 之間跑來跑去。

## 📋 一次性設定（已完成）

✅ 1. 安裝 Supabase CLI
```bash
npm install -D supabase
```

✅ 2. 取得 Personal Access Token
- 網址：https://supabase.com/dashboard/account/tokens
- 已取得：`sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0`

✅ 3. 連結到專案
```bash
export SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0
npx supabase link --project-ref pfqvdacxowpgfamuvnsn
```

✅ 4. 生成 TypeScript 類型
```bash
npm run db:types
```

## 🔄 日常工作流程

### 情境 1：修改前端資料結構

**步驟：**

1. **修改 TypeScript 類型**（在 `src/types/` 中）
2. **讓 AI 生成 SQL Migration**

```bash
# 例如：你想新增一個 manifestation_entries 表格
# 請 Claude Code 生成 SQL 到：
# supabase/migrations/YYYYMMDDHHMMSS_add_manifestation.sql
```

3. **執行 Migration**

```bash
npm run db:push
```

4. **更新 TypeScript 類型**

```bash
npm run db:types
```

5. **完成！** 前後端都同步了

### 情境 2：查看目前資料庫結構

```bash
npm run db:pull
```

這會把目前 Supabase 的 schema 下載到本地，方便查看。

### 情境 3：重置資料庫（危險！）

```bash
npm run db:reset
```

這會清空資料庫並重新執行所有 migrations。

## 📝 NPM Scripts（已設定）

在 `package.json` 中加入以下scripts：

```json
{
  "scripts": {
    "db:types": "SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 npx supabase gen types typescript --project-id pfqvdacxowpgfamuvnsn > src/lib/types/supabase-generated.ts",
    "db:push": "SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 npx supabase db push",
    "db:pull": "SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 npx supabase db pull",
    "db:diff": "SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 npx supabase db diff -f",
    "db:reset": "SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 npx supabase db reset"
  }
}
```

## 🤖 與 Claude Code 協作

### 建立新功能時：

1. **描述你要的功能**
   ```
   "我想新增一個manifestation功能，需要一個表格儲存用戶的manifestation記錄"
   ```

2. **Claude Code 會：**
   - ✅ 生成 migration SQL 檔案
   - ✅ 更新前端 TypeScript 類型
   - ✅ 建立相關的 React 組件
   - ✅ 更新 Supabase client 程式碼

3. **你只需要：**
   ```bash
   npm run db:push    # 推送到資料庫
   npm run db:types   # 更新類型
   ```

## 📂 目錄結構

```
venturo-new/
├── supabase/
│   ├── config.toml           # Supabase 設定
│   └── migrations/           # 所有 migration 檔案
│       ├── 20251025000000_complete_workspace_schema.sql
│       └── 20251025000001_create_channel_members.sql
├── src/
│   ├── lib/
│   │   └── types/
│   │       └── supabase-generated.ts  # 自動生成的類型
│   └── types/                # 手動定義的類型
└── package.json
```

## 🎓 Migration 命名規範

檔案名稱必須符合：`YYYYMMDDHHMMSS_description.sql`

例如：
- ✅ `20251025143022_add_manifestation.sql`
- ❌ `add_manifestation.sql`（會被跳過）

## 🚨 重要提醒

1. **Migration 是單向的** - 一旦推送就不要刪除
2. **本地檔案 = 真實來源** - 所有 migration 都要在 Git 中版本控管
3. **測試後再推送** - 可以先在本地 Supabase 測試（`npx supabase start`）

## ✅ 目前狀態

- [x] Supabase CLI 已安裝
- [x] 專案已連結
- [x] TypeScript 類型已生成
- [x] 完整的 workspace schema migration 已建立
- [x] Migration 已成功執行到雲端資料庫
- [x] 資料表已建立並可正常使用
  - workspaces
  - channels (✅ 2025-10-27: 新增 order 欄位用於拖曳排序)
  - channel_groups
  - channel_members
  - messages
  - bulletins
  - advance_lists
  - shared_order_lists
- [x] 舊的 migration 檔案已整理到 _archive 資料夾

## 📚 Migration 執行記錄

### 2025-10-27: 新增 channels.order 欄位
- **Migration**: `20251027000000_add_channel_order.sql`
- **目的**: 支援頻道拖曳排序功能
- **執行方式**: `npm run db:push`（使用 CLI + Personal Access Token）
- **狀態**: ✅ 成功執行
- **驗證**: `order: number | null` 已出現在 Supabase 生成的類型中

## 🔗 相關連結

- Supabase Dashboard: https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn
- SQL Editor: https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/sql
- Table Editor: https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/editor
