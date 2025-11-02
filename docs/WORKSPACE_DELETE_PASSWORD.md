# 工作空間刪除密碼設定

## 🔒 功能說明

為了防止誤刪重要的旅遊團頻道，系統加入了**密碼保護機制**：

- ✅ **一般頻道**：可以直接刪除（無需密碼）
- 🔐 **旅遊團頻道**：需要輸入密碼才能刪除

---

## 🎯 使用方式

### 刪除一般頻道
1. 進入工作空間
2. 找到要刪除的頻道
3. 滑鼠移到頻道上，點擊 🗑️ 刪除按鈕
4. 確認刪除即可

### 刪除旅遊團頻道
1. 進入工作空間
2. 找到要刪除的旅遊團頻道（有 `tour_id` 的頻道）
3. 滑鼠移到頻道上，點擊 🗑️ 刪除按鈕
4. **系統會彈出密碼輸入框**
5. 輸入正確密碼後才能刪除

---

## 🔧 修改刪除密碼

**檔案位置**：`src/lib/constants/workspace-settings.ts`

```typescript
/**
 * 刪除旅遊團頻道所需的密碼
 * 
 * 預設密碼：delete123
 * 修改此密碼以提高安全性
 */
export const DELETE_TOUR_CHANNEL_PASSWORD = 'delete123'  // ← 修改這裡
```

### 修改步驟

1. 開啟 `src/lib/constants/workspace-settings.ts`
2. 修改 `DELETE_TOUR_CHANNEL_PASSWORD` 的值
3. 儲存檔案
4. 重新啟動開發伺服器（`npm run dev`）

### 建議密碼

- ❌ 不要使用：`123456`, `password`, `delete`
- ✅ 建議使用：`venturo@2025`, `delete_tour_2025`, `secure_delete_pwd`

---

## 🚨 緊急情況：忘記密碼怎麼辦？

### 方法 1：查看設定檔
```bash
cat src/lib/constants/workspace-settings.ts
```

### 方法 2：用 Script 直接刪除
```bash
# 建立刪除腳本
node scripts/delete_channel.js
```

### 方法 3：直接從資料庫刪除
```sql
-- 查詢頻道
SELECT id, name, tour_id FROM channels WHERE name ILIKE '%關鍵字%';

-- 刪除頻道（記得先刪除相關資料）
DELETE FROM messages WHERE channel_id = '頻道ID';
DELETE FROM channel_members WHERE channel_id = '頻道ID';
DELETE FROM channels WHERE id = '頻道ID';
```

---

## 📝 預設密碼

**目前預設密碼**：`delete123`

**提醒**：第一次部署到正式環境時，請務必修改此密碼！

---

## ⚙️ 停用密碼保護

如果你不需要密碼保護，可以修改：

```typescript
// src/lib/constants/workspace-settings.ts

/**
 * 是否啟用旅遊團頻道刪除保護
 */
export const ENABLE_TOUR_CHANNEL_DELETE_PROTECTION = false  // ← 改為 false
```

然後修改 `SortableChannelItem.tsx`：

```typescript
// 如果是旅遊團頻道，需要輸入密碼
if (isTourChannel && ENABLE_TOUR_CHANNEL_DELETE_PROTECTION) {
  // ... 密碼驗證邏輯
}
```
