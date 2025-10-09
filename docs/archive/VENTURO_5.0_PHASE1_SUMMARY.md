# Venturo 5.0 - Phase 1 架構總結

## 核心概念

**Venturo 5.0 採用階段性開發策略，現在是 Phase 1**

### Phase 1: 本地開發（現在）⬅️ 我們在這裡
- ✅ **純 IndexedDB**（瀏覽器本地資料庫）
- ✅ **無需後端**（不用 Supabase）
- ✅ **簡單密碼**（統一用 `Venturo2025!`）
- ✅ **快速迭代**（專注功能開發）

### Phase 2: 內部測試（2週後）
- 加入認證機制
- 資料驗證
- 錯誤處理

### Phase 3: 生產環境（1個月後）
- 接入 Supabase
- bcrypt 密碼加密
- 多人協作
- 資料同步

---

## 當前架構（Phase 1）

```
使用者 → 登入頁面 → AuthServiceV5 (IndexedDB) → auth-store
                                    ↓
                            查詢 IndexedDB users 表
                                    ↓
                            密碼固定: Venturo2025!
                                    ↓
                               登入成功 → 工作區

HR 頁面 → DatabaseInitializer → 確保 William 帳號存在
              ↓
         user-store → SafeDB.getAll('users')
              ↓
         從 IndexedDB 讀取員工資料
              ↓
         顯示員工列表
```

---

## 關鍵檔案說明

### 1. **auth-service-v5.ts** - 認證服務
```typescript
// Phase 1: 簡單驗證
- 檢查 employeeNumber 存在
- 密碼固定: Venturo2025!
- 查詢 IndexedDB users 表
```

### 2. **user-store.ts** - 員工資料管理
```typescript
// Phase 1: 純 IndexedDB CRUD
- loadUsersFromDatabase() → SafeDB.getAll('users')
- addUser() → SafeDB.create('users', ...)
- updateUser() → SafeDB.update('users', ...)
- deleteUser() → SafeDB.delete('users', ...)
```

### 3. **database-initializer.ts** - 資料庫初始化
```typescript
// 確保 IndexedDB 有預設管理員
- 檢查 users 表是否為空
- 如果空的，建立 William 管理員帳號
  - employeeNumber: william01
  - 測試密碼: Venturo2025!
```

### 4. **safe-db.ts** - 防禦性資料庫層
```typescript
// 確保不會回傳 undefined
- getAll() → 永遠回傳陣列 ([] 或 [data])
- create/update/delete → 有錯誤處理
```

---

## 資料流程

### 登入流程
1. 輸入 `william01` / `Venturo2025!`
2. AuthServiceV5 查詢 IndexedDB
3. 找到使用者 → 檢查密碼
4. 密碼正確 → 建立 session
5. 導向工作區

### HR 頁面載入
1. DatabaseInitializer.ensureInitialized()
2. 檢查 IndexedDB users 表
3. 如果是空的 → 建立 William
4. user-store.loadUsersFromDatabase()
5. SafeDB.getAll('users')
6. 顯示員工列表

---

## 為什麼現在不用 Supabase？

### 設計理念（從 VENTURO_5.0_MANUAL.md）

1. **簡單優先**
   - Phase 1 只需要讓功能跑起來
   - 不需要複雜的認證、權限、加密

2. **漸進增強**
   - 先用 IndexedDB 開發功能
   - 等功能穩定後再加入 Supabase
   - 避免一開始就處理複雜的後端問題

3. **保持彈性**
   - VenturoAPI 已經準備好了
   - 等 Phase 3 時，只需切換資料來源
   - 不用重寫整個系統

### 開發效率

**Phase 1（現在）**：
- 改程式 → 重新整理瀏覽器 → 立即看到結果
- 不用管 Supabase 連線、權限、RLS
- 快速驗證想法

**如果現在用 Supabase**：
- 要設定環境變數
- 要管理資料庫結構
- 要處理 RLS 權限
- 要處理網路錯誤
- 開發速度變慢

---

## 目前可以做什麼

✅ **完整功能**：
- 登入/登出 (william01 / Venturo2025!)
- HR 員工管理（新增、編輯、刪除、搜尋）
- 資料持久化（IndexedDB 自動儲存）
- 離線工作（不需網路）

✅ **開發體驗**：
- 快速迭代
- 即時反饋
- 簡單除錯

---

## Phase 2、Phase 3 會加什麼？

### Phase 2（2週後）
```typescript
// 加入基本認證
- 密碼加密（bcrypt）
- Session 管理
- 登入失敗次數限制
- 帳號鎖定機制
```

### Phase 3（1個月後）
```typescript
// 接入 Supabase
- user-store 改用 VenturoAPI
- 多人協作
- 資料同步
- 即時更新
- 雲端備份
```

---

## 總結

### 現在的版本（Phase 1）
```
純前端 + IndexedDB
↓
單機使用
↓
快速開發功能
```

### 未來的版本（Phase 3）
```
前端 + Supabase
↓
多人協作
↓
雲端同步
```

### 設計理念
> **先讓它動 → 再讓它對 → 最後讓它快**

Phase 1 的目標是「讓它動」，不是「讓它完美」。

---

## 重要提醒

❌ **不要做的事**：
- 不要設定 Supabase（現在用不到）
- 不要執行 init-database.js（那是 Phase 3 的）
- 不要建立 .env.local（現在不需要）

✅ **應該做的事**：
- 專注開發功能
- 測試使用者體驗
- 完善業務邏輯
- 等 Phase 1 穩定了再進 Phase 2

---

**最後更新**: 2025-01-06
**版本**: 5.0 Phase 1
**下一個里程碑**: Phase 2 認證增強（預計 2 週後）
