# Claude Code 工作規範 (Venturo ERP)

> **最後更新**: 2026-01-23
> **文件類型**: Claude 專用工作流程與快速指令

---

## 🚨🚨🚨 對話開始必做 (P0) 🚨🚨🚨

### 第一步：理解 Venturo 願景

```
Read /Users/williamchien/Projects/venturo-erp/.claude/VENTURO_VISION.md
```

**核心概念**：
- Venturo 是**雙平台生態系統**（ERP + Online）
- **venturo-erp**：旅行社員工內部營運系統
- **venturo-online**：旅客會員體驗系統
- 兩系統**共享同一個 Supabase 資料庫**
- 資料流向：ERP 產生 → Online 呈現 → 會員回饋 → ERP 優化

### 第二步：閱讀 SITEMAP

```
Read /Users/williamchien/Projects/SITEMAP.md
```

**為什麼？** 直接查 SITEMAP 比 grep/glob 搜尋快 10 倍

---

## 📍 必讀清單（開發前必看）

| 類型 | 文件位置 | 說明 |
|------|---------|------|
| **願景** | `.claude/VENTURO_VISION.md` | 雙平台架構、價值飛輪 |
| **地圖** | `/Users/williamchien/Projects/SITEMAP.md` | 頁面路由、API、Store |
| **UI/組件** | `docs/COMPONENT_GUIDE.md` | 莫蘭迪色系、Table Cell、按鈕規範 |
| **效能** | `docs/PERFORMANCE_GUIDE.md` | 快取架構、N+1 查詢、資料載入 |
| **程式碼** | `docs/CODE_STANDARDS.md` | 日期處理、閉包陷阱、禁止項目 |
| **架構** | `docs/ARCHITECTURE_STANDARDS.md` | 五層架構、資料隔離、核心哲學 |
| **資料庫** | `docs/DATABASE_DESIGN_STANDARDS.md` | 命名規範、表格分類 |
| **欄位命名** | `docs/FIELD_NAMING_STANDARDS.md` | 欄位語意一致性、標準欄位名 |
| **RLS** | `docs/SUPABASE_RLS_POLICY.md` | Row Level Security 規範 |

---

## 🚨🚨🚨 六大禁令 (Zero Tolerance) 🚨🚨🚨

| 禁令 | 說明 |
|------|------|
| **禁止 any** | 不准使用 `: any`、`as any`、`<any>` |
| **禁止忽略資料庫** | 修改功能前必須檢查 Supabase 表格結構 |
| **禁止盲目修改** | 每次修改前必須先讀取並理解現有代碼 |
| **禁止自訂版面** | 列表頁面必須使用 `ListPageLayout` / `EnhancedTable` |
| **禁止詳細頁跳轉** | 不建立 `/xxx/[id]/page.tsx`，用 Dialog 或展開 |
| **禁止自創欄位名** | 新欄位必須查閱 `docs/FIELD_NAMING_STANDARDS.md` |

**額外禁止**：
- ❌ `console.log/error/warn` → 必須用 `logger`
- ❌ 新增 `as any` → 使用明確類型或 `unknown` + type guard
- ❌ 使用 `birthday` → 使用 `birth_date`
- ❌ 使用 `name_en` → 使用 `english_name`

---

## ⚡ 快速指令

### `修復多重遮罩` / `fix-overlay`
檢查並修復巢狀 Dialog 的遮罩疊加問題。
- 搜尋 `Dialog.*open=` 和巢狀 Dialog
- 套用單一遮罩模式（父 Dialog 在子 Dialog 開啟時不渲染）

### `CARD 檢查` / `card-check`
對功能模組進行四維度審計：
- **C**lean：死代碼、未使用 import
- **A**uth：API 認證、RLS
- **R**edundant：重複邏輯
- **D**ependencies：依賴正確性

### `檢查表格`
檢查 Supabase 表格是否存在：
```bash
SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 \
  npx supabase db dump --project-ref pfqvdacxowpgfamuvnsn | grep "CREATE TABLE"
```

### `重新生成類型`
更新 TypeScript 類型定義：
```bash
SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 \
  npx supabase gen types typescript --project-id pfqvdacxowpgfamuvnsn > src/lib/supabase/types.ts
```

---

## 🎯 專案基本資訊

```
專案名稱: Venturo ERP (旅遊團管理系統)
工作目錄: /Users/williamchien/Projects/venturo-erp
開發端口: 3000
技術棧:   Next.js 16 + React 19.2 + TypeScript 5 + Zustand 5 + Supabase
```

### 核心目錄結構
```
src/
├── app/          - Next.js 路由
├── components/   - UI 組件
├── features/     - 功能模組
├── stores/       - Zustand 狀態管理
├── hooks/        - 自定義 Hooks
├── lib/          - 工具函式
└── types/        - TypeScript 型別
```

---

## 🗄️ Supabase 連線資訊

```bash
Personal Access Token: sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0
Project Ref: pfqvdacxowpgfamuvnsn
Project URL: https://pfqvdacxowpgfamuvnsn.supabase.co
```

### 執行 Migration
```bash
npm run db:migrate
# 或
echo "Y" | SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 npx supabase db push
```

---

## 🎯 工作檢查清單

### 開始任何工作前
- [ ] 讀取 SITEMAP
- [ ] 確認工作目錄正確
- [ ] 了解要修改的功能範圍

### 修改代碼前
- [ ] 是否使用了可重用組件？（見 `docs/COMPONENT_GUIDE.md`）
- [ ] 型別定義是否完整？
- [ ] 是否避免 `as any`？

### 提交前檢查
- [ ] `npm run type-check` 通過
- [ ] `npm run lint` 通過
- [ ] 沒有新增 console.log
- [ ] 沒有未使用的 imports

---

## 🔢 編號規範（固定標準）

| 項目 | 格式 | 範例 |
|------|------|------|
| 團號 | `{城市代碼}{YYMMDD}{A-Z}` | `CNX250128A` |
| 訂單 | `{團號}-O{2位數}` | `CNX250128A-O01` |
| 需求單 | `{團號}-RQ{2位數}` | `CNX250128A-RQ01` |
| 請款單 | `{團號}-I{2位數}` | `CNX250128A-I01` |
| 收款單 | `{團號}-R{2位數}` | `CNX250128A-R01` |
| 出納單 | `P{YYMMDD}{A-Z}` | `P250128A` |
| 客戶 | `C{6位數}` | `C000001` |
| 員工 | `E{3位數}` | `E001` |

編號生成邏輯：`src/stores/utils/code-generator.ts`

---

## 💡 給 AI 助手的提示

1. **優先使用現有組件** - 見 `docs/COMPONENT_GUIDE.md`
2. **保持一致性** - 遵循既有的架構模式
3. **型別安全優先** - 避免型別斷言
4. **簡潔回應** - 不要過度解釋
5. **等待確認** - 重大修改前先說明計劃
6. **主動修復** - 發現資料庫問題時直接透過 CLI 修復

### 行為控制
- **問題 → 只回答**，不執行操作
- **等待指令**：「執行」「修正」「開始」才動作
- **簡潔回應**：問什麼答什麼

---

## 📚 詳細規範文件索引

所有詳細規範已移至 `docs/` 目錄：

| 主題 | 文件 | 內容 |
|------|------|------|
| UI/UX | `docs/COMPONENT_GUIDE.md` | 莫蘭迪色系、組件使用、Table Cell、按鈕規範 |
| 效能 | `docs/PERFORMANCE_GUIDE.md` | 快取架構、N+1 查詢、資料載入、前端優化 |
| 程式碼 | `docs/CODE_STANDARDS.md` | 日期處理、Stale Closure、RSC 邊界、命名規範 |
| 架構 | `docs/ARCHITECTURE_STANDARDS.md` | 五層架構、核心哲學、資料流邊界 |
| 資料庫 | `docs/DATABASE_DESIGN_STANDARDS.md` | 命名規範、表格分類、Migration 流程 |
| RLS | `docs/SUPABASE_RLS_POLICY.md` | Row Level Security 策略 |
| 審查 | `docs/CODE_REVIEW_CHECKLIST.md` | 程式碼審查清單 |

---

**注意**: 這是精簡版規範，只包含 Claude 工作流程與快速指令。詳細技術規範請參考 `docs/` 目錄。
