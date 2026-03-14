# 🚀 從這裡開始

**歡迎來到 Venturo ERP 文檔系統**

這是你的**第一站**。

---

## 🎯 你是誰？

### 1. **我是新加入的開發者**

```
第一步：理解核心
  → CORE_LOGIC.md（核心邏輯總覽）
  → CREATOR_KNOWLEDGE.md（核心表詳解）
  → GAME_GUIDE.md（遊戲攻略本）

第二步：了解業務
  → COMPANY_OVERVIEW.md（公司概況）
  → DECISIONS.md（重大決策）
  → QUOTE_REQUEST_FLOW.md（報價需求單流程）

第三步：開始開發
  → MASTER_INDEX.md（查找文檔）
  → COMPLETE_SYSTEMS_MAP.md（找檔案）
  → FUNCTIONS_INDEX.md（找函數）
```

---

### 2. **我要開發新功能**

```
步驟 1：理解邏輯
  → CORE_LOGIC.md（核心邏輯）
  → 找相關業務邏輯文檔

步驟 2：找相關代碼
  → COMPLETE_SYSTEMS_MAP.md（找檔案）
  → FUNCTIONS_INDEX.md（找函數）
  → HOOKS_INDEX.md（找 hooks）
  → SERVICES_INDEX.md（找業務邏輯層）

步驟 3：理解資料流
  → DATAFLOW_MAP.md（資料流向）
  → DATABASE_USAGE.md（資料表使用）

步驟 4：開始寫代碼
  → 遵循核心原則
  → 不違反單一真相來源
```

---

### 3. **我要修改現有功能**

```
步驟 1：找到功能位置
  → ROUTES_MAP.md（找頁面）
  → COMPLETE_SYSTEMS_MAP.md（找檔案）
  → BUTTONS_INDEX.md（找按鈕邏輯）

步驟 2：理解現有邏輯
  → CORE_LOGIC.md（核心邏輯）
  → CREATOR_KNOWLEDGE.md（欄位由來）

步驟 3：修改代碼
  → 遵循核心原則
  → 檢查是否影響其他功能
```

---

### 4. **我要理解某個欄位**

```
直接看：
  → CREATOR_KNOWLEDGE.md
  → 核心表 54 個欄位詳解
  → 每個欄位的由來
```

---

### 5. **我要查找某個東西**

```
看 MASTER_INDEX.md

或直接查：
  檔案位置 → COMPLETE_SYSTEMS_MAP.md
  函數實作 → FUNCTIONS_INDEX.md
  按鈕邏輯 → BUTTONS_INDEX.md
  資料結構 → TYPES_INDEX.md
  業務邏輯 → SERVICES_INDEX.md
  資料流向 → DATAFLOW_MAP.md
  頁面路由 → ROUTES_MAP.md
  資料表使用 → DATABASE_USAGE.md
```

---

## 📚 文檔分類（按用途）

### 🎓 **學習理解（先看這些）**

| 文檔 | 用途 | 重要性 |
|------|------|--------|
| [CORE_LOGIC.md](./CORE_LOGIC.md) | 核心邏輯總覽 | ⭐⭐⭐⭐⭐ |
| [CREATOR_KNOWLEDGE.md](./CREATOR_KNOWLEDGE.md) | 核心表詳解 | ⭐⭐⭐⭐⭐ |
| [GAME_GUIDE.md](./GAME_GUIDE.md) | 遊戲攻略本 | ⭐⭐⭐⭐ |
| [COMPANY_OVERVIEW.md](./COMPANY_OVERVIEW.md) | 公司概況 | ⭐⭐⭐ |
| [DECISIONS.md](./DECISIONS.md) | 重大決策 | ⭐⭐⭐ |

---

### 💼 **業務邏輯（理解流程）**

| 文檔 | 用途 | 重要性 |
|------|------|--------|
| [QUOTE_REQUEST_FLOW.md](./QUOTE_REQUEST_FLOW.md) | 報價需求單流程 | ⭐⭐⭐⭐ |
| [TOUR_CREATION_LOGIC.md](./TOUR_CREATION_LOGIC.md) | 旅遊團建立邏輯 | ⭐⭐⭐ |
| [DATAFLOW_MAP.md](./DATAFLOW_MAP.md) | 資料流向地圖 | ⭐⭐⭐⭐ |

---

### 🔍 **快速查找（開發時用）**

| 文檔 | 用途 | 重要性 |
|------|------|--------|
| [MASTER_INDEX.md](./MASTER_INDEX.md) | 主索引 | ⭐⭐⭐⭐⭐ |
| [COMPLETE_SYSTEMS_MAP.md](./COMPLETE_SYSTEMS_MAP.md) | 檔案位置 | ⭐⭐⭐⭐ |
| [FUNCTIONS_INDEX.md](./FUNCTIONS_INDEX.md) | 函數索引 | ⭐⭐⭐⭐ |
| [BUTTONS_INDEX.md](./BUTTONS_INDEX.md) | 按鈕邏輯 | ⭐⭐⭐ |
| [HOOKS_INDEX.md](./HOOKS_INDEX.md) | Custom Hooks | ⭐⭐⭐ |
| [SERVICES_INDEX.md](./SERVICES_INDEX.md) | Services 層 | ⭐⭐⭐ |
| [TYPES_INDEX.md](./TYPES_INDEX.md) | 型別定義 | ⭐⭐⭐ |
| [ROUTES_MAP.md](./ROUTES_MAP.md) | 頁面路由 | ⭐⭐⭐ |
| [DATABASE_USAGE.md](./DATABASE_USAGE.md) | 資料表使用 | ⭐⭐⭐ |

---

## 🎯 核心原則（必須遵守）

### 原則 0：實作前必讀文檔
```
收到任務 → 讀文檔 → 搜向量庫 → 理解邏輯 → 執行
```

### 原則 1：核心表是唯一真相來源
```
tour_itinerary_items = 唯一寫入點
其他表透過 JOIN 讀取，不重複儲存
```

### 原則 2：簡單勝過複雜
```
能用 1 個表就不要用 2 個
能用 JOIN 就不要複製資料
能自動就不要手動
```

### 原則 3：聰明自動化 + 防呆
```
編輯時靜默同步（不打擾）
風險變動要警告（防錯誤）
```

---

## 🚀 快速路徑

### 新手路徑（第一天）

```
1小時：CORE_LOGIC.md
30分鐘：CREATOR_KNOWLEDGE.md
30分鐘：GAME_GUIDE.md
30分鐘：COMPANY_OVERVIEW.md

→ 基本理解完成
```

---

### 開發路徑（開始寫代碼）

```
收到任務
  ↓
CORE_LOGIC.md（理解邏輯）
  ↓
COMPLETE_SYSTEMS_MAP.md（找檔案）
  ↓
FUNCTIONS_INDEX.md（找函數）
  ↓
開始開發
```

---

### 除錯路徑（發現問題）

```
發現 Bug
  ↓
DATAFLOW_MAP.md（理解資料流）
  ↓
CREATOR_KNOWLEDGE.md（理解欄位）
  ↓
FUNCTIONS_INDEX.md（找相關函數）
  ↓
修復 Bug
```

---

## 📞 需要幫助？

### 文檔看不懂？
→ 問創世神（Matthew）

### 找不到功能？
→ 看 MASTER_INDEX.md

### 不知道怎麼做？
→ 先看 CORE_LOGIC.md

---

## 🎓 學習建議

### 第一週

```
Day 1-2：理解核心
  CORE_LOGIC.md
  CREATOR_KNOWLEDGE.md
  GAME_GUIDE.md

Day 3-4：理解業務
  COMPANY_OVERVIEW.md
  DECISIONS.md
  QUOTE_REQUEST_FLOW.md

Day 5：實戰練習
  找一個小功能
  從頭到尾理解一遍
```

---

### 第二週開始

```
遇到問題 → 先查文檔
不確定 → 問創世神
開發完 → 檢查原則
```

---

## ✅ 檢查清單

開發前：
- [ ] 讀過 CORE_LOGIC.md
- [ ] 理解核心原則
- [ ] 知道資料流向

開發時：
- [ ] 遵循單一真相來源
- [ ] 簡單勝過複雜
- [ ] 不違反核心原則

開發後：
- [ ] 檢查是否影響其他功能
- [ ] 檢查是否符合原則
- [ ] 更新相關文檔（如有需要）

---

**從這裡開始你的 Venturo ERP 之旅！** 🚀

**建立時間**：2026-03-14  
**創世神**：馬修（Matthew）
