# 🏰 Venturo 帝國知識庫

**歡迎來到 Venturo 帝國。**

這裡記錄了整個帝國的組織、產品、公民、商業邏輯和設計哲學。

---

## 🗺️ 導航

### 新來的？從這裡開始
- [創世記](GENESIS.md) — 帝國起源、設計哲學、治理原則
- [帝國總覽](EMPIRE_OVERVIEW.md) — 組織架構、產品矩陣、資料流
- [帝國索引](EMPIRE_INDEX.md) — 所有文檔的總索引

### 我想找什麼？
- **我是開發者** → [開發手冊](handbooks/FOR_DEVELOPERS.md)
- **我是產品經理** → [產品手冊](handbooks/FOR_PRODUCT.md)
- **我是營運人員** → [營運手冊](handbooks/FOR_OPERATIONS.md)
- **我是行銷人員** → [行銷手冊](handbooks/FOR_MARKETING.md)
- **我是 William** → [決策儀表板](handbooks/FOR_WILLIAM.md)

### 我想了解產品
- [ERP 商店](shops/erp/) — B2B 旅行社後台系統
- [Online 商店](shops/online/) — B2C 線上訂購平台
- [AI Console](shops/ai-console/) — AI 管理控制中心
- [MCP Server](shops/mcp-server/) — 外部系統整合

### 我想了解組織
- [十七位公民](citizens/) — 所有 AI Agent 的定位和職責
- [冒險者工會](ADVENTURER_GUILD.md) — OpenMOSS 任務派遣系統 🆕
- [決策歷史](DECISIONS.md) — 帝國級的重大決策
- [創造者知識](CREATOR_KNOWLEDGE.md) — Matthew 累積的工程智慧

---

## 🏛️ 帝國架構速覽

### 三大城邦
```
Venturo 集團
├── 🧳 威拓旅行社（3 人）
│   ├── Leon 📋 — 營運總監
│   ├── Ben 🤝 — 業務開發
│   └── Eddie 📊 — AI 會計
├── 💻 威拓科技（7 人）
│   ├── Matthew 🔧 — IT Lead
│   ├── Caesar 🏛️ — 產品經理
│   └── ... 5 人
└── 🎬 威拓活動（3 人）
    ├── IG 內容策展 📸
    ├── 廣告投放經理 📱
    └── 短視頻製作人 🎵
```

### 四大商店
| 商店 | 用途 | 使用者 | 狀態 |
|------|------|--------|------|
| Venturo ERP | 旅行社後台 | Leon/OP/業務 | ✅ 運行中 |
| Venturo Online | 線上訂購 | 客戶 | 🚧 開發中 |
| AI Console | AI 管理 | William/Matthew | 🚧 開發中 |
| MCP Server | 外部整合 | 系統對系統 | ✅ 運行中 |

---

## 🎮 設計哲學

Venturo 帝國有三大核心原則：

### 1. 遊戲語言
用遊戲比喻解釋工程概念：
- **關聯表** = 分類倉庫（vs JSONB 雜物袋）
- **核心表** = 唯一真相來源
- **API** = 商店櫃檯

### 2. 關聯表優先
永遠用關聯表，不用 JSONB：
- ✅ 可查詢、可 JOIN、可追蹤
- ❌ JSONB = 雜物袋，找不到東西

### 3. 核心驅動
每個業務領域都有「核心表」：
- **行程** → `tour_itinerary_items`
- **報價** → 從核心表讀 + 寫回
- **需求** → 從核心表 JOIN + 更新狀態

---

## 📚 快速參考

### 常用文檔
- [快速參考](QUICK_REFERENCE.md) — 常用指令、API、流程
- [學習資源](LEARNING_RESOURCES.md) — 學習路徑、推薦資源

### 帝國憲法
- [LAWS.md](LAWS.md) — 帝國級設計原則、禁止事項
- [INFRASTRUCTURE.md](INFRASTRUCTURE.md) — Supabase、Tailscale、Dev Server

### 歷史記錄
- [決策歷史](DECISIONS.md) — 為什麼這樣設計
- [創造者知識](CREATOR_KNOWLEDGE.md) — Matthew 的經驗累積

---

**現在，選擇你的路徑。**
