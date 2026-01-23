# Venturo 開發指南

> **最後更新**: 2026-01-22
> **專案狀態**: 核心功能完成，純雲端架構
> **架構**: Supabase 為唯一資料來源（IndexedDB 已棄用）

---

## 🎯 專案基本資訊

### 專案概述
```
專案名稱: Venturo ERP (旅遊團管理系統)
工作目錄: /Users/williamchien/Projects/venturo-erp
開發端口: 3000
技術棧:   Next.js 16 + React 19.2 + TypeScript 5 + Zustand 5 + Supabase
架構模式: 純雲端架構（Supabase 為 Single Source of Truth）
```

### 核心原則
- **問題 → 只回答**，不執行操作
- **等待指令**：「執行」「修正」「開始」才動作
- **簡潔回應**：問什麼答什麼

---

## 📁 專案架構

### 核心目錄結構
```
src/
├── app/          (51 頁面) - Next.js 路由
├── components/   (185 檔案) - UI 組件
├── features/     (88 檔案) - 功能模組
├── stores/       (36 檔案) - Zustand 狀態管理
├── hooks/        (18 檔案) - 自定義 Hooks
├── lib/          (29 檔案) - 工具函式
├── services/     (5 檔案) - 業務服務
└── types/        (20 檔案) - TypeScript 型別
```

### 架構模式
- **Hybrid Feature-Based + Layer-Based**
- 功能模組獨立 (features/)
- 共享基礎層 (components/, hooks/, stores/)

---

## 🔧 開發規範

### 組件創建規則
```tsx
// ✅ 正確：使用 Phase 1/2 的可重用組件
import { ListPageLayout } from '@/components/layout/list-page-layout';
import { DateCell, StatusCell, ActionCell } from '@/components/table-cells';

// ❌ 錯誤：不要重複寫 ResponsiveHeader + EnhancedTable
```

### 命名規範
- **組件**: PascalCase (`ChannelChat.tsx`)
- **Hooks**: camelCase (`useUserStore.ts`)
- **工具**: kebab-case (`format-date.ts`)
- **型別**: kebab-case + `.types.ts`

### 型別安全
- **禁止**: `as any`
- **盡量避免**: `as unknown`
- **使用**: 正確的 TypeScript 型別定義

---

## 📋 常用指令

### 開發
```bash
cd /Users/williamchien/Projects/venturo-erp
npm run dev          # 啟動開發伺服器 (port 3000)
npm run build        # 建置專案
npm run lint         # 執行 ESLint
npm run type-check   # TypeScript 類型檢查
```

### 資料庫 (詳見 SUPABASE_GUIDE.md)
```bash
npm run db:types     # 更新 TypeScript 類型
npm run db:push      # 推送 migration 到資料庫
npm run db:pull      # 下載目前資料庫結構
```

### 檢查架構
```bash
ls -la src/components/     # 查看組件
ls -la src/features/       # 查看功能模組
find . -name "*-store.ts"  # 查找所有 stores
```

---

## ✅ 已完成的優化

### Phase 1-2: 可重用組件系統
- ✅ ListPageLayout 組件
- ✅ Table Cell 組件庫 (8 個組件)
- ✅ useListPageState Hook
- ✅ 應用到 Quotes/Contracts/Itinerary 頁面
- **總計減少**: 215 行代碼 (-24%)

### Phase 3-4: 純雲端架構遷移 (2026-01)
- ✅ 移除 IndexedDB 離線快取
- ✅ Supabase Auth 整合
- ✅ RLS 資料隔離（Workspace 層級）
- ✅ 編號系統重構（新格式：CNX250128A）
- ✅ Store 系統重構（createCloudStore）
- ✅ SWR 快取層

**關鍵改進**:
- 🔄 單一資料來源：Supabase 為唯一 Source of Truth
- ⚡ 即時更新：透過 SWR revalidation
- 🔒 資料隔離：RLS 確保 Workspace 資料安全
- 🔑 統一認證：Supabase Auth + JWT

---

## 🎯 工作檢查清單

### 開始任何工作前
- [ ] 確認當前工作目錄正確
- [ ] 檢查 port 3000 是否已佔用
- [ ] 了解要修改的功能範圍

### 修改代碼前
- [ ] 是否使用了可重用組件？
- [ ] 型別定義是否完整？
- [ ] 是否避免 `as any`？
- [ ] 是否符合命名規範？

### 提交前檢查
- [ ] `npm run build` 通過
- [ ] 沒有新增 console.log
- [ ] 沒有未使用的 imports
- [ ] 型別檢查通過

---

## 🔍 快速參考

### 主要文檔位置
```
docs/
├── DEVELOPMENT_GUIDE.md         - 開發指南（本檔案）
├── SUPABASE_GUIDE.md            - Supabase 完整操作指南
├── REALTIME_GUIDE.md            - Realtime 同步系統指南
├── DATABASE.md                  - 資料庫設計文檔
├── SUPABASE_RLS_POLICY.md       - RLS 政策說明
└── reports/
    └── SUPABASE_WORKFLOW.md     - Supabase 工作流程
```

### 關鍵檔案
```
# 狀態管理
src/stores/core/create-store.ts            - Store 工廠函數（純雲端）
src/stores/cloud-store-factory.ts          - Cloud Store 工廠
src/stores/types.ts                        - 所有型別定義

# 認證系統
src/stores/auth-store.ts                   - 認證狀態管理
src/lib/auth/auth-sync.ts                  - Auth 同步機制

# 編號生成
src/stores/utils/code-generator.ts         - 編號生成工具

# 組件系統
src/components/table-cells/index.tsx       - 表格單元格組件
src/components/layout/list-page-layout.tsx - 列表頁佈局
src/hooks/useListPageState.ts              - 列表頁狀態管理
src/lib/status-config.ts                   - 狀態配置

# 類型定義
src/lib/supabase/types.ts                  - Supabase 自動生成類型
```

---

## 🚨 已知問題與限制

### 需要改善的項目
1. **23 個超大檔案** (>500 行) - 需拆分
2. **重複的 Store Factory** - `create-store.ts` 應刪除
3. **188 個型別繞過** - `as any`/`as unknown` 過多
4. **Workspace Store Facade** - 耦合 5 個 stores

### 架構改善需求
- Service Layer 太薄 (只有 5 個，需 12-15 個)
- API Layer 不完整 (只有 4 個 routes)
- 測試覆蓋率 ~0%

---

## 📚 詳細文檔

- **Supabase 操作**: 查看 `docs/SUPABASE_GUIDE.md`
- **Realtime 同步**: 查看 `docs/REALTIME_GUIDE.md`
- **資料庫設計**: 查看 `docs/DATABASE.md`
- **RLS 政策**: 查看 `docs/SUPABASE_RLS_POLICY.md`

---

**注意**: 這是精簡版開發指南。詳細的操作說明請參考各專項文檔。
