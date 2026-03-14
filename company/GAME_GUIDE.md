# 🎮 Venturo ERP 遊戲攻略本

**版本**：v2.0  
**最後更新**：2026-03-14  
**攻略作者**：馬修（Matthew）— 遊戲工程師

---

## 📖 攻略本使用說明

這不只是技術文檔，這是一本**遊戲攻略**。

把 Venturo ERP 當成一個 RPG 遊戲：
- **世界地圖**：77 個路由（地點）→ [ARCHITECTURE_MAP.md](./ARCHITECTURE_MAP.md)
- **戰鬥系統**：核心功能（技能）
- **任務流程**：完整生命週期（主線任務）
- **數據面板**：核心表結構（角色屬性）
- **技能樹**：每個功能的觸發條件（技能解鎖）
- **快速參考卡**：1 頁快查（節省 token）→ [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

---

## ⚡ 快速開始（新手必讀）

### 開發時只需要這 2 頁

1. **[快速參考卡](./QUICK_REFERENCE.md)** ⭐
   - 1 頁 A4（~800 tokens）
   - 核心概念、檢查清單、程式碼範本
   - 節省 92% token

2. **[架構地圖](./ARCHITECTURE_MAP.md)** 🗺️
   - 系統全景圖
   - 模組分類、依賴關係
   - 資料流向、改進路線圖

**其他文檔按需查閱，不用全讀。** 🎯

---

## 🗺️ 世界地圖（網站地圖）

### **主城區（主要功能）**

#### 🏰 旅遊團管理區
```
/tours
  ├─ /tours/[id]               主線任務：旅遊團詳細頁
  │   ├─ Tab: 總覽             關卡 1：基本資訊
  │   ├─ Tab: 行程表           關卡 2：規劃路線（核心表寫入點）
  │   ├─ Tab: 報價單           關卡 3：計算成本（核心表讀取）
  │   ├─ Tab: 需求單           關卡 4：發送任務（核心表 JOIN）
  │   ├─ Tab: 確認單           關卡 5：確認訂單
  │   └─ Tab: 結帳單           關卡 6：完成結算
  │
  ├─ 狀態：draft/active/completed
  └─ 核心數據：tour_itinerary_items（唯一真相來源）
```

#### 💰 報價管理區
```
/quotes
  ├─ /quotes/[id]              支線任務：報價單編輯
  │   ├─ 分類：交通/住宿/餐食/活動/其他
  │   ├─ 個人分攤計算
  │   └─ 寫回核心表
  │
  └─ 數據來源：tour_itinerary_items
```

#### 📋 訂單管理區
```
/orders
  ├─ /orders/[id]              支線任務：訂單處理
  │   ├─ 團員管理
  │   ├─ 收款記錄
  │   └─ 代收轉付
  │
  └─ 關聯：tour_id → tours
```

#### 🏢 供應商管理區
```
/suppliers
  ├─ /suppliers/[id]           NPC 資料庫
  │   ├─ 基本資料
  │   ├─ 需求單收件匣
  │   └─ 回覆管理
  │
  └─ 類型：hotel/restaurant/transport/attraction
```

---

## ⚔️ 戰鬥系統（核心功能）

### **技能 1：報價系統**

```
技能名稱：個人分攤計算
等級要求：Lv.1
消耗 MP：無

技能效果：
  1. 從核心表讀取項目
  2. 計算個人成本
     - 餐廳：unit_price（固定 quantity=1）
     - 活動：unit_price（固定 quantity=1）
     - 住宿：unit_price ÷ quantity（幾人房）
     - Local：階梯報價（人數自動切換）
  3. 寫回核心表

觸發條件：
  - 行程表有資料
  - 進入報價單 Tab

數據流向：
  tour_itinerary_items（讀取）
    ↓ 計算
  tour_itinerary_items（寫回 unit_price, quantity）
```

---

### **技能 2：需求單系統**

```
技能名稱：從核心表產生需求單
等級要求：Lv.2
消耗 MP：無

技能效果：
  1. 從核心表 JOIN 讀取
     - tour_itinerary_items
     - restaurants（地址、電話）
     - hotels（地址、電話）
  2. 帶入訂單總人數
  3. 產生 PDF（桌數/房間數空白）
  4. 更新核心表狀態
     - request_status = 'sent'
     - request_sent_at = now()

觸發條件：
  - 報價單已填寫
  - 點擊「列印需求單」按鈕

數據流向：
  tour_itinerary_items（JOIN 讀取）
    ↓ 產生 PDF
  tour_itinerary_items（更新 request_status）
```

---

### **技能 3：Local 報價**

```
技能名稱：階梯報價自動切換
等級要求：Lv.2
消耗 MP：無

技能效果：
  1. 輸入階梯報價
     - 10人：$5,000/人
     - 20人：$4,000/人
     - 30人：$3,333/人
  2. 自動判斷適用階梯
  3. 顯示多列項目
  4. 禁止直接編輯

觸發條件：
  - 點擊「Local 報價」按鈕
  - 輸入階梯資訊

數據流向：
  LocalPricingDialog（輸入）
    ↓ 產生多個 CostItem
  categories（顯示）
    ↓ 寫回
  tour_itinerary_items（核心表）
```

---

## 🎯 主線任務（完整生命週期）

### **主線 1：開團流程**

```
步驟 1：建立旅遊團
  位置：/tours
  操作：點擊「新增旅遊團」→ 選擇「開團」
  資料：tours 表

步驟 2：規劃行程
  位置：/tours/[id] → 行程表 Tab
  操作：
    - 選餐廳（從 restaurants 表）
    - 選飯店（從 hotels 表）
    - 選景點（從 attractions 表）
  資料：tour_itinerary_items（核心表）← 寫入點

步驟 3：填寫報價
  位置：/tours/[id] → 報價單 Tab
  操作：
    - 填寫每個項目的價格
    - 餐廳：$1,000/人（quantity 固定=1）
    - 住宿：$3,500/2人房（quantity=2）
    - Local：階梯報價
  資料：tour_itinerary_items（核心表）← 寫回

步驟 4：產生需求單
  位置：/tours/[id] → 需求單 Tab
  操作：
    - 選擇供應商
    - 點擊「列印需求單」
    - 桌數/房間數助理手動填
  資料：tour_itinerary_items（核心表）← JOIN 讀取
         request_status ← 更新狀態

步驟 5：供應商回覆
  位置：/supplier/requests
  操作：
    - 供應商填寫確認價格
    - 回覆系統
  資料：tour_itinerary_items（核心表）← 更新 quoted_cost

步驟 6：確認訂單
  位置：/tours/[id] → 確認單 Tab
  操作：
    - 確認最終價格
    - 產生確認單給領隊
  資料：tour_itinerary_items（核心表）← 讀取

步驟 7：領隊回填
  位置：/tours/[id] → 結帳單 Tab
  操作：
    - 領隊填寫實際費用
    - 上傳收據
  資料：tour_itinerary_items（核心表）← 更新 actual_expense
```

---

## 📊 數據面板（核心表結構）

### **核心表：tour_itinerary_items**

這是整個遊戲的**角色屬性表**，所有數據的唯一真相來源。

```sql
tour_itinerary_items {
  -- 基本屬性
  id UUID                      -- 唯一 ID
  tour_id UUID                 -- 所屬團
  day_number INT               -- 第幾天
  category TEXT                -- 分類
  sub_category TEXT            -- 子分類
  title TEXT                   -- 項目名稱
  
  -- 戰鬥屬性（報價資訊）
  unit_price DECIMAL           -- 單價（ATK）
  quantity INT                 -- 數量（Combo）
  total_cost DECIMAL           -- 小計（DMG）
  adult_price DECIMAL          -- 成人價
  child_price DECIMAL          -- 兒童價
  infant_price DECIMAL         -- 嬰兒價
  
  -- 任務狀態
  quote_status TEXT            -- drafted/quoted/confirmed
  request_status TEXT          -- none/sent/replied
  confirmation_status TEXT     -- none/confirmed
  leader_status TEXT           -- none/filled/reviewed
  
  -- 回覆屬性
  quoted_cost DECIMAL          -- 供應商報價
  confirmed_cost DECIMAL       -- 確認價格
  actual_expense DECIMAL       -- 實際費用
  
  -- 時間戳
  request_sent_at TIMESTAMP    -- 需求單發送時間
  request_reply_at TIMESTAMP   -- 供應商回覆時間
  confirmed_at TIMESTAMP       -- 確認時間
  expense_at TIMESTAMP         -- 結帳時間
}
```

---

### **狀態機（State Machine）**

```
quote_status:
  none → drafted → quoted → confirmed
  
request_status:
  none → sent → replied → confirmed
  
confirmation_status:
  none → pending → confirmed
  
leader_status:
  none → filled → reviewed
```

---

## 🔧 技能樹（功能觸發條件）

### **行程表 → 報價單**

```
前置條件：
  ✓ tour_itinerary_items 有資料
  ✓ 至少有 1 個項目

觸發：
  進入報價單 Tab

效果：
  coreItemsToCostCategories()
    → 從核心表讀取
    → 轉換成報價單格式
    → 顯示在 UI
```

---

### **報價單 → 需求單**

```
前置條件：
  ✓ quote_status = 'quoted'
  ✓ unit_price 已填寫

觸發：
  點擊「列印需求單」

效果：
  useCoreRequestItems()
    → JOIN restaurants/hotels
    → useTotalPax()（帶入總人數）
    → 產生 PDF
    → 更新 request_status = 'sent'
```

---

### **需求單 → 確認單**

```
前置條件：
  ✓ request_status = 'replied'
  ✓ quoted_cost 已填寫

觸發：
  確認供應商回覆

效果：
  更新 confirmation_status = 'confirmed'
    → confirmed_cost = quoted_cost
    → 產生確認單給領隊
```

---

## 🐛 已知 Bug（需要修復的問題）

### **Bug #1：Local 報價階梯切換**
```
問題：人數變動時，適用階梯不會自動更新
狀態：待修復
優先級：P2
```

### **Bug #2：需求單 PDF 格式**
```
問題：桌數/房間數欄位格式需確認
狀態：待測試
優先級：P1
```

---

## 📝 開發日誌

### **2026-03-14**
- ✅ Local 報價禁止直接編輯
- ✅ Local 報價多列顯示
- ✅ 需求單核心表模式
- ✅ 移除 is_from_core（簡化）
- ✅ 建立遊戲攻略本 v1.0
- ⏳ 深度研究每個功能
- ⏳ 完善攻略內容

---

## 🎓 新手教學

### **如何理解這個系統？**

```
核心概念：
  tour_itinerary_items = 唯一真相來源
  
  其他表都是「視圖」：
    - tours：團的基本資料
    - quotes：報價單（從核心表計算）
    - orders：訂單（關聯核心表）
    - tour_requests：需求單狀態（核心表記錄）

資料流向：
  行程表（寫入）
    → tour_itinerary_items
    → 報價單（讀取 + 寫回）
    → tour_itinerary_items
    → 需求單（JOIN 讀取）
    → tour_itinerary_items（更新狀態）
```

---

## 🚀 進階攻略（待補完）

- [ ] 每個按鈕的詳細行為
- [ ] 欄位之間的計算關係
- [ ] 錯誤處理機制
- [ ] 效能優化技巧
- [ ] 常見問題 FAQ

---

**攻略持續更新中...**  
**有問題隨時問遊戲工程師 Matthew！** 🎮
