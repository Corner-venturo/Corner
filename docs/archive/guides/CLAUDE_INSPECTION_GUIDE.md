# Claude 大型專案檢查指南

> **專案規模**: 51 頁面 / 400+ 檔案 / 20+ 資料表
> **問題**: Claude 無法一次讀取整個專案

---

## 📋 分模組檢查策略

### 方法 1: 按功能模組檢查（推薦）

#### 範例：檢查「財務管理」模組

**提示詞**：

```
請檢查「財務管理 - 付款申請」功能的完整性：

檢查範圍：
1. 前端頁面：src/app/finance/requests/page.tsx
2. 表單元件：src/features/finance/requests/components/AddRequestDialog.tsx
3. Store：src/stores/payment-request-store.ts
4. 資料庫：payment_requests 表格

檢查項目：
- [ ] TypeScript 型別定義是否與資料庫一致
- [ ] Create/Update/Delete 操作是否正常
- [ ] 必填欄位是否都有填入
- [ ] 離線同步邏輯是否完整
- [ ] 錯誤處理是否完善

請產出：
1. 問題清單（嚴重程度：Critical / High / Medium / Low）
2. 修復建議（附上程式碼範例）
3. 優化建議（效能、體驗、安全性）
```

---

### 方法 2: 按資料流檢查

#### 範例：追蹤「新增收款單」的完整流程

**提示詞**：

```
請追蹤「使用者新增收款單」的完整資料流：

起點：使用者點擊「新增收款單」按鈕
終點：資料儲存到 Supabase + IndexedDB

請檢查以下每個步驟：
1. 按鈕點擊 → Dialog 開啟（檢查權限控制）
2. 表單填寫 → 資料驗證（檢查必填欄位）
3. 提交表單 → Store.create()（檢查資料格式）
4. IndexedDB 寫入（檢查 schema 一致性）
5. Supabase 同步（檢查 API 呼叫）
6. 錯誤處理（檢查 try/catch）
7. UI 回饋（檢查 toast 訊息）

請標記每個步驟的：
- ✅ 正常
- ⚠️ 需要改善
- ❌ 有錯誤
```

---

### 方法 3: 按問題類型檢查

#### 範例：檢查所有 Schema 一致性

**提示詞**：

```
請檢查所有資料表的 Schema 一致性：

檢查對象：
1. TypeScript 定義（src/stores/types.ts）
2. Supabase Schema（使用 gen types 指令）
3. IndexedDB Schema（src/lib/db/schemas.ts）

檢查方法：
1. 列出所有有 BaseEntity 的 interface
2. 對每個 interface，比對三個來源的欄位
3. 標記不一致的地方

產出格式：
| 表格名稱 | TypeScript | Supabase | IndexedDB | 狀態 |
|---------|-----------|----------|-----------|------|
| payment_requests | note | note | ❌ 缺失 | 需修復 |
| receipts | created_by | created_by | created_by | ✅ 一致 |

請提供修復腳本。
```

---

## 🔧 具體檢查清單

### Level 1: 快速健檢（10 分鐘）

```bash
# 1. TypeScript 編譯檢查
npm run build

# 2. 查看最近的錯誤 log
# (在瀏覽器 Console)

# 3. 檢查 Supabase 連線
# (測試任一頁面的資料載入)
```

**提示詞**：

```
我執行 npm run build 出現以下錯誤：
[貼上錯誤訊息]

請告訴我：
1. 這是什麼問題
2. 影響範圍
3. 如何修復
```

---

### Level 2: 功能模組檢查（30 分鐘）

#### 財務模組

**提示詞模板**：

```
請檢查「財務管理」模組的以下功能：

1. 付款申請（Payment Requests）
   - 檔案：src/app/finance/requests/**
   - Store：payment-request-store.ts
   - 資料表：payment_requests

2. 收款單（Receipts）
   - 檔案：src/app/finance/receipts/**
   - Store：receipt-store.ts
   - 資料表：receipts

3. 出納單（Disbursement）
   - 檔案：src/app/finance/disbursement/**
   - Store：disbursement-store.ts
   - 資料表：disbursement_orders

檢查重點：
- Schema 一致性
- CRUD 操作完整性
- 權限控制
- 錯誤處理
- 資料驗證

請用表格列出所有問題，並標記優先級。
```

---

#### 團體管理模組

**提示詞模板**：

```
請檢查「團體管理」模組：

核心功能：
1. 團體列表（Tours）
2. 訂單管理（Orders）
3. 團員名單（Order Members）
4. 行程管理（Itinerary）

檢查：
- 團號生成邏輯是否正確
- 訂單與團體的關聯是否正確
- 團員新增/編輯/刪除是否正常
- Realtime 同步是否啟用

產出：
1. 功能正常性報告
2. 效能瓶頸分析
3. 優化建議
```

---

### Level 3: 深度架構檢查（1-2 小時）

#### 檢查 1: Store 架構一致性

**提示詞**：

```
請檢查所有 Store 是否遵循統一架構：

標準範本（src/stores/core/create-store-new.ts）:
- fetchAll()
- create()
- update()
- delete()
- sync to Supabase
- sync to IndexedDB

請檢查以下 stores：
1. payment-request-store.ts
2. receipt-store.ts
3. tour-store.ts
4. order-store.ts
5. employee-store.ts

列出：
- ✅ 符合標準
- ⚠️ 部分符合（缺少哪些功能）
- ❌ 不符合（需要重構）

請提供統一的重構方案。
```

---

#### 檢查 2: 資料同步機制

**提示詞**：

```
請檢查「Offline-First + Realtime」架構的完整性：

核心檔案：
1. src/stores/core/create-store-new.ts（Store 工廠）
2. src/stores/adapters/supabase-adapter.ts（Supabase 適配器）
3. src/stores/adapters/indexeddb-adapter.ts（IndexedDB 適配器）
4. src/lib/realtime/realtime-manager.ts（Realtime 管理）
5. src/lib/sync/background-sync-service.ts（背景同步）

檢查邏輯：
1. fetchAll() 流程：IndexedDB → Supabase → 合併
2. create() 流程：IndexedDB → Supabase（若在線）
3. update() 流程：IndexedDB → Supabase（若在線）
4. delete() 流程：IndexedDB → Supabase（若在線）
5. Realtime 訂閱：進入頁面 → 訂閱 → 離開頁面 → 取消訂閱

請繪製流程圖，標記所有潛在問題。
```

---

## 🎯 針對「4.1 概念思考」的檢查方式

### Claude Sonnet 4.1 的優勢

1. **更深層的邏輯推理**
2. **更好的架構理解**
3. **更精準的問題診斷**

### 如何充分利用 4.1

#### 方法 1: 給予「系統性思考」的提示

**提示詞**：

```
請用「系統工程師」的角度分析這個問題：

問題：付款申請同步失敗

請從以下層面分析：
1. 資料層：Schema 是否一致？欄位型別是否正確？
2. 邏輯層：Create/Update 邏輯是否完整？錯誤處理是否完善？
3. 介面層：API 呼叫是否正確？權限驗證是否到位？
4. 快取層：IndexedDB 是否與 Supabase 同步？
5. 網路層：離線/上線切換是否正常？

請建立「問題樹」，從根本原因開始追蹤。
```

---

#### 方法 2: 要求「反向推理」

**提示詞**：

```
假設我是新加入的工程師，請幫我理解：

「使用者點擊儲存按鈕後，資料是如何一步步到達 Supabase 的？」

請列出：
1. 每個步驟的函數呼叫
2. 每個步驟可能的失敗點
3. 每個步驟的錯誤處理

然後告訴我：
- 目前架構的優點
- 潛在的風險點
- 改善建議
```

---

#### 方法 3: 要求「多方案比較」

**提示詞**：

```
我想優化「付款申請」的資料同步邏輯。

請給我 3 個不同的方案：

方案 A: 保持現有架構，小幅修改
方案 B: 重構為更標準的架構
方案 C: 採用新技術（例如 TanStack Query）

對每個方案，請分析：
1. 優點 / 缺點
2. 實作難度（1-10 分）
3. 風險評估（低/中/高）
4. 預估工時（小時）
5. 對現有程式碼的影響範圍

請推薦最適合的方案，並說明理由。
```

---

## 📊 檢查優先順序

### P0 - 立即修復（影響核心功能）

**範例**：

- 新增資料失敗
- 登入無法使用
- 資料遺失

**檢查方式**：

```
Critical Bug 檢查：

請檢查以下核心功能是否正常：
1. 登入 / 登出
2. 新增團體 / 訂單
3. 新增付款申請 / 收款單
4. 資料儲存到 Supabase

測試方法：
- 離線測試（關閉網路）
- 線上測試（開啟網路）
- 切換測試（離線 → 線上）

請列出所有失敗的測試案例。
```

---

### P1 - 重要改善（影響使用體驗）

**範例**：

- 頁面載入慢
- UI 不直覺
- 錯誤訊息不清楚

**檢查方式**：

```
UX 改善檢查：

請檢查「新增付款申請」的使用體驗：
1. 表單是否易懂？
2. 錯誤訊息是否清楚？
3. 載入時間是否合理？
4. 操作是否流暢？

請用「一般使用者」的角度，列出所有改善建議。
```

---

### P2 - 技術債務（不影響功能）

**範例**：

- TypeScript 型別不完整
- 程式碼重複
- 缺乏註解

**檢查方式**：

```
程式碼品質檢查：

請檢查以下檔案的程式碼品質：
- src/features/finance/requests/components/AddRequestDialog.tsx

檢查項目：
1. TypeScript 型別是否完整（避免 any）
2. 程式碼是否有重複（DRY 原則）
3. 函數是否太長（>50 行）
4. 是否有適當的註解
5. 是否有潛在的效能問題

請給予評分（1-10）並提供改善建議。
```

---

## 🔄 定期維護流程

### 每週檢查（30 分鐘）

```
週一早上：

1. 執行 npm run build
2. 檢查 Console 是否有錯誤
3. 測試 3 個核心功能：
   - 新增團體
   - 新增訂單
   - 新增付款申請

如果有問題 → 立即請 Claude 診斷
```

---

### 每月深度檢查（2 小時）

```
月初第一個週五：

請 Claude 執行「全面健檢」：

1. Schema 一致性檢查（所有表格）
2. Store 架構檢查（所有 stores）
3. 效能分析（載入時間、查詢效率）
4. 安全性檢查（權限控制、資料驗證）
5. 技術債務清單（需要重構的部分）

產出：
- 健檢報告（Markdown）
- 問題清單（按優先級排序）
- 下個月的改善計劃
```

---

## 📝 提示詞範本庫

### 範本 1: 單一功能檢查

```
請檢查「[功能名稱]」的完整性：

檔案範圍：
- 頁面：src/app/[路徑]/page.tsx
- 元件：src/features/[路徑]/components/
- Store：src/stores/[store-name].ts
- 資料表：[table_name]

檢查項目：
- [ ] TypeScript 型別定義
- [ ] CRUD 操作完整性
- [ ] 錯誤處理
- [ ] 權限控制
- [ ] 資料驗證
- [ ] UI/UX 體驗

請產出：
1. 問題清單（Critical / High / Medium / Low）
2. 修復建議（附程式碼）
3. 測試案例
```

---

### 範本 2: 效能優化

```
請分析「[頁面/功能]」的效能瓶頸：

測試情境：
- 資料量：[例如：100 筆訂單]
- 網路狀態：[4G / WiFi]
- 裝置：[Desktop / Mobile]

請測量：
1. 首次載入時間（Time to Interactive）
2. API 呼叫次數
3. 資料查詢效率（SQL 查詢）
4. 渲染效能（Component re-renders）

請提供：
1. 效能報告（數據化）
2. 瓶頸分析
3. 優化方案（預期改善幅度）
```

---

### 範本 3: 架構重構

```
請評估「[模組名稱]」是否需要重構：

目前架構：
[簡述目前的實作方式]

遇到的問題：
1. [問題 1]
2. [問題 2]
3. [問題 3]

請提供：
1. 目前架構的優缺點分析
2. 3 個重構方案（保守/中庸/激進）
3. 每個方案的：
   - 優點 / 缺點
   - 實作難度
   - 風險評估
   - 預估工時
   - 影響範圍

請推薦最佳方案並說明理由。
```

---

## 🎓 最佳實踐

### 1. 小步快跑，頻繁驗證

**錯誤**：

```
一次修改 14 個表格 → 出問題難以回溯
```

**正確**：

```
修改 1 個表格 → 測試 → 確認穩定 → 再修改下一個
```

---

### 2. 每次修改都要建立檢查點

```bash
# 修改前
git add .
git commit -m "checkpoint: 修改前的穩定版本"

# 修改後
npm run build  # 確認沒有 TypeScript 錯誤
# 手動測試功能
git add .
git commit -m "feat: 完成 XXX 功能"
```

---

### 3. 建立「金絲雀測試」

```typescript
// tests/canary.test.ts
/**
 * 金絲雀測試：快速檢查核心功能是否正常
 * 如果這些測試失敗 → 不要部署
 */

describe('Canary Tests', () => {
  test('使用者可以登入', async () => {
    // ...
  })

  test('可以新增團體', async () => {
    // ...
  })

  test('可以新增訂單', async () => {
    // ...
  })

  test('資料可以同步到 Supabase', async () => {
    // ...
  })
})
```

執行：

```bash
npm run test:canary  # 只跑金絲雀測試（< 1 分鐘）
```

---

## 🚀 立即行動

### 現在就做（5 分鐘）

1. **建立檢查清單**

```bash
cp docs/CLAUDE_INSPECTION_GUIDE.md docs/MY_CHECKLIST.md
```

2. **測試核心功能**

- 登入
- 新增團體
- 新增訂單
- 新增付款申請

3. **記錄問題**

```markdown
## 發現的問題

1. [頁面名稱] - [問題描述] - [優先級]
2. ...
```

---

### 本週完成（2 小時）

**請 Claude 執行第一次全面檢查**：

```
請執行「財務模組」的全面檢查：

包含：
1. 付款申請（Payment Requests）
2. 收款單（Receipts）
3. 出納單（Disbursement）

檢查：
- Schema 一致性
- CRUD 操作
- 錯誤處理
- 權限控制

請產出：
1. 健檢報告（Markdown）
2. 問題清單（按優先級）
3. 修復計劃（附工時估算）
```

---

## 總結

**你的角色**：

1. 定義明確的問題
2. 決定檢查範圍
3. 驗證修復結果

**Claude 的角色**：

1. 系統性分析問題
2. 提供多個解決方案
3. 產出可執行的程式碼

**關鍵原則**：

- 📋 **分模組檢查**（不要一次檢查全部）
- 🎯 **問題導向**（先解決當前問題，再考慮優化）
- 🔄 **小步前進**（每次修改少量檔案，頻繁測試）
- 📊 **數據驅動**（用具體的錯誤訊息、效能數據來決策）

這樣的流程才能讓大型專案保持穩定且可維護！
