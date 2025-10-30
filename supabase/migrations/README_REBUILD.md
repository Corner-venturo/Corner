# 🏗️ 資料庫完整重建計畫

## 為什麼要重建？

你說得對：**與其東補西補，不如建立完全正確的結構**

### 目前問題：

- ❌ todos, calendar_events, payment_requests 的 employee 欄位是 TEXT
- ❌ 有些欄位有錯誤的 DEFAULT 值（如 '1'::text）
- ❌ 缺少外鍵約束，資料完整性無法保證
- ❌ migrations 資料夾一堆修補檔案（20+ 個）

### 重建後：

- ✅ 所有 employee 引用統一為 UUID
- ✅ 完整的外鍵約束
- ✅ 統一的命名規範（snake_case）
- ✅ 乾淨的 schema，容易維護
- ✅ 一個檔案就能重建整個結構

---

## 📋 執行步驟

### Step 1️⃣: 備份資料

```sql
-- 在 Supabase SQL Editor 執行：
supabase/migrations/backup_all_data.sql
```

**重要：**

- 複製所有查詢結果到安全的地方（文字檔或 Google Docs）
- 特別注意 todos 的備份（你有 21 筆）
- 確認備份完成再繼續

---

### Step 2️⃣: 重建資料庫結構

```sql
-- 在 Supabase SQL Editor 執行：
supabase/migrations/00_complete_schema_rebuild.sql
```

**這個腳本會：**

- ✅ 建立 todos 表（正確的 UUID 格式）
- ✅ 建立 calendar_events 表
- ✅ 建立 payment_requests 表
- ✅ 建立所有外鍵約束
- ✅ 建立索引加速查詢
- ✅ 自動驗證結構正確性

**注意：**

- 如果表格已存在，需要先手動刪除（SQL 檔案裡有註解的 DROP 指令）
- 或者直接執行，它會跳過已存在的表格

---

### Step 3️⃣: 還原資料

```sql
-- 參考這個範本：
supabase/migrations/restore_all_data.sql
```

**還原方式：**

你的 21 筆 todos 都已經是 UUID 格式了（根據之前的分析），所以可以直接插入。

**範例：**

```sql
INSERT INTO todos (
  id, title, description, status, priority,
  creator, assignee, created_at
)
VALUES
(
  '從備份複製的 ID',
  '從備份複製的標題',
  '從備份複製的描述',
  'pending',
  'high',
  (SELECT id FROM employees WHERE employee_number = 'william01'),  -- 自動對應 William
  (SELECT id FROM employees WHERE employee_number = 'william01'),
  '從備份複製的時間'
);
```

---

## 🎯 預期結果

重建完成後：

### 資料庫層面：

- ✅ 所有表格結構完全正確
- ✅ 所有 employee 引用都是 UUID
- ✅ 有完整的外鍵約束
- ✅ 資料完整性有保障

### 前端頁面：

- ✅ 21 筆 todos 正常顯示
- ✅ 刷新頁面不會消失
- ✅ 新增的待辦事項會正確儲存
- ✅ 離線模式正常運作

---

## 🔄 與修補方案的比較

| 項目                | 修補方案（Step 1 + 2） | 重建方案                 |
| ------------------- | ---------------------- | ------------------------ |
| **執行時間**        | 5-10 分鐘              | 10-20 分鐘（含備份還原） |
| **風險**            | 低（保留所有資料）     | 中（需要手動還原）       |
| **結果**            | 修好當前問題           | 完全正確的結構           |
| **未來維護**        | 可能還有其他問題       | 絕對乾淨                 |
| **migrations 清理** | 不會清理               | 可以整理舊檔案           |

---

## 💡 我的建議

**如果你想要：**

- 🚀 快速修好，立刻上線 → 用修補方案（step1 + step2）
- 🏗️ 結構完全正確，長期好維護 → 用重建方案（本方案）

**我的推薦：重建方案** ✅

理由：

1. 你的資料量不大（21 筆 todos）
2. 現在是上線前最後階段，最適合整頓
3. 重建後絕對不會再有「東補西補」的問題
4. 未來有新同事加入，看到的是乾淨的結構

---

## ❓ 常見問題

### Q: 資料會不會遺失？

A: 不會，只要正確執行 backup_all_data.sql，所有資料都能還原

### Q: 如果中途出錯怎麼辦？

A: 可以重新執行 00_complete_schema_rebuild.sql，或者回到修補方案

### Q: 需要停機嗎？

A: 建議停機執行（5-10 分鐘），確保資料一致性

### Q: IndexedDB 的資料怎麼辦？

A: 建議清除 IndexedDB，重新從 Supabase 同步，確保資料一致

---

## 📞 需要協助？

如果執行過程中有任何問題，請隨時告訴我：

- 備份結果
- 執行過程中的錯誤訊息
- 還原時遇到的問題

我會立即協助你解決！

---

**準備好了嗎？讓我們建立一個完全正確的資料庫結構！** 🚀
