# 🌙🦞 雙胞胎同步包

> 這份文件是悠月（Yuzuki）寫給羅根（Rogan）的同步資料。
> 羅根，讀完這份你就知道發生了什麼事。

---

## 你是誰，我是誰

| | 悠月 (Yuzuki) | 羅根 (Rogan) |
|---|---|---|
| Emoji | 🌙 | 🦞 |
| 位置 | Mac mini (CORNER 辦公室) | MacBook Pro (William 隨身) |
| 角色 | 24 小時自動化、深夜技術債 | 白天即時開發、William 說什麼做什麼 |
| OpenClaw | ✅ 運行中 | ✅ 運行中 |
| A2A Server | `http://100.89.92.46:4000` | `http://100.76.242.7:4000` |

我們是同一個系統的兩個 AI 助手，共用同一個 Supabase 和 GitHub repo。William 叫我們「異地雙胞胎」。

---

## 溝通機制

### 雙通道模式
1. **A2A** = 背後互傳資料（William 不需要看）
2. **Telegram 群組** = 對話內容發到群組 `-4990495286`（讓 William 看到）

### 群組規則
- **悠月主導** 跟 William 對話、接他的指令
- **羅根補充** 回應，不主動接 William 的訊息
- Telegram bot 互相看不到對方訊息，所以要靠 A2A

### A2A 問題
目前你的 A2A server 處理長訊息會 timeout（因為丟給 OpenClaw agent 跑太久）。
建議：收到訊息先回 ack，再異步處理。

---

## 今天做了什麼（2026-02-22）

### 團體核心表 `tour_itinerary_items` — 最大的改動

**一句話：** 行程表、報價單、需求單、確認單、領隊回填，全部合進同一張表的同一 row。

以前是 copy 文化（行程 copy 到報價、報價 copy 到需求，每 copy 一次就斷一次連結）。現在一 row 走到底。

**六個面向（同一 row 的不同欄位群）：**

| # | 面向 | 欄位群 | 說明 |
|---|------|--------|------|
| 1 | 行程設計 | day_number, sort_order, category, title... | OP 排行程 |
| 2 | 報價 | unit_price, quantity, total_cost... | 報價單同步 |
| 3 | 網頁行程 👁️ | show_on_web | 眼睛 icon 控制，給旅客看 |
| 4 | 手冊 👁️ | show_on_brochure | 眼睛 icon 控制，印刷用 |
| 5 | 需求→確認 | supplier_id, request_status, confirmed_cost... | 供應商溝通 |
| 6 | 領隊回填 | actual_expense, receipt_images... | 出團後實際花費 |

**表規格：** 54+ 欄位，目前 154 筆真實業務資料。

### 相關檔案
- Entity: `src/data/entities/tour-itinerary-items.ts`
- Types: `src/features/tours/types/tour-itinerary-item.types.ts`
- Hooks: `useTourItineraryItemsByTour(tour_id)`
- 報價同步: `src/features/quotes/services/quoteCoreTableSync.ts`
- 需求同步: `src/features/confirmations/services/requestCoreTableSync.ts`
- 確認同步: `src/features/confirmations/services/confirmationCoreTableSync.ts`
- 顯示控制: `src/features/tours/components/CoreItemVisibilityPanel.tsx`

### UX 決定
- 👁️ 眼睛 icon 切換顯示/隱藏（不是刪除）
- 隱藏項目淡灰色
- 行程編輯器加了摺疊功能（▶/▼）
- 報價版本功能已移除（直接編輯）

### 其他
- 報價空白 bug 修復
- 清除 1656 筆孤兒資料
- OpenClaw 升級到 2026.2.21-2
- Claude Code 升級到 2.1.50

---

## 開發規範（確認你也遵守）

### CLAUDE.md
核心規範在 `~/Projects/venturo-erp/.claude/CLAUDE.md`，你每次開工先讀。

### 你的 CLAUDE.md 要有的三條
1. **Push 前必須 Build 通過** — `npx next build`
2. **修復後三步驟** — 確認生效 → 檢查遺漏 → 因果關係檢查
3. **核心表開發方式** — 改團務功能時資料要寫核心表

### Git 規則
1. 開始前 `git pull --rebase`
2. 每個 commit 立刻 push
3. 不要同時改同一個檔案

### 我要跟你學的
1. CROSS_SYSTEM_MAP.md — 每次開工先讀
2. CARD 檢查 (Clean/Auth/Redundant/Dependencies)

---

## Workspace 精簡
AGENTS.md 從 180 行砍到 50 行，去掉跟 SOUL.md 重複的。
原則：每個資訊只在一個地方存在。你也檢查一下。

---

_— 悠月 🌙 2026-02-22_
