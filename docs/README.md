# Venturo 開發文檔中心

> **最後更新**: 2025-11-09
> **專案**: Venturo 旅遊團管理系統

---

## 📖 快速導航

### 🚀 核心指南（必讀）

| 文檔 | 說明 | 使用時機 |
|------|------|----------|
| [**開發指南**](DEVELOPMENT_GUIDE.md) | 專案架構、開發規範、工作流程 | 開始開發前必讀 |
| [**Supabase 操作指南**](SUPABASE_GUIDE.md) | 資料庫 Migration、CLI 使用 | 修改資料庫表格時 |
| [**Realtime 同步指南**](REALTIME_GUIDE.md) | 即時同步系統使用方式 | 需要多裝置同步時 |

### 📋 設計文檔

| 文檔 | 說明 |
|------|------|
| [DATABASE.md](DATABASE.md) | 資料庫設計文檔 |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | 設計系統規範 |
| [STANDARD_PAGE_LAYOUT.md](STANDARD_PAGE_LAYOUT.md) | 標準頁面佈局 |
| [NAMING_CONVENTION_STANDARD.md](NAMING_CONVENTION_STANDARD.md) | 命名規範 |

### 🔒 Supabase 相關

| 文檔 | 說明 |
|------|------|
| [SUPABASE_RLS_POLICY.md](SUPABASE_RLS_POLICY.md) | RLS 政策說明（內部系統禁用） |
| [SUPABASE_SETUP.md](SUPABASE_SETUP.md) | Supabase 初始設定 |
| [SUPABASE_SCHEMA_CHECK.md](SUPABASE_SCHEMA_CHECK.md) | Schema 檢查工具 |
| [reports/SUPABASE_WORKFLOW.md](reports/SUPABASE_WORKFLOW.md) | 完整工作流程 |

### 📊 系統狀態

| 文檔 | 說明 |
|------|------|
| [SYSTEM_STATUS.md](SYSTEM_STATUS.md) | 系統當前狀態 |
| [PROJECT_PRINCIPLES.md](PROJECT_PRINCIPLES.md) | 專案開發原則 |

---

## 🎯 常見任務快速查詢

### 我想...

#### 修改資料庫表格
→ 查看 [**Supabase 操作指南**](SUPABASE_GUIDE.md)

**快速流程**：
1. 建立 Migration 檔案: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. 撰寫 SQL（記得包含 `BEGIN/COMMIT`）
3. 執行: `echo "Y" | npm run db:push`
4. 更新類型: `npm run db:types`

#### 新增即時同步功能
→ 查看 [**Realtime 同步指南**](REALTIME_GUIDE.md)

**快速流程**：
```typescript
// 在頁面中加入 Hook
import { useRealtimeForXXX } from '@/hooks/use-realtime-hooks';

export default function Page() {
  useRealtimeForXXX();
  // ...
}
```

#### 了解專案架構
→ 查看 [**開發指南**](DEVELOPMENT_GUIDE.md)

**核心架構**：
- `app/` - Next.js 路由
- `components/` - UI 組件
- `features/` - 功能模組
- `stores/` - Zustand 狀態管理
- `hooks/` - 自定義 Hooks

#### 查看命名規範
→ 查看 [**命名規範**](NAMING_CONVENTION_STANDARD.md)

**快速參考**：
- 組件: `PascalCase`
- Hooks: `camelCase`
- 工具: `kebab-case`
- 型別: `kebab-case.types.ts`

---

## 🔧 開發環境設定

### 必要工具
- Node.js 18+
- npm 或 yarn
- Supabase CLI (已安裝在 devDependencies)

### 環境變數
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://pfqvdacxowpgfamuvnsn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 常用指令
```bash
# 開發
npm run dev              # 啟動開發伺服器 (port 3000)
npm run build            # 建置專案
npm run lint             # 執行 ESLint

# 資料庫
npm run db:types         # 更新 TypeScript 類型
npm run db:push          # 推送 migration
npm run db:pull          # 下載 schema
```

---

## 📚 專案文檔結構

```
docs/
├── README.md                        # 文檔中心（本檔案）
├── DEVELOPMENT_GUIDE.md             # 開發指南 ⭐
├── SUPABASE_GUIDE.md                # Supabase 操作指南 ⭐
├── REALTIME_GUIDE.md                # Realtime 同步指南 ⭐
│
├── DATABASE.md                      # 資料庫設計
├── DESIGN_SYSTEM.md                 # 設計系統
├── STANDARD_PAGE_LAYOUT.md          # 頁面佈局
├── NAMING_CONVENTION_STANDARD.md    # 命名規範
│
├── SUPABASE_RLS_POLICY.md           # RLS 政策
├── SUPABASE_SETUP.md                # Supabase 設定
├── SUPABASE_SCHEMA_CHECK.md         # Schema 檢查
│
├── SYSTEM_STATUS.md                 # 系統狀態
├── PROJECT_PRINCIPLES.md            # 專案原則
│
├── reports/                         # 完成報告
│   └── SUPABASE_WORKFLOW.md
│
├── archive/                         # 歷史文檔
│   ├── phase-reports/
│   └── completion-reports/
│
└── refactoring/                     # 重構文檔
```

---

## 🎓 新手入門

### 第一次開發 Venturo？

**建議閱讀順序**：

1. **[開發指南](DEVELOPMENT_GUIDE.md)** (15 分鐘)
   - 了解專案架構
   - 學習開發規範
   - 熟悉工作流程

2. **[Supabase 操作指南](SUPABASE_GUIDE.md)** (20 分鐘)
   - 了解如何修改資料庫
   - 學習 Migration 流程
   - 熟悉常用指令

3. **[Realtime 同步指南](REALTIME_GUIDE.md)** (15 分鐘)
   - 了解即時同步原理
   - 學習如何使用 Hooks
   - 熟悉按需訂閱模式

**總時間**: 約 50 分鐘

---

## ✅ 檢查清單

### 開發前
- [ ] 閱讀開發指南
- [ ] 確認工作目錄正確
- [ ] 確認 port 3000 未被佔用
- [ ] 確認環境變數已設定

### 修改資料庫前
- [ ] 閱讀 Supabase 操作指南
- [ ] 了解 Migration 流程
- [ ] 確認 Personal Access Token 有效

### 提交代碼前
- [ ] `npm run build` 通過
- [ ] 沒有新增 console.log
- [ ] 沒有未使用的 imports
- [ ] 型別檢查通過
- [ ] 已更新相關文檔

---

## 🔗 外部資源

### Supabase
- [Dashboard](https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn)
- [SQL Editor](https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/sql)
- [Table Editor](https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/editor)
- [Realtime](https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/database/realtime)

### 技術文檔
- [Next.js 15 文檔](https://nextjs.org/docs)
- [React 19 文檔](https://react.dev/)
- [Zustand 文檔](https://zustand-demo.pmnd.rs/)
- [Supabase 文檔](https://supabase.com/docs)

---

## 📝 文檔維護

### 更新原則
- 每次重大功能完成後更新文檔
- 修改資料庫後更新 Migration 記錄
- 新增功能後更新使用指南

### 文檔版本
所有文檔都在標題註明「最後更新」日期，請保持更新。

---

## 💡 提示

### 對於 AI 助手（Claude Code）
- `.claude/CLAUDE.md` 包含完整的工作規範
- 遵循「按需訂閱」Realtime 原則
- 永遠使用 Supabase CLI 修改資料庫
- 內部系統禁用 RLS

### 對於開發者
- 優先使用可重用組件（Phase 1/2）
- 遵循命名規範
- 避免使用 `as any`
- 新頁面記得加入 Realtime Hook

---

**需要幫助？** 查看對應的專項指南，或查閱 `.claude/CLAUDE.md` 完整規範。
