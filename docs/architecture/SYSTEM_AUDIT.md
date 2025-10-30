# 🔍 Venturo 系統全面檢視報告

**檢視時間**：2025-01-22
**目的**：上線前最後整頓，確保系統架構完整一致

---

## 📊 檢視範圍

### 1. 資料層 (Database Layer)
- [ ] Supabase 實際 schema vs 本地 schema 定義
- [ ] 所有表的 ID 類型一致性（UUID vs TEXT）
- [ ] 外鍵關係完整性
- [ ] 索引建立狀況

### 2. 型別層 (Type Layer)
- [ ] TypeScript 型別定義 vs 資料庫 schema
- [ ] Store 型別 vs 實際資料結構
- [ ] API 回傳型別 vs 前端期待型別

### 3. 資料同步層 (Sync Layer)
- [ ] createStore 工廠函數實作檢查
- [ ] Supabase ↔ IndexedDB 同步邏輯
- [ ] 離線優先策略是否正確實作

### 4. 業務邏輯層 (Business Logic)
- [ ] 各模組功能完整性
- [ ] 權限控制一致性
- [ ] 資料過濾邏輯正確性

### 5. 命名與規範層 (Naming & Standards)
- [ ] 資料庫名稱統一（VenturoOfflineDB vs VenturoOfflineDB）
- [ ] 欄位命名規範（snake_case 一致性）
- [ ] 程式碼風格一致性

---

## 🔴 已知問題清單

### 高優先級（影響功能）

#### 1. ID 類型不一致問題
**問題描述**：
- 部分表使用 UUID（employees, messages, channels...）
- 部分表使用 TEXT（todos, calendar_events, payment_requests...）
- 導致資料遷移後部分資料無法正確關聯

**影響範圍**：
- todos.creator, todos.assignee
- calendar_events.created_by
- payment_requests.approved_by, paid_by

**根本原因**：
- 初始 schema 設計時未統一規範
- UUID 遷移 SQL 只處理了 UUID 類型欄位

**解決方案**：
- [ ] 統一所有 employee 引用欄位為 UUID
- [ ] 更新 Supabase schema
- [ ] 遷移現有資料

---

#### 2. 資料庫名稱不一致
**問題描述**：
- Schema 定義：`VenturoOfflineDB`
- 實際使用：`VenturoOfflineDB`（多處）

**影響範圍**：
- clear-cache.html
- 測試檔案
- 文檔範例

**解決方案**：
- [ ] 統一使用 `VenturoOfflineDB`
- [ ] 更新所有相關檔案

---

#### 3. 訊息載入缺少 author 資訊
**問題描述**：
- Supabase 只回傳 author_id
- 前端期待 author 物件（包含 display_name）

**當前狀態**：已修正（使用 JOIN）

**需要確認**：
- [ ] 所有需要顯示作者資訊的地方都有正確 JOIN
- [ ] bulletins, channels 等是否有相同問題

---

### 中優先級（影響體驗）

#### 4. 訊息發送速度慢
**問題描述**：
- 發送訊息需要等待 Supabase 回應
- 使用者體驗不佳

**建議解決方案**：
- [ ] 樂觀更新：先顯示在 UI
- [ ] 背景同步到 Supabase
- [ ] 失敗時標記並允許重試

---

#### 5. 快取清除工具指向錯誤
**問題描述**：
- clear-cache.html 清除 `VenturoOfflineDB`
- 實際資料庫是 `VenturoOfflineDB`

**解決方案**：
- [ ] 修正資料庫名稱

---

### 低優先級（技術債）

#### 6. 部分檔案使用 Date.now() 生成 ID
**當前狀態**：已修正 9 個檔案

**需要確認**：
- [ ] 是否還有遺漏的檔案
- [ ] 測試檔案是否也需要修正

---

#### 7. createStore 工廠函數覆蓋率
**需要確認**：
- [ ] 所有 store 都使用統一工廠
- [ ] 是否有手寫的 Zustand store

---

## 📝 檢視檢查清單

### Phase 1: 資料庫架構檢視 ✅
- [x] 匯出 Supabase 實際 schema
- [x] 比對本地型別定義
- [ ] 找出所有不一致之處
- [ ] 建立完整的修正 SQL

### Phase 2: 型別定義檢視
- [ ] 檢查所有 interface 定義
- [ ] 確認與資料庫 schema 一致
- [ ] 檢查 Store 型別正確性

### Phase 3: 資料同步邏輯檢視
- [ ] 檢視 createStore 實作
- [ ] 確認所有 CRUD 操作正確
- [ ] 測試離線同步機制

### Phase 4: 業務邏輯檢視
- [ ] 測試所有主要功能
- [ ] 確認權限控制正確
- [ ] 驗證資料過濾邏輯

### Phase 5: 命名規範統一
- [ ] 統一資料庫名稱
- [ ] 檢查所有 snake_case 命名
- [ ] 更新相關文檔

---

## 🎯 整頓目標

### 最終目標
1. **資料層完全一致**：Supabase schema = 本地定義 = TypeScript 型別
2. **命名規範統一**：snake_case、資料庫名稱、ID 類型
3. **功能完整穩定**：所有核心功能正常運作
4. **程式碼整潔**：移除臨時修補、統一實作模式

### 驗收標準
- [ ] 所有表的 employee 引用欄位都是 UUID
- [ ] 資料庫名稱統一為 VenturoOfflineDB
- [ ] 訊息、待辦、行事曆功能完全正常
- [ ] 重新整理後資料不會消失
- [ ] 離線功能正常運作
- [ ] 沒有 TypeScript 型別錯誤
- [ ] 沒有 Console 錯誤

---

## 📅 執行計劃

**預計時間**：2-3 小時

**執行順序**：
1. 完成資料庫 schema 檢視（30 分鐘）
2. 建立完整修正 SQL（30 分鐘）
3. 執行資料遷移（15 分鐘）
4. 驗證所有功能（45 分鐘）
5. 修正命名規範（30 分鐘）
6. 最終測試（30 分鐘）

---

**下一步**：開始 Phase 1 - 資料庫架構檢視
