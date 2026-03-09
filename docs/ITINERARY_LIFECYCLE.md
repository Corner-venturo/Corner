# 行程生命週期架構

> 最後更新：2026-01-31

## 🎯 核心原則

**Single Source of Truth** — 行程資料只做一次，多處使用

---

## 📊 問題：同一行程做三次

| 階段 | 產出       | 問題              |
| ---- | ---------- | ----------------- |
| 提案 | 網頁行程   | 第 1 版           |
| 開團 | 手冊       | 第 2 版（重做）   |
| 出團 | Online App | 第 3 版（又重做） |

**浪費人力 + 版本錯亂**

---

## ✅ 解決方案

### 資料流

```
┌─────────────────────────────────────────────────────────────┐
│                    ERP (venturo-erp)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  【提案階段】packages                                        │
│      └── itinerary_id                                       │
│          (可編輯、可多版本比較)                               │
│                 ↓                                           │
│          客戶確認，選定最終版本                               │
│                 ↓                                           │
│  【開團階段】tours                                           │
│      └── itinerary_id (鎖定)                                │
│      └── brochure_settings (手冊排版：顯示/隱藏景點)         │
│                 ↓                                           │
│  【訂單】orders                                              │
│      └── tour_id                                            │
│      └── members                                            │
│                 ↓                                           │
│          確認交接                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                    │
                    │ 複製最終版本
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                  Online (venturo-online)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  trips 表                                                   │
│      └── source: 'erp' | 'user'                            │
│      └── erp_tour_id (如果來自 ERP)                         │
│      └── itinerary_data (行程資料)                          │
│                                                             │
│  【領隊】根據現況更新時間                                    │
│  【旅客】查看每日行程                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 三個產出，一份資料

| 產出           | 來源                            | 差異           |
| -------------- | ------------------------------- | -------------- |
| **網頁行程**   | itineraries                     | 全部顯示       |
| **手冊**       | itineraries + brochure_settings | 可隱藏部分景點 |
| **Online App** | trips (從 itineraries 複製)     | 領隊可更新時間 |

---

## 🔐 關鍵規則

| 規則         | 說明                                       |
| ------------ | ------------------------------------------ |
| **開團前**   | itinerary 可自由編輯、可有多版本           |
| **開團後**   | itinerary 鎖定，只能修改內容，不能新增版本 |
| **手冊隱藏** | 設定存在 brochure_settings，不影響原始資料 |
| **複製時機** | 確認交接時（最終版本）                     |
| **時間欄位** | 選填，領隊可在 Online 更新                 |

---

## 📱 Online 使用場景

### 旅客查看行程

```
┌─────────────────────────┐
│  Day 2 · 1月31日        │
├─────────────────────────┤
│  ● 08:30 飯店大廳集合    │
│                         │
│  ● 09:00 出發前往鐮倉    │
│    [活動圖片]            │
│    經典灌籃高手平交道... │
│                         │
│  ● 12:30 午餐自理        │
└─────────────────────────┘
```

### 領隊更新時間

```
客人：「明天幾點集合？」

領隊打開 App → 更新集合時間 → 旅客馬上看到
```

---

## 📋 Online trips 表設計

```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 來源
  source TEXT NOT NULL CHECK (source IN ('erp', 'user')),
  erp_tour_id UUID REFERENCES erp_tours(id),  -- 如果來自 ERP

  -- 基本資訊
  title TEXT NOT NULL,
  subtitle TEXT,
  cover_image TEXT,
  departure_date DATE,
  return_date DATE,

  -- 行程資料 (JSONB)
  itinerary_data JSONB NOT NULL DEFAULT '{}',
  -- 結構：
  -- {
  --   "dailyItinerary": [
  --     {
  --       "day": 1,
  --       "activities": [
  --         {
  --           "title": "飯店大廳集合",
  --           "startTime": "0830",
  --           "endTime": "0900",
  --           "description": "...",
  --           "image": "..."
  --         }
  --       ],
  --       "meals": { "breakfast": "飯店內", "lunch": "自理", "dinner": "..." },
  --       "hotel": "..."
  --     }
  --   ],
  --   "outboundFlight": {...},
  --   "returnFlight": {...},
  --   "hotels": [...]
  -- }

  -- 狀態
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),

  -- 權限
  created_by UUID REFERENCES users(id),
  leader_id UUID REFERENCES users(id),  -- 領隊

  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 團員關聯
CREATE TABLE trip_members (
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  PRIMARY KEY (trip_id, user_id)
);
```

---

## 🚀 待實作

### ERP 端

1. [ ] 「確認交接」按鈕 — tours 詳情頁
2. [ ] 複製 itinerary 到 Online API
3. [ ] brochure_settings 欄位（手冊隱藏景點）

### Online 端

1. [ ] trips 表 migration
2. [ ] `/api/trips/sync-from-erp` API
3. [ ] `/trips/[id]` 行程詳情頁
4. [ ] 領隊編輯時間功能
5. [ ] 推播通知（時間更新時）

---

## 📝 相關文件

- `VENTURO_VISION.md` — 雙平台架構
- `CROSS_SYSTEM_MAP.md` — 跨系統影響地圖
- `venturo-online/.claude/CLAUDE.md` — Online 開發規範
