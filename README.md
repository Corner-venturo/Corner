# Venturo 旅遊團管理系統

> 專業的旅遊團營運管理平台，提供完整的旅行社管理解決方案

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

---

## 📌 系統簡介

**Venturo** 是一套專為旅行社設計的營運管理系統，整合旅遊團規劃、訂單管理、財務追蹤、成員管理等核心功能，提供直覺的使用者介面與高效的工作流程。

### 核心特色

✅ **即時同步** - 多裝置即時資料同步，變更立即反映
✅ **快取優先** - 使用 IndexedDB 快取加速載入，確保流暢體驗
✅ **完整功能** - 涵蓋旅行社 80% 日常營運需求
✅ **響應式設計** - 完美支援桌面、平板、手機

---

## 🚀 快速開始

### 系統需求

- Node.js 18.17 或以上
- npm 9.0 或以上
- 支援的瀏覽器：Chrome、Edge、Safari、Firefox

### 安裝與啟動

```bash
# 1. 安裝依賴
npm install

# 2. 啟動開發伺服器
npm run dev

# 3. 開啟瀏覽器
http://localhost:3000
```

### 測試

```bash
npm test             # 執行所有測試
npm run test:watch   # 監看模式
npm run test:ui      # Vitest UI
npm run test:coverage # 覆蓋率報告
```

### 建置生產版本

```bash
# 建置
npm run build

# 執行
npm start
```

---

## 📦 核心功能

### 1. 旅遊團管理

- 團體資料建立與編輯
- 行程規劃與景點管理
- 團員名單管理
- 出團狀態追蹤

### 2. 訂單管理

- 訂單建立與報價
- 付款記錄追蹤
- 訂金與尾款管理
- 訂單狀態流程

### 3. 財務管理

- 應收帳款追蹤
- 應付帳款管理
- 預收款項記錄
- 財務報表總覽

### 4. 客戶管理

- 顧客資料維護
- 歷史訂單查詢
- 客戶標籤分類
- 備註與追蹤

### 5. 報價系統

- 快速報價單生成
- 報價單版本管理
- 成本利潤計算
- 報價單轉訂單

### 6. 基礎資料管理

- 地區與城市資料
- 景點資料庫
- 供應商管理
- 簽證資料管理

### 7. 團隊協作

- 工作空間系統
- 頻道訊息功能
- 待辦事項管理
- 行事曆排程

---

## 🏗️ 技術架構

### 前端技術棧

```
Next.js 15.5.4      - React 框架
React 19            - UI 框架
TypeScript 5        - 型別安全
TailwindCSS 3       - 樣式框架
Zustand 5          - 狀態管理
Framer Motion      - 動畫效果
```

### 後端與資料

```
Supabase           - 後端服務 (PostgreSQL)
IndexedDB          - 本地快取
Realtime           - 即時同步
```

### 架構模式

**Hybrid Feature-Based + Layer-Based Architecture**

```
src/
├── app/          - Next.js 路由與頁面 (51 頁面)
├── components/   - UI 組件 (185 個組件)
├── features/     - 功能模組 (88 檔案)
├── stores/       - 狀態管理 (36 檔案)
├── hooks/        - 自定義 Hooks (18 檔案)
├── lib/          - 工具函式 (29 檔案)
├── services/     - 業務服務 (5 檔案)
└── types/        - TypeScript 型別 (20 檔案)
```

---

## 🔄 資料同步機制

### 即時同步（Realtime）

- 使用 Supabase Realtime 實現多裝置即時同步
- 進入頁面時自動訂閱，離開時取消訂閱（按需訂閱模式）
- 變更 < 100ms 內同步到所有裝置

### 離線優先（Offline-First）

```
使用者操作 → 立即更新 UI
           ↓
           寫入 Supabase（雲端）
           ↓
           更新 IndexedDB（本地快取）
```

**離線行為**：

1. 離線時資料存入本地 IndexedDB
2. UI 立即反映變更
3. 網路恢復後自動上傳

---

## 📱 頁面導航

### 主要功能頁面

| 路徑          | 功能       | 說明                        |
| ------------- | ---------- | --------------------------- |
| `/`           | 首頁總覽   | 系統儀表板與快速導航        |
| `/tours`      | 旅遊團管理 | 團體列表、新增、編輯        |
| `/tours/[id]` | 團體詳情   | 行程、成員、財務等 6 個分頁 |
| `/orders`     | 訂單管理   | 訂單 CRUD、付款追蹤         |
| `/customers`  | 顧客管理   | 顧客資料庫                  |
| `/quotes`     | 報價系統   | 報價單管理                  |
| `/finance`    | 財務模組   | 應收應付、預收款項          |
| `/database`   | 基礎資料   | 地區、景點、供應商          |
| `/workspace`  | 工作空間   | 團隊協作、頻道訊息          |
| `/todos`      | 待辦事項   | 任務管理                    |
| `/calendar`   | 行事曆     | 排程管理                    |

---

## 🎨 設計規範

### 莫蘭迪色系

系統採用莫蘭迪色系，營造專業而溫和的視覺體驗。

```css
--morandi-primary: #3a3633 /* 主要文字 */ --morandi-secondary: #8b8680 /* 次要文字 */
  --morandi-gold: #c4a572 /* 強調色 */ --morandi-green: #9fa68f /* 成功狀態 */
  --morandi-red: #c08374 /* 警告狀態 */ --morandi-container: #e8e5e0 /* 容器背景 */;
```

### UI 設計原則

1. **響應式優先** - 完美適配所有螢幕尺寸
2. **統一佈局** - 標題左、操作右
3. **視覺層次** - 避免過度嵌套
4. **液態玻璃效果** - 半透明背景 + 模糊

---

## 🔧 開發指南

### 專案規範

完整的開發規範請參考：

- [CLAUDE.md](./.claude/CLAUDE.md) - AI 助手工作規範
- [docs/](./docs/) - 詳細技術文檔

### 命名規範

```typescript
// 組件: PascalCase
ChannelChat.tsx

// Hooks: camelCase
useUserStore.ts

// 工具: kebab-case
format - date.ts

// 型別: kebab-case + .types.ts
user - types.ts
```

### Store 使用方式

```typescript
// 1. 建立 Store
const useTourStore = createStore({
  tableName: 'tours',
  codePrefix: 'T'
});

// 2. 使用 Store
function ToursPage() {
  const { items, fetchAll, create, update, delete: deleteItem } = useTourStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return <div>...</div>;
}
```

### Realtime 即時同步

```typescript
// 在需要即時同步的頁面使用 Hook
import { useRealtimeForTours } from '@/hooks/use-realtime-hooks';

function ToursPage() {
  // 進入頁面時自動訂閱，離開時取消
  useRealtimeForTours();

  const tours = useTourStore(state => state.items);
  return <div>...</div>;
}
```

---

## 🗄️ 資料庫

### Supabase 管理

系統使用 Supabase 作為後端服務，所有資料庫變更透過 Migration 管理。

```bash
# 執行 Migration
SUPABASE_ACCESS_TOKEN=xxx npx supabase db push

# 生成型別定義
npx supabase gen types typescript --project-id xxx
```

### Migration 規範

所有 Migration 檔案必須遵循命名規範：

```
<timestamp>_description.sql

範例：
20251031095616_disable_todos_rls.sql
```

**重要**：Venturo 是內部管理系統，所有表格都應該禁用 RLS (Row Level Security)。

---

## 📊 專案統計

```
總頁面數：   51 個頁面
組件數量：   185 個組件
功能模組：   88 檔案
Store：      36 檔案
Hooks：      18 個自定義 Hooks
工具函式：   29 個工具
型別定義：   20 個型別檔案
```

---

## 🔍 常見問題

### Q: 資料會不會遺失？

A: 系統使用 Supabase 雲端資料庫 + IndexedDB 本地快取雙重保護，資料不會遺失。

### Q: 離線可以使用嗎？

A: 可以。離線時資料存在本地，網路恢復後自動同步。

### Q: 支援多少人同時使用？

A: 系統設計可支援中小型旅行社（20-50 員工）同時使用。

### Q: 需要安裝嗎？

A: 不需要。這是網頁應用程式，開啟瀏覽器即可使用。

---

## 📝 授權

此專案為商業專有軟體，未經授權不得複製、分發或修改。

**Copyright © 2025 Venturo. All rights reserved.**

---

## 📧 聯絡資訊

如有任何問題或建議，請聯絡：

- **專案維護者**: William Chien
- **專案狀態**: ✅ 生產就緒

---

**最後更新**: 2025-10-31
